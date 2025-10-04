# Database Commands Quick Reference

## 🎯 Phase-Based Commands

### 🟢 DEVELOPMENT PHASE

**Use these commands during active development:**

```powershell
# Fresh database with current schema (RECOMMENDED)
pnpm db:reset -Confirm

# Web dashboard with Mermaid diagrams - BEST for viewing
pnpm db:dashboard

# Terminal status check
pnpm db:status

# Interactive schema sync (preview changes)
pnpm db:push:safe

# Start/stop database
pnpm db:up
pnpm db:down
```

### 🔴 PRODUCTION PHASE

**Use these commands for production deployment:**

```powershell
# Generate migration file (REQUIRED before commit)
pnpm db:generate

# Apply all migrations (production deployment)
pnpm db:migrate

# Monitor migration status
pnpm db:dashboard

# Database GUI for production data
pnpm db:studio
```

## 🚀 Development Commands (Use These Daily)

```powershell
# Fresh database with current schema (RECOMMENDED)
pnpm db:reset -Confirm

# Web dashboard with Mermaid diagrams - BEST for viewing
pnpm db:dashboard

# Terminal status check
pnpm db:status

# Interactive schema sync (preview changes)
pnpm db:push:safe

# Start/stop database
pnpm db:up
pnpm db:down
```

## 🏭 Production Commands (Use Before Deploy)

```powershell
# Generate migration file (REQUIRED before commit)
pnpm db:generate

# Apply migrations (production only)
pnpm db:migrate
```

## ⚠️ Important Notes

- **`db:push`** = Development speed (skips 294 migration files)
- **`db:migrate`** = Production safety (runs all migration files)
- **Migration files location:** `packages/adapters/db/migrations/` (294 files)
- **Never use `db:push` in production!**

## 📚 Full Documentation

See [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md) for complete details.
