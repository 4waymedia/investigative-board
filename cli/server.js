/**
 * Investigative Board - Local Server & Live Sync Bridge
 * Serves static web UI and provides real-time API for Agent/Browser interaction
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const BoardStorage = require('./storage');

class BoardServer {
  constructor(port = 3000, storage = null) {
    this.port = port;
    this.storage = storage || new BoardStorage();
    this.clients = new Set();
    this.rootDir = path.resolve(__dirname, '..');
  }

  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch (e) {
        this.clients.delete(client);
      }
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    return map[ext] || 'application/octet-stream';
  }

  start() {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${this.port}`);
      const pathname = parsedUrl.pathname;

      // Handle CORS for agent tooling
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // API Endpoints
      if (pathname === '/api/events') {
        // Server-Sent Events (SSE) for live sync
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        this.clients.add(res);
        req.on('close', () => this.clients.delete(res));
        res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`);
        return;
      }

      if (pathname === '/api/boards' && req.method === 'GET') {
        const boards = this.storage.listBoards();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ boards, activeId: this.storage.getActiveBoardId() }));
        return;
      }

      if (pathname.startsWith('/api/boards/') && req.method === 'GET') {
        const boardId = pathname.split('/')[3];
        const board = this.storage.getBoard(boardId);
        if (!board) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Board not found" }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(board));
        return;
      }

      if (pathname === '/api/boards' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const newBoard = this.storage.createBoard(data);
            this.broadcast('board-created', { boardId: newBoard.id });
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newBoard));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (pathname.startsWith('/api/boards/') && pathname.endsWith('/pins') && req.method === 'POST') {
        const boardId = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const pinData = JSON.parse(body || '{}');
            const result = this.storage.addPin(boardId, pinData);
            this.broadcast('board-updated', { boardId, action: 'pin_add', ...result });
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (pathname.startsWith('/api/boards/') && pathname.endsWith('/connections') && req.method === 'POST') {
        const boardId = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const connData = JSON.parse(body || '{}');
            const result = this.storage.addConnection(boardId, connData);
            this.broadcast('board-updated', { boardId, action: 'connection_add', ...result });
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // Static File Serving
      let reqPath = pathname === '/' ? '/index.html' : pathname;
      let filePath = path.join(this.rootDir, reqPath);

      // Security: prevent directory traversal
      if (!filePath.startsWith(this.rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': this.getMimeType(filePath) });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("Not Found");
      }
    });

    server.listen(this.port, () => {
      console.log(`🌐 Investigative Board Server running at http://localhost:${this.port}`);
      console.log(`📡 Real-time sync bridge active on /api/events`);
    });

    return server;
  }
}

if (require.main === module) {
  const port = process.argv[2] ? parseInt(process.argv[2]) : 3000;
  const server = new BoardServer(port);
  server.start();
}

module.exports = BoardServer;
