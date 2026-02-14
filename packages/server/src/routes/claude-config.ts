import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const TDS_DIR = path.join(HOME, 'tds');
const CLAUDE_JSON = path.join(HOME, '.claude.json');

function readJsonFile(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function readTextFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

interface SkillMeta {
  name: string;
  description: string;
  userInvocable: boolean;
  allowedTools: string[];
  content: string;
}

function parseSkillMd(filePath: string): SkillMeta | null {
  const text = readTextFile(filePath);
  if (!text) return null;

  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) return { name: path.basename(path.dirname(filePath)), description: '', userInvocable: false, allowedTools: [], content: text };

  const frontmatter = fmMatch[1];
  const content = fmMatch[2].trim();

  const getName = (fm: string) => fm.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? '';
  const getDesc = (fm: string) => {
    const match = fm.match(/^description:\s*>?\s*\n?([\s\S]*?)(?=^[a-z-]+:|$)/m);
    if (match) return match[1].replace(/\n\s*/g, ' ').trim();
    const inline = fm.match(/^description:\s*(.+)$/m);
    return inline?.[1]?.trim() ?? '';
  };
  const getBool = (fm: string, key: string) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() === 'true';
  const getTools = (fm: string) => {
    const match = fm.match(/^allowed-tools:\s*(.+)$/m);
    return match ? match[1].split(',').map(t => t.trim()) : [];
  };

  return {
    name: getName(frontmatter),
    description: getDesc(frontmatter),
    userInvocable: getBool(frontmatter, 'user-invocable'),
    allowedTools: getTools(frontmatter),
    content,
  };
}

interface McpServer {
  name: string;
  project: string;
  type: string;
  command: string;
  args: string[];
}

function redactValue(val: string): string {
  if (val.length <= 8) return val;
  return val.slice(0, 4) + '...' + val.slice(-4);
}

function getMcpServers(): McpServer[] {
  const claudeJson = readJsonFile(CLAUDE_JSON) as Record<string, unknown> | null;
  if (!claudeJson) return [];

  const servers: McpServer[] = [];
  const projects = claudeJson.projects as Record<string, Record<string, unknown>> | undefined;
  if (!projects) return [];

  for (const [projectPath, projectConfig] of Object.entries(projects)) {
    const mcpServers = projectConfig.mcpServers as Record<string, Record<string, unknown>> | undefined;
    if (!mcpServers) continue;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      if (!serverConfig.command) continue;
      const args = (serverConfig.args as string[] ?? []).map(a => {
        // Redact things that look like tokens/secrets
        if (a.length > 30 && /^[A-Za-z0-9_=+\-/.]+$/.test(a)) return redactValue(a);
        return a;
      });
      servers.push({
        name: serverName,
        project: projectPath.replace(HOME, '~'),
        type: (serverConfig.type as string) ?? 'stdio',
        command: serverConfig.command as string,
        args,
      });
    }
  }

  // Also check top-level mcpServers
  const topLevel = claudeJson.mcpServers as Record<string, Record<string, unknown>> | undefined;
  if (topLevel) {
    for (const [serverName, serverConfig] of Object.entries(topLevel)) {
      if (!serverConfig.command) continue;
      servers.push({
        name: serverName,
        project: 'global',
        type: (serverConfig.type as string) ?? 'stdio',
        command: serverConfig.command as string,
        args: serverConfig.args as string[] ?? [],
      });
    }
  }

  return servers;
}

interface ProjectConfig {
  name: string;
  path: string;
  settings: unknown | null;
  settingsLocal: unknown | null;
  claudeMd: string | null;
  hasPlugins: boolean;
  plugins: string[];
  agents: string[];
}

function getProjectConfigs(): ProjectConfig[] {
  const configs: ProjectConfig[] = [];

  function scanDir(baseDir: string, depth = 0) {
    if (depth > 2) return;
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = path.join(baseDir, entry.name);
        const claudeDir = path.join(fullPath, '.claude');

        try {
          fs.accessSync(claudeDir);
          const settings = readJsonFile(path.join(claudeDir, 'settings.json'));
          const settingsLocal = readJsonFile(path.join(claudeDir, 'settings.local.json'));
          const claudeMd = readTextFile(path.join(claudeDir, 'CLAUDE.md'));

          let plugins: string[] = [];
          let agents: string[] = [];
          const pluginsDir = path.join(claudeDir, 'plugins');
          try {
            const pluginDirs = fs.readdirSync(pluginsDir, { withFileTypes: true });
            for (const pd of pluginDirs) {
              if (pd.isDirectory()) {
                plugins.push(pd.name);
                // Check for agents within plugins
                const agentsDir = path.join(pluginsDir, pd.name, 'agents');
                try {
                  const agentFiles = fs.readdirSync(agentsDir);
                  agents.push(...agentFiles.filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
                } catch { /* no agents dir */ }
              }
            }
          } catch { /* no plugins dir */ }

          if (settings || settingsLocal || claudeMd || plugins.length > 0) {
            configs.push({
              name: entry.name,
              path: fullPath.replace(HOME, '~'),
              settings,
              settingsLocal,
              claudeMd,
              hasPlugins: plugins.length > 0,
              plugins,
              agents,
            });
          }
        } catch { /* no .claude dir */ }

        // Recurse into subdirectories (e.g., ~/tds/powerschool/*)
        if (depth < 2) scanDir(fullPath, depth + 1);
      }
    } catch { /* dir doesn't exist */ }
  }

  scanDir(TDS_DIR);
  return configs;
}

router.get('/', (_req, res) => {
  const globalSettings = readJsonFile(path.join(CLAUDE_DIR, 'settings.json'));
  const globalClaudeMd = readTextFile(path.join(CLAUDE_DIR, 'CLAUDE.md'));
  const workflowMd = readTextFile(path.join(CLAUDE_DIR, 'WORKFLOW.md'));
  const keybindings = readJsonFile(path.join(CLAUDE_DIR, 'keybindings.json'));

  // Skills with full metadata
  const skills: SkillMeta[] = [];
  const skillsDir = path.join(CLAUDE_DIR, 'skills');
  try {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const dir of skillDirs) {
      if (!dir.isDirectory()) continue;
      const meta = parseSkillMd(path.join(skillsDir, dir.name, 'SKILL.md'));
      if (meta) skills.push(meta);
    }
  } catch { /* no skills dir */ }

  const mcpServers = getMcpServers();
  const projectConfigs = getProjectConfigs();

  res.json({
    globalSettings,
    globalClaudeMd,
    workflowMd,
    skills,
    mcpServers,
    keybindings,
    projectConfigs,
  });
});

export default router;
