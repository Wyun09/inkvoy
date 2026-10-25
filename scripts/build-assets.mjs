import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import './write-notices.mjs';
import {OBSERVE_SCRIPT} from '../js/browser-observation.js';
const root = new URL('../', import.meta.url);
const assets = new URL('app/src/main/assets/', root);
await mkdir(assets, { recursive: true });
await build({
  entryPoints: [new URL('js/entry.js', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  outfile: new URL('engine.bundle.js', assets).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  bundle: true, format: 'iife', platform: 'browser', target: 'chrome120',
  minify: false, legalComments: 'eof',
  plugins: [{ name: 'android-platform', setup(build) {
    build.onResolve({ filter: /^(?:node:crypto|node:fs\/promises|node:path|playwright)$/ }, () => ({ path: new URL('js/platform.js', root).pathname.replace(/^\/([A-Za-z]:)/, '$1') }));
  } }],
});
await writeFile(new URL('engine.html', assets), await readFile(new URL('js/ui/app.html', root)));
await writeFile(new URL('browser-observation.js',assets),OBSERVE_SCRIPT);
await writeFile(new URL('app.css', assets), (await Promise.all(['node_modules/@xterm/xterm/css/xterm.css','js/ui/app.css','js/ui/workbench.css','js/ui/studio.css','js/ui/thread.css','js/ui/reply.css','js/ui/motion.css','js/ui/computer.css'].map(file=>readFile(new URL(file,root),'utf8')))).join('\n'));
await writeFile(new URL('logo.png', assets), await readFile(new URL('js/ui/logo.png', root)));
console.log('Built isolated Android engine assets.');

await writeFile(new URL('companion.png', assets), await readFile(new URL('js/ui/companion-motion.png', root)));
