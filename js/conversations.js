import { BridgeError } from './core/protocol.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const stable = value => JSON.stringify(value, (_key, item) => object(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable(value)));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function content(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every(part => part?.type === 'text')) return value.map(part => part.text).join('');
  return value;
}
function canonical(message) {
  const result = { role: message.role, content: content(message.content) };
  if (message.tool_call_id) result.tool_call_id = message.tool_call_id;
  if (message.tool_calls?.length) result.tool_calls = message.tool_calls.map(call => {
    let args = call.function.arguments;
    try { args = JSON.parse(args); } catch {}
    return { id: call.id, name: call.function.name, arguments: args };
  });
  return result;
}
export function conversationOptions(body) {
  const key = body.conversation_id ?? body.metadata?.conversation_id;
  if (key !== undefined && (typeof key !== 'string' || !key.trim() || key.length > 128)) throw new BridgeError(400, 'invalid_conversation_id', 'conversation_id 必须是 1–128 字符的非空字符串。');
  if (body.reset_conversation !== undefined && typeof body.reset_conversation !== 'boolean') throw new BridgeError(400, 'invalid_reset_conversation', 'reset_conversation 必须是 true 或 false。');
  return { key, reset: body.reset_conversation === true };
}

/** Keeps fingerprints and webpage handles, never copies full prompts to disk.
 * A matching prefix includes our validated assistant answer and real tool IDs.
 * Identical first questions alone are never enough to merge independent tasks. */
export class ConversationPool {
  constructor({ max = 8, onChange = () => {} } = {}) { this.max = max; this.records = new Map(); this.onChange = onChange; this.created = 0; this.reused = 0; this.sequence = 0; }
  state() { return { enabled: true, tracked: this.records.size, created: this.created, reused: this.reused, lastAction: this.lastAction || 'ready' }; }
  publish() { this.onChange(this.state()); }
  reset() { this.records.clear(); this.lastAction = 'reset'; this.publish(); }
  async plan(body) {
    const { key, reset } = conversationOptions(body);
    const messages = body.messages.map(canonical), toolsHash = await digest(body.tools || []);
    if (reset) {
      if (key === undefined) this.records.clear();
      else for (const [id, record] of this.records) if (record.key === key) this.records.delete(id);
    }
    const prefixHashes = new Map();
    const candidates = [...this.records.values()].filter(record => record.key === key && messages.length > record.length)
      .sort((a, b) => b.length - a.length || b.used - a.used);
    let matched;
    for (const record of candidates) {
      if (matched && record.length < matched.length) break;
      if (!prefixHashes.has(record.length)) prefixHashes.set(record.length, await digest(messages.slice(0, record.length)));
      if (prefixHashes.get(record.length) === record.digest) {
        if (matched) return { messages, toolsHash, key, offset: 0, reuse: false, reason: 'ambiguous_history' };
        matched = record;
      }
    }
    if (matched) return { record: matched, messages, toolsHash, key, offset: matched.length, reuse: true };
    return { messages, toolsHash, key, offset: 0, reuse: false };
  }
  continuation(prepared, plan) {
    if (!plan.reuse) return prepared.prompt;
    let prompt = prepared.prompt.replace('<conversation_json>\n' + JSON.stringify(prepared.messages) + '\n</conversation_json>',
      '<conversation_json>\n' + JSON.stringify(prepared.messages.slice(plan.offset)) + '\n</conversation_json>');
    if (plan.record.toolsHash === plan.toolsHash) prompt = prompt.replace(/<available_tools_json>\n[\s\S]*?\n<\/available_tools_json>/,
      'The available function names, descriptions and JSON Schemas are UNCHANGED from the previous request in this webpage conversation. Use those same definitions.');
    return 'CONTINUATION OF THE SAME EXTERNAL TASK. Earlier history is already present above. The conversation_json below contains ONLY NEW external messages after the last validated assistant turn. Consume real tool results, continue the original task, and follow the current output protocol. Do not repeat or re-execute completed actions.\n' + prompt;
  }
  async commit(plan, answer, handle, reused) {
    if (plan.record) this.records.delete(plan.record.id);
    if (!handle || typeof handle.path !== 'string') { this.publish(); return; }
    const history = [...plan.messages, canonical(answer)];
    const id = ++this.sequence;
    this.records.set(id, { id, key: plan.key, digest: await digest(history), length: history.length, toolsHash: plan.toolsHash, handle, used: Date.now() });
    const continued = reused && plan.record?.handle.path === handle.path;
    if (continued) this.reused++; else this.created++;
    this.lastAction = continued ? 'reused' : 'created';
    while (this.records.size > this.max) this.records.delete(this.records.keys().next().value);
    this.publish();
  }
  invalidate(plan) { if (plan?.record) this.records.delete(plan.record.id); this.publish(); }
}
