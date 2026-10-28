import postcss from 'postcss';

// These selectors belong to app-shell/*.css. Specialized feature fields keep
// their styles, but cannot bring an older header, composer or reply layout back.
const owners=['topbar','top-actions','brand','brand-mark','workspace-rail','workspace-content','workspace-statusbar','workspace-page-name','rail-route','rail-command','rail-mark','rail-divider','rail-active-surface','bottom-nav','dock-marker','studio-chat','chat-heading','chat-stage','chat-messages','chat-welcome','welcome-intro','welcome-companion','welcome-starters','welcome-footnote','command-deck','chat-composer','composer-bottom','composer-toolbar','composer-model','composer-hint','composer-label','composer-modes','composer-collapsed','composer-suggestions','composer-references','client-progress','work-status-heading','work-activity-line','client-notice','reply-turn','reply-header','reply-brand','reply-status','reply-body','reply-thinking','reply-thought','reply-process','reply-notes','reply-steps','reply-step','reply-code','reply-footer','reply-copy','reply-pending','reply-earlier','reply-follow-latest','model-scrim','model-dialog','model-layout'];
const owned=new RegExp('\\.(?:'+owners.join('|')+')(?=[\\s.#:[>+~]|$)');
export function pruneFeatureStyles(css,from='feature.css'){
 const root=postcss.parse(css,{from});let removedSelectors=0;
 root.walkRules(rule=>{
  if(rule.parent?.type==='atrule'&&/keyframes$/i.test(rule.parent.name))return;
  const selectors=rule.selectors,remaining=selectors.filter(selector=>!owned.test(selector));removedSelectors+=selectors.length-remaining.length;
  if(!remaining.length)rule.remove();else if(remaining.length!==selectors.length)rule.selectors=remaining;
 });
 return {css:root.toString(),removedSelectors};
}
