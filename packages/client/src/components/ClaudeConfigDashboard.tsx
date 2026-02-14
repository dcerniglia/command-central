import { useState, useEffect } from 'react';

interface SkillMeta {
  name: string;
  description: string;
  userInvocable: boolean;
  allowedTools: string[];
  content: string;
}

interface McpServer {
  name: string;
  project: string;
  type: string;
  command: string;
  args: string[];
}

interface ProjectConfig {
  name: string;
  path: string;
  settings: Record<string, unknown> | null;
  settingsLocal: Record<string, unknown> | null;
  claudeMd: string | null;
  hasPlugins: boolean;
  plugins: string[];
  agents: string[];
}

interface ClaudeConfig {
  globalSettings: Record<string, unknown> | null;
  globalClaudeMd: string | null;
  workflowMd: string | null;
  skills: SkillMeta[];
  mcpServers: McpServer[];
  keybindings: Record<string, unknown> | null;
  projectConfigs: ProjectConfig[];
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-100">{title}</span>
          {count != null && (
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && <div className="border-t border-gray-700">{children}</div>}
    </div>
  );
}

function ExpandableRow({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 w-4">{open ? '▾' : '▸'}</span>
          <span className="text-sm font-medium text-gray-200">{label}</span>
          {badge}
        </div>
      </button>
      {open && <div className="px-5 pb-4 pl-11">{children}</div>}
    </div>
  );
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'green' | 'blue' | 'purple' | 'yellow' }) {
  const colors = {
    gray: 'bg-gray-600/30 text-gray-300',
    green: 'bg-emerald-500/20 text-emerald-300',
    blue: 'bg-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/20 text-purple-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm py-0.5">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}

interface ParsedBlock {
  type: 'heading' | 'bullet' | 'checkbox' | 'numbered' | 'code' | 'table' | 'blank' | 'paragraph';
  content: string;
  level?: number; // heading level or indent level
  checked?: boolean;
  lang?: string;
  rows?: string[][];
}

function parseMarkdownBlocks(text: string): ParsedBlock[] {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', content: codeLines.join('\n'), lang: lang || undefined });
      i++; // skip closing ```
      continue;
    }

    // Table (line with pipes, followed by separator)
    if (trimmed.includes('|') && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-|:\s]+$/.test(lines[i + 1])) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        tableRows.push(row);
        i++;
      }
      // Remove separator row (index 1)
      if (tableRows.length > 1) tableRows.splice(1, 1);
      blocks.push({ type: 'table', content: '', rows: tableRows });
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', content: headingMatch[2], level: headingMatch[1].length });
      i++;
      continue;
    }

    // Checkbox
    const checkboxMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checkboxMatch) {
      const indent = line.length - trimmed.length;
      blocks.push({ type: 'checkbox', content: checkboxMatch[2], checked: checkboxMatch[1] !== ' ', level: Math.floor(indent / 2) });
      i++;
      continue;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const indent = line.length - trimmed.length;
      blocks.push({ type: 'bullet', content: trimmed.slice(2), level: Math.floor(indent / 2) });
      i++;
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      const indent = line.length - trimmed.length;
      blocks.push({ type: 'numbered', content: numberedMatch[2], level: Math.floor(indent / 2) });
      i++;
      continue;
    }

    // Blank line
    if (trimmed === '') {
      blocks.push({ type: 'blank', content: '' });
      i++;
      continue;
    }

    // Paragraph
    blocks.push({ type: 'paragraph', content: line });
    i++;
  }

  return blocks;
}

