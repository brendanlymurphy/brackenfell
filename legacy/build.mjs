// Concatenates src/*.js (sorted) + src/style.css into src/index.html -> dist/index.html
import fs from 'node:fs';
const src = new URL('./src/', import.meta.url).pathname;
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
let js = '';
for (const f of files) js += `\n// ---- ${f} ----\n` + fs.readFileSync(src + f, 'utf8') + '\n';
if (js.includes('</script')) throw new Error('script close tag inside JS');
const css = fs.readFileSync(src + 'style.css', 'utf8');
let html = fs.readFileSync(src + 'index.html', 'utf8');
html = html.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
fs.writeFileSync(new URL('./dist/index.html', import.meta.url).pathname, html);
console.log('built dist/index.html', (html.length / 1024).toFixed(1) + ' KB', files.length + ' js files');
