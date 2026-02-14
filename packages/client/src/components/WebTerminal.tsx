import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface Props {
  sessionName: string;
}

export default function WebTerminal({ sessionName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Refit terminal when expanded state changes
  const refit = useCallback(() => {
    requestAnimationFrame(() => {
      fitAddonRef.current?.fit();
      const term = terminalRef.current;
      const ws = wsRef.current;
      if (term && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    });
  }, []);

  useEffect(() => {
    refit();
  }, [expanded, refit]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      scrollback: 5000,
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    const ws = new WebSocket(`ws://localhost:3001/terminal?session=${encodeURIComponent(sessionName)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      term.write(typeof event.data === 'string' ? event.data : new Uint8Array(event.data as ArrayBuffer));
    };

    ws.onclose = () => {
      term.write('\r\n\x1b[90m[session disconnected]\x1b[0m\r\n');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      wsRef.current = null;
    };
  }, [sessionName]);

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute top-1 right-1 z-10 p-1 rounded bg-gray-700/80 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors cursor-pointer"
        title={expanded ? 'Collapse terminal' : 'Expand terminal'}
      >
        {expanded ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: expanded ? 'calc(80vh - 100px)' : '320px', transition: 'height 0.2s ease' }}
      />
    </div>
  );
}
