import { prepareRequest, parseToolResponse, buildToolRetryPrompt, BridgeError } from './core/protocol.js';
import { ContentEnvelopeDecoder } from './core/streaming.js';
import { estimateUsage } from './core/usage.js';
import { MobileBuffer, randomUUID } from './platform.js';

function errorPayload(error) {
  const payload = { message: error.status || error.code ? error.message : 'Android bridge error.', type: 'bridge_error', code: error.code || 'internal_error', param: null };
  if (error.details) {
    const allowed = ['phase', 'answerContainers', 'reasoningContainers', 'composers', 'parserState', 'receivedCharacters', 'formatAttempts', 'firstOutputTimeoutMs', 'emptyResponseAttempts'];
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
  const config = { model: 'deepseek-web', timeoutMs: 600000, heartbeatMs: 10000, maxQueue: 8, ...options };
  const jobs = new Map();
  const waiting = [];
  let active = null;
  let sequence = 0;
  const emit = (job, kind, payload = {}) => {
    if (!job.disconnected) emitNative(job.id, kind, payload);
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
      const prepared = prepareRequest(job.body, config.model);
      const images = resolveDataImages(prepared.images);
      let output = '', reasoning = '', published = '', currentPrompt = prepared.prompt;
      let formatRetries = 0, emptyRetries = 0, finishReason = 'stop', result;
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
        output = '';
        prompts.push(currentPrompt);
        iterator = backend.generate({ prompt: currentPrompt, images, reasoning: attemptReasoning, signal })[Symbol.asyncIterator]();
        try {
          for (;;) {
            const next = await abortable(iterator.next(), signal);
            if (next.done) break;
            const event = next.value;
            if (event.type === 'ready') { ready(); continue; }
            if (event.type === 'done') { if (event.finishReason === 'length') finishReason = 'length'; continue; }
            if (event.type === 'reasoning') {
              if (!attemptReasoning) continue;
              if (typeof event.delta !== 'string') throw new BridgeError(502, 'invalid_backend_response', 'Invalid reasoning event.');
              reasoning += event.delta;
              if (prepared.stream && event.delta) chunk(envelope({ reasoning_content: event.delta }));
              continue;
            }
            const delta = typeof event === 'string' ? event : event.delta;
            if (typeof delta !== 'string') throw new BridgeError(502, 'invalid_backend_response', 'Invalid text event.');
            output += delta;
            if (prepared.stream && delta) {
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
          if (generationError.code === 'UPSTREAM_NO_OUTPUT' && attempt === 0 && !output && !reasoning && !published && !signal.aborted) { emptyRetries++; continue; }
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
            formatRetries++; currentPrompt = buildToolRetryPrompt(prepared, output, published); continue;
          }
          throw error;
        }
      }
      if (reasoning) result.message.reasoning_content = reasoning;
      const usage = estimateUsage({ prompt: prompts.join('\n'), content: outputs.join('\n'), reasoning, images });
      const usageMeta = { estimated: true, method: 'unicode_han_1.5_chars_per_token_other_4_chars_per_token', image_tokens_included: false, cache: { status: 'unknown', source: 'not_exposed_by_web_ui', tokens_reported: false }, format_retries: formatRetries, empty_response_retries: emptyRetries };
      if (!prepared.stream) return respond(job, 200, { id, object: 'chat.completion', created, model: config.model, choices: [{ index: 0, message: result.message, finish_reason: result.finishReason }], usage, usage_meta: usageMeta });
      if (prepared.toolsEnabled) {
        const finalText = result.message.content || '';
        if (finalText.slice(published.length)) chunk(envelope({ content: finalText.slice(published.length) }));
        if (result.message.tool_calls) chunk(envelope({ tool_calls: result.message.tool_calls.map((call, index) => ({ index, ...call })) }));
      }
      chunk(envelope({}, result.finishReason));
      if (prepared.includeUsage) chunk({ id, object: 'chat.completion.chunk', created, model: config.model, choices: [], usage, usage_meta: usageMeta });
      emit(job, 'data', { text: 'data: [DONE]\n\n' }); emit(job, 'end');
    } catch (error) {
      const actual = signal.aborted ? signal.reason : error;
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
    const job = { ...request, id: request.id || `mobile-${++sequence}`, controller: new AbortController(), disconnected: false };
    if (active && waiting.length >= config.maxQueue) return respond(job, 429, errorPayload(new BridgeError(429, 'queue_full', '手机网页正在处理，队列已满。')));
    if (job.path !== '/v1/chat/completions' && !['/browser/status', '/browser/open'].includes(job.path)) return respond(job, 404, errorPayload(new BridgeError(404, 'not_found', 'Unsupported path.')));
    jobs.set(job.id, job);
    job.timer = setTimeout(() => {
      job.controller.abort(new BridgeError(504, 'request_timeout', '请求超时，含排队时间。'));
      if (active !== job) { const index = waiting.indexOf(job); if (index >= 0) waiting.splice(index, 1); respond(job, 504, errorPayload(job.controller.signal.reason)); jobs.delete(job.id); }
    }, config.timeoutMs);
    waiting.push(job); drain();
  }
  function cancel(id) {
    const job = jobs.get(id);
    if (!job) return;
    job.disconnected = true; job.controller.abort(cancelled());
    const index = waiting.indexOf(job);
    if (index >= 0) { waiting.splice(index, 1); clearTimeout(job.timer); jobs.delete(id); }
  }
  return { receive, cancel, activity: () => ({ busy: active !== null, queued: waiting.length }) };
}
