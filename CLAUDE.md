# Command Central

## What This Is

Command Central is a personal platform for managing all aspects of life and work — tasks, fitness, finances, dev tools, and whatever else needs a custom system. It's a modular monorepo where each domain gets its own self-contained module (server + client) that plugs into a shared shell.

This is a **personal project**, completely independent from Sparkshaft/TDS. It uses similar patterns (Inversify DI, tRPC, repository pattern) as a learning vehicle and to maintain muscle memory, but shares zero code with work projects.

## Broader Goals

### Portfolio & Personal Brand

Command Central is also a portfolio piece. The goal is to demonstrate:
- Deep full-stack architecture skills (monorepo, tRPC, Inversify DI, Drizzle, WebAuthn, React)
- A genuinely extensible module system — not theoretical, actually clean and pluggable
- Real software that solves real problems, not a toy demo

### DavidCerniglia.com Rebrand

The process of building Command Central will be documented and featured on a redesigned DavidCerniglia.com. The site's tone should be:
- "These are the types of problems I like to think about and the types of solutions I've built"
- Showcase thinking, architecture decisions, and outcomes — NOT a services pitch
- Indirect positioning: attract people who need custom systems built, without explicitly soliciting work
- **Must not look like job hunting** — David has a job and boss he loves and trusts. The site is about passion for the craft, not looking for an exit.

### Business Applications

The module system isn't just for personal life management. The architecture should demonstrate value for business use cases too — custom internal tools, dashboards, integrations, workflow automation. The vision: someone sees this and thinks "I want this person as a technical partner to build out all the custom systems my business needs."

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Database**: PostgreSQL via Drizzle ORM (drizzle-kit for migrations)
- **API**: tRPC (type-safe end-to-end)
- **DI**: Inversify (independent from Sparkshaft, same patterns)
- **Frontend**: React + Vite + shadcn/ui (New York style) + Tailwind
- **Mobile**: React Native + Expo (scaffolded, built out later)
- **Auth**: Passkey/WebAuthn via SimpleWebAuthn (Touch ID / Face ID)
- **Routing**: React Router v6 with lazy-loaded module routes
- **Server state**: TanStack Query via tRPC React hooks

## Monorepo Structure

```
~/command-central/
├── packages/
│   ├── shared/       # @cc/shared — Zod schemas, types, constants
│   ├── server/       # @cc/server — tRPC + Express + Inversify + Drizzle
│   ├── client/       # @cc/client — React + shadcn/ui
│   └── mobile/       # @cc/mobile — Expo (scaffold)
```

## Module System

Each module is a self-contained unit with server and client halves.

**Server module:** name, tRPC router, `registerContainer(container)` to bind DI services/repos.

**Client module:** name, route path, sidebar icon/label, lazy-loaded React Router routes.

Database tables are namespaced by module prefix (e.g. `task_items`, `task_lists`). All tables live in one Postgres database. Drizzle Kit manages all migrations.

## Project Tracking

**GitHub Issues are the source of truth** for all tasks, planning, and project details. Not markdown files, not mental notes. Every decision, task, and piece of context gets captured in an issue or issue comment.

## Conventions

### Database
- UUIDs for all IDs (Postgres `uuid` type)
- Drizzle ORM for schema definitions and queries
- drizzle-kit for migrations
- All tables namespaced by module prefix

### DI (Inversify)
- `@injectable()` on all classes
- `@inject(SYMBOL)` on constructor parameters
- Repositories: request-scoped (per-request instance)
- Stateless services: singleton
- tRPC context provides the Inversify container

### tRPC
- Routers organized by module under `appRouter`
- Auth middleware on all procedures except registration/login
- Procedures resolve services from the DI container

### Frontend
- shadcn/ui components (New York style, zinc palette)
- Tailwind for styling
- tRPC React hooks for server state
- React Router v6 with code splitting per module

### Auth
- Passkey-first via SimpleWebAuthn
- Single user now, but built properly to support multiple users later
- HTTP-only secure session cookies stored in Postgres

### Testing

Every feature must have well-documented associated tests. Tests are not optional — they ship with the feature.

**Stack:**
- **Unit/integration tests**: Vitest (all packages)
- **Component tests**: Vitest + React Testing Library + jsdom (client)
- **E2E tests**: Playwright (root `/e2e/` directory)
- **HTTP route tests**: Vitest + supertest (server)

**Conventions:**
- Test files live next to the code they test: `TaskService.ts` → `TaskService.test.ts`
- Server tests use the test helper (`test-helpers.ts`) for in-memory database setup
- Client component tests render with tRPC mock provider or MSW for API mocking
- E2E tests cover critical user flows (create task, complete task, navigate views, auth)
- Every tRPC router procedure should have at least one happy-path test
- Every React component with logic (not pure layout) should have a component test
- Run `pnpm test` at root to run all unit/integration tests across packages
- Run `pnpm test:e2e` at root to run Playwright end-to-end tests

**CI/CD:**
- GitHub Actions runs all tests on push and PR
- Pipeline: lint → typecheck → unit tests → build → e2e tests
- Tests must pass before merge

### Commit Messages
- Start with lowercase present-tense verb: adds, modifies, fixes, removes, updates, refactors, implements
- Brief description of WHAT changed
- Keep first line under 72 characters
- Do NOT use conventional commits (feat:, fix:), past tense, or ALL CAPS

### Branching & PR Workflow

All work follows a strict PR-based workflow. Every feature/fix gets its own branch and PR.

**Branches:**
- `main` — production. Protected: requires PR review + CI passing.
- `develop` — staging/integration. Protected: requires PR review + CI passing.
- Feature branches: `feature/<short-name>` off `develop`
- Fix branches: `fix/<short-name>` off `develop`

**Workflow:**
1. Create feature branch from `develop`
2. Implement feature with tests
3. Push branch, create PR to `develop` with summary + test plan
4. CI runs (typecheck → unit tests → build → e2e)
5. David reviews and approves
6. Merge to `develop` — auto-deploys to staging
7. When ready, PR from `develop` → `main` — auto-deploys to production

**Every GitHub Issue should have an associated PR.** Reference the issue in the PR description (`Closes #N`).

### Deployment

**Hosting:** Railway ($5/mo hobby plan)
- `develop` branch → staging environment
- `main` branch → production environment
- Auto-deploy on push via Dockerfile

**Database:** Neon Postgres (free tier)
- Serverless with auto-scaling to zero
- Database branching: `prod` branch and `dev` branch
- 7-day point-in-time recovery on free tier
- Daily automatic backups

**Environment variables (Railway):**
- `DATABASE_URL` — Neon connection string (with `?sslmode=require`)
- `NODE_ENV` — `production`
- `PORT` — set by Railway automatically
- `APP_URL` — full production URL (for CORS)
- `WEBAUTHN_RP_ID` — hostname for passkey auth (e.g. `command-central.up.railway.app`)
- `WEBAUTHN_ORIGIN` — full origin for passkey auth (e.g. `https://command-central.up.railway.app`)

**Production build:** Dockerfile builds client (Vite → static files) and server (tsc), then server serves both tRPC API and static client SPA. Single container.

## What NOT To Do

- No Sparkshaft imports — this is independent
- No MongoDB ObjectId — Postgres UUIDs only
- No SSR — client-side React SPA
- No .js files — TypeScript only
- No VS Code configs
- Do not remove the legacy POC — it stays mounted at `/legacy` during migration
