import { prepareRequest, parseToolResponse, buildToolRetryPrompt, BridgeError } from './core/protocol.js';
import { ContentEnvelopeDecoder } from './core/streaming.js';
import { estimateUsage } from './core/usage.js';
import { MobileBuffer, randomUUID } from './platform.js';
import { fromAnthropic, anthropicChannel, anthropicError } from './anthropic.js';
import { ConversationPool } from './conversations.js';
import { TaskLedger } from './tasks.js';
import { setTimeout, clearTimeout } from './native-clock.js';

function errorPayload(error) {
  const payload = { message: error.status || error.code ? error.message : 'Android bridge error.', type: 'bridge_error', code: error.code || 'internal_error', param: null };
  if (error.details) {
    const allowed = ['phase', 'answerContainers', 'reasoningContainers', 'composers', 'parserState', 'receivedCharacters', 'formatAttempts', 'firstOutputTimeoutMs', 'emptyResponseAttempts', 'sendControlReason', 'sendControlCount'];
    payload.details = Object.fromEntries(allowed.filter(key => ['string', 'number'].includes(typeof error.details[key])).map(key => [key, error.details[key]]));
  }
  return { error: payload };
}

export function resolveDataImages(images) {
  return images.map((image, sourceIndex) => {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.url);
    if (!match || match[2].length % 4 !== 0) throw new BridgeError(400, 'unsupported_image_url', '安卓版目前接受 PNG/JPEG/WebP 的 base64 data URL；远程图片 URL 尚未支持。');
    const buffer = MobileBuffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) throw new BridgeError(400, 'invalid_image_data', '图片为空或超过 10 MiB。');
    return { sourceIndex, buffer, mimeType: match[1], name: `${image.label}.${match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1]}` };
  });
}

