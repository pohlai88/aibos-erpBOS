# PowerShell script to set up database for development and testing
# This script ensures the database is properly initialized with all migrations

param(
    [string]$Environment = "development"
)

Write-Host "Setting up database for $Environment..." -ForegroundColor Green

# Set database URL based on environment
if ($Environment -eq "test") {
    $env:DATABASE_URL = "postgresql://aibos:aibos@localhost:5432/aibos_test"
} else {
    $env:DATABASE_URL = "postgresql://aibos:aibos@localhost:5432/aibos"
}

Write-Host "Using DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Yellow

# Check if database is running
Write-Host "Checking database connection..." -ForegroundColor Blue
try {
    $result = docker exec aibos-postgres pg_isready -U aibos -d aibos
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Database is not ready. Starting database..." -ForegroundColor Red
        docker compose up -d db
        Start-Sleep -Seconds 10
    }
} catch {
    Write-Host "Database container not found. Starting database..." -ForegroundColor Red
    docker compose up -d db
    Start-Sleep -Seconds 10
}

# Build database packages first
Write-Host "Building database packages..." -ForegroundColor Blue
Set-Location packages/adapters/db
pnpm run build
Set-Location ../..

# Push schema to database
Write-Host "Pushing schema to database..." -ForegroundColor Blue
pnpm run db:push

# Verify tables exist
Write-Host "Verifying database tables..." -ForegroundColor Blue
$tables = @("close_run", "close_task", "close_kpi", "flux_run", "mdna_template")
foreach ($table in $tables) {
    $check = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT 1 FROM $table LIMIT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Table $table exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Table $table missing" -ForegroundColor Red
    }
}

Write-Host "Database setup complete!" -ForegroundColor Green