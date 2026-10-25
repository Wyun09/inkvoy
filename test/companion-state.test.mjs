import test from 'node:test';
import assert from 'node:assert/strict';
import {companionState} from '../js/ui/companion.js';

test('companion follows actual tool names and distinguishes terminal, writing and reading',()=>{
  const poses={terminal:'terminal',write_file:'writing',read_file:'reading',list_files:'reading',search_files:'reading'};
  for(const [name,pose]of Object.entries(poses))assert.equal(companionState({status:'tools',tool:{name}},true).pose,pose);
  assert.equal(companionState({status:'tools',tool:{name:'unknown'}},true).pose,'thinking');
});
test('completion, error, input, cancellation and inactive sessions have truthful states',()=>{
  const messages=[{role:'user',content:'run'}];
  for(const [status,pose]of Object.entries({completed:'done',failed:'error',interrupted:'error',needs_input:'waiting',budget:'waiting',cancelled:'idle'})){
    const state=companionState({status,messages},false);assert.equal(state.pose,pose);assert.equal(state.visible,true);
  }
  assert.equal(companionState({status:'generating'},true).label,'正在生成');
  assert.equal(companionState({status:'cancelling'},true).pose,'waiting');
  assert.equal(companionState({status:'idle',messages:[]},false).visible,false);
  assert.equal(companionState(undefined,false).visible,false);
});
