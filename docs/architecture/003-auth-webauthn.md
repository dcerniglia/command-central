# ADR 003: Passkey Authentication via WebAuthn

## Status
Accepted

## Context
Need authentication that's secure, passwordless, and works across Mac (Touch ID) and mobile (Face ID / Touch ID).

## Decision
Passkey-first authentication via SimpleWebAuthn (`@simplewebauthn/server` + `@simplewebauthn/browser`).

## Design
- **Registration**: First launch detects no users → registration page → create passkey
- **Login**: Challenge → biometric prompt → session cookie
- **Sessions**: HTTP-only secure cookies, stored in Postgres `sessions` table
- **Tables**: `users` (id, username) + `authenticators` (credentialId, publicKey, counter, userId)
- **Auth middleware**: All tRPC procedures require valid session (except registration/login)
- **Dev bypass**: `devLogin` endpoint (disabled in production) for e2e testing

## Consequences
- No passwords to manage or forget
- Biometric auth on every device
- Single user for now, but the schema supports multiple users
- WebAuthn requires HTTPS in production (or localhost for development)
- RP_ID and ORIGIN must be configured per environment
