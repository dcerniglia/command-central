export const SYMBOLS = {
  Database: Symbol.for('Database'),
  AuthService: Symbol.for('AuthService'),
  TaskRepository: Symbol.for('TaskRepository'),
  AreaRepository: Symbol.for('AreaRepository'),
  TagRepository: Symbol.for('TagRepository'),
  ChecklistRepository: Symbol.for('ChecklistRepository'),
  ProjectRepository: Symbol.for('ProjectRepository'),
  TaskService: Symbol.for('TaskService'),
  JiraService: Symbol.for('JiraService'),
} as const;
