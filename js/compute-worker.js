// One background worker handles serialization and code highlighting; never touches DOM.
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
for(const [name,language]of Object.entries({javascript,typescript,python,bash,json,xml,css,java}))hljs.registerLanguage(name,language);
self.onmessage=event=>{const {id,operation,value}=event.data;try{const result=operation==='stringify'?JSON.stringify(value):operation==='highlight'?hljs.highlight(value.text,{language:value.language,ignoreIllegals:true}).value:null;self.postMessage({id,ok:true,result});}catch(error){self.postMessage({id,ok:false,error:String(error.message||error)});}};
