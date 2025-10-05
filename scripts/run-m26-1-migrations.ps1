# M26.1 Auto-Controls & Certifications - Migration Runner
# Run this script to execute all migrations in sequence

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "aibos_erp"
)

Write-Host "🚀 Starting M26.1 Auto-Controls & Certifications Migration" -ForegroundColor Green
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "URL: $DatabaseUrl" -ForegroundColor Yellow
Write-Host ""

# Migration files in order
$migrations = @(
    "0200_controls_core.sql",
    "0201_controls_run.sql", 
    "0202_controls_evidence.sql",
    "0203_cert_core.sql",
    "0204_controls_views.sql",
    "0205_controls_perf_idx.sql",
    "0206_controls_rbac.sql",
    "0207_controls_seed.sql",
    "0208_controls_outbox.sql",
    "0209_fk_hardening.sql"
)

$migrationPath = "packages/adapters/db/migrations"

foreach ($migration in $migrations) {
    $filePath = Join-Path $migrationPath $migration
    
    if (Test-Path $filePath) {
        Write-Host "📄 Executing $migration..." -ForegroundColor Cyan
        
        try {
            # Execute migration using psql
            $result = psql $DatabaseUrl -f $filePath
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $migration completed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ $migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
                Write-Host "Error output: $result" -ForegroundColor Red
                throw "Migration failed: $migration"
            }
        }
        catch {
            Write-Host "❌ Error executing $migration`: $_" -ForegroundColor Red
            throw
        }
        
        Write-Host ""
    } else {
        Write-Host "❌ Migration file not found: $filePath" -ForegroundColor Red
        throw "Migration file not found: $migration"
    }
}

Write-Host "🎉 All M26.1 migrations completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Seed baseline controls for existing companies" -ForegroundColor White
Write-Host "2. Test API endpoints" -ForegroundColor White
Write-Host "3. Set up cron scheduling" -ForegroundColor White
Write-Host ""
