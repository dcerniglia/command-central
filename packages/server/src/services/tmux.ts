import { execSync } from 'child_process';

export interface TmuxPane {
  sessionName: string;
  windowName: string;
  currentCommand: string;
  currentPath: string;
}

export interface TmuxSession {
  name: string;
  created: number;
  windows: number;
  attached: boolean;
  panes: TmuxPane[];
  detectedStatus: string | null;
}

export function getTmuxSessions(): TmuxSession[] {
  try {
    const sessionsRaw = execSync(
      "tmux list-sessions -F '#{session_name}|#{session_created}|#{session_windows}|#{session_attached}'",
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();

    if (!sessionsRaw) return [];

    const sessions = new Map<string, TmuxSession>();

    for (const line of sessionsRaw.split('\n')) {
      const [name, created, windows, attached] = line.split('|');
      sessions.set(name, {
        name,
        created: parseInt(created, 10),
        windows: parseInt(windows, 10),
        attached: attached === '1',
        panes: [],
        detectedStatus: null,
      });
    }

    try {
      const panesRaw = execSync(
        "tmux list-panes -a -F '#{session_name}|#{window_name}|#{pane_current_command}|#{pane_current_path}'",
        { encoding: 'utf-8', timeout: 5000 }
      ).trim();

      if (panesRaw) {
        for (const line of panesRaw.split('\n')) {
          const [sessionName, windowName, currentCommand, currentPath] = line.split('|');
          const session = sessions.get(sessionName);
          if (session) {
            session.panes.push({ sessionName, windowName, currentCommand, currentPath });
          }
        }
      }
    } catch { /* pane listing failed, sessions still valid */ }

    // Detect status from pane content
    for (const session of sessions.values()) {
      session.detectedStatus = detectSessionStatus(session);
    }

    return Array.from(sessions.values());
  } catch {
    return [];
  }
}

function capturePaneContent(sessionName: string): string {
  try {
    return execSync(
      `tmux capture-pane -t "${sessionName}" -p -S -30`,
      { encoding: 'utf-8', timeout: 3000 }
    );
  } catch {
    return '';
  }
}

function detectSessionStatus(session: TmuxSession): string | null {
  const hasClaudeProcess = session.panes.some(
    (p) => p.currentCommand === 'claude' || p.currentCommand === 'node'
  );

  if (!hasClaudeProcess) {
    // Just a shell, no Claude running
    return 'idle';
  }

  const content = capturePaneContent(session.name);
  if (!content) return null;

  // Work from the bottom up — last 30 lines of the pane
  const lines = content.split('\n').filter((l) => l.trim());
  const tail = lines.slice(-15).join('\n');
  const lastLine = lines[lines.length - 1]?.trim() ?? '';

  // Waiting for user input — Claude prompt or permission prompt
  if (/>\s*$/.test(lastLine) && !lastLine.includes('Error')) {
    return 'needs_input';
  }
  if (/\(y\/n\)/i.test(lastLine) || /\[Y\/n\]/i.test(lastLine) || /Allow/i.test(lastLine)) {
    return 'needs_input';
  }
  if (/Do you want to proceed/i.test(tail) || /approve/i.test(lastLine)) {
    return 'needs_input';
  }

  // Errors / debugging needed
  if (/error(?:ed)?[\s:]/i.test(tail) || /TypeError|ReferenceError|SyntaxError/i.test(tail)) {
    return 'debugging';
  }
  if (/FAIL|failed|exception/i.test(tail) && !/0 failed/i.test(tail)) {
    return 'debugging';
  }
  if (/stack trace|at\s+\S+\s+\(/i.test(tail)) {
    return 'debugging';
  }

  // Ready to commit
  if (/changes? (are |were )?complete/i.test(tail) || /ready to commit/i.test(tail)) {
    return 'ready_to_commit';
  }
  if (/shall I commit/i.test(tail) || /want me to commit/i.test(tail)) {
    return 'ready_to_commit';
  }

  // Claude actively working — spinner, thinking, streaming
  if (/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/u.test(tail)) {
    return 'claude_working';
  }
  if (/thinking|generating|writing|reading|searching/i.test(lastLine)) {
    return 'claude_working';
  }

  // If Claude process is running but none of the above matched
  return 'claude_working';
}

export function detectPhase(sessionName: string): string | null {
  const content = capturePaneContent(sessionName);
  if (!content) return null;

  const text = content.toLowerCase();

  // Match skill phase markers
  if (/phase\s*1.*understand|phase\s*1.*analy/i.test(content)) return 'analyzing';
  if (/phase\s*2.*pattern|phase\s*2.*plan/i.test(content)) return 'analyzing';
  if (/phase\s*3.*implement|phase\s*3.*code|phase\s*3.*build/i.test(content)) return 'coding';
  if (/phase\s*4.*verif|phase\s*4.*test/i.test(content)) return 'testing';
  if (/phase\s*5.*review|phase\s*5.*commit|creating pr|pull request/i.test(content)) return 'reviewing';

  // Match skill names in progress indicators
  if (/running.*task-analyzer|analyzing task/i.test(content)) return 'analyzing';
  if (/running.*implement|implementing/i.test(content)) return 'coding';
  if (/running.*debug/i.test(content)) return 'blocked';
  if (/running.*pr\b|creating.*pull request/i.test(content)) return 'reviewing';
  if (/running.*estimate/i.test(content)) return 'analyzing';

  // Match test output
  if (/test.*pass|tests.*passing|✓.*test/i.test(content)) return 'testing';
  if (/test.*fail|tests.*failing|✗.*test/i.test(content)) return 'testing';

  return null;
}
