import { readFile } from 'node:fs/promises';
export async function uiHarness(browser, viewport = { width: 390, height: 844 }, { storage = 'enabled', failStartup = false, initialPage = 'home', studio = false, holdTools=false, clientState = {}, providerState={}, providerCatalog, mediaFiles={}, fileChanges={}, saveDelay=0, assetsDirectory, recordVideo, runtimeTools = [{name:'JADX',version:'1.5.6',kind:'APK / DEX'},{name:'radare2',version:'6.2.4',kind:'ELF / SO'}] } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1,...(recordVideo?{recordVideo}:{}) });
  const page = await context.newPage();
  const assets = assetsDirectory || new URL('../app/src/main/assets/', import.meta.url);
  await page.route('https://bridge.local/**', async route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    if (!['engine.html', 'engine.bundle.js', 'compute.worker.js', 'mcp.worker.js', 'app.css', 'logo.png', 'companion.png','Geist.ttf'].includes(name)) return route.abort();
    return route.fulfill({ contentType: name.endsWith('.ttf')?'font/ttf':name.endsWith('.png') ? 'image/png' : name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8', body: await readFile(new URL(name, assets)) });
  });
  await page.addInitScript(({ storage, failStartup, studio, holdTools, clientState, providerState, providerCatalog, mediaFiles, fileChanges, runtimeTools, saveDelay }) => {
    if (failStartup) window.ResizeObserver = class { constructor() { throw new Error('ResizeObserver unavailable'); } };
    if (storage === 'disabled') Object.defineProperty(window, 'localStorage', { get: () => null });
    if (storage === 'blocked') Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('Storage access denied', 'SecurityError'); } });
    if (storage === 'read-only') Object.defineProperty(window, 'localStorage', { get: () => ({ getItem: () => null, setItem: () => { throw new DOMException('Storage full', 'QuotaExceededError'); } }) });
    const set = window.setTimeout.bind(window), clear = window.clearTimeout.bind(window), timers = new Map();
    window.nativeActions = []; window.nativeLayouts = []; window.nativeStartupErrors = [];
    const files = { 'hello.py': 'print("fixture")\n' };for(const change of Object.values(fileChanges))files[change.path]=change.current??change.after;let term=0;
    window.workspaceCalls=[];window.clientSaved=[];window.providerSaved=[];window.providerCalls=[];window.providerCancels=[];
    const managedJobs=[];
    let computerState={url:'',title:'AI 浏览器',enabled:true,canBack:false,canForward:false,loading:false,phase:'就绪'};
    window.NativeBridge = {
      ready() { window.nativeReady = true; },
      timer(id, ms) { timers.set(id, set(() => { timers.delete(id); AndroidEngine.timer(id); }, ms)); },
      clearTimer(id) { clear(timers.get(id)); timers.delete(id); },
      uiAction(action, raw) { window.nativeActions.push({ action, payload: JSON.parse(raw) }); },
      uiLayout(raw) { window.nativeLayouts.push(JSON.parse(raw)); },
      startupError(message) { window.nativeStartupErrors.push(message); },
      searchDefault() { return true; },
      saveClientState(raw) {window.clientSaved.push(JSON.parse(raw));return true;},
      saveLocalState(id,channel,raw){set(()=>{if(channel==='client')window.clientSaved.push(JSON.parse(raw));if(channel==='provider')window.providerSaved.push(JSON.parse(raw));AndroidEngine.stateSaved(id,true);},saveDelay);},
      loadClientState(){return JSON.stringify(clientState);},
      loadProviders(){return JSON.stringify(providerState);},
      providerCancel(id){window.providerCancels.push(id);},
      providerRequest(id,raw){const p=JSON.parse(raw);window.providerCalls.push({id,...p});if(window.providerFixtureResponses?.length){const body=window.providerFixtureResponses.shift();set(()=>AndroidEngine.providerEvent(id,{type:'response',body}),30);return;}if(p.operation==='models'){set(()=>AndroidEngine.providerEvent(id,{type:'response',body:providerCatalog||{data:[{id:'fixture-custom-model'},{id:'fixture-model-2'}]}}),20);return;}const first='data: '+JSON.stringify({choices:[{delta:{content:'CUSTOM_STREAM_FIRST'}}]})+'\n\n';const last='data: '+JSON.stringify({choices:[{delta:{content:' + final'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n';set(()=>AndroidEngine.providerEvent(id,{type:'data',text:first}),40);set(()=>{AndroidEngine.providerEvent(id,{type:'data',text:last});AndroidEngine.providerEvent(id,{type:'end'});},1200);},
      workspaceRequest(id,operation,raw) {window.workspaceCalls.push({id,operation,args:JSON.parse(raw)});if(!studio)return;const a=JSON.parse(raw);let value=true;
        if(operation==='browser.ui'){if(a.action==='open')computerState={...computerState,url:a.url,title:'测试网页',enabled:computerState.enabled};if(a.action==='zoom')computerState.zoom=a.scale??Math.max(.5,Math.min(3,(computerState.zoom||1)*(a.factor||1)));if(a.action==='takeover')computerState.enabled=false;if(a.action==='allow')computerState.enabled=true;value={...computerState};set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;}
        if(operation==='file.attachment'){value={...(mediaFiles[a.path]||{name:a.path,path:a.path,bytes:12,image:false}),project:a.project};set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;}if(operation==='media.data'){value='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7F8AAAAASUVORK5CYII=';set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;}if(operation==='file.change'||operation==='file.revert'){
          const change=fileChanges[a.id];if(!change){set(()=>AndroidEngine.workspaceRpc(id,{ok:false,error:{message:'快照已过期'}}),20);return;}
          const canRevert=!change.reverted&&files[change.path]===change.after;
          if(operation==='file.revert'){if(!canRevert){set(()=>AndroidEngine.workspaceRpc(id,{ok:false,error:{message:'文件已有后续修改'}}),20);return;}if(change.existed)files[change.path]=change.before;else delete files[change.path];change.reverted=true;value={ok:true};}
          else value={...change,id:a.id,previewable:true,canRevert};
          set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;
        }
        if(operation==='process.list'){value={jobs:managedJobs.filter(j=>j.project===a.project).map(j=>({...j}))};set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;}
        if(operation==='process.stop'){const j=managedJobs.find(j=>j.id===a.id&&j.project===a.project);if(j){j.state='exited';j.exitCode=0;}value=j||{};set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;}
        if(operation==='tool.execute'&&a.name==='process'&&a.args.action==='start'){value={id:a.id,project:a.project,title:a.args.title||'开发服务',command:a.args.command,cwd:a.args.cwd,previewUrl:a.args.preview_url,state:'running',stdout:'Serving HTTP on 127.0.0.1 port 8899',stderr:''};managedJobs.push(value);set(()=>AndroidEngine.workspaceRpc(id,{ok:true,value}),20);return;}
        if(operation==='tool.execute'&&holdTools)return;
        if(operation==='account.list')value={accounts:[],authorizing:false,notice:''};
        else if(operation==='extension.list')value={servers:[],plugins:[]};
        else if(operation==='runtime.status'||operation==='runtime.ensure')value={ready:true,verified:false,tools:runtimeTools};
        else if(operation==='file.list')value={entries:Object.entries(files).map(([name,content])=>({name,bytes:content.length,directory:false}))};
        else if(operation==='file.read')value={content:files[a.path]||'',truncated:false};
        else if(operation==='file.write'){files[a.path]=a.content;value={ok:true};}
        else if(operation==='file.search')value={matches:[]};
        else if(operation==='terminal.open')value={id:'fixture-pty-'+(++term)};
        else if(operation==='terminal.attach')value={buffer:btoa('Fixture PTY output\r\n$ '),exited:false};
        else if(operation==='runtime.test')value={ok:true,stdout:'Fixture self-test',exitCode:0};
        set(()=>window.AndroidEngine.workspaceRpc(id,{ok:true,value}),20);
      },
      request() {}, response() {}, reportUi() {},
    };
  }, { storage, failStartup, studio, holdTools, clientState, providerState, providerCatalog, mediaFiles, fileChanges, runtimeTools, saveDelay });
  await page.goto('https://bridge.local/engine.html');
  await page.waitForFunction(failStartup => failStartup ? window.nativeStartupErrors?.length > 0 : window.nativeReady && window.BridgeDashboard, failStartup, { timeout: 5000 });
  if(!failStartup)await page.evaluate(tab=>BridgeDashboard.navigate(tab),initialPage);
  return { context, page };
}
export async function navigateLegacy(page, tab) {
  if(await page.locator('#page-chat').isVisible())return navigateStudio(page,tab);
  if(await page.locator('#workspace-menu').count())return navigateStudio(page,tab);
  if(['tasks','connect'].includes(tab)) {
    await page.locator('.bottom-nav [data-navigate="home"]').click();
    await page.locator('#page-home [data-navigate="'+tab+'"]').first().click();
  } else await page.locator('.bottom-nav [data-navigate="'+tab+'"]').click();
}
export async function navigateStudio(page,tab) {
  if(await page.locator('#page-'+tab).isVisible())return;
  if(tab==='settings'&&await page.locator('#rail-settings').isVisible()){await page.locator('#rail-settings').click();return;}
  const rail=page.locator('[data-rail-page="'+tab+'"]');if(await rail.count()&&await rail.isVisible()){await rail.click();return;}
  const direct=page.locator('.bottom-nav [data-navigate="'+tab+'"]');if(await direct.count()&&await direct.isVisible()){await direct.click();return;}
  if(await page.locator('#workspace-menu').count()){
    if(await page.locator('#session-menu').isVisible())await page.locator('#session-menu').click();else if(await page.locator('#workspace-menu').isVisible())await page.locator('#workspace-menu').click();else await page.locator('#rail-sessions').click();
    const extra=page.locator('#studio-drawer [data-drawer-page="'+tab+'"]');if(await extra.count()&&!(await extra.isVisible()))await page.locator('#drawer-more>summary').click();
    await page.locator('[data-drawer-page="'+tab+'"]').click();
  }else await navigateLegacy(page,tab);
}
export const readyState = { version: '1.0.0', ready: true, running: true, loggedIn: true, hasInspection: true, inspecting: false, needsVerification: false, reasoningMode: { count: 1, enabled: false, source: 'ds_toggle_component' }, webSearchDefault: true, webSearchMode: { count: 1, enabled: true, source: 'aria-pressed' }, requests: 0, busy: false, testStatus: 'passed', probeRunning: false, activities: [{ text: '本机服务已启动', time: '09:41' }, { text: '网页登录已确认', time: '09:42' }, { text: '接口自测通过', time: '09:42' }] };

// Deterministic display fixtures, never included in the production UI bundle.
const fixtureTime = new Date('2026-10-17T09:42:00+08:00').getTime();
function fixtureTask(id, title, state, phase, extra = {}) {
  return { id, title, state, phase, protocol: 'Anthropic', createdAt: fixtureTime - 90000, updatedAt: fixtureTime, requestCount: 4, toolsOffered: 3, reused: 3, firstOutputMs: 3800, cancelAvailable: state === 'running', resultAvailable: state !== 'running', retryAvailable: false, localRetryAvailable: false,
    events: [{ time: fixtureTime - 90000, phase: 'queued', text: '等待处理' }, { time: fixtureTime - 89000, phase: 'resuming_conversation', text: '恢复原会话' }, { time: fixtureTime - 87000, phase: 'submitting', text: '发送消息' }, { time: fixtureTime - 83000, phase: 'thinking', text: '正在思考' }, { time: fixtureTime - 60000, phase: 'waiting_tools', text: '等待客户端工具结果' }, { time: fixtureTime, phase, text: ({ thinking: '正在思考', failed: '处理失败', completed: '已完成', waiting_tools: '等待客户端工具结果' })[phase] || phase }], ...extra };
}
export const workbenchState = { ...readyState, busy: true, agentStrict: true, storage: { available: true, encrypted: true, reason: 'ready' }, conversations: { tracked: 3, created: 3, reused: 18 },
  taskboard: { totalRequests: 28, active: 1, completed: 1, failed: 1, firstOutputMs: 3800,
    tasks: [fixtureTask('task_scene', '完善 Three.js 场景与移动端性能', 'running', 'thinking'),
      fixtureTask('task_tools', '整理项目结构，补齐缺失的配置', 'waiting_tools', 'waiting_tools', { requestCount: 2, toolsOffered: 2, reused: 1 }),
      fixtureTask('task_retry', '检查构建结果，修复类型错误', 'failed', 'failed', { protocol: 'OpenAI', requestCount: 1, toolsOffered: 0, reused: 0, retryAvailable: true, localRetryAvailable: true, lastError: { code: 'PAGE_CHANGED', message: '网页连接中断，可检查网页后重试。' } }),
      fixtureTask('task_done', '完成首页布局与明暗主题', 'completed', 'completed', { requestCount: 6, toolsOffered: 5, reused: 5 })],
    sessions: [{ id: '1', taskId: 'task_scene', turns: 4, messages: 12, used: fixtureTime }, { id: '2', taskId: 'task_tools', turns: 2, messages: 6, used: fixtureTime - 900000 }, { id: '3', taskId: 'task_done', turns: 6, messages: 20, used: fixtureTime - 3600000 }] } };
