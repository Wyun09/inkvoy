/** Self-contained DOM operation, evaluated in the remote WebView. It uses only
 * visible page DOM. No app internals, hidden credentials or private APIs. */
export function sendControl({ prompt, nonce, action = 'click' } = {}) {
  const result = (reason, extra = {}) => ({ clicked: false, count: 0, reason, ...extra });
  if (location.origin !== 'https://chat.deepseek.com') return result('unexpected_origin');
  const visible = element => {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const inputs = [...document.querySelectorAll('textarea')].filter(visible);
  const named = inputs.filter(node => /DeepSeek/i.test(node.getAttribute('placeholder') || ''));
  const composers = named.length === 1 ? named : inputs;
  if (composers.length !== 1) return result(composers.length ? 'multiple_composers' : 'composer_missing');
  const input = composers[0];
  if (nonce && input.getAttribute('data-local-bridge-send') === nonce) return { clicked: true, count: 1, reason: 'already_triggered' };
  if (typeof prompt !== 'string' || input.value !== prompt) return result('prompt_changed');
  const nameOf = element => {
    const ids = (element.getAttribute('aria-labelledby') || '').trim().split(/\s+/).filter(Boolean);
    return (element.getAttribute('aria-label') || ids.map(id => document.getElementById(id)?.textContent || '').join(' ')
      || element.getAttribute('title') || element.textContent || '').trim();
  };
  const sendName = /^(?:发送(?:消息|问题)?|提交(?:消息|问题)?|send(?: message| prompt)?|submit)(?:\s*[（(](?:enter|return|回车|↵)[）)])?$/i;
  const sourceOf = element => {
    if (sendName.test(nameOf(element))) return 'accessible_name';
    if (/^(?:send(?:[-_](?:button|message|prompt))?|submit[-_]?(?:button|message))$/i.test(element.getAttribute('data-testid') || '')) return 'test_id';
    if (element.tagName === 'BUTTON' && element.type === 'submit' && element.form && element.form === input.form) return 'form_submit';
    // Observed on chat.deepseek.com: unlabeled div[role=button], circle/primary
    // component and the upward-send arrow. Never infer send from colour alone.
    const classes = element.classList;
    if (classes.contains('ds-button') && classes.contains('ds-button--primary') && classes.contains('ds-button--circle')) {
      const arrow = [...element.querySelectorAll('svg path')].some(path => {
        const d = (path.getAttribute('d') || '').replace(/[\s,]+/g, '').toLowerCase();
        return d.startsWith('m8.31250.980206c8.66767') && d.includes('v15.0417h7v3.95579');
      });
      if (arrow) return 'deepseek_send_arrow';
    }
    return null;
  };
  const disabled = element => {
    for (let node = element; node; node = node.parentElement) {
      if (node.matches(':disabled, [inert], [aria-disabled="true"], [data-disabled="true"], .ds-button--disabled, .ds-icon-button--disabled')
        || getComputedStyle(node).pointerEvents === 'none') return true;
    }
    return false;
  };
  for (let scope = input.parentElement, depth = 0; scope && depth < 7 && !/^(?:BODY|HTML)$/.test(scope.tagName); scope = scope.parentElement, depth++) {
    if ([...scope.querySelectorAll('textarea')].filter(visible).length !== 1) break;
    // Do not expand into a transcript just to find a historical send button.
    if (scope.querySelector('.ds-message, .ds-assistant-message-main-content, [role="log"]')) break;
    const controls = [...scope.querySelectorAll('button, [role="button"]')].filter(visible);
    const candidates = controls.map(element => ({ element, source: sourceOf(element) })).filter(item => item.source);
    if (!candidates.length) continue;
    if (candidates.length !== 1) return result('multiple_send_controls', { count: candidates.length });
    const { element, source } = candidates[0];
    if (disabled(element)) return result('send_disabled', { count: 1, source });
    if (controls.some(node => /^(?:停止(?:生成|回答)?|stop(?: generating| generation| response)?)$/i.test(nameOf(node)))) return result('generation_active', { count: 1, source });
    if (action !== 'click') return result('ready', { count: 1, source });
    if (typeof nonce !== 'string' || !nonce || nonce.length > 120) return result('invalid_nonce');
    // Atomic read/validate/click: a repeated RPC with this nonce never clicks twice.
    input.setAttribute('data-local-bridge-send', nonce);
    element.click();
    return { clicked: true, count: 1, reason: 'clicked', source };
  }
  return result('send_missing');
}
