import { BridgeError } from './core/protocol.js';
import { estimateUsage } from './core/usage.js';
import { randomUUID } from './platform.js';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = message => { throw new BridgeError(400, 'invalid_request_error', message); };
const usageMeta = { estimated: true, image_tokens_included: false, cache: { status: 'unknown', source: 'not_exposed_by_web_ui', tokens_reported: false }, thinking_signature: 'not_available' };

// Stable aliases allow long Anthropic/MCP names to fit the shared core's limit.
function alias(name) {
  if (typeof name !== 'string' || !name || name.length > 1024) invalid('Tool name must be a non-empty string of at most 1024 characters.');
  if (/^[a-zA-Z0-9_-]{1,64}$/.test(name)) return name;
  let hash = 2166136261;
  for (const ch of name) { hash ^= ch.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return 'bridge_' + name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 44) + '_' + (hash >>> 0).toString(16).padStart(8, '0');
}
function parts(content) {
  if (typeof content === 'string') return [{ type: 'text', text: content }];
  if (!Array.isArray(content)) invalid('Message content must be text or an array of content blocks.');
  return content.map(block => {
    if (!object(block)) invalid('Content blocks must be objects.');
    if (block.type === 'text' && typeof block.text === 'string') return { type: 'text', text: block.text };
    if (block.type === 'image') {
      const source = block.source;
      if (!object(source) || source.type !== 'base64' || !/^image\/(?:png|jpeg|webp)$/.test(source.media_type || '') || typeof source.data !== 'string') invalid('Images require PNG/JPEG/WebP base64 source blocks.');
      return { type: 'image_url', image_url: { url: `data:${source.media_type};base64,${source.data}` } };
    }
    invalid('Unsupported content block: ' + String(block.type || 'missing type') + '.');
  });
}

