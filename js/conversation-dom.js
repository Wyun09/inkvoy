/** Snapshot only visible webpage structure. Markers belong to this bridge;
 * no framework internals, credentials, requests or private APIs are read. */
export function conversationDom({ action = 'snapshot', nonce = 'turn' } = {}) {
  if (location.origin !== 'https://chat.deepseek.com') return null;
  const visible = element => {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const fingerprint = (node, legacy = false) => {
    const copy = node.cloneNode(true);
    if (!legacy) copy.querySelectorAll('button,svg,script,style,noscript,[role="button"],[aria-hidden="true"],.md-code-block-banner-wrap,.md-code-block-banner,.code-info-button-text').forEach(n => n.remove());
    const text = (legacy ? node.textContent || '' : copy.textContent || '').replace(/\r\n/g, '\n'); let a = 2166136261, b = 5381;
    for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
    return (legacy ? '' : 'v2:') + text.length + ':' + (a >>> 0).toString(16) + ':' + (b >>> 0).toString(16);
  };
  const selector = '.ds-markdown.ds-assistant-message-main-content';
  const answers = [...document.querySelectorAll(selector)].filter(node => visible(node) && !node.parentElement?.closest(selector)
    && !node.closest('.ds-think-content, [data-message-role="reasoning"], [data-role="reasoning"], [data-role="search"], [data-message-role="search"], [data-search-result], [data-testid="search-results"], [data-testid="search-result"]'));
  const signatures = answers.map(fingerprint);
  if (action === 'inspect') return { path: location.pathname, answerCount: answers.length, lastAnswer: signatures.at(-1) || '', lastAnswerLegacy: answers.length ? fingerprint(answers.at(-1), true) : '' };
  const descriptors = answers.map((node, index) => {
    const marker = nonce + '-' + index; node.setAttribute('data-local-bridge-history', marker);
    return { marker, signature: signatures[index], legacySignature: fingerprint(node, true) };
  });
  document.querySelectorAll('.ds-think-content, [aria-label="朗读"], [aria-label="Read aloud"], [aria-label="播放语音"]').forEach(node => node.setAttribute('data-local-bridge-history', nonce));
  return { path: location.pathname, nonce, answers: descriptors };
}
