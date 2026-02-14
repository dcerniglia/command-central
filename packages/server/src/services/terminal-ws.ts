import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import type http from 'http';

export function setupTerminalWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/terminal' });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const session = url.searchParams.get('session');

    if (!session) {
      ws.close(1008, 'Missing session parameter');
      return;
    }

    // Sanitize session name — allow spaces but block shell metacharacters
    const safeName = session.replace(/[^a-zA-Z0-9 _-]/g, '');
    if (!safeName) {
      ws.close(1008, 'Invalid session name');
      return;
    }

    console.log(`[terminal-ws] Connecting to tmux session: "${safeName}"`);

    let ptyProcess: pty.IPty;
    try {
      ptyProcess = pty.spawn('tmux', ['new-session', '-As', safeName], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME ?? '/',
        env: process.env as Record<string, string>,
      });
    } catch (err) {
      console.error('[terminal-ws] Failed to spawn pty:', err);
      ws.close(1011, 'Failed to spawn terminal');
      return;
    }

    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log(`[terminal-ws] pty exited with code ${exitCode} for session "${safeName}"`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Session ended');
      }
    });

    ws.on('message', (msg: Buffer | string) => {
      const str = msg.toString();
      // Check for resize messages
      try {
        const parsed = JSON.parse(str);
        if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
          ptyProcess.resize(parsed.cols, parsed.rows);
          return;
        }
      } catch {
        // Not JSON — treat as terminal input
      }
      ptyProcess.write(str);
    });

    ws.on('close', () => {
      ptyProcess.kill();
    });
  });
}
