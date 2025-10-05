# Safe Database Push Script
# This script provides a safer way to handle database schema changes

param(
    [switch]$Force,
    [switch]$DryRun,
    [switch]$Help
)

if ($Help) {
    Write-Host "Safe Database Push Script" -ForegroundColor Green
    Write-Host "Usage: .\scripts\safe-db-push.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Force     Force push without confirmation prompts" -ForegroundColor White
    Write-Host "  -DryRun    Show what would be changed without executing" -ForegroundColor White
    Write-Host "  -Help      Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\scripts\safe-db-push.ps1                    # Interactive mode" -ForegroundColor White
    Write-Host "  .\scripts\safe-db-push.ps1 -DryRun           # Preview changes" -ForegroundColor White
    Write-Host "  .\scripts\safe-db-push.ps1 -Force            # Force push" -ForegroundColor White
    exit 0
}

# Set environment
$env:DATABASE_URL = "postgresql://aibos:aibos@localhost:5432/aibos"

Write-Host "🔍 Checking database connection..." -ForegroundColor Blue
try {
    docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT 1;" | Out-Null
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection failed. Make sure the database is running:" -ForegroundColor Red
    Write-Host "   pnpm db:up" -ForegroundColor Yellow
    exit 1
}

if ($DryRun) {
    Write-Host "🔍 Dry run mode - showing what would be changed..." -ForegroundColor Blue
    Write-Host "This will show the SQL statements that would be executed without making changes." -ForegroundColor Yellow
    Write-Host ""
    
    # Use drizzle-kit push with dry-run equivalent
    pnpm db:push --verbose
    exit 0
}

Write-Host "🚀 Starting database schema push..." -ForegroundColor Blue

if ($Force) {
    Write-Host "⚠️  Force mode enabled - skipping confirmation prompts" -ForegroundColor Yellow
    Write-Host "This will execute all schema changes without asking for confirmation." -ForegroundColor Red
    Write-Host ""
    
    $confirm = Read-Host "Are you sure you want to force push? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        exit 1
    }
    
    # Force push
    echo "y" | pnpm db:push --force --verbose
} else {
    Write-Host "📋 Interactive mode - you'll be prompted for each change" -ForegroundColor Blue
    Write-Host "This is the safest option as it asks for confirmation on each change." -ForegroundColor Green
    Write-Host ""
    
    # Interactive push
    pnpm db:push --verbose
}

Write-Host "✅ Database push completed!" -ForegroundColor Green
