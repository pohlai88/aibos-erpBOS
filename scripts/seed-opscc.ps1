# M27: Ops Command Center - Seed Data Script
# PowerShell wrapper for seeding OpsCC data

Write-Host "🌱 Starting M27 Ops Command Center seed data creation..." -ForegroundColor Green

try {
    # Change to the project root directory
    Set-Location $PSScriptRoot\..
    
    # Run the TypeScript seed script
    Write-Host "📊 Running OpsCC seed script..." -ForegroundColor Yellow
    npx tsx scripts/seed-opscc.ts
    
    Write-Host "✅ M27 Ops Command Center seed data created successfully!" -ForegroundColor Green
    Write-Host "🎯 Default boards, tiles, alerts, and playbooks are now available" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Error creating OpsCC seed data: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
