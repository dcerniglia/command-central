# ADR 004: Module System

## Status
Accepted

## Context
Command Central needs to support multiple independent life domains (tasks, fitness, finances, dev tools) without creating a monolithic application.

## Decision
Each domain is a "module" with a standardized server and client interface.

## Server Module
```typescript
interface ServerModule {
  name: string;
  router: AnyRouter;  // tRPC router
  registerContainer(container: Container): void;  // Inversify DI bindings
}
```
Routers merge into `appRouter`. DI bindings register repositories (request-scoped) and services (singleton).

## Client Module
```typescript
interface ClientModule {
  name: string;
  path: string;        // route prefix, e.g. "/tasks"
  icon: ComponentType; // sidebar icon
  label: string;
  routes: RouteObject[];  // lazy-loaded React Router routes
}
```
Sidebar renders registered modules. Routes are code-split per module.

## Database Convention
Tables are namespaced: `task_items`, `task_lists`, `task_areas`, `task_tags`, etc.
All tables live in one Postgres database.

## Current Modules
1. **Personal Tasks** — task management with lists, areas, tags, smart views, recurrence
2. **Legacy Dev Tools** — original POC (at `/legacy`), to be migrated later

## Consequences
- Clear separation of concerns per domain
- Adding a new module is a well-defined, repeatable process
- Shared shell provides consistent UX across modules
- Cross-module queries possible via shared Postgres database
