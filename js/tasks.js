import { randomUUID } from './platform.js';
export const PHASES = {
  queued: '等待处理', preparing: '校验请求', opening_browser: '连接网页', new_conversation: '准备新会话', resuming_conversation: '恢复原会话',
  setting_reasoning: '确认思考模式', decoding_images: '检查图片', uploading_images: '上传附件', filling_prompt: '准备消息', ready: '网页已就绪',
  submitting: '发送消息', searching: '搜索网页', generating: '正在生成', thinking: '正在思考', repairing: '修复回复格式', waiting_tools: '等待客户端工具结果',
  waiting_user: '等待你的补充', completed: '已完成', failed: '处理失败', blocked: '需要处理网页登录', cancelled: '已取消', interrupted: '上次运行中断', replayed: '已返回缓存结果',
};
const ACTIVE = new Set(['queued', 'preparing', 'running']);
const RETRYABLE = new Set(['failed', 'cancelled', 'interrupted', 'blocked']);
const clone = value => JSON.parse(JSON.stringify(value));
const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
export async function fingerprint(value) {
  const stable = JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable));
  return [...new Uint8Array(data)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function titleOf(body) {
  const message = body.messages?.find(item => item.role === 'user');
  let text = typeof message?.content === 'string' ? message.content : message?.content?.filter?.(part => part.type === 'text').map(part => part.text).join(' ') || '';
  text = text.replace(/(?:android-|sk-)[A-Za-z0-9_-]{16,}/g, '[已隐藏]').replace(/\b1[3-9]\d{9}\b/g, '[手机号]').replace(/\s+/g, ' ').trim();
  return Array.from(text || '新的 API 任务').slice(0, 46).join('');
}
export class TaskLedger {
  constructor(saved = {}, { onChange = () => {}, max = 32 } = {}) {
    this.max = max; this.onChange = onChange; this.tasks = new Map(); this.requests = new Map();
    this.total = Number.isSafeInteger(saved.total) ? saved.total : 0;
    for (const task of Array.isArray(saved.tasks) ? saved.tasks.slice(-max) : []) {
      if (!task || typeof task.id !== 'string' || !Array.isArray(task.events)) continue;
      const clean = clone(task);
      if (ACTIVE.has(clean.state)) { clean.state = 'interrupted'; clean.phase = 'interrupted'; clean.activeRequestId = null; clean.events.push({ time: Date.now(), phase: 'interrupted', text: '应用重新启动，需确认上次请求状态' }); }
      this.tasks.set(clean.id, clean);
    }
    for (const request of Array.isArray(saved.requests) ? saved.requests.slice(-64) : []) {
      if (request && typeof request.id === 'string' && this.tasks.has(request.taskId)) {
        const clean = clone(request); if (clean.status === 'running' || clean.status === 'queued') clean.status = 'interrupted';
        this.requests.set(clean.id, clean);
      }
    }
  }
  changed() { this.onChange(); }
  create(job, protocol) {
    const now = Date.now(), id = 'task_' + randomUUID().replaceAll('-', '').slice(0, 16);
    const task = { id, title: titleOf(job.body), protocol, model: job.body.model || 'deepseek-web', state: 'queued', phase: 'queued', createdAt: now, updatedAt: now, requestCount: 1, activeRequestId: job.id, lastRequestId: job.id, toolsOffered: 0, reused: 0, events: [{ time: now, phase: 'queued', text: PHASES.queued }] };
    const request = { id: job.id, taskId: id, status: 'queued', path: job.originalPath || job.path, createdAt: now, toolsReleased: false };
    const cached = { path: request.path, body: job.originalBody || job.body };
    if (bytes(cached) <= 1024 * 1024) request.input = clone(cached);
    this.tasks.set(id, task); this.requests.set(job.id, request); job.taskId = id; this.total++;
    while (this.tasks.size > this.max) {
      const victim = [...this.tasks.values()].find(item => !ACTIVE.has(item.state)); if (!victim) break;
      this.tasks.delete(victim.id); for (const [rid, req] of this.requests) if (req.taskId === victim.id) this.requests.delete(rid);
    }
    while (this.requests.size > 64) this.requests.delete(this.requests.keys().next().value);
    this.changed(); return id;
  }
  attach(job, taskId) {
    if (!taskId || taskId === job.taskId || !this.tasks.has(taskId)) return;
    const previous = this.tasks.get(job.taskId), target = this.tasks.get(taskId), request = this.requests.get(job.id);
    if (previous) this.tasks.delete(previous.id);
    target.requestCount++; target.activeRequestId = job.id; target.lastRequestId = job.id; target.state = 'running'; target.updatedAt = Date.now();
    request.taskId = taskId; job.taskId = taskId; this.changed();
  }
  phase(job, phase, text) {
    const task = this.tasks.get(job.taskId), request = this.requests.get(job.id); if (!task) return;
    if (request) request.status = 'running';
    task.state = phase === 'queued' ? 'queued' : 'running'; task.activeRequestId = job.id; task.updatedAt = Date.now();
    if (task.phase !== phase) { task.phase = phase; task.events.push({ time: task.updatedAt, phase, text: text || PHASES[phase] || phase }); task.events = task.events.slice(-48); }
    this.changed();
  }
  output(job, kind) {
    const request = this.requests.get(job.id), task = this.tasks.get(job.taskId); if (!request || !task) return;
    if (!request.firstOutputMs) { request.firstOutputMs = Math.max(1, Date.now() - request.createdAt); task.firstOutputMs = request.firstOutputMs; }
    if (task.phase !== kind) this.phase(job, kind);
  }
  offerTools(job, count) { const request = this.requests.get(job.id); if (request) { request.toolsReleased = true; request.toolCount = count; this.changed(); } }
  finish(job, result, meta) {
    const request = this.requests.get(job.id), task = this.tasks.get(job.taskId); if (!request || !task) return;
    request.status = 'completed'; request.finishedAt = Date.now();
    const phase = result.message.tool_calls?.length ? 'waiting_tools' : result.agentStatus === 'needs_input' ? 'waiting_user' : 'completed';
    task.state = phase; task.phase = phase; task.activeRequestId = null; task.updatedAt = request.finishedAt; task.lastRequestId = job.id;
    task.toolsOffered += result.message.tool_calls?.length || 0; task.reused += meta.conversation?.reused ? 1 : 0; task.lastError = null;
    task.events.push({ time: task.updatedAt, phase, text: PHASES[phase] }); task.events = task.events.slice(-48);
    this.changed();
  }
  fail(job, error, cancelled = false) {
    const request = this.requests.get(job.id), task = this.tasks.get(job.taskId); if (!request || !task) return;
    const phase = cancelled ? 'cancelled' : /LOGIN_REQUIRED|VERIFICATION_REQUIRED/.test(error.code || '') ? 'blocked' : 'failed';
    request.status = phase; task.state = phase; task.phase = phase; task.activeRequestId = null; task.updatedAt = Date.now(); task.lastRequestId = job.id;
    task.lastError = { code: error.code || 'internal_error', message: error.status || error.code ? error.message : '处理失败，请查看网页状态' };
    task.events.push({ time: task.updatedAt, phase, text: PHASES[phase] }); task.events = task.events.slice(-48); this.changed();
  }
  cache(job, frames) {
    const request = this.requests.get(job.id); if (!request) return;
    if (frames && bytes(frames) <= 1024 * 1024) request.frames = clone(frames);
    this.changed();
  }
  async idempotency(job, key) {
    if (!key) return null;
    if (typeof key !== 'string' || key.length > 128 || !/^[\x21-\x7e]+$/.test(key)) return { error: 'invalid_idempotency_key' };
    const keyHash = await fingerprint(key), bodyHash = await fingerprint({ path: job.originalPath || job.path, body: job.originalBody || job.body });
    const previous = [...this.requests.values()].find(item => item.id !== job.id && item.keyHash === keyHash);
    if (previous) {
      if (previous.bodyHash !== bodyHash) return { error: 'idempotency_conflict' };
      if (previous.status === 'completed' && previous.frames) return { replay: previous.frames, taskId: previous.taskId };
      if (previous.status === 'running' || previous.status === 'queued') return { error: 'request_in_progress' };
      if (previous.toolsReleased || previous.status === 'completed') return { error: 'request_result_unavailable' };
      delete previous.keyHash;
    }
    const request = this.requests.get(job.id); request.keyHash = keyHash; request.bodyHash = bodyHash; return null;
  }
  retryInput(taskId) {
    const task = this.tasks.get(taskId), request = this.requests.get(task?.lastRequestId);
    if (!task || !RETRYABLE.has(task.state) || !request?.input || request.toolsReleased) return null;
    return clone(request.input);
  }
  result(taskId) { const task = this.tasks.get(taskId); return this.requests.get(task?.lastRequestId)?.frames || null; }
  snapshot() {
    const tasks = [...this.tasks.values()].sort((a, b) => b.updatedAt - a.updatedAt).map(task => {
      const request = this.requests.get(task.lastRequestId), input = RETRYABLE.has(task.state) && !request?.toolsReleased ? request?.input : null;
      const hasTools = Boolean(input?.body.tools?.length);
      return { ...task, events: task.events.slice(-48), retryAvailable: Boolean(input), localRetryAvailable: Boolean(input) && !hasTools,
        cancelAvailable: ACTIVE.has(task.state), resultAvailable: Boolean(request?.frames), errorCode: task.lastError?.code || '' };
    });
    const observations = [...this.requests.values()].filter(item => item.firstOutputMs).map(item => item.firstOutputMs);
    return { totalRequests: this.total, active: tasks.filter(item => ACTIVE.has(item.state)).length, completed: tasks.filter(item => item.state === 'completed').length,
      failed: tasks.filter(item => ['failed', 'blocked', 'interrupted'].includes(item.state)).length,
      firstOutputMs: observations.length ? Math.round(observations.reduce((a, b) => a + b, 0) / observations.length) : null, tasks };
  }
  serialize() {
    const data = { total: this.total, tasks: [...this.tasks.values()], requests: clone([...this.requests.values()]) };
    // Metadata stays; large/private retry inputs and result frames are evicted
    // whole, never truncated into a different prompt or partial tool request.
    for (const request of data.requests) { if (bytes(data) <= 3 * 1024 * 1024) break; delete request.input; delete request.frames; }
    return data;
  }
}
