# Database Migration Status Checker
# This script provides crystal clear information about your database state

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Database Migration Status Checker" -ForegroundColor Green
    Write-Host "Usage: .\scripts\check-db-status.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This script will show you:" -ForegroundColor Cyan
    Write-Host "  - Exactly how many migration files exist" -ForegroundColor White
    Write-Host "  - How many have been applied to your database" -ForegroundColor White
    Write-Host "  - What happens when you run each command" -ForegroundColor White
    Write-Host "  - Clear step-by-step instructions" -ForegroundColor White
    exit 0
}

# Set environment
$env:DATABASE_URL = "postgresql://aibos:aibos@localhost:5432/aibos"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    DATABASE STATUS - CRYSTAL CLEAR REPORT" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if database is running
Write-Host "1. DATABASE CONNECTION" -ForegroundColor Blue
try {
    docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT 1;" | Out-Null
    Write-Host "   Database is running" -ForegroundColor Green
} catch {
    Write-Host "   Database is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUTION: Start database first" -ForegroundColor Yellow
    Write-Host "   pnpm db:up" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Count migration files
Write-Host "2. MIGRATION FILES IN YOUR PROJECT" -ForegroundColor Blue
$migrationFiles = Get-ChildItem -Path "packages/adapters/db/migrations" -Filter "*.sql" | Where-Object { $_.Name -notlike "meta*" }
$totalMigrations = $migrationFiles.Count
Write-Host "   Total migration files: $totalMigrations" -ForegroundColor Cyan
Write-Host "   Location: packages/adapters/db/migrations/" -ForegroundColor Cyan

Write-Host ""

# Check migration tracking
Write-Host "3. MIGRATIONS APPLIED TO YOUR DATABASE" -ForegroundColor Blue
$hasMigrationTable = $false
$appliedCount = 0
try {
    $migrationTable = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%drizzle%';" 2>$null
    if ($migrationTable -match "__drizzle_migrations") {
        $hasMigrationTable = $true
        $appliedResult = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT COUNT(*) as applied FROM __drizzle_migrations;" 2>$null
        $appliedCount = ($appliedResult -split '\s+')[3]
        Write-Host "   Migration tracking table exists" -ForegroundColor Green
        Write-Host "   Applied migrations: $appliedCount out of $totalMigrations" -ForegroundColor Cyan
    } else {
        Write-Host "   No migration tracking table found" -ForegroundColor Red
        Write-Host "   Applied migrations: 0 out of $totalMigrations" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   No migration tracking table found" -ForegroundColor Red
    Write-Host "   Applied migrations: 0 out of $totalMigrations" -ForegroundColor Cyan
}

Write-Host ""

# Check database tables
Write-Host "4. YOUR DATABASE TABLES" -ForegroundColor Blue
$tableCountResult = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
$tableCount = ($tableCountResult -split '\s+')[3]
if ($tableCount -match '\d+') {
    Write-Host "   Total tables in database: $tableCount" -ForegroundColor Cyan
} else {
    Write-Host "   Database has tables (exact count unclear)" -ForegroundColor Cyan
}

# Check key tables
Write-Host "   Essential tables status:" -ForegroundColor Cyan
$keyTables = @("company", "account", "journal", "playbook_action")
foreach ($table in $keyTables) {
    $exists = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>$null
    if ($exists -match "t") {
        Write-Host "     $table - EXISTS" -ForegroundColor Green
    } else {
        Write-Host "     $table - MISSING" -ForegroundColor Red
    }
}

Write-Host ""

# Clear explanation of what each command does
Write-Host "5. WHAT EACH COMMAND DOES" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Cyan

if (-not $hasMigrationTable) {
    Write-Host ""
    Write-Host "CURRENT SITUATION: Schema-First Mode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Your database is using CURRENT schema directly" -ForegroundColor Green
    Write-Host "   Migration files ($totalMigrations) are NOT being used" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "COMMAND BREAKDOWN:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   pnpm db:reset -Confirm" -ForegroundColor White
    Write-Host "   - Stops database container" -ForegroundColor Gray
    Write-Host "   - Deletes ALL data (fresh start)" -ForegroundColor Gray
    Write-Host "   - Starts clean database" -ForegroundColor Gray
    Write-Host "   - Applies CURRENT schema directly" -ForegroundColor Gray
    Write-Host "   - Skips ALL $totalMigrations migration files" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   pnpm db:push" -ForegroundColor White
    Write-Host "   - Compares current schema with database" -ForegroundColor Gray
    Write-Host "   - Applies differences directly" -ForegroundColor Gray
    Write-Host "   - Skips ALL $totalMigrations migration files" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   pnpm db:migrate" -ForegroundColor White
    Write-Host "   - Runs ALL $totalMigrations migration files" -ForegroundColor Gray
    Write-Host "   - Creates migration tracking table" -ForegroundColor Gray
    Write-Host "   - Takes much longer (production approach)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "RECOMMENDED WORKFLOW:" -ForegroundColor Green
    Write-Host ""
    Write-Host "   For Development (Fast):" -ForegroundColor White
    Write-Host "   pnpm db:reset -Confirm" -ForegroundColor Green
    Write-Host "   (This includes db:push automatically)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Before Committing Changes:" -ForegroundColor White
    Write-Host "   pnpm db:generate" -ForegroundColor Green
    Write-Host "   (Creates new migration file for team)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   For Production:" -ForegroundColor White
    Write-Host "   pnpm db:migrate" -ForegroundColor Green
    Write-Host "   (Runs all $totalMigrations migration files)" -ForegroundColor Gray
    
} else {
    Write-Host ""
    Write-Host "CURRENT SITUATION: Migration-Based Mode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Your database is using migration files" -ForegroundColor Green
    Write-Host "   Applied: $appliedCount out of $totalMigrations migration files" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "COMMAND BREAKDOWN:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   pnpm db:migrate" -ForegroundColor White
    Write-Host "   - Runs remaining migration files" -ForegroundColor Gray
    Write-Host "   - Updates migration tracking table" -ForegroundColor Gray
    Write-Host "   - Slow but safe (production approach)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   pnpm db:reset -Confirm" -ForegroundColor White
    Write-Host "   - Switches to schema-first mode" -ForegroundColor Gray
    Write-Host "   - Ignores all $totalMigrations migration files" -ForegroundColor Gray
    Write-Host "   - Much faster for development" -ForegroundColor Gray
    Write-Host ""
    Write-Host "RECOMMENDED WORKFLOW:" -ForegroundColor Green
    Write-Host ""
    Write-Host "   For Development (Switch to fast mode):" -ForegroundColor White
    Write-Host "   pnpm db:reset -Confirm" -ForegroundColor Green
    Write-Host "   (Switches to schema-first approach)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   For Production (Continue current):" -ForegroundColor White
    Write-Host "   pnpm db:migrate" -ForegroundColor Green
    Write-Host "   (Applies remaining migrations)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "KEY POINTS TO REMEMBER:" -ForegroundColor Red
Write-Host "   You have $totalMigrations migration files in your project" -ForegroundColor Red
Write-Host "   db:reset = Fast development (ignores migrations)" -ForegroundColor Red
Write-Host "   db:migrate = Slow production (uses all migrations)" -ForegroundColor Red
Write-Host "   db:push = Direct schema sync (ignores migrations)" -ForegroundColor Red
Write-Host ""
Write-Host "DOCUMENTATION:" -ForegroundColor Blue
Write-Host "   Complete Guide: DATABASE_WORKFLOW.md" -ForegroundColor White
Write-Host "   Quick Reference: DB_COMMANDS.md" -ForegroundColor White
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    END OF CRYSTAL CLEAR REPORT" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""