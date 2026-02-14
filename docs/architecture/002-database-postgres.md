# ADR 002: PostgreSQL via Drizzle ORM

## Status
Accepted

## Context
The POC used SQLite (better-sqlite3) which worked for single-user local development but doesn't support concurrent connections, has limited type system, and can't be hosted as a managed service.

## Decision
Migrate to PostgreSQL with Drizzle ORM for the schema layer and drizzle-kit for migrations.

## Rationale
- **Relational integrity**: Foreign keys across modules (e.g., tasks referencing areas/lists)
- **UUID primary keys**: Native `uuid` type, `gen_random_uuid()` for generation
- **Managed hosting**: Neon Postgres (serverless, free tier, branching for dev/prod)
- **Drizzle ORM**: Type-safe schema definitions that generate the AppRouter types end-to-end
- **drizzle-kit push**: Schema-first workflow — define tables in TypeScript, push to DB

## Consequences
- Requires Docker for local development (`docker-compose.yml` with Postgres 16)
- All IDs are UUIDs (no auto-increment integers)
- Schema changes go through Drizzle schema files, not raw SQL migrations
- Neon provides automatic backups and point-in-time restore
