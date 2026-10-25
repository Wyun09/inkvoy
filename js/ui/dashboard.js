import { PHASES } from '../tasks.js';
const paths = {
  bridge: '<path d="M3 15h18M5 15v6M19 15v6M5 15C5 3 19 3 19 15M12 6v9"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2.5M12 17h.01"/>',
  power: '<path d="M12 2v9M6 5a9 9 0 1 0 12 0"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  'arrow-right': '<path d="M4 12h16M14 6l6 6-6 6"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  shield: '<path d="m12 3 8 3v6c0 4-3.5 7-8 9-4.5-2-8-5-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  sparkles: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 2v4M18 4h4"/>',
  pulse: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9l10-6ZM2 13l10 6 10-6M2 17l10 6 10-6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  plug: '<path d="m9 3 1 5M15 3l-1 5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  message: '<path d="M21 11a8 8 0 0 1-8 8H7l-5 3 1.5-6A8 8 0 1 1 21 11Z"/><path d="M7 10h9M7 14h5"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18"/>',
  activity: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 15v-3M12 15V8M17 15v-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>', check: '<path d="m5 12 5 5L20 7"/>',
};
function icon(node, name) {
  node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}
export function initDashboard() {
  if (!document.getElementById('app')) return;
  const $ = id => document.getElementById(id);
  document.querySelectorAll('[data-icon]').forEach(node => icon(node, node.dataset.icon));
  let state = { ready: false, running: false, loggedIn: false, hasInspection: false, inspecting: false, busy: false, testStatus: 'untested', reasoningMode: { enabled: null }, activities: [], version: '1.0.0', taskboard: { tasks: [], sessions: [] } };
  let tab = 'home', board = 'tasks', filter = 'all', toastTimer, modal = false, previousFocus, modalTaskId;
  // Android WebView disables DOM storage by default. Preferences are optional:
  // an unavailable, blocked or full store must never stop event binding/boot.
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try {
    const saved = window.localStorage?.getItem('bridge-theme');
    if (saved === 'dark' || saved === 'light') theme = saved;
  } catch { /* Use the system theme when persistent storage is unavailable. */ }
  function native(action, payload = {}) {
    if (window.NativeBridge?.uiAction) NativeBridge.uiAction(action, JSON.stringify(payload));
    else toast('此操作需要在安卓应用中使用');
  }
  function setTheme(value) {
    theme = value; document.body.classList.toggle('dark', value === 'dark');
    icon($('theme'), value === 'dark' ? 'sun' : 'moon');
    $('theme').setAttribute('aria-label', value === 'dark' ? '切换为浅色主题' : '切换为深色主题');
    try { window.localStorage?.setItem('bridge-theme', value); } catch { /* Theme still works for this session. */ }
    native('theme', { dark: value === 'dark' });
  }
  let layoutFrame = 0, lastLayout = '';
  function layout() {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      const visible = tab === 'web' && !modal;
      const slot = visible ? $('web-slot').getBoundingClientRect() : null;
      const rounded = value => Math.round(value * 2) / 2;
      const raw = JSON.stringify(visible ? { visible, top: rounded(slot.top), left: rounded(slot.left), width: rounded(slot.width), height: rounded(slot.height), viewportWidth: innerWidth } : { visible: false });
      if (raw === lastLayout) return;
      lastLayout = raw; NativeBridge.uiLayout?.(raw);
    });
  }
  function navigate(value) {
    if (!['home', 'tasks', 'web', 'connect', 'chat', 'files', 'terminal', 'tools'].includes(value) || !$('page-' + value)) return;
    tab = value;
    document.body.dataset.page=value;
    window.StudioUI?.closeDrawer();
    for (const name of ['home', 'tasks', 'web', 'connect', 'chat', 'files', 'terminal', 'tools']) if ($('page-' + name)) $('page-' + name).hidden = name !== value;
    document.querySelectorAll('.bottom-nav [data-navigate]').forEach(button => {
      button.classList.toggle('active', button.dataset.navigate === value);
      if (button.dataset.navigate === value) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    requestAnimationFrame(layout);
    window.dispatchEvent(new CustomEvent('bridge:navigate', { detail: value }));
    if (value === 'home' && state.ready && !state.busy && !state.inspecting) native('inspect');
  }
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2500);
  }
  const paragraph = text => { const node = document.createElement('p'); node.textContent = text; return node; };
  const row = (label, value) => {
    const node = document.createElement('div'); node.className = 'detail-row';
    const key = document.createElement('span'), detail = document.createElement('strong'); key.textContent = label; detail.textContent = value;
    node.append(key, detail); return node;
  };
  function closeSheet() { modal = false; modalTaskId = null; $('sheet-scrim').hidden = true; previousFocus?.focus(); layout(); }
  function sheet(title, nodes, actions = [], symbol = 'info') {
    const wasOpen = modal;
    const focusedAction = wasOpen && $('sheet-actions').contains(document.activeElement) ? document.activeElement.textContent : null;
    if (!wasOpen) previousFocus = document.activeElement;
    modal = true;
    $('sheet-title').textContent = title; icon($('sheet-icon'), symbol);
    $('sheet-body').replaceChildren(...nodes); $('sheet-actions').replaceChildren();
    for (const action of actions) {
      const button = document.createElement('button'); button.textContent = action.label; button.disabled = Boolean(action.disabled); if (action.danger) button.className = 'danger';
      button.addEventListener('click', action.run); $('sheet-actions').append(button);
    }
    $('sheet-scrim').hidden = false;
    if (!wasOpen) $('close-sheet').focus();
    else if (focusedAction) ([...$('sheet-actions').querySelectorAll('button:not(:disabled)')].find(button => button.textContent === focusedAction) || $('close-sheet')).focus();
    layout();
  }
  function reasoningSheet() {
    const mode = state.reasoningMode || {};
    const reason = { login_required: '先完成网页登录，再检测思考开关。', verification_required: '请先在 DeepSeek 网页完成人机验证。', control_missing: '页面还没有显示思考开关，可以等待网页加载后重新检测。', multiple_controls: '页面出现多个思考开关，暂未选择其中任何一个。', state_not_exposed: '已找到按钮，但当前页面没有提供可信的开关状态。', conflicting_state: '页面里的开关状态标记互相冲突，暂未切换。', observation_failed: '暂时无法读取网页，请打开 DeepSeek 页面检查。' };
    const label = typeof mode.enabled === 'boolean' ? mode.enabled ? '已开启' : '已关闭' : '尚未确认';
    sheet('深度思考', [row('当前网页状态', label), row('找到的控件', String(mode.count ?? 0) + ' 个'), paragraph(reason[mode.reason] || '桥会按每次请求指定的思考设置切换，并再次确认网页状态。'), paragraph('“开启并测试”会发送一次带思考模式的真实测试请求。')], [
      { label: state.inspecting ? '检测中…' : '重新检测', disabled: state.inspecting, run: () => { closeSheet(); native('inspect'); toast('正在检测思考开关'); } },
      { label: '开启并测试', disabled: !state.running || state.busy || state.probeRunning, run: () => { closeSheet(); native('test', { thinking: true }); } },
    ], 'sparkles');
  }
  function help() {
    sheet('在手机上，完成连接', [paragraph('01  打开 DeepSeek 页面，手动登录并完成网站要求的验证。'), paragraph('02  回到概览，运行一次接口自测。通过后在连接页复制配置。'), paragraph('03  在同一部手机的兼容客户端填写本机地址、模型和密钥。电脑无需参与运行。'), paragraph('建议分屏保持本应用可见。锁屏与长期后台运行仍需在你的设备上验证。'), paragraph('这是第三方适配应用。账号登录由 DeepSeek 网页处理。')], [{ label: '打开 DeepSeek', run: () => { closeSheet(); navigate('web'); } }, { label: '连接配置', run: () => { closeSheet(); navigate('connect'); } }], 'bridge');
  }
  function searchSheet() {
    const mode = state.webSearchMode || {};
    const enabled = state.webSearchDefault !== false;
    const label = typeof mode.enabled === 'boolean' ? mode.enabled ? '已开启' : '已关闭' : '尚未确认';
    sheet('网页智能搜索', [row('当前网页状态', label), row('请求默认策略', enabled ? '默认开启' : '默认关闭'),
      paragraph('使用 DeepSeek 网页自带的智能搜索，不需要配置额外搜索模型或 API Key。网页会决定本次回答是否需要实际检索。'),
      paragraph('默认策略会在下次请求发送前应用，并确认开关状态。请求体里的 web_search: true 或 false 优先于这里的默认值。')], [
      { label: '默认开启', disabled: enabled, run: () => { native('search-policy', { enabled: true }); closeSheet(); } },
      { label: '默认关闭', disabled: !enabled, run: () => { native('search-policy', { enabled: false }); closeSheet(); } },
      { label: '重新检测网页', disabled: state.inspecting, run: () => { closeSheet(); native('inspect'); } },
    ], 'globe');
  }
  function diagnostics() {
    sheet('连接诊断', [row('应用版本', state.version || '1.0.0'), row('本机服务', state.running ? '已启动' : '未启动'), row('网页登录', state.hasInspection ? state.loggedIn ? '已登录' : '需要登录或验证' : '尚未检测'), row('思考开关', state.reasoningMode?.source || '待检测'), row('累计请求', String(state.taskboard?.totalRequests || 0) + ' 次'), row('当前任务', state.busy ? '处理中' : '空闲'), row('Agent 协议', state.agentStrict === false ? '兼容模式' : '严格模式'), row('持久化存储', state.storage?.available ? '本机加密保存' : '暂未就绪'), row('保留会话', String(state.taskboard?.sessions?.length || 0) + ' 个'), paragraph(!state.storage?.available && state.storage?.reason ? '本机记录无法读写，当前任务仍可在内存中运行。可保留应用数据后重新打开，再检查存储状态。' : state.lastError || '诊断不包含 API 密钥、验证码、任务标题和聊天正文。')], [{ label: '复制诊断信息', run: () => native('copy', { field: 'diagnostics' }) }, { label: '重新检测', disabled: state.inspecting, run: () => { closeSheet(); native('inspect'); } }], 'activity');
  }
  function conversationSheet() {
    const usage = state.conversations || {};
    sheet('会话复用', [row('工作方式', '同一任务自动续接'), row('已复用', String(usage.reused || 0) + ' 次'), row('已关联的新会话', String(usage.created || 0) + ' 个'),
      paragraph('工具执行后的下一轮、同一聊天中的追问，会沿用对应的网页对话，只发送新增消息。不同任务分别保留会话关联。'),
      paragraph('关联会加密保存在本机，应用重开后先校验网页再续接。客户端改写或压缩历史、网页会话不可恢复时，用完整历史新建会话。重置只清除关联，不会删除网页历史。')], [
      { label: '下次开始新会话', disabled: state.busy || state.probeRunning || !state.ready, run: () => { native('reset-conversations'); closeSheet(); } },
      { label: '继续自动复用', run: closeSheet },
      { label: '管理会话', run: () => { closeSheet(); navigate('tasks'); switchBoard('sessions'); } },
    ], 'message');
  }
  function result(result) {
    const ok = result.passed === true;
    sheet(result.thinking ? '深度思考测试' : '接口自测', [row('结果', ok ? '测试通过' : '未通过'), paragraph(result.message || (ok ? '真实网页调用已完成。' : '请检查网页或重新检测连接状态。')), ...(result.thinking && result.reasoningChars ? [row('已读取思考内容', result.reasoningChars + ' 字符')] : [])], [{ label: ok ? '查看连接配置' : '打开 DeepSeek', run: () => { closeSheet(); navigate(ok ? 'connect' : 'web'); } }, { label: '完成', run: closeSheet }], ok ? 'check' : 'info');
  }
  const activeStates = new Set(['queued', 'running', 'waiting_tools']);
  const attentionStates = new Set(['failed', 'blocked', 'interrupted', 'waiting_user']);
  const taskData = () => state.taskboard || { tasks: [], sessions: [] };
  const findTask = id => taskData().tasks?.find(task => task.id === id);
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  function symbol(name, className = '') { const node = make('span', className); icon(node, name); return node; }
  const timeOf = value => Number.isFinite(value) ? new Date(value).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
  const dateOf = value => Number.isFinite(value) ? new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + timeOf(value).slice(0, 5) : '—';
  const phaseOf = task => PHASES[task.phase] || PHASES[task.state] || '等待状态更新';
  function phaseChip(task) {
    const style = attentionStates.has(task.state) ? 'attention' : task.state === 'completed' ? 'completed' : ['waiting_tools', 'waiting_user'].includes(task.state) ? 'waiting' : task.state === 'cancelled' ? 'cancelled' : '';
    return make('span', 'phase-chip ' + style, phaseOf(task));
  }
  function duration(ms) { const seconds = Math.max(0, Math.floor(ms / 1000)); return seconds < 60 ? seconds + ' 秒' : Math.floor(seconds / 60) + ' 分 ' + seconds % 60 + ' 秒'; }
  function switchBoard(value) {
    board = value; $('task-board').hidden = board !== 'tasks'; $('session-board').hidden = board !== 'sessions';
    document.querySelectorAll('[data-board]').forEach(button => { const selected = button.dataset.board === board; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); });
  }
  function showRetryInfo(task) {
    modalTaskId = null;
    const pre = make('pre', '', 'POST /v1/bridge/tasks/' + task.id + '/retry\nAuthorization: Bearer YOUR_LOCAL_KEY');
    sheet('在原客户端继续', [paragraph('这个请求包含客户端工具。桥内重试无法替客户端执行文件、命令等操作，因此需要回到原客户端继续任务。'), paragraph('若客户端支持自定义请求，也可以调用下方接口；响应仍是该任务原来的 OpenAI 或 Anthropic 协议。执行工具前请核对客户端已有记录。'), pre], [{ label: '查看网页', run: () => { closeSheet(); navigate('web'); } }, { label: '返回任务', run: () => taskSheet(task.id) }], 'code');
  }
  function taskSheet(id) {
    const task = findTask(id); if (!task) { toast('这条任务已不在保留范围内'); return; }
    modalTaskId = id;
    const nodes = [phaseChip(task), row('接入协议', task.protocol || 'OpenAI'), row('请求次数', String(task.requestCount || 1) + ' 次'), row('已交出的工具调用', String(task.toolsOffered || 0) + ' 个'), row('会话续接', String(task.reused || 0) + ' 次')];
    if (task.firstOutputMs) nodes.push(row('最近一次首段输出', (task.firstOutputMs / 1000).toFixed(1) + ' 秒'));
    if (task.lastError) { const error = make('div', 'task-detail-error'); error.append(paragraph(task.lastError.message || '请求未完成'), make('code', '', task.lastError.code || '')); nodes.push(error); }
    if (task.state === 'waiting_tools') nodes.push(paragraph('网页已交出工具调用，正在等待原客户端执行并提交结果。桥会在下一轮请求校验历史后续接此会话。'));
    if (task.state === 'interrupted') nodes.push(paragraph('上次运行被中断，未自动重新发送。请先确认原客户端和网页状态，再决定是否重试。'));
    if (task.state === 'waiting_user') nodes.push(paragraph('模型明确请求你补充信息。请在原客户端回复后继续。'));
    if (task.state === 'completed') nodes.push(paragraph('该次 API 请求已正常结束。工具任务是否全部完成，仍由原客户端结合实际执行结果判断。'));
    nodes.push(make('div', 'task-detail-label', '运行时间线'));
    const timeline = make('ol', 'timeline');
    for (const event of (task.events || []).slice(-18)) { const item = make('li'), detail = make('div'); detail.append(make('strong', '', event.text || PHASES[event.phase] || '状态更新'), make('time', '', timeOf(event.time))); item.append(make('i'), detail); timeline.append(item); }
    nodes.push(timeline);
    const actions = [];
    if (task.cancelAvailable) actions.push({ label: '取消本次请求', danger: true, run: () => { native('task-cancel', { id }); toast('正在请求取消'); } });
    if (task.localRetryAvailable) actions.push({ label: '重试本次请求', disabled: !state.running || !state.ready, run: () => { native('task-retry', { id }); closeSheet(); toast('正在加入重试队列'); } });
    else if (task.retryAvailable) actions.push({ label: '查看重试方式', run: () => showRetryInfo(task) });
    if (task.state === 'blocked') actions.push({ label: '处理网页登录', run: () => { closeSheet(); navigate('web'); } });
    if (task.resultAvailable) actions.push({ label: '查看响应记录', run: () => { modalTaskId = null; native('task-result', { id }); } });
    const session = taskData().sessions?.find(item => item.taskId === id);
    if (session) actions.push({ label: '打开原会话', disabled: state.busy, run: () => { native('session-open', { id: session.id }); closeSheet(); } });
    sheet(task.title || 'API 任务', nodes, actions, 'activity');
  }
  function sessionSheet(id) {
    const session = taskData().sessions?.find(item => item.id === id); if (!session) return;
    modalTaskId = null;
    const task = findTask(session.taskId);
    sheet(task?.title || '已保存的网页会话', [row('累计轮次', String(session.turns || 1) + ' 轮'), row('已校验消息', String(session.messages || 0) + ' 条'), row('最近使用', dateOf(session.used)), paragraph('恢复会话前会校验网页地址和上一条回答；移除本机关联不会删除 DeepSeek 网页历史。')], [
      { label: '打开原会话', disabled: state.busy || !state.ready, run: () => { native('session-open', { id }); closeSheet(); } },
      { label: '移除关联', disabled: state.busy, danger: true, run: () => { native('session-forget', { id }); closeSheet(); } },
    ], 'message');
  }
  function emptyCard(title, text, action) { const node = make(action ? 'button' : 'div', 'task-empty'); node.append(symbol('layers')); const detail = make('div'); detail.append(make('strong', '', title), paragraph(text)); node.append(detail); if (action) node.addEventListener('click', action); return node; }
  function renderTasks() {
    const data = taskData(), tasks = data.tasks || [], sessions = data.sessions || [];
    $('metric-requests').textContent = String(data.totalRequests || 0); $('metric-reused').textContent = String(state.conversations?.reused || 0);
    $('metric-first').textContent = data.firstOutputMs ? (data.firstOutputMs / 1000).toFixed(1) + 's' : '—';
    $('tasks-count').textContent = String(tasks.length); $('sessions-count').textContent = String(sessions.length);
    $('tasks-active').textContent = String(tasks.filter(task => activeStates.has(task.state)).length);
    $('tasks-attention').textContent = String(tasks.filter(task => attentionStates.has(task.state)).length);
    $('tasks-done').textContent = String(tasks.filter(task => task.state === 'completed').length);
    $('task-nav-dot').hidden = !tasks.some(task => attentionStates.has(task.state));
    const latest = tasks.find(task => ['running', 'queued'].includes(task.state)) || tasks[0];
    if (latest) {
      const peek = make('button', 'task-peek'); peek.setAttribute('aria-label', '查看任务：' + latest.title);
      const top = make('div', 'peek-top'), detail = make('div', 'peek-main'); detail.append(make('strong', '', latest.title), make('span', '', phaseOf(latest) + ' · ' + (latest.requestCount || 1) + ' 次请求'));
      top.append(symbol(latest.phase === 'thinking' ? 'sparkles' : 'activity', 'peek-symbol'), detail, symbol('chevron-right', 'peek-chevron')); peek.append(top);
      if (['running', 'queued'].includes(latest.state)) { const progress = make('div', 'peek-progress'); progress.append(make('i')); peek.append(progress); }
      peek.addEventListener('click', () => taskSheet(latest.id)); $('task-peek').replaceChildren(peek);
    } else $('task-peek').replaceChildren(emptyCard('一切就绪，等待新任务', '连接客户端后，任务会自动出现在这里。', () => navigate('connect')));
    const selected = tasks.filter(task => filter === 'all' || filter === 'active' && activeStates.has(task.state) || filter === 'attention' && attentionStates.has(task.state) || filter === 'completed' && task.state === 'completed');
    $('task-list').replaceChildren(...(selected.length ? selected.map(task => {
      const card = make('button', 'task-card'); card.dataset.task = task.id; const top = make('div', 'task-card-top'), protocol = make('span', 'task-protocol', task.protocol || 'OpenAI'); protocol.prepend(symbol('code')); top.append(protocol, phaseChip(task));
      const bottom = make('div', 'task-card-bottom'); bottom.append(make('span', '', (task.requestCount || 1) + ' 次请求 · ' + (task.reused || 0) + ' 次续接'), make('span', '', dateOf(task.updatedAt)));
      card.append(top, make('h3', '', task.title || 'API 任务'), bottom);
      if (task.lastError) card.append(make('p', 'task-card-error', task.lastError.message || '请求未完成'));
      if (['running', 'queued'].includes(task.state)) { const progress = make('div', 'task-card-progress'); progress.append(make('i')); card.append(progress); }
      card.addEventListener('click', () => taskSheet(task.id)); return card;
    }) : [emptyCard(filter === 'all' ? '还没有任务' : '这里暂时没有任务', filter === 'all' ? '从连接页复制配置，在客户端发送第一条消息。' : '符合筛选条件的任务会显示在这里。')]));
    $('session-list').replaceChildren(...(sessions.length ? sessions.map(session => {
      const card = make('button', 'task-card session-card'); card.dataset.session = session.id; const top = make('div', 'task-card-top'); top.append(make('span', 'task-protocol', 'SESSION / ' + String(session.id).padStart(2, '0')), make('span', 'session-indicator', '已保存关联'));
      const bottom = make('div', 'task-card-bottom'); bottom.append(make('span', '', (session.turns || 1) + ' 轮对话 · ' + (session.messages || 0) + ' 条消息'), make('span', '', dateOf(session.used)));
      card.append(top, make('h3', '', findTask(session.taskId)?.title || '已保存的网页会话'), bottom); card.addEventListener('click', () => sessionSheet(session.id)); return card;
    }) : [emptyCard('还没有会话关联', '第一轮成功调用后，会自动保留对应的网页会话。')]));
    if (modal && modalTaskId) taskSheet(modalTaskId);
  }
  function showResult(frames) {
    modalTaskId = null;
    if (!Array.isArray(frames) || !frames.length) { toast('响应记录未保存或已过期'); return; }
    const response = frames.find(frame => frame.kind === 'response');
    const text = response ? JSON.stringify(response.payload?.body, null, 2) : frames.filter(frame => frame.kind === 'data').map(frame => frame.payload?.text || '').join('');
    const pre = make('pre', 'result-pre', (text || '没有可显示的正文').slice(0, 12000));
    sheet('已保存的响应', [paragraph('保留原协议响应与工具调用 ID。这里只查看记录，不会执行其中的工具。'), pre, ...(text?.length > 12000 ? [paragraph('界面展示前 12,000 字符，完整缓存可从任务 result 接口读取。')] : [])], [{ label: '关闭', run: closeSheet }], 'code');
  }
  function render(next) {
    state = { ...state, ...next };
    window.StudioUI?.platformState(state);
    const running = state.running, loggedIn = state.hasInspection && state.loggedIn;
    $('hero-dot').classList.toggle('running', running);
    $('service-label').textContent = !state.ready ? '正在准备本机服务' : running ? state.busy ? '本机服务正在处理请求' : '本机服务运行中' : '本机服务已停止';
    $('hero-title').textContent = !state.ready ? '准备连接' : !running ? '连接暂时休息中' : loggedIn ? '你的连接，已就绪' : '服务已启动';
    $('hero-detail').textContent = !state.ready ? '正在初始化运行环境' : !running ? '启动服务，即可继续在手机上调用' : loggedIn ? 'DeepSeek 网页与本机接口已连接' : state.needsVerification ? '请打开网页，完成网站要求的验证' : '打开 DeepSeek，登录后即可开始调用';
    $('service-toggle-label').textContent = running ? '停止服务' : '启动服务';
    $('service-toggle').disabled = !state.ready;
    $('login-value').textContent = state.inspecting ? '检测中' : state.hasInspection ? state.needsVerification ? '需验证' : loggedIn ? '已登录' : '待登录' : '待检测';
    const thought = state.reasoningMode || {};
    $('reasoning-value').textContent = state.inspecting ? '检测中' : typeof thought.enabled === 'boolean' ? thought.enabled ? '已开启' : '已关闭' : !loggedIn ? '待登录' : '未识别';
    const search = state.webSearchMode || {};
    $('search-value').textContent = state.inspecting ? '检测中' : typeof search.enabled === 'boolean' ? search.enabled ? '已开启' : '已关闭' : !loggedIn ? '待登录' : '未识别';
    $('test-value').textContent = state.probeRunning ? '测试中' : state.testStatus === 'passed' ? '已通过' : state.testStatus === 'failed' ? '未通过' : '未测试';
    $('login-subtitle').textContent = loggedIn ? '网页会话已确认，可以继续调用' : state.needsVerification ? '打开网页，手动完成验证' : '在应用内完成网页登录';
    $('test-subtitle').textContent = state.probeRunning ? '正在等待真实网页响应…' : state.testStatus === 'passed' ? '真实网页调用已验证通过' : state.testStatus === 'failed' ? '上次测试未通过，可查看连接诊断' : '确认网页与本机接口连接正常';
    for (const name of ['login', 'test']) {
      const done = name === 'login' ? loggedIn : state.testStatus === 'passed';
      $(name + '-step').classList.toggle('done', done); $(name + '-check').classList.toggle('done', done);
      icon($(name + '-check'), done ? 'check' : 'chevron-right');
    }
    $('inspect-all').disabled = state.inspecting || !state.ready;
    $('inspect-all').classList.toggle('spinning', state.inspecting);
    $('web-status').textContent = state.busy ? '正在处理请求，请保持网页连接' : '在这里登录并管理你的网页会话';
    $('web-login-chip').textContent = loggedIn ? '网页登录有效' : state.needsVerification ? '需要手动验证' : '登录状态待确认';
    $('web-think-chip').textContent = typeof thought.enabled === 'boolean' ? thought.enabled ? '深度思考已开启' : '深度思考已关闭' : '检测深度思考';
    $('app-version').textContent = state.version || '1.0.0';
    $('conversation-summary').textContent = state.conversations?.reused ? '已复用 ' + state.conversations.reused + ' 次，减少重复新建' : '同一任务连续调用沿用一个对话';
    const activities = (state.activities || []).slice(-4).reverse();
    if (activities.length) {
      $('activity-list').replaceChildren(...activities.map(item => {
        const node = document.createElement('div'); node.className = 'activity-item'; const dot = document.createElement('i'), text = document.createElement('span'), time = document.createElement('time');
        text.textContent = item.text; time.textContent = item.time || ''; node.append(dot, text, time); return node;
      }));
    }
    $('storage-label').textContent = state.storage?.available ? '会话与任务记录，已在本机加密保存' : state.storage?.reason ? '记录暂无法持久保存，请查看诊断' : '存储尚未就绪，记录仅在本次运行有效';
    $('storage-note').classList.toggle('warning', Boolean(state.storage?.reason));
    const strict = state.agentStrict !== false;
    $('agent-policy-title').textContent = strict ? '严格完成协议' : '兼容完成协议';
    $('agent-policy-detail').textContent = strict ? '工具任务须明确完成或请求补充信息。' : '接受旧格式，任务结束判断交给客户端。';
    document.querySelectorAll('[data-agent]').forEach(button => { const selected = (button.dataset.agent === 'strict') === strict; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); });
    renderTasks(); requestAnimationFrame(layout);
  }
  document.querySelectorAll('[data-navigate]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.navigate)));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => native('copy', { field: button.dataset.copy })));
  document.querySelectorAll('[data-board]').forEach(button => button.addEventListener('click', () => switchBoard(button.dataset.board)));
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => { const selected = item.dataset.filter === filter; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); }); renderTasks(); }));
  document.querySelectorAll('[data-agent]').forEach(button => button.addEventListener('click', () => { native('agent-policy', { enabled: button.dataset.agent === 'strict' }); toast('协议设置将在下次请求生效'); }));
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'help') help(); else if (action === 'reasoning') reasoningSheet(); else if (action === 'search') searchSheet(); else if (action === 'conversations') conversationSheet(); else if (action === 'diagnostics') diagnostics();
    else if (action === 'test') {
      if (!state.running) toast('请先启动服务'); else if (state.busy || state.probeRunning) toast('当前请求处理中，请稍后再试'); else native('test', { thinking: false });
    } else native(action);
  }));
  $('inspect-all').addEventListener('click', () => native('inspect'));
  $('service-toggle').addEventListener('click', () => native(state.running ? 'stop' : 'start'));
  $('theme').addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
  $('close-sheet').addEventListener('click', closeSheet);
  $('sheet-scrim').addEventListener('click', event => { if (event.target === $('sheet-scrim')) closeSheet(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal) closeSheet();
    if (event.key === 'Tab' && modal) { const nodes = [...$('sheet-scrim').querySelectorAll('button:not(:disabled)')]; const first = nodes[0], last = nodes.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  });
  new ResizeObserver(layout).observe($('app'));
  $('app').addEventListener('animationend',event=>{if(event.target.classList.contains('page'))layout();});
  window.addEventListener('resize', layout);
  window.BridgeDashboard = { render, navigate, toast, result, showResult, back() { if (window.StudioUI?.closeDrawer()) return true; if (modal) { closeSheet(); return true; } if (tab !== 'home') { navigate('home'); return true; } return false; }, setTheme };
  setTheme(theme); render(state);
}
