// Build script: assembles this folder into ONE deployable output (dist/).
//   node build.mjs
// No dependencies. Output:
//   dist/index.html            the whole app as a single self-contained file
//                              (this is also the file to publish as an artifact)
//   dist/manifest.webmanifest, dist/sw.js, dist/icons/, dist/README.txt   the installable-app files
// The service-worker cache name is derived from a hash of index.html, so an
// installed app always refreshes when (and only when) the app actually changed.
//
// Layout this script expects (this folder):
//   index.html               the page template (@@INCLUDE / @@SCRIPTS / @@DATAURI markers)
//   src/js/order.json        the JS load order; src/js/<core|state|i18n|calc|tax|ui>/*.js
//   src/html/...             markup partials included into index.html
//   src/styles/...           app.css, tailwind.config.js
//   src/assets/...           images referenced via @@DATAURI
//   manifest.webmanifest, sw.js, README.txt, icons/   installable-app files, copied as-is
//   (these four are flattened at the top level here, not nested under a pwa/ folder)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const at = (...p) => path.join(root, ...p);
const src = (...p) => path.join(root, 'src', ...p);
const dist = (...p) => path.join(root, 'dist', ...p);
const read = (f) => fs.readFileSync(f, 'utf8');
const chop = (s) => (s.endsWith('\n') ? s.slice(0, -1) : s);   // files end with one newline

// 1. JavaScript: concatenate in the order listed in src/js/order.json.
//    Order matters (constants must exist before they are used at load time).
const order = JSON.parse(read(src('js', 'order.json'))).js;
const scriptText = order.map((f) => {
  const file = src('js', f);
  if (!fs.existsSync(file)) throw new Error('Missing JS file listed in order.json: ' + f);
  return `// ===== src/js/${f} =====\n` + read(file);
}).join('');

// 2. HTML: replace each @@INCLUDE path@@ line with that file's content.
//    Include paths (e.g. "html/shell-header-nav.html", "styles/app.css") are
//    relative to src/, same as the original project this was split from.
const tplLines = chop(read(at('index.html'))).split('\n');   // template file ends with one newline
const out = tplLines.map((line) => {
  const inc = line.match(/^@@INCLUDE (.+)@@$/);
  if (inc) {
    const file = src(inc[1]);
    if (!fs.existsSync(file)) throw new Error('Missing include: ' + inc[1]);
    return chop(read(file));
  }
  if (line === '@@SCRIPTS@@') return chop(scriptText);
  return line;
}).join('\n');
// Small images are embedded as data: URIs so dist/index.html stays one self-contained file.
const withImages = out.replace(/@@DATAURI ([^@]+)@@/g, (_, rel) => {
  const file = src(rel.trim());
  if (!fs.existsSync(file)) throw new Error('Missing image: ' + rel);
  const mime = { png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', jpg: 'image/jpeg' }[path.extname(file).slice(1)];
  return `data:${mime};base64,` + fs.readFileSync(file).toString('base64');
});
if (/@@(INCLUDE|SCRIPTS|DATAURI)/.test(withImages)) throw new Error('Unresolved include marker left in output');

// 3. Write dist/ (installable-app files copied next to index.html).
//    manifest.webmanifest, sw.js, README.txt and icons/ live at the top level
//    of this folder (not nested under a pwa/ subfolder) and are copied as-is.
fs.rmSync(dist(), { recursive: true, force: true });
fs.mkdirSync(dist('icons'), { recursive: true });
fs.writeFileSync(dist('index.html'), withImages);
const hash = crypto.createHash('sha256').update(withImages).digest('hex').slice(0, 10);
fs.writeFileSync(dist('sw.js'), read(at('sw.js')).replace('__BUILD__', hash));
fs.copyFileSync(at('manifest.webmanifest'), dist('manifest.webmanifest'));
fs.copyFileSync(at('README.txt'), dist('README.txt'));
for (const f of fs.readdirSync(at('icons'))) fs.copyFileSync(at('icons', f), dist('icons', f));

const kb = (fs.statSync(dist('index.html')).size / 1024).toFixed(0);
console.log(`built dist/index.html  ${kb} KB  (${withImages.split('\n').length} lines, ${order.length} JS files)  cache=cjf-${hash}`);
