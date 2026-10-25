/** Self-contained DOM operation for desktop/mobile DeepSeek variants.
 * State must come from an explicit attribute, a native checkbox, or a known
 * component state class. Colour and absence of arbitrary classes are not state.
 */
export async function reasoningControl({ action = 'read', enabled, waitMs = 0 } = {}) {
  const pattern = /^(?:深度思考(?:模式)?|思考模式|思考|Deep\s*Think|Thinking(?:\s*mode)?)(?:\s*[(（][^()（）]{1,32}[)）])?(?:\s*[:：]\s*(?:开|关|开启|关闭|on|off))?$/i;
  const interactive = 'button,input[type="checkbox"],[role="button"],[role="switch"],[role="checkbox"],[role="tab"],[role="radio"],[aria-pressed],[aria-checked],[aria-selected],label,.ds-toggle-button,[data-state],[data-checked],[data-selected],[data-active],[tabindex]';
  const visible = element => {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const normalize = text => (text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const primary = 'button,input[type="checkbox"],[role="button"],[role="switch"],[role="checkbox"],[role="tab"],[role="radio"],label,.ds-toggle-button,[aria-pressed],[aria-checked],[aria-selected]';
  const labels = element => [element.getAttribute('aria-label'), element.getAttribute('title'), element.innerText,
    ...(element.matches(primary) ? [...element.querySelectorAll('span')].filter(node => node.children.length === 0).map(node => node.textContent) : [])]
    .map(normalize).filter(text => text && text.length < 80);
  const boolean = raw => /^(?:true|on|checked|selected|active)$/i.test(raw || '') ? true
    : /^(?:false|off|unchecked|unselected|inactive)$/i.test(raw || '') ? false : null;
  const readState = element => {
    const carriers = [element, ...element.querySelectorAll('[aria-pressed],[aria-checked],[aria-selected],input[type="checkbox"],[data-state],[data-checked],[data-selected],[data-active]')];
    const ariaMarkers = carriers.flatMap(node => ['aria-pressed', 'aria-checked', 'aria-selected'].filter(attribute => node.hasAttribute(attribute)).map(attribute => ({ raw: node.getAttribute(attribute), source: attribute })));
    if (ariaMarkers.some(item => !/^(?:true|false)$/i.test(item.raw))) return { enabled: null, source: 'aria', reason: 'indeterminate_state' };
    const aria = ariaMarkers.map(item => ({ value: item.raw.toLowerCase() === 'true', source: item.source }));
    if (aria.length) return aria.some(item => item.value !== aria[0].value) ? { enabled: null, source: 'aria', reason: 'conflicting_state' } : { enabled: aria[0].value, source: aria[0].source };
    for (const attribute of ['aria-pressed', 'aria-checked', 'data-state', 'data-checked', 'data-selected', 'data-active']) {
      const values = carriers.map(node => boolean(node.getAttribute(attribute))).filter(value => value !== null);
      if (values.length) {
        if (values.some(value => value !== values[0])) return { enabled: null, source: attribute, reason: 'conflicting_state' };
        return { enabled: values[0], source: attribute };
      }
    }
    const input = element.matches('input[type="checkbox"]') ? element : element.querySelector('input[type="checkbox"]');
    if (input && !input.indeterminate) return { enabled: input.checked, source: 'native_checkbox' };
    const stateNodes = [element, ...element.querySelectorAll('.ds-toggle-button')];
    for (const node of stateNodes) {
      if (node.classList.contains('ds-toggle-button')) return { enabled: node.classList.contains('ds-toggle-button--selected'), source: 'ds_toggle_component' };
      const names = [...node.classList];
      if (names.some(name => /^(?:is-)?(?:unselected|inactive|unchecked|off)$/.test(name))) return { enabled: false, source: 'explicit_state_class' };
      if (names.some(name => /^(?:is-)?(?:selected|active|checked|on)$/.test(name))) return { enabled: true, source: 'explicit_state_class' };
    }
    const label = labels(element).find(text => pattern.test(text)) || '';
    if (/[:：]\s*(?:开|开启|on)$/i.test(label)) return { enabled: true, source: 'explicit_label' };
    if (/[:：]\s*(?:关|关闭|off)$/i.test(label)) return { enabled: false, source: 'explicit_label' };
    return { enabled: null, source: 'none', reason: 'state_not_exposed' };
  };
  const discover = () => {
    if (location.origin !== 'https://chat.deepseek.com') return { count: 0, enabled: null, reason: 'unexpected_origin' };
    let candidates = [...document.querySelectorAll(interactive)].filter(visible)
      .filter(node => !node.closest('.ds-message,.ds-think-content,[data-message-role="assistant"]'))
      .filter(node => labels(node).some(label => pattern.test(label)));
    // A label span/state-bearing child and its one containing control are one
    // toggle. Two disjoint controls remain ambiguous.
    candidates = candidates.filter(node => !candidates.some(other => other !== node && other.contains(node)));
    const composers = [...document.querySelectorAll('textarea')].filter(visible);
    const named = composers.filter(node => /deepseek/i.test(node.getAttribute('placeholder') || ''));
    const composer = named.length === 1 ? named[0] : composers.length === 1 ? composers[0] : null;
    if (composer && candidates.length > 1) {
      for (let parent = composer.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const local = candidates.filter(node => parent.contains(node));
        if (local.length) { candidates = local; break; }
      }
    }
    if (candidates.length !== 1) return { count: candidates.length, enabled: null, source: 'none', reason: candidates.length ? 'multiple_controls' : 'control_missing' };
    const element = candidates[0];
    const state = readState(element);
    return { count: 1, ...state, label: labels(element).find(text => pattern.test(text)) || '', markers: String(element.className || '').slice(0, 160),
      disabled: element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true', element };
  };
  let result = discover();
  const deadline = Date.now() + Math.min(1500, Math.max(0, waitMs));
  while (result.count === 0 && result.reason === 'control_missing' && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 80)); result = discover();
  }
  const { element, ...publicResult } = result;
  if (action === 'read') return publicResult;
  if (action !== 'set' || typeof enabled !== 'boolean') return { ...publicResult, clicked: false, reason: 'invalid_action' };
  if (result.count !== 1 || typeof result.enabled !== 'boolean' || result.disabled) return { ...publicResult, clicked: false };
  if (result.enabled === enabled) return { ...publicResult, clicked: false, alreadySet: true };
  if (!enabled && ['tab', 'radio'].includes(element.getAttribute('role'))) {
    const group = element.closest('[role="tablist"],[role="radiogroup"]');
    const normal = group ? [...group.querySelectorAll('[role="tab"],[role="radio"]')].filter(node => node !== element && visible(node))
      .filter(node => labels(node).some(label => /^(?:普通|标准|快速|非思考|直接回答|normal|standard|fast|instant)$/i.test(label))) : [];
    if (normal.length !== 1 || normal[0].matches(':disabled') || normal[0].getAttribute('aria-disabled') === 'true') return { ...publicResult, clicked: false, reason: 'normal_mode_missing' };
    normal[0].click(); return { ...publicResult, clicked: true };
  }
  // Selection and click use the same DOM snapshot, never a broad second query.
  element.click();
  return { ...publicResult, clicked: true };
}
