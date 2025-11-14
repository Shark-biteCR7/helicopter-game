#!/usr/bin/env node

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

if (!existsSync(DIST_DIR)) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const port = Number(process.env.PORT) || Number(process.argv[2]) || 4173;

const server = createServer(async (req, res) => {
  try {
    const urlPath = req.url ? req.url.split('?')[0] : '/';
    const normalized = normalize(urlPath.startsWith('/') ? urlPath.slice(1) : urlPath);
    let target = join(DIST_DIR, normalized);

    if (!target.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (normalized === '' || normalized.endsWith('/')) {
      target = join(target, 'index.html');
    }

    let data;
    try {
      data = await readFile(target);
    } catch (error) {
      const fallback = join(DIST_DIR, 'index.html');
      data = await readFile(fallback);
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
      res.end(data);
      return;
    }

    const ext = extname(target);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end('Internal Server Error');
    console.error(error);
  }
});

server.listen(port, () => {
  console.log(`Preview server running → http://localhost:${port}`);
});
