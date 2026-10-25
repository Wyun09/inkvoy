import { MobileBrowser } from './mobile-browser.js';
import { createEngine } from './engine.js';
import { MobileBuffer } from './platform.js';
import { initDashboard } from './ui/dashboard.js';
import { createClient } from './client.js';
import { initStudio } from './ui/studio.js';
import { setTimeout, clearTimeout, fireTimer } from './native-clock.js';
import { createClientStream } from './client-stream.js';
import { createProviders } from './providers.js';
import {createAgentTools,createWebSearch} from './agent-tools.js';
globalThis.Buffer = MobileBuffer;
let sequence = 0;
const statePending = new Map();
const saveLocal = (channel, raw) => new Promise((resolve, reject) => {
  if (!NativeBridge.saveLocalState) { resolve((channel === 'client' ? NativeBridge.saveClientState?.(raw) : NativeBridge.saveState?.(raw)) ?? false); return; }
  const id = ++sequence;
  const timer = setTimeout(() => { statePending.delete(id); reject(new Error('保存本机记录超时，请检查存储状态。')); }, 30000);
  statePending.set(id, { resolve, timer });
  NativeBridge.saveLocalState(id, channel, raw);
});
let providerInitial={};try{providerInitial=JSON.parse(NativeBridge.loadProviders?.()||'{}');}catch{}
const providers=createProviders({initial:providerInitial,save:raw=>saveLocal('provider',raw),onChange:state=>window.StudioUI?.providerState(state)});
const pending = new Map();
const workspacePending = new Map(), clientRequests = new Map();
const workspace = (operation, argument = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { workspacePending.delete(id); reject(new Error('本机操作等待超时，请检查工具记录再重试。')); }, ['runtime.ensure', 'runtime.test', 'tool.execute'].includes(operation) ? 1200000 : 20000);
  workspacePending.set(id, {resolve,reject,timer});
  if (!NativeBridge.workspaceRequest) { clearTimeout(timer); workspacePending.delete(id); reject(new Error('此界面需要 v2 原生运行时')); return; }
  NativeBridge.workspaceRequest(id, operation, JSON.stringify(argument));
});
const rpc = (operation, argument) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Object.assign(new Error('Android WebView 操作超时。'), { code: 'android_webview_timeout', status: 504 })); }, operation === 'navigate' ? 35000 : 10000);
  pending.set(id, { resolve, reject, timer });
  NativeBridge.request(id, operation, JSON.stringify(argument));
});
const backend = new MobileBrowser(rpc);
let initialState = {};
let stateSaveFailed = false;
try { initialState = JSON.parse(NativeBridge.loadState?.() || '{}'); } catch {}
const engine = createEngine(backend, (id, kind, payload) => {
  const target = clientRequests.get(id);
  if (target) {
    if (kind === 'response') { clientRequests.delete(id); if (payload.status >= 400) target.reject(new Error(payload.body.error?.message || '模型请求失败')); else target.resolve(payload.body); }
    else if(kind==='data'){try{target.stream.push(payload.text);}catch(error){clientRequests.delete(id);target.reject(error);engine.cancel(id,false);}}
    else if(kind==='end'){clientRequests.delete(id);try{target.resolve(target.stream.finish());}catch(error){target.reject(error);}}
    return;
  }
  NativeBridge.response(id, kind, JSON.stringify(payload));
}, {
  initialState,
  previewEnabled:id=>clientRequests.has(id),
  onDraft:(id,draft)=>{try{clientRequests.get(id)?.onProgress?.(draft);}catch{}},
  saveState: NativeBridge.saveLocalState || NativeBridge.saveState ? value => {
    void saveLocal('engine', JSON.stringify(value)).catch(() => false).then(ok => {
      if (!ok && !stateSaveFailed) NativeBridge.reportUi?.('taskNotice', JSON.stringify({ message: '本机记录保存失败，当前任务仍可运行；请查看连接诊断。' }));
      stateSaveFailed = !ok;
    });
  } : undefined,
  onTaskState: state => NativeBridge.reportUi?.('tasks', JSON.stringify(state)),
  strictAgent: () => NativeBridge.agentStrict?.() ?? true,
  defaultWebSearch: () => NativeBridge.searchDefault?.() ?? true,
  onConversationState: state => NativeBridge.reportUi?.('conversations', JSON.stringify(state)),
});
let clientState = {};
try { clientState = JSON.parse(NativeBridge.loadClientState?.() || '{}'); } catch {}
const requestWeb=(id,body,onProgress,requestKey)=>new Promise((resolve,reject)=>{clientRequests.set(id,{resolve,reject,onProgress,stream:createClientStream()});engine.receive({id,path:'/v1/chat/completions',body,requestKey});});
const agentTools=createAgentTools({search:createWebSearch({request:requestWeb,cancel:id=>engine.cancel(id,false),evidence:text=>backend.searchEvidence(text)}),onQuestion:value=>window.StudioUI?.questionState(value)});
const client = createClient({
  modelInfo:()=>providers.current()?{name:providers.current().name,model:providers.current().model,source:'api',provider:{...providers.current()}}:{name:'DeepSeek',model:'deepseek-web',source:'web'},
  initialState:clientState, native:workspace,agentTools,
  request:(id,body,onProgress,connection)=>connection?.source==='api'?providers.request(id,body,onProgress,connection.provider):requestWeb(id,body,onProgress),
  cancel:id=>{if(!providers.cancel(id))engine.cancel(id,false);},saveState:raw=>saveLocal('client', raw),
  onChange:state=>window.StudioUI?.render(state),
});
let inspecting = false;
globalThis.AndroidEngine = {
  computerOpen:()=>window.BridgeDashboard?.navigate('computer'),
  receive: request => engine.receive(request), cancel: id => engine.cancel(id), cancelAll: () => { void client.stop(); engine.cancelAll(); },
  resetConversations() { NativeBridge.reportUi?.('conversationReset', JSON.stringify({ ok: engine.resetConversations() })); },
  async taskAction(action, id) {
    let ok = false;
    try {
      if (action === 'task-cancel') ok = engine.cancelTask(id);
      else if (action === 'task-retry') ok = engine.retryTask(id);
      else if (action === 'session-open') ok = await engine.openSession(id);
      else if (action === 'session-forget') ok = engine.forgetSession(id);
      else if (action === 'task-result') { BridgeDashboard.showResult(engine.taskResult(id)); return; }
    } catch {}
    NativeBridge.reportUi?.('taskNotice', JSON.stringify({ message: ok ? action === 'task-retry' ? '已加入重试队列' : action === 'task-cancel' ? '正在取消请求' : action === 'session-forget' ? '已解除关联，网页历史保留' : '已打开会话' : '当前状态无法执行此操作，请查看任务详情' }));
  },
  async inspect() {
    if (inspecting) return;
    inspecting = true;
    NativeBridge.reportUi?.('inspectionStart', '{}');
    try { NativeBridge.reportUi?.('inspection', JSON.stringify(await backend.status())); }
    catch { NativeBridge.reportUi?.('inspectionError', '{}'); }
    finally { inspecting = false; }
  },
  timer: fireTimer,
  stateSaved(id, ok) { const target = statePending.get(id); if (!target) return; clearTimeout(target.timer); statePending.delete(id); target.resolve(ok === true); },
  workspaceRpc(id, response) { const target=workspacePending.get(id);if(!target)return;clearTimeout(target.timer);workspacePending.delete(id);if(response.ok)target.resolve(response.value);else target.reject(new Error(response.error?.message||'本机操作失败')); },
  nativeEvent:event=>window.StudioUI?.nativeEvent(event),
  providerEvent:(id,value)=>providers.event(id,value),
  rpc(id, response) {
    const target = pending.get(id); if (!target) return;
    clearTimeout(target.timer); pending.delete(id);
    if (response.ok) target.resolve(response.value);
    else target.reject(Object.assign(new Error(response.error?.message || 'Android WebView 操作失败。'), { code: response.error?.code || 'PAGE_CHANGED', status: response.error?.status || 502 }));
  },
};
try {
  initStudio({client,native:workspace,providers,agentTools});
  initDashboard();
  BridgeDashboard.navigate('chat');
  NativeBridge.ready();
  engine.publishState();
} catch (error) {
  // Native fallback remains usable even if the packaged UI cannot boot.
  NativeBridge.startupError?.(String(error?.message || '界面初始化失败').slice(0, 240));
  throw error;
}
