import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import './write-notices.mjs';
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
await writeFile(new URL('engine.html', assets), '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\' \'unsafe-eval\'; connect-src \'none\'; frame-src \'none\'"><script src="engine.bundle.js"></script>');
console.log('Built isolated Android engine assets.');
