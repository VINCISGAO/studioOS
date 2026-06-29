# StudioOS — Disaster Recovery & Restore Guide

This guide explains how to recover the project if your computer fails, files are deleted, or you need to redeploy from backup.

---

## 1. Clone from GitHub (primary recovery)

Git is the source of truth for code. Backups protect uncommitted work and database state.

```bash
git clone git@github.com:YOUR_ORG/YOUR_PRIVATE_REPO.git studioos
cd studioos
npm install
cp .env.example .env.local
```

Edit `.env.local` with your secrets (see section 3).

```bash
npm run db:init    # Docker Postgres + migrate + seed (local dev)
npm run dev
```

Verify:

```bash
npm run typecheck
npm run build
npm run backup:verify
```

---

## 2. Install dependencies

Requirements:

- Node.js 20–22 (`nvm use` if `.nvmrc` exists)
- Docker Desktop (local Postgres, Redis, MinIO)
- `zip` and `pg_dump` (or Docker for database export)

```bash
npm install
npm run db:generate
```

---

## 3. Restore environment variables

**Never commit `.env` or `.env.local`.** After clone or ZIP restore:

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```
2. Restore values from your password manager or secure notes:
   - `DATABASE_URL`
   - `STRIPE_*`, `OPENAI_API_KEY`, `RESEND_*`
   - `R2_*` / S3 credentials
   - `BACKUP_S3_*` for cloud backups
3. Confirm secrets are not tracked:
   ```bash
   git ls-files .env .env.local   # should print nothing
   ```

---

## 4. Restore from project ZIP backup

ZIP backups are stored **outside the repo** by default:

```
~/StudioOS-Backups/project/StudioOS_Backup_YYYY-MM-DD_HH-mm.zip
```

### Steps

1. Extract to a new folder (do not overwrite an active dev tree blindly):
   ```bash
   mkdir -p ~/restored-studioos
   unzip ~/StudioOS-Backups/project/StudioOS_Backup_2026-06-30_09-00.zip -d ~/restored-studioos
   ```
2. Reinstall dependencies (ZIP excludes `node_modules`):
   ```bash
   cd ~/restored-studioos
   npm install
   ```
3. Restore `.env.local` from secure storage (not inside ZIP).
4. Run verification:
   ```bash
   npm run typecheck && npm run build
   ```

### Cloud download (S3 / R2)

If `BACKUP_CLOUD_ENABLED=1`, backups are uploaded to:

- Project: `s3://{BACKUP_S3_BUCKET}/backups/project/`
- Database: `s3://{BACKUP_S3_BUCKET}/backups/database/`

Download with AWS CLI or your S3/R2 dashboard, then extract as above.

---

## 5. Restore database backup

Database dumps are stored separately:

```
~/StudioOS-Backups/database/Database_Backup_YYYY-MM-DD_HH-mm.sql
```

### Local Docker Postgres

```bash
docker compose up -d postgres
docker compose exec -T postgres psql -U studioos -d studioos -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T postgres psql -U studioos -d studioos < ~/StudioOS-Backups/database/Database_Backup_YYYY-MM-DD_HH-mm.sql
npm run db:generate
```

### Remote Postgres (production)

Use your hosting provider's restore flow, or:

```bash
psql "$DATABASE_URL" < Database_Backup_YYYY-MM-DD_HH-mm.sql
```

**Warning:** Restoring overwrites current data. Take a fresh backup before restoring.

---

## 6. Redeploy

### Vercel

```bash
npm run build
npm run deploy:vercel-only
```

Ensure production env vars are set in the Vercel dashboard (same keys as `.env.example`).

### Database migrations (production)

```bash
npm run db:migrate:deploy
```

---

## 7. If your computer is lost or damaged

1. **Code:** Clone private GitHub repo on a new machine.
2. **Secrets:** Restore `.env.local` from password manager / cloud secret store.
3. **Database:** Download latest `Database_Backup_*.sql` from `~/StudioOS-Backups` or S3/R2; restore into new Postgres.
4. **Uncommitted work:** Restore latest `StudioOS_Backup_*.zip` if Git did not have it.
5. **Verify:** `npm run backup:verify` and `npm run build`.
6. **Redeploy** if this was production.

---

## 8. Backup commands (daily routine)

| Command | Purpose |
|---------|---------|
| `npm run backup:project` | ZIP project (excludes secrets, node_modules) |
| `npm run backup:database` | SQL export via `pg_dump` |
| `npm run backup:daily` | Both + retention + optional cloud upload |
| `npm run backup:verify` | Verify git, backups, cloud config |
| `npm run backup:protect -- project File.zip` | Mark backup as never auto-delete |

### Retention

- Keeps latest **30** non-protected backups (configurable via `BACKUP_RETENTION_COUNT`).
- Deletions are logged to `~/StudioOS-Backups/logs/retention.log`.

### Schedule daily backups (macOS cron example)

```bash
crontab -e
# Add:
0 9 * * * cd /path/to/studioos && npm run backup:daily >> ~/StudioOS-Backups/logs/cron.log 2>&1
```

---

## 9. Sprint delivery checklist

Before marking a sprint complete:

```bash
npm run typecheck
npm run build
git add -A && git commit -m "sprint N: description"
git push origin main
npm run backup:daily
npm run backup:verify
```

Wait for project owner approval before starting the next sprint.

---

## 10. Support files

| File | Purpose |
|------|---------|
| `scripts/backup/project-backup.mjs` | Project ZIP |
| `scripts/backup/database-backup.mjs` | Database SQL export |
| `scripts/backup/backup-all.mjs` | Full daily backup |
| `scripts/backup/verify-backup.mjs` | Safety verification |
| `scripts/setup-github-remote.sh` | Connect GitHub remote |
| `.env.example` | Environment template (no secrets) |
