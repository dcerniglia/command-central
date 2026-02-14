# ADR 001: Platform Overview

## Status
Accepted

## Context
Need a personal platform to replace scattered tools (Obsidian, spreadsheets, notes apps) with a single unified system for managing all aspects of life — tasks, fitness, finances, dev tools, etc.

## Decision
Build Command Central as a modular monorepo where each life domain gets its own self-contained module. Modules share a common shell (sidebar navigation, auth, notifications) but are otherwise independent.

## Architecture
- Monorepo with pnpm workspaces: `shared/`, `server/`, `client/`, `mobile/`
- Each module = server router + client routes + DB tables
- Modules register via a standard interface, making the system extensible
- Single Postgres database with table namespacing per module

## Consequences
- Adding a new life domain is a well-defined process (create module, register router/routes)
- Shared auth, navigation, and notification system across all modules
- Single deployment artifact (one server serves API + SPA)
