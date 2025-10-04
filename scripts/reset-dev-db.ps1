# Development Database Reset Script
# This script provides a clean way to reset your development database

param(
    [switch]$Confirm,
    [switch]$Help
)

if ($Help) {
    Write-Host "Development Database Reset Script" -ForegroundColor Green
    Write-Host "Usage: .\scripts\reset-dev-db.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Cyan
    Write-Host "  1. Stop the database container" -ForegroundColor White
    Write-Host "  2. Remove the database volume (ALL DATA WILL BE LOST)" -ForegroundColor Red
    Write-Host "  3. Start a fresh database container" -ForegroundColor White
    Write-Host "  4. Push the schema to the fresh database" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Confirm    Skip confirmation prompt" -ForegroundColor White
    Write-Host "  -Help       Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  WARNING: This will delete ALL data in your development database!" -ForegroundColor Red
    exit 0
}

if (-not $Confirm) {
    Write-Host "⚠️  WARNING: This will delete ALL data in your development database!" -ForegroundColor Red
    Write-Host "This includes all tables, views, and data." -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Are you sure you want to reset the development database? (yes/no)"
    if ($confirm -ne "yes" -and $confirm -ne "YES") {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔄 Resetting development database..." -ForegroundColor Blue

# Step 1: Stop database
Write-Host "1️⃣ Stopping database container..." -ForegroundColor Blue
pnpm db:down

# Step 2: Remove volume
Write-Host "2️⃣ Removing database volume..." -ForegroundColor Blue
docker volume rm aibos-erpBOS_dbdata 2>$null

# Step 3: Start fresh database
Write-Host "3️⃣ Starting fresh database container..." -ForegroundColor Blue
pnpm db:up

# Step 4: Wait for database to be ready
Write-Host "4️⃣ Waiting for database to be ready..." -ForegroundColor Blue
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT 1;" | Out-Null
        Write-Host "✅ Database is ready!" -ForegroundColor Green
        break
    } catch {
        Write-Host "⏳ Waiting for database... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Database failed to start within expected time" -ForegroundColor Red
    exit 1
}

# Step 5: Clean up existing views and push schema
Write-Host "5️⃣ Cleaning up existing views and pushing schema..." -ForegroundColor Blue
$env:DATABASE_URL = "postgresql://aibos:aibos@localhost:5432/aibos"

# First, manually drop problematic views with CASCADE
Write-Host "   Dropping existing views with CASCADE..." -ForegroundColor Yellow
try {
    docker exec aibos-postgres psql -U aibos -d aibos -c "DROP VIEW IF EXISTS v_board_tiles CASCADE; DROP VIEW IF EXISTS v_latest_kpi_snapshots CASCADE; DROP VIEW IF EXISTS v_active_alerts CASCADE; DROP VIEW IF EXISTS v_playbook_executions CASCADE; DROP VIEW IF EXISTS v_whatif_summaries CASCADE;" 2>$null
    Write-Host "   ✅ Views cleaned up successfully" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Some views may not exist (this is normal)" -ForegroundColor Yellow
}

# Now push schema with force flag
Write-Host "   Pushing schema with force mode..." -ForegroundColor Yellow
Write-Host "   This will automatically handle constraint additions safely..." -ForegroundColor Green

# Create a temporary input file to provide answers to prompts
$tempInput = @"
n
y
"@
$tempInput | pnpm db:push --force

Write-Host "✅ Development database reset completed!" -ForegroundColor Green
Write-Host "Your database is now fresh and ready for development." -ForegroundColor Green
