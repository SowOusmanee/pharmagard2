import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function localSyncPlugin() {
  const clients = new Set();
  const history = [];

  return {
    name: 'local-realtime-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync/events', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();

          res.write(': connected\n\n');

          for (const ev of history.slice(-20)) {
            res.write(`data: ${JSON.stringify(ev)}\n\n`);
          }

          clients.add(res);

          req.on('close', () => {
            clients.delete(res);
          });
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const event = JSON.parse(body);
              if (event && event.type) {
                history.push(event);
                if (history.length > 60) history.shift();

                const msg = `data: ${JSON.stringify(event)}\n\n`;
                for (const client of clients) {
                  try {
                    client.write(msg);
                  } catch {
                    clients.delete(client);
                  }
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, clients: clients.size }));
            } catch {
              res.statusCode = 400;
              res.end('{"error":"Invalid JSON"}');
            }
          });
          return;
        }

        res.statusCode = 404;
        res.end();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localSyncPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
