const fs = require('fs');

const filesCJS = [
  'node_modules/@crediblemark/build/dist/index.js',
  'node_modules/@crediblemark/build/dist/no-external.js',
  'node_modules/@crediblemark/build/dist/rsc.js'
];

for (const file of filesCJS) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace the import logic entirely
    content = content.replace(/import_isomorphic_dompurify = __toESM\(require\("\.\/dompurify-mock\.js"\)\);[\s\S]*?dompurify_default = import_isomorphic_dompurify\.default;/g, 
      `var xss = require('xss'); dompurify_default = { sanitize: function(h) { if (typeof h !== 'string') return ''; return (xss.filterXSS ? xss.filterXSS(h) : xss(h)); } };`);
    fs.writeFileSync(file, content);
  }
}

const fileMJS = 'node_modules/@crediblemark/build/dist/chunk-TFAYWP2C.mjs';
if (fs.existsSync(fileMJS)) {
  let content = fs.readFileSync(fileMJS, 'utf8');
  content = content.replace(/import DOMPurify from "\.\/dompurify-mock\.mjs";[\s\S]*?var dompurify_default = DOMPurify;/g,
    `import xss from 'xss'; var dompurify_default = { sanitize: function(h) { if (typeof h !== 'string') return ''; return (xss.filterXSS ? xss.filterXSS(h) : xss(h)); } };`);
  fs.writeFileSync(fileMJS, content);
}
