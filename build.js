const path = require('path');
const fs = require('fs-extra');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_DIR = path.resolve(__dirname, 'public');
const OUT_DIR = path.resolve(__dirname, process.argv[2] || 'dist');

const htmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  minifyJS: true,
  minifyCSS: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
};

async function processFile(srcPath, distPath) {
  const ext = path.extname(srcPath).toLowerCase();
  await fs.ensureDir(path.dirname(distPath));

  if (ext === '.html') {
    const content = await fs.readFile(srcPath, 'utf8');
    const minified = await minifyHtml(content, htmlMinifyOptions);
    await fs.writeFile(distPath, minified, 'utf8');
  } else if (ext === '.js') {
    const content = await fs.readFile(srcPath, 'utf8');
    const terserRes = await minifyJs(content, { compress: true, mangle: true });
    const obfuscated = JavaScriptObfuscator.obfuscate(terserRes.code || content, {
      compact: true,
      stringArray: true,
      stringArrayThreshold: 0.75,
    }).getObfuscatedCode();
    await fs.writeFile(distPath, obfuscated, 'utf8');
  } else {
    await fs.copy(srcPath, distPath);
  }
}

async function walkDir(currentSrc, currentDist) {
  const entries = await fs.readdir(currentSrc, { withFileTypes: true });
  for (const entry of entries) {
    const sPath = path.join(currentSrc, entry.name);
    const dPath = path.join(currentDist, entry.name);
    if (entry.isDirectory()) {
      await walkDir(sPath, dPath);
    } else {
      await processFile(sPath, dPath);
    }
  }
}

(async () => {
  if (!(await fs.pathExists(SRC_DIR))) {
    throw new Error(`找不到來源目錄: ${SRC_DIR}`);
  }
  await walkDir(SRC_DIR, OUT_DIR);
  console.log(`✅ 打包混淆完成: ${SRC_DIR} -> ${OUT_DIR}`);
})();
