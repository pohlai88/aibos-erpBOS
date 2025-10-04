# M26.7: Attestations Portal - Seed Data Script
# This script seeds the attestations portal with sample programs, templates, and assignments

Write-Host "🌱 Starting M26.7 Attestations Portal seed data..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if pnpm is available
if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm is not installed. Please install pnpm first." -ForegroundColor Red
    exit 1
}

# Build the contracts package first
Write-Host "📦 Building contracts package..." -ForegroundColor Yellow
pnpm --filter @aibos/contracts build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build contracts package" -ForegroundColor Red
    exit 1
}

# Build the db-adapter package
Write-Host "📦 Building db-adapter package..." -ForegroundColor Yellow
pnpm --filter @aibos/db-adapter build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build db-adapter package" -ForegroundColor Red
    exit 1
}

# Run the seed script
Write-Host "🌱 Running attestations seed script..." -ForegroundColor Yellow
npx tsx scripts/seed-attestations.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 M26.7 Attestations Portal seed data completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Issue a campaign using the API:" -ForegroundColor White
    Write-Host "     POST /api/attest/campaigns" -ForegroundColor Gray
    Write-Host "     {`"programCode`": `"302-QUARTERLY`", `"templateCode`": `"302-v1`", `"period`": `"2025-Q1`", `"dueAt`": `"2025-04-15T16:00:00Z`"}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Submit tasks using the API:" -ForegroundColor White
    Write-Host "     POST /api/attest/tasks/submit" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Approve and sign packs:" -ForegroundColor White
    Write-Host "     POST /api/attest/tasks/approve" -ForegroundColor Gray
    Write-Host "     POST /api/attest/packs/sign" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  4. Download attestation packs:" -ForegroundColor White
    Write-Host "     GET /api/attest/packs/download?taskId=<task_id>&format=json" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to seed attestations data" -ForegroundColor Red
    exit 1
}
