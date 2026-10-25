import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import './write-notices.mjs';
import {OBSERVE_SCRIPT} from '../js/browser-observation.js';
import {ACTION_SCRIPT} from '../js/browser-actions.js';
import {SCRIPT_TEMPLATE} from '../js/browser-script.js';
const root = new URL('../', import.meta.url);
const assets = new URL('app/src/main/assets/', root);
await mkdir(assets, { recursive: true });
const engineBuild=await build({
  entryPoints: [new URL('js/entry.js', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  outfile: new URL('engine.bundle.js', assets).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  bundle: true, format: 'iife', platform: 'browser', target: 'chrome120',
  minify: false, legalComments: 'eof', metafile:true,
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
const styles=['node_modules/@xterm/xterm/css/xterm.css',...['slate','slate-dark','blue','blue-dark','indigo','indigo-dark','jade','jade-dark','amber','amber-dark'].map(name=>'node_modules/@radix-ui/colors/'+name+'.css'),'js/ui/atelier5/tokens.css','js/ui/expressive/navigation.css','js/ui/expressive/journal.css','js/ui/expressive/results.css','js/ui/expressive/surfaces.css','js/ui/expressive/connections.css','js/ui/expressive/overlays.css','js/ui/v4/browser.css','js/ui/v4/motion.css','js/ui/atelier5/shell.css','js/ui/atelier5/composer.css','js/ui/atelier5/details.css','js/ui/atelier5/logo.css','js/ui/atelier5/workflows.css'];
styles.push('js/ui/atelier5/stream.css');
await writeFile(new URL('app.css', assets),'@font-face{font-family:Geist;src:url(Geist.ttf) format("truetype");font-weight:100 900;font-style:normal;font-display:swap}\n'+(await Promise.all(styles.map(file=>readFile(new URL(file,root),'utf8')))).join('\n'));
await writeFile(new URL('Geist.ttf',assets),await readFile(new URL('third_party/ui-v4/Geist.ttf',root)));
await writeFile(new URL('verification/ui-engine-bundle-500.json',root),JSON.stringify({version:'5.0.0',cssInputs:styles,legacyStylesBundled:false,reactRuntimeBundled:Object.keys(engineBuild.metafile.inputs).some(name=>/node_modules\/react\//.test(name)),font:'Geist variable, SIL OFL 1.1, local only',engineInputs:Object.keys(engineBuild.metafile.inputs),outputs:engineBuild.metafile.outputs},null,2)+'\n');
await writeFile(new URL('logo.png', assets), await readFile(new URL('js/ui/logo.png', root)));
console.log('Built isolated Android engine assets.');

await writeFile(new URL('companion.png', assets), await readFile(new URL('js/ui/companion-motion.png', root)));
