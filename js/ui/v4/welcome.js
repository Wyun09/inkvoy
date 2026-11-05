import {uiIcon} from '../icon-system.js';
import {SECURITY_STARTERS} from '../../security-identity.js';
import {createLivingMark} from '../living-mark.js';
export function createWelcome(){
 const section=document.createElement('section');section.className='chat-welcome';
 const intro=document.createElement('div');intro.className='welcome-intro';
 const pet=document.createElement('button');pet.type='button';pet.className='welcome-companion';pet.dataset.pose='idle';pet.setAttribute('aria-label','和 Inky 打招呼');pet.append(createLivingMark());
 const text=document.createElement('div'),caption=document.createElement('span'),title=document.createElement('h2'),detail=document.createElement('p');caption.className='overline';caption.textContent='INKVOY';title.textContent='开始一项新任务';detail.textContent='代码、安全研究与逆向分析';text.append(caption,title,detail);intro.append(pet,text);section.append(intro);
 const starters=document.createElement('div');starters.className='welcome-starters';starters.setAttribute('aria-label','任务起点');
 for(const [icon,label,subtitle,prompt]of SECURITY_STARTERS){const button=document.createElement('button');button.type='button';button.dataset.starter=icon;const words=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=label;small.textContent=subtitle;words.append(strong,small);button.append(uiIcon(icon),words,uiIcon('next'));button.onclick=()=>{const input=document.getElementById('chat-input');if(input.disabled)return;input.value=prompt;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};starters.append(button);}
 section.append(starters);const foot=document.createElement('footer');foot.className='welcome-footnote';foot.innerHTML='<span>选择一个方向开始</span><span></span>';section.append(foot);return section;
}
