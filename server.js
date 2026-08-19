import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8080;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // API Endpoint to list available export files in Source_file folder
  if (reqPath === '/api/source-files') {
    const sourceDir = path.join(ROOT, 'Source_file');
    let filesList = [];
    try {
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir);
        filesList = files
          .filter(f => f.toLowerCase().endsWith('.txt') || f.toLowerCase().endsWith('.zip'))
          .map(f => {
            const stats = fs.statSync(path.join(sourceDir, f));
            return {
              name: f,
              sizeBytes: stats.size,
              sizeFormatted: formatBytes(stats.size),
              path: `Source_file/${f}`
            };
          });
      }
    } catch (e) {
      console.error('Error reading Source_file dir:', e);
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(filesList));
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