function MarkdownPreview({ text }: { text: string }) {
  const blocks = parseMarkdownBlocks(text);
  let numberedCounter = 0;

  return (
    <div className="text-sm text-gray-300 space-y-1">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
            const cls = block.level === 1
              ? 'text-lg font-bold text-gray-100 pt-3 pb-1'
              : block.level === 2
                ? 'text-base font-semibold text-gray-200 pt-2 pb-0.5'
                : 'text-sm font-semibold text-gray-200 pt-1';
            return <Tag key={i} className={cls}>{formatInline(block.content)}</Tag>;
          }
          case 'checkbox':
            return (
              <div key={i} className="flex items-start gap-2" style={{ paddingLeft: `${(block.level ?? 0) * 12}px` }}>
                <span className={`mt-0.5 w-4 h-4 flex items-center justify-center rounded border text-xs ${
                  block.checked
                    ? 'bg-indigo-500/30 border-indigo-400 text-indigo-300'
                    : 'border-gray-600 text-transparent'
                }`}>
                  {block.checked ? '✓' : ''}
                </span>
                <span className={block.checked ? 'line-through text-gray-500' : ''}>{formatInline(block.content)}</span>
              </div>
            );
          case 'bullet':
            return (
              <div key={i} className="flex gap-2" style={{ paddingLeft: `${(block.level ?? 0) * 12}px` }}>
                <span className="text-gray-500">-</span>
                <span>{formatInline(block.content)}</span>
              </div>
            );
          case 'numbered': {
            // Reset counter if previous block wasn't numbered
            if (i === 0 || blocks[i - 1].type !== 'numbered') numberedCounter = 0;
            numberedCounter++;
            return (
              <div key={i} className="flex gap-2" style={{ paddingLeft: `${(block.level ?? 0) * 12}px` }}>
                <span className="text-gray-500 min-w-[1.2em] text-right">{numberedCounter}.</span>
                <span>{formatInline(block.content)}</span>
              </div>
            );
          }
          case 'code':
            return (
              <div key={i} className="my-2 rounded-lg border border-gray-700/50 overflow-hidden">
                {block.lang && (
                  <div className="bg-gray-900 px-3 py-1 text-xs text-gray-500 border-b border-gray-700/50">{block.lang}</div>
                )}
                <pre className="bg-gray-900/70 p-3 overflow-x-auto">
                  <code className="text-xs font-mono text-indigo-300 whitespace-pre">{block.content}</code>
                </pre>
              </div>
            );
          case 'table':
            return (
              <div key={i} className="my-2 overflow-x-auto rounded-lg border border-gray-700/50">
                <table className="w-full text-sm">
                  {block.rows && block.rows.length > 0 && (
                    <>
                      <thead>
                        <tr className="bg-gray-800/80">
                          {block.rows[0].map((cell, ci) => (
                            <th key={ci} className="px-3 py-2 text-left text-xs font-semibold text-gray-300 border-b border-gray-700/50">
                              {formatInline(cell)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.slice(1).map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-800/30' : ''}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-1.5 text-gray-400 border-b border-gray-700/30">
                                {formatInline(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            );
          case 'blank':
            return <div key={i} className="h-2" />;
          case 'paragraph':
          default:
            return <p key={i}>{formatInline(block.content)}</p>;
        }
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  // Handle **bold** and `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    let firstMatch: { index: number; length: number; node: React.ReactNode } | null = null;

    if (boldMatch?.index != null) {
      firstMatch = {
        index: boldMatch.index,
        length: boldMatch[0].length,
        node: <strong key={key++} className="text-gray-100 font-semibold">{boldMatch[1]}</strong>,
      };
    }
    if (codeMatch?.index != null && (!firstMatch || codeMatch.index < firstMatch.index)) {
      firstMatch = {
        index: codeMatch.index,
        length: codeMatch[0].length,
        node: <code key={key++} className="bg-gray-700 text-indigo-300 px-1 py-0.5 rounded text-xs">{codeMatch[1]}</code>,
      };
    }

    if (firstMatch) {
      if (firstMatch.index > 0) {
        parts.push(remaining.slice(0, firstMatch.index));
      }
      parts.push(firstMatch.node);
      remaining = remaining.slice(firstMatch.index + firstMatch.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function ClaudeConfigDashboard() {
  const [config, setConfig] = useState<ClaudeConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/claude-config')
      .then((r) => r.json())
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-6 text-red-400">Error loading config: {error}</div>;
  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading Claude Code configuration...</div>
      </div>
    );
  }

  const activeServers = config.mcpServers.filter(s => s.args.length > 0 || s.command);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-4 max-w-4xl mx-auto w-full">
      {/* Skills */}
      <Section title="Skills" count={config.skills.length}>
        {config.skills.length === 0 ? (
          <p className="px-5 py-3 text-gray-500 italic">No skills installed</p>
        ) : (
          config.skills.map((skill) => (
            <ExpandableRow
              key={skill.name}
              label={skill.name}
              badge={
                <div className="flex gap-1.5">
                  {skill.userInvocable && <Badge color="green">invocable</Badge>}
                  <Badge color="blue">/{skill.name}</Badge>
                </div>
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed">{skill.description}</p>
                {skill.allowedTools.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Allowed Tools</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {skill.allowedTools.map((tool) => (
                        <Badge key={tool} color="gray">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {skill.content && (
                  <details className="group">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                      View full instructions
                    </summary>
                    <div className="mt-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                      <MarkdownPreview text={skill.content} />
                    </div>
                  </details>
                )}
              </div>
            </ExpandableRow>
          ))
        )}
      </Section>

      {/* MCP Servers */}
      <Section title="MCP Servers" count={activeServers.length}>
        {activeServers.length === 0 ? (
          <p className="px-5 py-3 text-gray-500 italic">No MCP servers configured</p>
        ) : (
          activeServers.map((server, i) => (
            <ExpandableRow
              key={`${server.name}-${i}`}
              label={server.name}
              badge={
                <div className="flex gap-1.5">
                  <Badge color="purple">{server.type}</Badge>
                  <Badge color="gray">{server.project}</Badge>
                </div>
              }
            >
              <div className="space-y-1">
                <KeyValue label="Command" value={<code className="text-indigo-300 text-xs">{server.command} {server.args.join(' ')}</code>} />
                <KeyValue label="Project" value={server.project} />
              </div>
            </ExpandableRow>
          ))
        )}
      </Section>

      {/* Global Settings */}
      <Section title="Global Settings">
        {config.globalSettings ? (
          <div className="px-5 py-3">
            {Object.entries(config.globalSettings).map(([key, value]) => (
              <KeyValue
                key={key}
                label={key}
                value={
                  typeof value === 'object'
                    ? <code className="text-xs text-gray-400">{JSON.stringify(value)}</code>
                    : String(value)
                }
              />
            ))}
          </div>
        ) : (
          <p className="px-5 py-3 text-gray-500 italic">Not configured</p>
        )}
      </Section>

      {/* CLAUDE.md */}
      <Section title="CLAUDE.md">
        {config.globalClaudeMd ? (
          <div className="px-5 py-4 ">
            <MarkdownPreview text={config.globalClaudeMd} />
          </div>
        ) : (
          <p className="px-5 py-3 text-gray-500 italic">No global CLAUDE.md</p>
        )}
      </Section>

      {/* Workflow */}
      {config.workflowMd && (
        <Section title="WORKFLOW.md">
          <div className="px-5 py-4 ">
            <MarkdownPreview text={config.workflowMd} />
          </div>
        </Section>
      )}

      {/* Project Configs */}
      <Section title="Project Configs" count={config.projectConfigs.length}>
        {config.projectConfigs.length === 0 ? (
          <p className="px-5 py-3 text-gray-500 italic">No project configs found in ~/tds/</p>
        ) : (
          config.projectConfigs.map((project) => (
            <ExpandableRow
              key={project.name}
              label={project.name}
              badge={
                <div className="flex gap-1.5">
                  <Badge color="gray">{project.path}</Badge>
                  {project.hasPlugins && <Badge color="yellow">plugins</Badge>}
                  {project.agents.length > 0 && <Badge color="purple">{project.agents.length} agent{project.agents.length > 1 ? 's' : ''}</Badge>}
                </div>
              }
            >
              <div className="space-y-3">
                {project.settings && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">settings.json</span>
                    <div className="mt-1 bg-gray-900/50 rounded p-3 border border-gray-700/50">
                      {Object.entries(project.settings as Record<string, unknown>).map(([k, v]) => (
                        <KeyValue key={k} label={k} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
                      ))}
                    </div>
                  </div>
                )}
                {project.settingsLocal && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">settings.local.json</span>
                    <pre className="mt-1 bg-gray-900/50 rounded p-3 border border-gray-700/50 text-xs text-gray-400 font-mono whitespace-pre-wrap">
                      {JSON.stringify(project.settingsLocal, null, 2)}
                    </pre>
                  </div>
                )}
                {project.plugins.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Plugins</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {project.plugins.map((p) => <Badge key={p} color="yellow">{p}</Badge>)}
                    </div>
                  </div>
                )}
                {project.agents.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Custom Agents</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {project.agents.map((a) => <Badge key={a} color="purple">{a}</Badge>)}
                    </div>
                  </div>
                )}
                {project.claudeMd && (
                  <details>
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">View CLAUDE.md</summary>
                    <div className="mt-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                      <MarkdownPreview text={project.claudeMd} />
                    </div>
                  </details>
                )}
                {!project.settings && !project.settingsLocal && !project.claudeMd && project.plugins.length === 0 && (
                  <p className="text-gray-500 italic text-sm">Empty .claude directory</p>
                )}
              </div>
            </ExpandableRow>
          ))
        )}
      </Section>

      {/* Keybindings */}
      <Section title="Keybindings">
        {config.keybindings ? (
          <div className="px-5 py-3">
            <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(config.keybindings, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="px-5 py-3 text-gray-500 italic">No custom keybindings configured</p>
        )}
      </Section>
    </div>
  );
}
