import 'reflect-metadata';
import { Container } from 'inversify';
import { SYMBOLS } from './symbols.js';
import { createDatabase } from '../db/drizzle.js';
import { AuthService } from '../services/auth-service.js';
import { TaskRepository } from '../services/task-repository.js';
import { AreaRepository } from '../services/area-repository.js';
import { TagRepository } from '../services/tag-repository.js';
import { ProjectRepository } from '../services/project-repository.js';
import { TaskService } from '../services/task-service.js';
import { JiraService } from '../services/jira-service.js';
import { NaturalLanguageService } from '../services/natural-language-service.js';

export function createContainer(): Container {
  const container = new Container();

  // Database — singleton
  container.bind(SYMBOLS.Database).toConstantValue(createDatabase());

  // Auth — singleton
  container.bind(SYMBOLS.AuthService).to(AuthService).inSingletonScope();

  // Repositories — request scope
  container.bind(SYMBOLS.TaskRepository).to(TaskRepository).inRequestScope();
  container.bind(SYMBOLS.AreaRepository).to(AreaRepository).inRequestScope();
  container.bind(SYMBOLS.TagRepository).to(TagRepository).inRequestScope();
  container.bind(SYMBOLS.ProjectRepository).to(ProjectRepository).inRequestScope();

  // Services — singleton
  container.bind(SYMBOLS.TaskService).to(TaskService).inSingletonScope();
  container.bind(SYMBOLS.JiraService).to(JiraService).inSingletonScope();
  container.bind(SYMBOLS.NaturalLanguageService).to(NaturalLanguageService).inRequestScope();

  return container;
}
