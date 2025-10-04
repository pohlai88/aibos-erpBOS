# Migration Files Directory

## 📁 Location

```
C:\AI-BOS\aibos-erpBOS\packages\adapters\db\migrations\
```

## 📊 Current Status

- **Total Files**: 294 migration files
- **Range**: 0000_silky_tenebrous.sql → 0294_ops_rule_core_m27_2.sql
- **Purpose**: Historical evolution of database schema

## ⚠️ Important Notes

### These files are **NOT used** by:

- `pnpm db:push` (development command)
- `pnpm db:reset` (development command)

### These files are **ONLY used** by:

- `pnpm db:migrate` (production command)
- `pnpm db:generate` (creates new migration files)

## 🔄 How They Work

1. **Historical Record**: Each file represents a schema change over time
2. **Sequential Execution**: Migrations run in order (0000 → 0294)
3. **Production Safety**: Ensures consistent database state across environments
4. **Team Sync**: Allows team members to apply same changes

## 🚀 Development vs Production

### Development (Current Approach)

```powershell
# Uses current schema directly - ignores migration files
pnpm db:reset -Confirm
```

### Production (Migration-Based)

```powershell
# Runs all 294 migration files in sequence
pnpm db:migrate
```

## 📚 Related Documentation

- [Database Workflow Guide](../DATABASE_WORKFLOW.md)
- [Database Commands Reference](../DB_COMMANDS.md)

---

**Remember**: Migration files are for production safety, not development speed!
