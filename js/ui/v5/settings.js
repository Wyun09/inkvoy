import {uiIcon} from '../icon-system.js';

const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const click=selector=>{const node=document.querySelector(selector);if(node&&typeof node.click==='function')node.click();return node;};
const legacy=()=>!!window.__studioV5LegacyChat;

export function mountV5Settings({navigate=page=>window.BridgeDashboard?.navigate(page)}={}){
  if(legacy())return {render(){}};
  const page=document.getElementById('page-settings');
  if(!page)return {render(){}};
  for(const child of [...page.children])child.hidden=true;
  page.classList.add('v5-settings-page');
  document.body.classList.add('v5-settings-mode');
  const host=el('div','v5-settings');host.id='v5-settings';
  host.innerHTML=`
    <header class="v5-settings-head">
      <button class="v5-iconbtn" id="v5-settings-back" aria-label="返回">${uiIcon('chevron-left')?uiIcon('chevron-left').outerHTML:'‹'}</button>
      <span class="v5-settings-title">设置</span>
      <span class="v5-settings-mode">设置模式</span>
    </header>
    <div class="v5-settings-scroll"><div class="v5-settings-inner">
      <section class="v5-group"><h3>外观</h3>
        <div class="v5-setrow"><div class="v5-lab"><b>主题</b><small>界面明暗与纸张底色</small></div><div class="v5-seg" id="v5-theme-seg"><button data-v5-theme="light">浅色</button><button data-v5-theme="dark">深色</button></div></div>
        <div class="v5-setrow"><div class="v5-lab"><b>强调色</b><small>信号色与选中态</small></div><div class="v5-seg v5-accent" id="v5-accent-seg"><button data-v5-accent="graphite">默认</button><button data-v5-accent="jade">青绿</button><button data-v5-accent="blue">蓝色</button><button data-v5-accent="amber">琥珀</button><button data-v5-accent="violet">紫罗兰</button></div></div>
        <div class="v5-setrow"><div class="v5-lab"><b>界面密度</b><small>信息密度与行高</small></div><div class="v5-seg" id="v5-density-seg"><button data-v5-density="compact">紧凑</button><button data-v5-density="comfortable">标准</button><button data-v5-density="spacious">宽松</button></div></div>
        <div class="v5-setrow"><div class="v5-lab"><b>显示比例</b><small>仅调整应用界面，网页缩放单独控制</small></div><div class="v5-seg v5-scale" id="v5-scale-seg"><button data-v5-scale="80">80%</button><button data-v5-scale="90">90%</button><button data-v5-scale="100">100%</button><button data-v5-scale="110">110%</button></div></div>
        <div class="v5-setrow"><div class="v5-lab"><b>减少动态效果</b><small>关闭过渡、面板与按压动画</small></div><button class="v5-switch" id="v5-reduce-motion" role="switch" aria-checked="false"><i></i></button></div>
      </section>
      <section class="v5-group"><h3>工作台</h3>
        <div class="v5-setrow"><div class="v5-lab"><b>屏幕方向</b><small>自动旋转或锁定显示方向</small></div><select class="v5-select" id="v5-orientation"><option value="auto">自动旋转</option><option value="portrait">竖屏</option><option value="landscape">横屏</option></select></div>
        <div class="v5-setrow"><div class="v5-lab"><b>沉浸全屏</b><small>隐藏系统栏，边缘滑动可临时呼出</small></div><button class="v5-switch" id="v5-fullscreen" role="switch" aria-checked="true"><i></i></button></div>
        <div class="v5-setrow"><div class="v5-lab"><b>终端与文件</b><small>终端、项目文件与编辑器</small></div><div class="v5-seg"><button data-v5-go="terminal">终端</button><button data-v5-go="files">文件</button></div></div>
      </section>
      <section class="v5-group"><h3>连接</h3>
        <div class="v5-setrow"><div class="v5-lab"><b>模型与 API</b><small>连接方式、密钥与模型目录</small></div><div class="v5-seg"><button data-v5-go="accounts">账号</button><button data-v5-go="extensions">扩展</button></div></div>
        <div class="v5-setrow"><div class="v5-lab"><b>浏览器与外部客户端</b><small>网页、本机网关与外接客户端</small></div><div class="v5-seg"><button data-v5-go="web">网页</button><button data-v5-go="connect">网关</button></div></div>
      </section>
      <div class="v5-about"><span class="v5-about-id"><b>Inkvoy 5.5.0</b><small>BUILD 30 · arm64-v8a</small></span><button class="v5-btn" data-v5-go="tools">工具与诊断</button></div>
    </div></div>`;
  page.append(host);

  const $=selector=>host.querySelector(selector);
  $('#v5-settings-back').onclick=()=>navigate('chat');
  for(const button of host.querySelectorAll('[data-v5-go]'))button.onclick=()=>navigate(button.dataset.v5Go);
  for(const button of host.querySelectorAll('[data-v5-theme]'))button.onclick=()=>{
    const wantDark=button.dataset.v5Theme==='dark';
    if(document.body.classList.contains('dark')!==wantDark){
      const origin=document.getElementById('settings-theme');
      if(origin)origin.click();else document.getElementById('theme')?.click();
    }
    sync();
  };
  for(const button of host.querySelectorAll('[data-v5-accent]'))button.onclick=()=>{click('[data-accent-choice="'+button.dataset.v5Accent+'"]');sync();};
  for(const button of host.querySelectorAll('[data-v5-density]'))button.onclick=()=>{click('[data-density-choice="'+button.dataset.v5Density+'"]');sync();};
  for(const button of host.querySelectorAll('[data-v5-scale]'))button.onclick=()=>{click('[data-ui-scale="'+button.dataset.v5Scale+'"]');sync();};
  $('#v5-reduce-motion').onclick=()=>{
    const box=document.getElementById('ui-reduce-motion');
    if(box){box.checked=!box.checked;box.dispatchEvent(new Event('change',{bubbles:true}));}
    sync();
  };
  $('#v5-fullscreen').onclick=()=>{
    const box=document.getElementById('display-fullscreen');
    if(box){box.checked=!box.checked;box.dispatchEvent(new Event('change',{bubbles:true}));}
    sync();
  };
  $('#v5-orientation').onchange=()=>{
    const select=document.getElementById('settings-orientation');
    if(select){select.value=$('#v5-orientation').value;select.dispatchEvent(new Event('change',{bubbles:true}));}
  };

  function sync(){
    const dark=document.body.classList.contains('dark');
    for(const button of host.querySelectorAll('[data-v5-theme]'))button.classList.toggle('on',String(dark)===String(button.dataset.v5Theme==='dark'));
    const accent=document.body.dataset.accent||'graphite';
    for(const button of host.querySelectorAll('[data-v5-accent]'))button.classList.toggle('on',button.dataset.v5Accent===accent);
    const density=document.body.dataset.density||'compact';
    for(const button of host.querySelectorAll('[data-v5-density]'))button.classList.toggle('on',button.dataset.v5Density===density);
    const scaleRaw=Number(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'))||.9;
    const scale=Math.round(scaleRaw*100);
    for(const button of host.querySelectorAll('[data-v5-scale]'))button.classList.toggle('on',Number(button.dataset.v5Scale)===scale||Number(button.dataset.v5Scale)===90&&![80,90,100,110].includes(scale));
    const reduce=document.getElementById('ui-reduce-motion')?.checked||document.body.classList.contains('reduce-motion');
    const switchReduce=$('#v5-reduce-motion');switchReduce.classList.toggle('on',!!reduce);switchReduce.setAttribute('aria-checked',String(!!reduce));
    const full=document.getElementById('display-fullscreen')?.checked!==false;
    const switchFull=$('#v5-fullscreen');switchFull.classList.toggle('on',!!full);switchFull.setAttribute('aria-checked',String(!!full));
    const orientation=document.getElementById('settings-orientation')?.value||'auto';
    $('#v5-orientation').value=orientation;
  }
  sync();const timer=setInterval(sync,500);
  window.addEventListener('bridge:navigate',event=>{if(event.detail==='settings')sync();});
  return {render(){sync();},stop(){clearInterval(timer);}};
}
