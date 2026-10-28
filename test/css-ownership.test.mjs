import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import {pruneFeatureStyles} from '../scripts/css-ownership.mjs';

test('legacy feature CSS cannot redefine app chrome, including grouped and nested selectors',()=>{
 const result=pruneFeatureStyles('@media (max-width:700px){body.dark .topbar,.hub-card:is(.one,.two){padding:2px}.chat-composer textarea{height:10px}} .reply-body.markdown{font-size:10px} .provider-capability{display:grid}');
 const selectors=[];postcss.parse(result.css).walkRules(r=>selectors.push(...r.selectors));assert.deepEqual(selectors,['.hub-card:is(.one,.two)','.provider-capability']);assert.equal(result.removedSelectors,3);
});
test('feature names, keyframes and properties containing core names are retained',()=>{
 const css='@keyframes fade{0%{opacity:0}100%{opacity:1}} .reply-step-result{color:red} .hub-card{--brand:green;background:url("brand-mark.png")}';
 const result=pruneFeatureStyles(css);assert.equal(result.css,css);assert.equal(result.removedSelectors,0);
});