/** Translate the client protocol only. The model remains the logged-in webpage. */
export function fromAnthropic(input, { countOnly = false } = {}) {
  if (!object(input)) invalid('The JSON body must be an object.');
  if (!Array.isArray(input.messages) || !input.messages.length) invalid('messages must contain at least one message.');
  if (!countOnly && (!Number.isSafeInteger(input.max_tokens) || input.max_tokens < 1)) invalid('max_tokens must be a positive integer.');
  if (input.output_config?.format || input.response_format) invalid('Structured output is not supported by this webpage adapter. Use ordinary text or client function tools.');
  if (input.tools !== undefined && (!Array.isArray(input.tools) || input.tools.length > 128)) invalid('tools must be an array of at most 128 definitions.');
  const names = new Map(), originals = new Set(), tools = [];
  let delegatedSearch = false;
  for (const tool of input.tools || []) {
    if (!object(tool)) invalid('Each tool must be an object.');
    if (typeof tool.type === 'string' && /^web_search_/.test(tool.type)) { delegatedSearch = true; continue; }
    // All supplied custom schemas are exposed directly, so a server-side tool
    // discovery step is unnecessary. Unsupported execution/fetch tools fail.
    if (typeof tool.type === 'string' && /^tool_search_tool_/.test(tool.type)) continue;
    if (tool.type && tool.type !== 'custom') invalid('Unsupported server tool type: ' + tool.type + '.');
    const name = alias(tool.name);
    if (originals.has(tool.name) || names.has(name)) invalid('Duplicate or colliding tool name.');
    if (!object(tool.input_schema)) invalid('Custom tools require an input_schema object.');
    originals.add(tool.name); names.set(name, tool.name);
    tools.push({ type: 'function', function: { name, description: typeof tool.description === 'string' ? tool.description : '', parameters: tool.input_schema } });
  }
  const messages = [];
  if (input.system !== undefined) {
    const blocks = parts(input.system);
    if (blocks.some(block => block.type !== 'text')) invalid('System blocks must be text.');
    messages.push({ role: 'system', content: blocks.map(block => block.text).join('\n\n') });
  }
  for (const message of input.messages) {
    if (!object(message) || !['user', 'assistant', 'system'].includes(message.role)) invalid('Messages require user, assistant or system roles.');
    if (message.role === 'system') { messages.push({ role: 'system', content: parts(message.content) }); continue; }
    if (typeof message.content === 'string') { messages.push({ role: message.role, content: message.content }); continue; }
    if (!Array.isArray(message.content)) invalid('Message content must be text or content blocks.');
    if (message.role === 'assistant') {
      const text = [], calls = [];
      for (const block of message.content) {
        if (!object(block)) invalid('Assistant blocks must be objects.');
        if (block.type === 'thinking' || block.type === 'redacted_thinking') continue; // No Anthropic signed state exists upstream.
        if (block.type === 'tool_use') {
          if (typeof block.id !== 'string' || !block.id || !object(block.input)) invalid('tool_use requires id, name and an input object.');
          calls.push({ id: block.id, type: 'function', function: { name: alias(block.name), arguments: JSON.stringify(block.input) } });
        } else text.push(...parts([block]));
      }
      messages.push({ role: 'assistant', content: text.length ? text : null, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      let pending = [];
      const flush = () => { if (pending.length) { messages.push({ role: 'user', content: pending }); pending = []; } };
      for (const block of message.content) {
        if (!object(block)) invalid('User blocks must be objects.');
        if (block.type === 'tool_result') {
          flush();
          if (typeof block.tool_use_id !== 'string' || !block.tool_use_id) invalid('tool_result requires tool_use_id.');
          const content = parts(block.content ?? '');
          if (block.is_error) content.unshift({ type: 'text', text: '[Tool execution failed]' });
          messages.push({ role: 'tool', tool_call_id: block.tool_use_id, content });
        } else pending.push(...parts([block]));
      }
      flush();
    }
  }
  let choice = 'auto';
  if (input.tool_choice !== undefined) {
    if (!object(input.tool_choice)) invalid('tool_choice must be an object.');
    const kind = input.tool_choice.type;
    if (kind === 'any') choice = 'required';
    else if (kind === 'none') choice = 'none';
    else if (kind === 'tool') choice = { type: 'function', function: { name: alias(input.tool_choice.name) } };
    else if (kind !== 'auto') invalid('Unsupported tool_choice type.');
  }
  const body = { model: input.model, messages, tools, tool_choice: choice, stream: input.stream ?? false, max_tokens: input.max_tokens ?? 1, stream_options: { include_usage: true } };
  if (input.stop_sequences !== undefined) body.stop = input.stop_sequences;
  if (input.web_search !== undefined) body.web_search = input.web_search;
  else if (delegatedSearch) body.web_search = true;
  if (input.thinking !== undefined) {
    if (!object(input.thinking) || !['enabled', 'disabled', 'adaptive'].includes(input.thinking.type)) invalid('thinking.type must be enabled, disabled or adaptive.');
    body.thinking = { type: input.thinking.type === 'disabled' ? 'disabled' : 'enabled' };
  }
  return { body, names, showThinking: input.thinking?.type !== 'disabled' && input.thinking?.display !== 'omitted', delegatedSearch };
}

export function anthropicError(payload, status = 500) {
  const source = payload?.error || payload || {};
  const type = status === 401 ? 'authentication_error' : status === 403 ? 'permission_error' : status === 404 ? 'not_found_error'
    : status === 413 ? 'request_too_large' : status === 429 ? 'rate_limit_error' : status < 500 ? 'invalid_request_error' : 'api_error';
  return { type: 'error', error: { type, message: source.message || 'Webpage bridge request failed.', ...(source.code ? { code: source.code } : {}), ...(source.details ? { details: source.details } : {}) } };
}
const stopReason = reason => reason === 'tool_calls' ? 'tool_use' : reason === 'length' ? 'max_tokens' : 'end_turn';
const usage = stats => ({ input_tokens: stats?.prompt_tokens || 0, output_tokens: stats?.completion_tokens || 0 });

/** Each response has an independent state machine. No event or tool ID is
 * shared across concurrent/queued requests. */
export function anthropicChannel(input, conversion) {
  const id = 'msg_' + randomUUID().replaceAll('-', '');
  const model = input.model;
  const initial = estimateUsage({ prompt: JSON.stringify(conversion.body) }).prompt_tokens;
  const meta = extra => ({ ...usageMeta, ...extra });
  const responseName = name => conversion.names.get(name) || name;
  const message = (content, finish, stats, extra) => ({ id, type: 'message', role: 'assistant', model, content, stop_reason: finish, stop_sequence: null,
    usage: usage(stats), usage_meta: meta(extra) });
  let started = false, finished = false, failed = false, block = null, nextIndex = 0, finish = 'end_turn', stats;
  const calls = new Map();
  function emit(kind, payload, send) {
    const event = (type, fields = {}) => send('data', { text: `event: ${type}\ndata: ${JSON.stringify({ type, ...fields })}\n\n` });
    const start = () => {
      if (started) return;
      started = true; send('stream', {});
      event('message_start', { message: message([], null, { prompt_tokens: initial, completion_tokens: 0 }) });
    };
    const closeBlock = () => { if (block) { event('content_block_stop', { index: block.index }); block = null; } };
    const append = (type, value) => {
      if (!value) return;
      if (type === 'thinking' && !conversion.showThinking) return;
      if (!block || block.type !== type) {
        closeBlock(); block = { type, index: nextIndex++ };
        event('content_block_start', { index: block.index, content_block: type === 'thinking' ? { type, thinking: '', signature: '' } : { type, text: '' } });
      }
      event('content_block_delta', { index: block.index, delta: type === 'thinking' ? { type: 'thinking_delta', thinking: value } : { type: 'text_delta', text: value } });
    };
    const complete = () => {
      if (finished || failed) return;
      start(); closeBlock();
      for (const call of calls.values()) {
        let args;
        try { args = JSON.parse(call.arguments || '{}'); } catch { throw new Error('Invalid validated tool argument stream.'); }
        const index = nextIndex++;
        event('content_block_start', { index, content_block: { type: 'tool_use', id: call.id, name: responseName(call.name), input: {} } });
        event('content_block_delta', { index, delta: { type: 'input_json_delta', partial_json: JSON.stringify(args) } });
        event('content_block_stop', { index });
      }
      event('message_delta', { delta: { stop_reason: calls.size ? 'tool_use' : finish, stop_sequence: null }, usage: usage(stats), usage_meta: meta() });
      event('message_stop'); finished = true;
    };
    if (kind === 'response') {
      if (payload.status >= 400 || payload.body.error) return send('response', { status: payload.status, body: anthropicError(payload.body, payload.status) });
      if (payload.body.object !== 'chat.completion') return send(kind, payload); // count_tokens result
      const choice = payload.body.choices[0], answer = choice.message, content = [];
      if (conversion.showThinking && answer.reasoning_content) content.push({ type: 'thinking', thinking: answer.reasoning_content, signature: '' });
      if (answer.content) content.push({ type: 'text', text: answer.content });
      for (const call of answer.tool_calls || []) content.push({ type: 'tool_use', id: call.id, name: responseName(call.function.name), input: JSON.parse(call.function.arguments) });
      return send('response', { status: payload.status, body: message(content, stopReason(choice.finish_reason), payload.body.usage, payload.body.usage_meta) });
    }
    if (kind === 'stream') return start();
    if (kind === 'end') { complete(); return send('end', {}); }
    if (kind !== 'data' || finished || failed) return;
    start();
    for (const line of payload.text.split('\n')) {
      if (line.startsWith(':')) { event('ping'); continue; }
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6);
      if (raw === '[DONE]') { complete(); continue; }
      const chunk = JSON.parse(raw);
      if (chunk.error) { closeBlock(); const error = anthropicError(chunk, 502); event('error', { error: error.error }); failed = true; continue; }
      if (chunk.usage) stats = chunk.usage;
      for (const item of chunk.choices || []) {
        if (item.finish_reason) finish = stopReason(item.finish_reason);
        append('thinking', item.delta?.reasoning_content); append('text', item.delta?.content);
        for (const part of item.delta?.tool_calls || []) {
          const old = calls.get(part.index) || { id: '', name: '', arguments: '' };
          if (part.id) old.id = part.id;
          if (part.function?.name) old.name += part.function.name;
          if (part.function?.arguments) old.arguments += part.function.arguments;
          calls.set(part.index, old);
        }
      }
    }
  }
  return { emit, error: anthropicError };
}
