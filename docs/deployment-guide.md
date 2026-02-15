# Command Central — Deployment Guide

Step-by-step instructions to deploy Command Central to Railway + Neon Postgres.

---

## 1. Neon Postgres Setup

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project (e.g. "command-central")
3. Create two branches:
   - `main` — production database
   - `dev` — development/staging database
4. Copy the connection string for each branch (format: `postgresql://user:pass@host/dbname?sslmode=require`)

### Apply Migrations

From the project root, run against each database:

```bash
DATABASE_URL="<connection-string>" pnpm drizzle-kit push
```

This applies the current Drizzle schema to the target database. Run it once for setup and after each schema change.

---

## 2. Railway Setup

1. Create a free account at [railway.app](https://railway.app) ($5/mo hobby plan required for persistent deployments)
2. Create a new project, connect your GitHub repo (`dcerniglia/command-central`)
3. Create two services from the same repo:
   - **Production** — deploys from `main` branch
   - **Staging** — deploys from `develop` branch
4. Railway auto-detects the `Dockerfile` at the project root and builds from it

### Environment Variables

Set these on each Railway service:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon connection string (use prod branch for production, dev branch for staging) | `postgresql://user:pass@host/dbname?sslmode=require` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Set automatically by Railway | _(don't set manually)_ |
| `APP_URL` | Full public URL of the deployment | `https://command-central.up.railway.app` |
| `WEBAUTHN_RP_ID` | Hostname for passkey auth (no protocol, no port) | `command-central.up.railway.app` |
| `WEBAUTHN_ORIGIN` | Full origin for passkey auth | `https://command-central.up.railway.app` |
| `SESSION_SECRET` | Secret for signing session cookies | _(generate a random 64-char string)_ |

#### Jira Integration (optional)

| Variable | Description |
|---|---|
| `JIRA_URL` | Your Atlassian instance URL (e.g. `https://yourcompany.atlassian.net`) |
| `JIRA_EMAIL` | Email associated with your Atlassian account |
| `JIRA_API_TOKEN` | API token from [id.atlassian.net/manage-profile/security/api-tokens](https://id.atlassian.net/manage-profile/security/api-tokens) |
| `JIRA_WEBHOOK_SECRET` | Random string used to authenticate incoming Jira webhooks |

---

## 3. Custom Domain (Optional)

1. In Railway, go to your production service → Settings → Networking → Custom Domain
2. Add your domain (e.g. `app.davidcerniglia.com`)
3. Create the DNS records Railway provides (CNAME)
4. Update `APP_URL`, `WEBAUTHN_RP_ID`, and `WEBAUTHN_ORIGIN` to match the custom domain

---

## 4. Passkey Registration

After first deployment, you need to register your passkey:

1. Navigate to your deployed app URL
2. The login page will show a "Register" option (first-time setup)
3. Register with Touch ID / Face ID / security key
4. After registration, subsequent logins use the registered passkey

> **Note:** Passkeys are bound to the `WEBAUTHN_RP_ID` domain. If you change domains, you'll need to re-register.

---

## 5. Jira Webhook Setup (Optional)

To enable real-time Jira → Command Central sync:

1. In Jira, go to **Settings → System → WebHooks**
2. Create a new webhook:
   - **URL**: `https://<your-domain>/api/webhooks/jira?secret=<JIRA_WEBHOOK_SECRET>`
   - **Events**: Issue created, Issue updated, Issue deleted
   - **JQL filter** (optional): `assignee = currentUser()` to only sync your issues
3. Save the webhook

### Manual Sync

Even without webhooks, you can click the "Sync Jira" button in the task sidebar to pull all assigned issues on demand.

---

## 6. Verification Checklist

After deployment, verify:

- [ ] App loads at the public URL
- [ ] Passkey registration/login works
- [ ] Can create, complete, and delete tasks
- [ ] Task detail panel opens with all fields
- [ ] Checklist items can be added and toggled
- [ ] Markdown notes render correctly
- [ ] Date pickers work
- [ ] Areas, lists, and projects can be created
- [ ] Focus mode filters tasks by area
- [ ] Jira sync pulls issues (if configured)
- [ ] Jira webhook creates/updates tasks (if configured)

---

## 7. Ongoing Operations

### Database Migrations

After adding new Drizzle schema changes:

```bash
# Generate migration SQL
pnpm drizzle-kit generate

# Apply to staging
DATABASE_URL="<dev-connection-string>" pnpm drizzle-kit push

# After testing, apply to production
DATABASE_URL="<prod-connection-string>" pnpm drizzle-kit push
```

### Monitoring

- Railway provides built-in logging and metrics for each service
- Neon dashboard shows database activity, storage, and compute usage

### Backups

- Neon free tier includes 7-day point-in-time recovery
- Database branching can be used to snapshot before risky operations