export function createEngine(backend, emitNative, options = {}) {
  const config = { model: 'deepseek-web', timeoutMs: 600000, heartbeatMs: 10000, maxQueue: 8, defaultWebSearch: () => true, ...options };
  let saveTimer;
  const ledger = new TaskLedger(config.initialState?.ledger, { onChange: () => publish() });
  const conversations = new ConversationPool({ saved: config.initialState?.conversations, onChange: state => { config.onConversationState?.(state); publish(); } });
  function snapshot() { return { ...ledger.snapshot(), sessions: conversations.summaries() }; }
  function save() { clearTimeout(saveTimer); saveTimer = undefined; config.saveState?.({ version: 1, conversations: conversations.serialize(), ledger: ledger.serialize() }); }
  function publish() { config.onTaskState?.(snapshot()); if (config.saveState) { clearTimeout(saveTimer); saveTimer = setTimeout(save, 120); } }
  const jobs = new Map();
  const waiting = [];
  let active = null;
  let sequence = 0;
  const emit = (job, kind, payload = {}) => {
    if (job.disconnected) return;
    const send = (outputKind, outputPayload) => {
      if (job.taskId && !job.cacheOverflow) {
        job.frames ||= []; job.frameBytes = (job.frameBytes || 0) + JSON.stringify(outputPayload).length;
        if (job.frameBytes <= 700000) job.frames.push({ kind: outputKind, payload: outputPayload }); else { job.frames = null; job.cacheOverflow = true; }
      }
      emitNative(job.id, outputKind, outputPayload);
      if (outputKind === 'response' || outputKind === 'end') { ledger.cache(job, job.frames); save(); }
    };
    if (job.anthropic) job.anthropic.emit(kind, payload, send);
    else send(kind, payload);
  };
  const cancelled = () => new BridgeError(499, 'request_cancelled', '手机客户端已取消请求。');
  const abortable = (promise, signal) => {
    const pending = Promise.resolve(promise);
    if (signal.aborted) { pending.catch(() => {}); return Promise.reject(signal.reason); }
    return new Promise((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener('abort', abort, { once: true });
      pending.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    });
  };
  const respond = (job, status, body) => emit(job, 'response', { status, body });

  async function execute(job) {
    let iterator;
    let heartbeat;
    let started = false;
    let roleSent = false;
    let conversationPlan, conversationHandle, conversationReused = false;
    const { signal } = job.controller;
    const id = 'chatcmpl-' + randomUUID().replaceAll('-', '');
    const created = Math.floor(Date.now() / 1000);
    const envelope = (delta, finishReason = null) => ({ id, object: 'chat.completion.chunk', created, model: config.model, choices: [{ index: 0, delta, finish_reason: finishReason }] });
    const start = () => { if (!started) { started = true; emit(job, 'stream'); } };
    const chunk = value => {
      if (signal.aborted) throw signal.reason;
      start();
      if (!roleSent) { emit(job, 'data', { text: `data: ${JSON.stringify(envelope({ role: 'assistant' }))}\n\n` }); roleSent = true; }
      emit(job, 'data', { text: `data: ${JSON.stringify(value)}\n\n` });
    };
    try {
      if (signal.aborted) throw signal.reason;
      if (job.path === '/browser/status') return respond(job, 200, { ...await abortable(backend.status(), signal), busy: false, queued: waiting.length });
      if (job.path === '/browser/open') return respond(job, 200, await abortable(backend.openLogin(), signal));
      if (job.body.bridge_agent_mode !== undefined && !['strict', 'compatible'].includes(job.body.bridge_agent_mode)) throw new BridgeError(400, 'invalid_agent_mode', 'bridge_agent_mode 必须是 strict 或 compatible。');
      const policy = typeof config.strictAgent === 'function' ? config.strictAgent() : config.strictAgent;
      const prepared = prepareRequest(job.body, config.model, { strictAgent: job.body.bridge_agent_mode ? job.body.bridge_agent_mode === 'strict' : policy ?? true });
      if (job.body.bridge_output_mode !== undefined && !['stable', 'live'].includes(job.body.bridge_output_mode)) throw new BridgeError(400, 'invalid_output_mode', 'bridge_output_mode 必须是 stable 或 live。');
      const stableOutput = job.body.bridge_output_mode === 'stable' || (job.body.bridge_output_mode !== 'live' && prepared.toolsEnabled);
      if (job.countOnly) return respond(job, 200, { input_tokens: estimateUsage({ prompt: prepared.prompt }).prompt_tokens,
        usage_meta: { estimated: true, method: 'unicode_han_1.5_chars_per_token_other_4_chars_per_token', image_tokens_included: false, cache: { status: 'unknown' } } });
      const repeated = await ledger.idempotency(job, job.requestKey);
      if (repeated?.error) throw new BridgeError(repeated.error === 'invalid_idempotency_key' ? 400 : 409, repeated.error, '请求 ID 正在使用、内容冲突或结果已不可重放，请检查任务记录。');
      if (repeated?.replay) {
        const previous = ledger.tasks.get(repeated.taskId), priorState = previous?.state, priorPhase = previous?.phase, priorLast = previous?.lastRequestId, priorActive = previous?.activeRequestId;
        ledger.attach(job, repeated.taskId);
        const request = ledger.requests.get(job.id); if (request) { request.status = 'completed'; request.finishedAt = Date.now(); }
        for (const frame of repeated.replay) emitNative(job.id, frame.kind, frame.payload);
        const task = ledger.tasks.get(job.taskId); if (task) { task.activeRequestId = priorActive || null; task.lastRequestId = priorLast || job.id; task.state = priorState || 'completed'; task.phase = priorPhase || task.state; task.events.push({ time: Date.now(), phase: 'replayed', text: '已返回原请求结果，未重新生成' }); task.events = task.events.slice(-48); }
        ledger.cache(job, repeated.replay); publish(); save(); return;
      }
      if ('web_search' in job.body && typeof job.body.web_search !== 'boolean') throw new BridgeError(400, 'invalid_web_search', 'web_search 必须是 true 或 false。');
      const webSearch = job.body.web_search ?? config.defaultWebSearch();
      const images = resolveDataImages(prepared.images);
      conversationPlan = await conversations.plan(job.body);
      ledger.attach(job, conversationPlan.record?.taskId); conversationPlan.taskId = job.taskId; ledger.phase(job, 'preparing'); save();
      if (signal.aborted) throw signal.reason;
      let output = '', reasoning = '', published = '', currentPrompt = conversations.continuation(prepared, conversationPlan);
      let conversation = { ...(conversationPlan.record?.handle || {}), reuse: conversationPlan.reuse, fullPrompt: prepared.prompt, fullImages: images };
      let attemptImages = conversationPlan.reuse ? images.filter(image => prepared.images[image.sourceIndex].messageIndex >= conversationPlan.offset) : images;
      let formatRetries = 0, emptyRetries = 0, finishReason = 'stop', result;
      const draftEnabled = config.onDraft && (!config.previewEnabled || config.previewEnabled(job.id));
      const draft = value => {
        if (!draftEnabled || signal.aborted) return;
        let content=value.content||'';
        if (prepared.toolsEnabled) { try { const decoder=new ContentEnvelopeDecoder();decoder.push(content);content=decoder.content; } catch { content=''; } }
        config.onDraft(job.id,{content,reasoning:attemptDraftReasoning?value.reasoning||'':'',phase:value.phase||'generating'});
      };
      let attemptDraftReasoning=false;
      const prompts = [], outputs = [];
      const ready = () => {
        if (prepared.stream && !heartbeat) heartbeat = setInterval(() => {
          if (signal.aborted) return;
          start(); emit(job, 'data', { text: ': keep-alive\n\n' });
        }, config.heartbeatMs);
      };
      for (let attempt = 0; attempt < 2; attempt++) {
        let generationError, decoderError;
        const decoder = prepared.toolsEnabled ? new ContentEnvelopeDecoder() : null;
        const attemptReasoning = prepared.reasoning && formatRetries === 0;
        attemptDraftReasoning=attemptReasoning;
        output = '';
        prompts.push(currentPrompt);
        conversationHandle = undefined;
        iterator = backend.generate({ prompt: currentPrompt, images: attemptImages, reasoning: attemptReasoning, webSearch, conversation, signal, stableOutput, onPhase: phase => ledger.phase(job, phase), onSnapshot: draftEnabled ? draft : undefined })[Symbol.asyncIterator]();
        try {
          for (;;) {
            const next = await abortable(iterator.next(), signal);
            if (next.done) break;
            const event = next.value;
            if (event.type === 'ready') { ready(); continue; }
            if (event.type === 'done') { if (event.finishReason === 'length') finishReason = 'length'; conversationHandle = event.conversation; conversationReused = event.reused === true; continue; }
            if (event.type === 'reasoning') {
              if (!attemptReasoning) continue;
              if (typeof event.delta !== 'string') throw new BridgeError(502, 'invalid_backend_response', 'Invalid reasoning event.');
              reasoning += event.delta;
              if (draftEnabled) draft({content:output,reasoning});
              ledger.output(job, 'thinking');
              if (prepared.stream && event.delta && !stableOutput) chunk(envelope({ reasoning_content: event.delta }));
              continue;
            }
            const delta = typeof event === 'string' ? event : event.delta;
            if (typeof delta !== 'string') throw new BridgeError(502, 'invalid_backend_response', 'Invalid text event.');
            output += delta;
            if (draftEnabled) draft({content:output,reasoning});
            if (delta) ledger.output(job, 'generating');
            if (prepared.stream && delta && !stableOutput) {
              ready();
              if (decoder) {
                try { decoder.push(delta); } catch (error) { if (error.code !== 'invalid_tool_response') throw error; decoderError = error; break; }
                const candidate = decoder.content;
                if (candidate.startsWith(published)) {
                  const suffix = candidate.slice(published.length);
                  if (suffix) chunk(envelope({ content: suffix }));
                  published = candidate;
                } else if (!published.startsWith(candidate)) throw new BridgeError(502, 'tool_repair_content_mismatch', '重生成改变了已发送的正文，未交出工具调用。');
              } else { chunk(envelope({ content: delta })); published += delta; }
            }
          }
        } catch (error) { generationError = error; }
        if (iterator.return) await iterator.return();
        iterator = null;
        outputs.push(output);
        if (generationError) {
          if (generationError.code === 'UPSTREAM_NO_OUTPUT' && attempt === 0 && !output && !reasoning && !published && !signal.aborted) {
            emptyRetries++; currentPrompt = prepared.prompt; attemptImages = images; conversation = { reuse: false, fullPrompt: prepared.prompt, fullImages: images }; continue;
          }
          throw generationError;
        }
        try {
          if (decoderError) throw decoderError;
          if (!output.trim()) throw new BridgeError(502, 'empty_response', '网页没有返回回答正文。');
          result = prepared.toolsEnabled ? parseToolResponse(output, prepared) : { message: { role: 'assistant', content: output }, finishReason };
          if (prepared.stream && prepared.toolsEnabled) {
            if (attempt > 0 && result.message.tool_calls && result.message.content === null) result.message.content = published || null;
            if (!(result.message.content || '').startsWith(published)) throw new BridgeError(502, 'tool_repair_content_mismatch', '最终正文与已发送正文不一致。');
          }
          break;
        } catch (error) {
          if (error.code === 'invalid_tool_response' && attempt === 0 && finishReason !== 'length' && !signal.aborted) {
            formatRetries++; ledger.phase(job, 'repairing');
            if (draftEnabled) config.onDraft(job.id,{content:'',reasoning:'',phase:'repairing'});
            if (conversationHandle) {
              currentPrompt = buildToolRetryPrompt({ prompt: 'Repair the immediately preceding assistant turn in this SAME conversation. The external task, new messages and tool schemas above are unchanged.' }, output, published);
              conversation = { ...conversationHandle, reuse: true, fullPrompt: buildToolRetryPrompt(prepared, output, published), fullImages: images }; attemptImages = [];
            } else {
              currentPrompt = buildToolRetryPrompt(prepared, output, published);
              conversation = { reuse: false, fullPrompt: currentPrompt, fullImages: images }; attemptImages = images;
            }
            continue;
          }
          throw error;
        }
      }
      if (reasoning) result.message.reasoning_content = reasoning;
      if (signal.aborted) throw signal.reason;
      await conversations.commit(conversationPlan, result.message, conversationHandle, conversationReused);
      const usage = estimateUsage({ prompt: [prepared.prompt, ...prompts.slice(1)].join('\n'), content: outputs.join('\n'), reasoning, images });
      const continued = conversationReused && conversationPlan.record?.handle.path === conversationHandle?.path;
      const usageMeta = { estimated: true, method: 'unicode_han_1.5_chars_per_token_other_4_chars_per_token', prompt_basis: 'logical_api_history', agent_status: result.agentStatus || 'complete', image_tokens_included: false, cache: { status: 'unknown', source: 'not_exposed_by_web_ui', tokens_reported: false }, format_retries: formatRetries, empty_response_retries: emptyRetries,
        conversation: { reused: continued, history_messages: job.body.messages.length, sent_messages: continued ? job.body.messages.length - conversationPlan.offset : job.body.messages.length } };
      if (result.message.tool_calls?.length) { ledger.offerTools(job, result.message.tool_calls.length); save(); }
      ledger.finish(job, result, usageMeta);
      if (!prepared.stream) return respond(job, 200, { id, object: 'chat.completion', created, model: config.model, choices: [{ index: 0, message: result.message, finish_reason: result.finishReason }], usage, usage_meta: usageMeta });
      if (stableOutput && reasoning) chunk(envelope({ reasoning_content: reasoning }));
      if (stableOutput && !prepared.toolsEnabled && result.message.content) chunk(envelope({ content: result.message.content }));
      if (prepared.toolsEnabled) {
        const finalText = result.message.content || '';
        if (finalText.slice(published.length)) chunk(envelope({ content: finalText.slice(published.length) }));
        if (result.message.tool_calls) chunk(envelope({ tool_calls: result.message.tool_calls.map((call, index) => ({ index, ...call })) }));
      }
      chunk(envelope({}, result.finishReason));
      if (prepared.includeUsage) chunk({ id, object: 'chat.completion.chunk', created, model: config.model, choices: [], usage, usage_meta: usageMeta });
      emit(job, 'data', { text: 'data: [DONE]\n\n' }); emit(job, 'end');
    } catch (error) {
      conversations.invalidate(conversationPlan);
      const actual = signal.aborted ? signal.reason : error;
      ledger.fail(job, actual, signal.aborted && ['request_cancelled', 'REQUEST_CANCELLED'].includes(actual.code));
      if (started) { emit(job, 'data', { text: `data: ${JSON.stringify(errorPayload(actual))}\n\ndata: [DONE]\n\n` }); emit(job, 'end'); }
      else respond(job, actual.status || 500, errorPayload(actual));
    } finally {
      clearInterval(heartbeat);
      // Retain the queue through cancelled/rejected page cleanup.
      if (iterator?.return) try { await iterator.return(); } catch {}
      clearTimeout(job.timer); jobs.delete(job.id); active = null;
      drain();
    }
  }
  function drain() {
    if (active) return;
    const job = waiting.shift();
    if (!job) return;
    active = job; void execute(job);
  }
  function receive(request) {
    const id = request.id || `mobile-${++sequence}`;
    if (request.path.startsWith('/v1/bridge/')) { void control({ ...request, id }); return; }
    const nativeAnthropic = ['/v1/messages', '/v1/messages/count_tokens'].includes(request.path);
    let conversion;
    if (nativeAnthropic) {
      try { conversion = fromAnthropic(request.body, { countOnly: request.path.endsWith('/count_tokens') }); }
      catch (error) { emitNative(id, 'response', { status: error.status || 400, body: anthropicError(errorPayload(error), error.status || 400) }); return; }
    }
    const job = { ...request, id, originalPath: request.path, originalBody: request.body, controller: new AbortController(), disconnected: false,
      ...(nativeAnthropic ? { path: '/v1/chat/completions', body: conversion.body, countOnly: request.path.endsWith('/count_tokens'), anthropic: anthropicChannel(request.body, conversion) } : {}) };
    if (active && waiting.length >= config.maxQueue) return respond(job, 429, errorPayload(new BridgeError(429, 'queue_full', '手机网页正在处理，队列已满。')));
    if (job.path !== '/v1/chat/completions' && !['/browser/status', '/browser/open'].includes(job.path)) return respond(job, 404, errorPayload(new BridgeError(404, 'not_found', 'Unsupported path.')));
    if (job.path === '/v1/chat/completions' && !job.countOnly) { ledger.create(job, nativeAnthropic ? 'Anthropic' : 'OpenAI'); if (request.retryOf) ledger.attach(job, request.retryOf); save(); }
    jobs.set(job.id, job);
    job.timer = setTimeout(() => {
      job.controller.abort(new BridgeError(504, 'request_timeout', '请求超时，含排队时间。'));
      if (active !== job) { const index = waiting.indexOf(job); if (index >= 0) waiting.splice(index, 1); ledger.fail(job, job.controller.signal.reason); respond(job, 504, errorPayload(job.controller.signal.reason)); jobs.delete(job.id); }
    }, config.timeoutMs);
    waiting.push(job); drain();
  }
  function cancel(id, disconnected = true) {
    const job = jobs.get(id);
    if (!job) return;
    job.disconnected = disconnected; job.controller.abort(cancelled());
    const index = waiting.indexOf(job);
    if (index >= 0) { waiting.splice(index, 1); clearTimeout(job.timer); ledger.fail(job, cancelled(), true); if (!disconnected) respond(job, 499, errorPayload(cancelled())); jobs.delete(id); save(); }
  }
  async function control(request) {
    try {
      const match = /^\/v1\/bridge\/tasks(?:\/([a-zA-Z0-9_-]+)(?:\/(result|cancel|retry))?)?$/.exec(request.path);
      if (!match) throw new BridgeError(404, 'not_found', '任务接口不存在。');
      const [, taskId, action] = match, task = snapshot().tasks.find(item => item.id === taskId);
      if (!taskId) return emitNative(request.id, 'response', { status: 200, body: snapshot() });
      if (!task) throw new BridgeError(404, 'task_not_found', '任务记录不存在或已过期。');
      if (action === 'retry') {
        const input = ledger.retryInput(taskId); if (!input) throw new BridgeError(409, 'retry_unavailable', '请在原客户端确认工具状态后重试；此记录无法安全重试。');
        return receive({ ...input, id: request.id, retryOf: taskId, requestKey: request.requestKey });
      }
      if (action === 'cancel') { if (!task.activeRequestId || !jobs.has(task.activeRequestId)) throw new BridgeError(409, 'task_not_active', '任务当前没有运行中的请求。'); cancel(task.activeRequestId, false); return emitNative(request.id, 'response', { status: 200, body: { cancelled: true, task_id: taskId } }); }
      const result = action === 'result' ? ledger.result(taskId) : task;
      if (!result) throw new BridgeError(409, 'result_unavailable', '结果未保存或已过期。');
      emitNative(request.id, 'response', { status: 200, body: action === 'result' ? { task_id: taskId, frames: result } : result });
    } catch (error) { emitNative(request.id, 'response', { status: error.status || 500, body: errorPayload(error) }); }
  }
  function retryTask(taskId) {
    const task = snapshot().tasks.find(item => item.id === taskId); if (!task?.localRetryAvailable) return false;
    const input = ledger.retryInput(taskId); input.body.stream = false;
    receive({ ...input, id: 'ui-' + randomUUID(), retryOf: taskId }); return true;
  }
  function cancelTask(taskId) { const task = ledger.tasks.get(taskId); if (!task?.activeRequestId || !jobs.has(task.activeRequestId)) return false; cancel(task.activeRequestId, false); return true; }
  async function openSession(id) { if (active) return false; const record = conversations.get(id); if (!record) return false; await backend.openSavedSession(record.handle); return true; }
  function resetConversations() { if (active || waiting.length) return false; conversations.reset(); return true; }
  return { receive, cancel, cancelAll: () => { for (const id of jobs.keys()) cancel(id, false); }, resetConversations, retryTask, cancelTask, openSession, forgetSession: id => !active && conversations.forget(id), snapshot, taskResult: id => ledger.result(id), publishState: () => { config.onConversationState?.(conversations.state()); publish(); }, saveState: save,
    conversationState: () => conversations.state(), activity: () => ({ busy: active !== null, queued: waiting.length }) };
}
