import {uiIcon} from '../icon-system.js';
import {SECURITY_STARTERS} from '../../security-identity.js';
export function createWelcome(){
 const section=document.createElement('section');section.className='chat-welcome';
 const intro=document.createElement('div');intro.className='welcome-intro';
 const pet=document.createElement('button');pet.type='button';pet.className='welcome-companion';pet.dataset.pose='idle';pet.setAttribute('aria-label','和 Inky 打招呼');const sprite=document.createElement('span');sprite.className='companion-sprite';pet.append(sprite);pet.onclick=()=>{pet.classList.remove('is-greeting');requestAnimationFrame(()=>pet.classList.add('is-greeting'));};pet.addEventListener('animationend',e=>{if(e.animationName==='pet-greet')pet.classList.remove('is-greeting');});
 const text=document.createElement('div'),caption=document.createElement('span'),title=document.createElement('h2'),detail=document.createElement('p');caption.className='overline';caption.textContent='和 Inky 一起探索';title.innerHTML='从线索，<br>到<em>答案。</em>';detail.textContent='安全测试 · 逆向分析 · 编程';text.append(caption,title,detail);intro.append(pet,text);section.append(intro);
 const starters=document.createElement('div');starters.className='welcome-starters';starters.setAttribute('aria-label','任务起点');
 for(const [icon,label,subtitle,prompt]of SECURITY_STARTERS){const button=document.createElement('button');button.type='button';button.dataset.starter=icon;const words=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=label;small.textContent=subtitle;words.append(strong,small);button.append(uiIcon(icon),words,uiIcon('next'));button.onclick=()=>{const input=document.getElementById('chat-input');if(input.disabled)return;input.value=prompt;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};starters.append(button);}
 section.append(starters);const foot=document.createElement('footer');foot.className='welcome-footnote';foot.innerHTML='<span>选择一个方向开始</span><span></span>';section.append(foot);return section;
}
