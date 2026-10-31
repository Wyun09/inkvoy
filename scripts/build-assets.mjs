import { build, transform } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import './write-notices.mjs';
import {OBSERVE_SCRIPT} from '../js/browser-observation.js';
import {ACTION_SCRIPT} from '../js/browser-actions.js';
import {SCRIPT_TEMPLATE} from '../js/browser-script.js';
import {pruneFeatureStyles} from './css-ownership.mjs';
const root = new URL('../', import.meta.url);
const {version}=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
const production=!process.argv.includes('--debug');
const assets = new URL('app/src/main/assets/', root);
await mkdir(assets, { recursive: true });
const engineBuild=await build({
  entryPoints: [new URL('js/entry.js', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  outfile: new URL('engine.bundle.js', assets).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  bundle: true, format: 'iife', platform: 'browser', target: 'chrome120',
  minify: production, legalComments: 'eof', metafile:true,
  plugins: [{ name: 'android-platform', setup(build) {
    build.onResolve({ filter: /^(?:node:crypto|node:fs\/promises|node:path|playwright)$/ }, () => ({ path: new URL('js/platform.js', root).pathname.replace(/^\/([A-Za-z]:)/, '$1') }));
  } }],
});
await build({entryPoints:[new URL('js/compute-worker.js',root).pathname.replace(/^\/([A-Za-z]:)/,'$1')],outfile:new URL('compute.worker.js',assets).pathname.replace(/^\/([A-Za-z]:)/,'$1'),bundle:true,format:'iife',platform:'browser',target:'chrome120',minify:true,legalComments:'eof'});
await build({entryPoints:[new URL('js/mcp-worker.js',root).pathname.replace(/^\/([A-Za-z]:)/,'$1')],outfile:new URL('mcp.worker.js',assets).pathname.replace(/^\/([A-Za-z]:)/,'$1'),bundle:true,format:'iife',platform:'browser',target:'chrome120',minify:true,legalComments:'eof'});
await writeFile(new URL('engine.html', assets), await readFile(new URL('js/ui/v4/app.html', root)));
await writeFile(new URL('browser-observation.js',assets),OBSERVE_SCRIPT);
await writeFile(new URL('browser-actions.js',assets),ACTION_SCRIPT);
await writeFile(new URL('browser-script.js',assets),SCRIPT_TEMPLATE);
const vendor=['node_modules/@xterm/xterm/css/xterm.css',...['slate','slate-dark','blue','blue-dark','indigo','indigo-dark','jade','jade-dark','amber','amber-dark'].map(name=>'node_modules/@radix-ui/colors/'+name+'.css')];
// Specialized tools keep their feature styles. Core shell rules have one owner and
// a declared layer order, so legacy selector specificity cannot move app chrome.
const layers={features:['js/ui/expressive/journal.css','js/ui/expressive/results.css','js/ui/expressive/surfaces.css','js/ui/expressive/connections.css','js/ui/expressive/overlays.css','js/ui/v4/browser.css','js/ui/atelier5/details.css','js/ui/atelier5/workflows.css','js/ui/atelier5/journey.css','js/ui/atelier5/logo.css','js/ui/atelier5/stream.css'],base:['js/ui/app-shell/foundation.css'],surfaces:['js/ui/app-shell/conversation.css','js/ui/app-shell/surfaces.css'],layout:['js/ui/app-shell/layout.css'],motion:['js/ui/v4/motion.css','js/ui/app-shell/motion.css'],visual:['js/ui/app-shell/visual-language.css']};
const styles=[...vendor,...Object.values(layers).flat()];
let css='@font-face{font-family:Geist;src:url(Geist.ttf) format("truetype");font-weight:100 900;font-style:normal;font-display:swap}\n@layer features,base,surfaces,layout,motion,visual;\n';
css+=(await Promise.all(vendor.map(file=>readFile(new URL(file,root),'utf8')))).join('\n');
const prunedFeatures=[];
for(const [name,files]of Object.entries(layers)){const parts=[];for(const file of files){let body=await readFile(new URL(file,root),'utf8');if(name==='features'){if(!/\/(?:logo|stream)\.css$/.test(file)){const result=pruneFeatureStyles(body,file);body=result.css;prunedFeatures.push({file,removedSelectors:result.removedSelectors});}body=body.replace(/!important\b/g,'');}parts.push(body);}css+='\n@layer '+name+' {\n'+parts.join('\n')+'\n}\n';}
css+='\n[hidden]{display:none!important}\nbody[data-large-targets] #app :is(button,summary){min-height:calc(44px / var(--ui-scale));min-width:calc(44px / var(--ui-scale))}\n';
const compiledCss=await transform(css,{loader:'css',target:'chrome120',minify:true,legalComments:'eof'});if(compiledCss.warnings.length)throw new Error('CSS validation warnings: '+compiledCss.warnings.map(w=>w.text).join('; '));
await writeFile(new URL('app.css', assets),compiledCss.code);
await writeFile(new URL('Geist.ttf',assets),await readFile(new URL('third_party/ui-v4/Geist.ttf',root)));
await writeFile(new URL('verification/ui-engine-bundle-'+version.replaceAll('.','')+'.json',root),JSON.stringify({version,engineMinified:production,cssInputs:styles,cssLayers:layers,prunedFeatures,cssBytes:Buffer.byteLength(compiledCss.code),coreStyleOwner:'js/ui/app-shell',legacyCoreStylesBundled:false,reactRuntimeBundled:Object.keys(engineBuild.metafile.inputs).some(name=>/node_modules\/react\//.test(name)),font:'Geist variable, SIL OFL 1.1, local only',engineInputs:Object.keys(engineBuild.metafile.inputs),outputs:engineBuild.metafile.outputs},null,2)+'\n');
await writeFile(new URL('logo.png', assets), await readFile(new URL('js/ui/logo.png', root)));
console.log('Built isolated Android engine assets.');

await writeFile(new URL('companion.png', assets), await readFile(new URL('js/ui/companion-motion.png', root)));
