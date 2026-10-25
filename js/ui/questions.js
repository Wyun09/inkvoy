// Interaction semantics follow the Harness question card: drafts are not answers.
export function createQuestionView({tools,client,notify}){
 const panel=document.createElement('section');panel.id='agent-question';panel.className='agent-question';panel.hidden=true;panel.setAttribute('aria-label','AI 问答交互');document.querySelector('#chat-form').before(panel);
 let current,drafts=[];
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function render(value){if(current?.id===value?.id)return;current=value;panel.hidden=!value;document.querySelector('#chat-form').hidden=!!value;panel.replaceChildren();if(!value)return;window.BridgeDashboard?.navigate('chat');drafts=value.questions.map(()=>({selected:[],custom:'',skipped:false}));
  const header=node('header');header.append(node('strong','等你回答'),node('small','提交后继续任务'));panel.append(header);const body=node('div');body.className='question-fields';const form=node('form');
  for(const [i,q]of value.questions.entries()){
   const field=node('fieldset'),legend=node('legend',(value.questions.length>1?(i+1)+'. ':'')+q.question);field.append(legend);const options=node('div');options.className='question-options';
   const input=node('textarea');input.rows=2;input.placeholder=q.options.length?'也可以补充自己的回答…':'在这里填写回答…';input.maxLength=8000;input.setAttribute('aria-label','回答：'+q.question);
   const refresh=()=>{options.querySelectorAll('input').forEach(n=>n.checked=drafts[i].selected.includes(n.value));field.classList.toggle('is-skipped',drafts[i].skipped);};
   for(const label of q.options){const option=node('label'),radio=node('input');radio.type=q.multiSelect?'checkbox':'radio';radio.name='question-'+i;radio.value=label;option.append(radio,node('span',label));radio.onchange=()=>{drafts[i].skipped=false;if(q.multiSelect){drafts[i].selected=radio.checked?[...drafts[i].selected,label]:drafts[i].selected.filter(v=>v!==label);}else{drafts[i].selected=[label];drafts[i].custom='';input.value='';}refresh();};options.append(option);}
   input.oninput=()=>{drafts[i].custom=input.value;drafts[i].skipped=false;if(!q.multiSelect&&input.value.trim())drafts[i].selected=[];refresh();};field.append(options,input);const skip=node('button','跳过这个问题');skip.type='button';skip.className='question-skip';skip.onclick=()=>{drafts[i]={selected:[],custom:'',skipped:!drafts[i].skipped};input.value='';skip.textContent=drafts[i].skipped?'已跳过 · 撤销':'跳过这个问题';refresh();};field.append(skip);body.append(field);
  }
  form.append(body);const footer=node('footer'),stop=node('button','停止任务'),submit=node('button','提交并继续');stop.type='button';stop.onclick=()=>void client.stop();submit.type='submit';submit.className='question-submit';footer.append(stop,submit);form.append(footer);form.onsubmit=e=>{e.preventDefault();try{tools.answer(value.id,drafts);}catch(error){notify(error.message);}};panel.append(form);
 }
 return {render};
}
