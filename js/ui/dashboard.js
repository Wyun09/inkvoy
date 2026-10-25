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
  let state = { ready: false, running: false, loggedIn: false, hasInspection: false, inspecting: false, busy: false, testStatus: 'untested', reasoningMode: { enabled: null }, activities: [], version: '0.2.0' };
  let tab = 'home', toastTimer, modal = false, previousFocus;
  let theme = localStorage.getItem('bridge-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function native(action, payload = {}) {
    if (window.NativeBridge?.uiAction) NativeBridge.uiAction(action, JSON.stringify(payload));
    else toast('此操作需要在安卓应用中使用');
  }
  function setTheme(value) {
    theme = value; document.body.classList.toggle('dark', value === 'dark');
    icon($('theme'), value === 'dark' ? 'sun' : 'moon');
    $('theme').setAttribute('aria-label', value === 'dark' ? '切换为浅色主题' : '切换为深色主题');
    localStorage.setItem('bridge-theme', value); native('theme', { dark: value === 'dark' });
  }
  function layout() {
    const slot = $('web-slot').getBoundingClientRect();
    if (window.NativeBridge?.uiLayout) NativeBridge.uiLayout(JSON.stringify({ visible: tab === 'web' && !modal, top: slot.top, left: slot.left, width: slot.width, height: slot.height, viewportWidth: innerWidth }));
  }
  function navigate(value) {
    if (!['home', 'web', 'connect'].includes(value)) return;
    tab = value;
    for (const name of ['home', 'web', 'connect']) $('page-' + name).hidden = name !== value;
    document.querySelectorAll('.bottom-nav [data-navigate]').forEach(button => {
      button.classList.toggle('active', button.dataset.navigate === value);
      if (button.dataset.navigate === value) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    requestAnimationFrame(layout);
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
  function closeSheet() { modal = false; $('sheet-scrim').hidden = true; previousFocus?.focus(); layout(); }
  function sheet(title, nodes, actions = [], symbol = 'info') {
    previousFocus = document.activeElement; modal = true;
    $('sheet-title').textContent = title; icon($('sheet-icon'), symbol);
    $('sheet-body').replaceChildren(...nodes); $('sheet-actions').replaceChildren();
    for (const action of actions) {
      const button = document.createElement('button'); button.textContent = action.label; button.disabled = Boolean(action.disabled);
      button.addEventListener('click', action.run); $('sheet-actions').append(button);
    }
    $('sheet-scrim').hidden = false; $('close-sheet').focus(); layout();
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
  function diagnostics() {
    sheet('连接诊断', [row('应用版本', state.version || '0.2.0'), row('本机服务', state.running ? '已启动' : '未启动'), row('网页登录', state.hasInspection ? state.loggedIn ? '已登录' : '需要登录或验证' : '尚未检测'), row('思考开关', state.reasoningMode?.source || '待检测'), row('接口请求', String(state.requests || 0) + ' 次'), row('当前任务', state.busy ? '处理中' : '空闲'), paragraph(state.lastError || '诊断不包含 API 密钥、验证码和聊天正文。')], [{ label: '复制诊断信息', run: () => native('copy', { field: 'diagnostics' }) }, { label: '重新检测', disabled: state.inspecting, run: () => { closeSheet(); native('inspect'); } }], 'activity');
  }
  function result(result) {
    const ok = result.passed === true;
    sheet(result.thinking ? '深度思考测试' : '接口自测', [row('结果', ok ? '测试通过' : '未通过'), paragraph(result.message || (ok ? '真实网页调用已完成。' : '请检查网页或重新检测连接状态。')), ...(result.thinking && result.reasoningChars ? [row('已读取思考内容', result.reasoningChars + ' 字符')] : [])], [{ label: ok ? '查看连接配置' : '打开 DeepSeek', run: () => { closeSheet(); navigate(ok ? 'connect' : 'web'); } }, { label: '完成', run: closeSheet }], ok ? 'check' : 'info');
  }
  function render(next) {
    state = { ...state, ...next };
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
    $('app-version').textContent = state.version || '0.2.0';
    const activities = (state.activities || []).slice(-4).reverse();
    if (activities.length) {
      $('activity-list').replaceChildren(...activities.map(item => {
        const node = document.createElement('div'); node.className = 'activity-item'; const dot = document.createElement('i'), text = document.createElement('span'), time = document.createElement('time');
        text.textContent = item.text; time.textContent = item.time || ''; node.append(dot, text, time); return node;
      }));
    }
    requestAnimationFrame(layout);
  }
  document.querySelectorAll('[data-navigate]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.navigate)));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => native('copy', { field: button.dataset.copy })));
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'help') help(); else if (action === 'reasoning') reasoningSheet(); else if (action === 'diagnostics') diagnostics();
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
  new ResizeObserver(() => requestAnimationFrame(layout)).observe($('app'));
  window.addEventListener('resize', layout);
  window.BridgeDashboard = { render, navigate, toast, result, back() { if (modal) { closeSheet(); return true; } if (tab !== 'home') { navigate('home'); return true; } return false; }, setTheme };
  setTheme(theme); render(state);
}
