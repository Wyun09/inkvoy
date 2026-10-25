export const revisionId='r-0123456789abcdef0123456789abcdef';
export const fileChanges={[revisionId]:{path:'hello.py',existed:true,before:'print("fixture")\n',after:'print("edited")\n',beforeBytes:17,afterBytes:16,createdAt:1792344000000,reverted:false}};
const tool=(id,name,args)=>({id,type:'function',function:{name,arguments:JSON.stringify(args)}});
export const replyFixture={selected:'reply-fixture',sessions:[{id:'reply-fixture',project:'p-fixture',title:'检查并完善项目',status:'completed',settings:{agent:true,thinking:true,search:true},messages:[
 {role:'user',content:'检查项目配置，运行验证并更新文件。'},
 {role:'assistant',content:'我会检查配置、运行命令，再根据结果更新文件。',reasoning_content:'测试夹具中的思考字段，用于验证折叠展示与文本渲染。',tool_calls:[tool('read-1','read_file',{path:'package.json'}),tool('run-1','terminal',{command:'npm run build'}),tool('write-1','write_file',{path:'hello.py',content:'print("edited")\n'})]},
 {role:'tool',tool_call_id:'read-1',content:JSON.stringify({ok:true,content:'{"name":"studio-demo","scripts":{"build":"vite build"}}',bytes:60})},
 {role:'tool',tool_call_id:'run-1',content:JSON.stringify({ok:true,stdout:'vite building for production...\n✓ 42 modules transformed.\ndist/index.html  0.43 kB\n✓ built in 1.23s\n',stderr:'',exitCode:0,durationMs:1230})},
 {role:'tool',tool_call_id:'write-1',content:JSON.stringify({ok:true,path:'hello.py',bytes:16,change:{id:revisionId,path:'hello.py',kind:'modified',beforeBytes:17,afterBytes:16}})},
 {role:'assistant',content:'项目检查完成，文件修改已保存。\n\n### 本次完成\n\n- 检查了项目配置\n- 运行构建并查看退出码\n- 更新了 `hello.py`，可以展开执行过程查看差异\n\n```typescript\nconst result = {\n  status: "completed",\n  files: ["hello.py"]\n};\n```\n\n| 检查项 | 结果 | 说明 |\n| --- | --- | --- |\n| 构建 | 通过 | 退出码 0 |\n| 文件 | 已更新 | 支持查看改动 |\n\n> 终端输出和文件改动都可在执行过程里展开查看。\n\n[查看 Vite 文档](https://vite.dev/guide/)'}
]}]};
