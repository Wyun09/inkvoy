import {uiIcon} from '../icon-system.js';

const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const legacy=()=>!!window.__studioV5LegacyChat;
const icon=name=>{const node=uiIcon(name);return node?node.outerHTML:'<span></span>';};

export function mountV5Terminal(){
  if(legacy())return {render(){}};
  const page=document.getElementById('page-terminal');
  if(!page)return {render(){}};
  const tabs=document.getElementById('terminal-tabs');
  const host=document.getElementById('terminal-host');
  const keys=page.querySelector('.terminal-keys');
  const foot=page.querySelector('.terminal-footer');
  if(!host)return {render(){}};
  page.classList.add('v5-terminal-page');
  document.body.classList.add('v5-terminal-mode');
  const wrap=el('div','v5-terminal');wrap.id='v5-terminal';
  wrap.innerHTML=`
    <div class="v5-term-head">
      <div class="v5-term-crumb"><span class="macro">WORKBENCH</span><span class="p">/ terminal</span></div>
      <div class="v5-term-tabs" id="v5-term-tabs"></div>
      <div class="v5-term-tools">
        <button class="v5-iconbtn" id="v5-term-add" aria-label="新建终端">${icon('plus')}</button>
        <button class="v5-iconbtn" id="v5-term-close" aria-label="关闭终端">${icon('close')}</button>
      </div>
    </div>
    <div class="v5-term-host">
      <section class="v5-terminal-card">
        <div class="v5-tbar"><span class="l"><span class="v5-led"></span>DEBIAN 13 · ARM64</span><span class="r">UTF-8<span class="dim"> · </span>120×32<span class="dim"> · </span>ZSH</span></div>
        <div class="v5-term-screen" id="v5-term-screen"></div>
        <div class="v5-tbar2"><span class="l"><span class="v5-dot"></span>RUNNING</span><span class="v5-keycaps" id="v5-term-keycaps"></span></div>
      </section>
    </div>
    <div class="v5-term-foot" id="v5-term-foot"></div>`;
  page.append(wrap);
  const tabsSlot=wrap.querySelector('#v5-term-tabs'),screenSlot=wrap.querySelector('#v5-term-screen'),keycaps=wrap.querySelector('#v5-term-keycaps'),footSlot=wrap.querySelector('#v5-term-foot');
  if(tabs)tabsSlot.append(tabs);
  screenSlot.append(host);
  if(keys)keycaps.append(keys);
  if(foot)footSlot.append(foot);
  for(const child of [...page.children])if(child!==wrap)child.hidden=true;
  for(const node of [tabs,host,keys,foot])if(node)node.hidden=false;
  wrap.querySelector('#v5-term-add').onclick=()=>document.getElementById('terminal-add')?.click();
  wrap.querySelector('#v5-term-close').onclick=()=>document.getElementById('terminal-close')?.click();
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  window.addEventListener('bridge:navigate',event=>{
    if(event.detail==='terminal')requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  });
  return {render(){}};
}
