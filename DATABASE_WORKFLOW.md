# Database Workflow Guide

## 🎯 Overview

This project uses **Drizzle ORM** with two distinct database management approaches:

- **Development**: Schema-first with `db:push` (fast iteration)
- **Production**: Migration-based with `db:migrate` (safe deployment)

## 🚀 Phase-Based Guidelines

### 🟢 DEVELOPMENT PHASE

**When:** Active development, testing, feature building  
**Goal:** Fast iterations with current schema

```bash
# Daily development workflow
pnpm db:reset -Confirm    # Fresh database (fast)
pnpm db:dashboard        # Visual status check
pnpm db:generate         # Before committing changes
```

**Benefits:**

- ✅ Fast iterations
- ✅ Current schema directly applied
- ✅ Skip 307 migration files
- ✅ Perfect for testing

### 🔴 PRODUCTION PHASE

**When:** Deploying to production, staging environments  
**Goal:** Safe, tracked migrations

```bash
# Production deployment workflow
pnpm db:migrate          # Run all migration files
pnpm db:dashboard        # Monitor progress
pnpm db:studio           # Data inspection
```

**Benefits:**

- ✅ Full migration history
- ✅ Rollback capability
- ✅ Team synchronization
- ✅ Production safety

## 🚀 Development Workflow (Recommended)

### Quick Database Reset

```powershell
# Clean slate - perfect for development
pnpm db:reset -Confirm
```

**When to use:**

- Starting new feature development
- After schema changes
- When database gets into inconsistent state
- Before running tests

**What it does:**

- Stops database container
- Removes all data (fresh start)
- Starts clean database
- Applies current schema directly
- **Skips migration files** (294 files in `/migrations/`)

### Safe Interactive Push

```powershell
# When you want to see what changes will be made
pnpm db:push:safe
```

**When to use:**

- Previewing schema changes
- When you have important data to preserve
- Before making significant changes

## 🏭 Production Workflow

### Generate Migration

```powershell
# Create migration file after schema changes
pnpm db:generate
```

**When to use:**

- Before committing schema changes
- When preparing for production deployment
- When sharing changes with team

### Apply Migrations

```powershell
# Run migrations in sequence
pnpm db:migrate
```

**When to use:**

- Production deployments
- Staging environment setup
- Team synchronization

## 📁 Migration Files Location

**Migration files are stored in:**

```
C:\AI-BOS\aibos-erpBOS\packages\adapters\db\migrations\
```

**Current status:** 294 migration files (0000 → 0294)

- These represent the **historical evolution** of your schema
- **NOT executed** by `db:push` commands
- **ONLY executed** by `db:migrate` commands

## ⚠️ Important Rules

### ✅ DO Use `db:push` For:

- Development work
- Testing schema changes
- Quick iterations
- Local development environment

### ❌ DON'T Use `db:push` For:

- Production deployments
- Shared team environments
- When migration history matters
- Production data migration

### ✅ DO Use `db:migrate` For:

- Production deployments
- Team synchronization
- When you need migration history
- Staging environment setup

## 🔄 Complete Development Cycle

### 1. Make Schema Changes

```typescript
// Edit schema files in packages/adapters/db/src/schema/
export const newTable = pgTable('new_table', {
  id: text('id').primaryKey(),
  // ... other fields
});
```

### 2. Build Schema

```powershell
# Compile TypeScript to JavaScript
pnpm --filter @aibos/db-adapter build
```

### 3. Test Changes (Development)

```powershell
# Reset database with new schema
pnpm db:reset -Confirm
```

### 4. Generate Migration (Before Commit)

```powershell
# Create migration file for team/production
pnpm db:generate
```

### 5. Commit Changes

```powershell
git add .
git commit -m "feat: add new table schema"
```

## 🛠️ Available Commands

| Command             | Purpose                             | Use Case             |
| ------------------- | ----------------------------------- | -------------------- |
| `pnpm db:reset`     | Fresh database with current schema  | Development          |
| `pnpm db:push:safe` | Interactive schema sync             | Preview changes      |
| `pnpm db:generate`  | Create migration file               | Before commit        |
| `pnpm db:migrate`   | Apply migrations                    | Production           |
| `pnpm db:status`    | Check migration status (terminal)   | Status checking      |
| `pnpm db:dashboard` | Web dashboard with Mermaid diagrams | Visual relationships |
| `pnpm db:studio`    | Database GUI                        | Data inspection      |
| `pnpm db:up`        | Start database                      | Start development    |
| `pnpm db:down`      | Stop database                       | Stop development     |

## 🚨 Common Mistakes to Avoid

### ❌ Wrong: Using `db:push` in Production

```powershell
# DON'T DO THIS IN PRODUCTION
pnpm db:push --force
```

### ❌ Wrong: Skipping Migration Generation

```powershell
# DON'T skip this before committing schema changes
# pnpm db:generate  # <- This is required!
```

### ❌ Wrong: Using `db:migrate` for Development

```powershell
# DON'T DO THIS FOR DEVELOPMENT (too slow)
pnpm db:migrate  # Runs 294 migration files!
```

## 🔍 Troubleshooting

### Database Connection Issues

```powershell
# Check if database is running
pnpm db:up

# Verify connection
docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT 1;"
```

### Schema Sync Issues

```powershell
# Nuclear option - fresh start
pnpm db:reset -Confirm
```

### Migration Conflicts

```powershell
# Generate new migration
pnpm db:generate

# Review the generated SQL file
# Then apply if correct
pnpm db:migrate
```

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Database Schema Files](./packages/adapters/db/src/schema/)
- [Migration Files](./packages/adapters/db/migrations/)

---

**Remember:** `db:push` = Development Speed, `db:migrate` = Production Safety
