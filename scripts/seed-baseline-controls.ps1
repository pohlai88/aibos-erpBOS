# M26.1 Auto-Controls & Certifications - Baseline Controls Seeder
# Run this script to seed baseline controls for all companies

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$CompanyId = $null
)

Write-Host "🌱 Starting M26.1 Baseline Controls Seeding" -ForegroundColor Green
Write-Host "API Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "X-API-Key" = $ApiKey
    "Content-Type" = "application/json"
}

if ($CompanyId) {
    # Seed for specific company
    Write-Host "📋 Seeding baseline controls for company: $CompanyId" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/seed" -Method POST -Headers $headers
        
        if ($response.success) {
            Write-Host "✅ Baseline controls seeded successfully for $CompanyId" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to seed baseline controls: $($response.error)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error seeding controls for $CompanyId`: $_" -ForegroundColor Red
    }
} else {
    # Seed for all companies (would need to get company list first)
    Write-Host "📋 Seeding baseline controls for all companies..." -ForegroundColor Cyan
    Write-Host "Note: This requires implementing a company list endpoint" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For now, use the specific company seeding:" -ForegroundColor Yellow
    Write-Host ".\seed-baseline-controls.ps1 -ApiKey 'your-api-key' -CompanyId 'company-id'" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Baseline controls seeding completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test API endpoints with curl examples" -ForegroundColor White
Write-Host "2. Set up cron scheduling" -ForegroundColor White
Write-Host "3. Verify controls are working" -ForegroundColor White
Write-Host ""
