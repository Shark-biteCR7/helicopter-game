#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rm, mkdir, readFile, writeFile, copyFile, readdir, stat } from 'fs/promises';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

const assetFiles = [
  ['manifest.json', 'manifest.json'],
  ['sw.js', 'sw.js'],
  ['helicol.png', 'helicol.png'],
  ['游戏二维码.png', '游戏二维码.png']
];

function minifyHtml(html) {
  return html
    .replace(/<!--[^]*?-->/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

function minifyCss(css) {
  return css
    .replace(/\/\*[^]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

async function ensureDist() {
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
}

async function bundleSource() {
  await esbuild.build({
    entryPoints: [join(ROOT_DIR, 'src', 'main.js')],
    outfile: join(DIST_DIR, 'main.js'),
    bundle: true,
    format: 'esm',
    target: 'es2018',
    minify: true,
    treeShaking: true,
    logLevel: 'info',
    legalComments: 'none',
    platform: 'browser',
    pure: ['console.info', 'console.debug']
  });
}

async function writeIndexHtml() {
  const rawHtml = await readFile(join(ROOT_DIR, 'index.html'), 'utf8');
  const processed = rawHtml
    .replace('href="src/ui/dom.css"', 'href="./dom.css"')
    .replace('src="src/main.js"', 'src="./main.js"');
  await writeFile(join(DIST_DIR, 'index.html'), minifyHtml(processed));
}

async function writeDomCss() {
  const rawCss = await readFile(join(ROOT_DIR, 'src', 'ui', 'dom.css'), 'utf8');
  await writeFile(join(DIST_DIR, 'dom.css'), minifyCss(rawCss));
}

async function copyAssets() {
  for (const [from, to] of assetFiles) {
    const source = join(ROOT_DIR, from);
    try {
      await copyFile(source, join(DIST_DIR, to));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

async function folderSize(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await folderSize(fullPath);
    } else {
      const fileStat = await stat(fullPath);
      total += fileStat.size;
    }
  }
  return total;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function printFileSizes(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await printFileSizes(fullPath, `${prefix}${entry.name}/`);
    } else {
      const size = (await stat(fullPath)).size;
      const label = `${prefix}${entry.name}`;
      console.log(`  ${label.padEnd(28, ' ')} ${formatBytes(size)}`);
    }
  }
}

async function logBundleReport() {
  const totalBytes = await folderSize(DIST_DIR);
  console.log('\nBuild output:');
  await printFileSizes(DIST_DIR);
  console.log(`\n  Total size: ${formatBytes(totalBytes)}\n`);
}

async function run() {
  console.time('Build time');
  await ensureDist();
  await Promise.all([bundleSource(), copyAssets()]);
  await Promise.all([writeIndexHtml(), writeDomCss()]);
  await logBundleReport();
  console.timeEnd('Build time');
}

run().catch((error) => {
  console.error('Build failed');
  console.error(error);
  process.exit(1);
});
