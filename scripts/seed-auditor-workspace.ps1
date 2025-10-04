#!/usr/bin/env pwsh
# M26.8: Auditor Workspace - Seeding Script
# Creates sample auditors, grants, and watermark policies for testing

param(
    [string]$CompanyId = "default",
    [string]$ApiKey = "",
    [string]$BaseUrl = "http://localhost:3000"
)

if (-not $ApiKey) {
    Write-Error "API key is required. Usage: .\seed-auditor-workspace.ps1 -ApiKey 'your-api-key'"
    exit 1
}

Write-Host "🌱 Seeding Auditor Workspace for company: $CompanyId" -ForegroundColor Green

# Sample auditors
$auditors = @(
    @{
        email = "external.auditor@big4.com"
        display_name = "External Auditor - Big4"
        status = "ACTIVE"
    },
    @{
        email = "internal.audit@client.com"
        display_name = "Internal Audit Team"
        status = "ACTIVE"
    },
    @{
        email = "compliance@regulator.gov"
        display_name = "Regulatory Compliance"
        status = "ACTIVE"
    }
)

# Sample grants
$grants = @(
    @{
        auditor_email = "external.auditor@big4.com"
        scope = "ATTEST_PACK"
        object_id = "attest_pack_001"
        can_download = $false
        expires_at = "2026-03-31T23:59:59Z"
    },
    @{
        auditor_email = "external.auditor@big4.com"
        scope = "CTRL_RUN"
        object_id = "ctrl_run_001"
        can_download = $true
        expires_at = "2026-03-31T23:59:59Z"
    },
    @{
        auditor_email = "internal.audit@client.com"
        scope = "EVIDENCE"
        object_id = "evd_record_001"
        can_download = $true
        expires_at = "2026-06-30T23:59:59Z"
    }
)

# Sample watermark policy
$watermarkPolicy = @{
    text_template = "CONFIDENTIAL • {company} • {auditor_email} • {ts}"
    diagonal = $true
    opacity = 0.15
    font_size = 24
    font_color = "#FF0000"
}

# Headers
$headers = @{
    "X-API-Key" = $ApiKey
    "Content-Type" = "application/json"
}

try {
    # Create auditors
    Write-Host "📝 Creating auditors..." -ForegroundColor Yellow
    foreach ($auditor in $auditors) {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/audit/admin/auditors" -Method POST -Headers $headers -Body ($auditor | ConvertTo-Json)
        Write-Host "✅ Created auditor: $($auditor.email)" -ForegroundColor Green
    }

    # Create grants
    Write-Host "🔐 Creating grants..." -ForegroundColor Yellow
    foreach ($grant in $grants) {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/audit/admin/grants" -Method POST -Headers $headers -Body ($grant | ConvertTo-Json)
        Write-Host "✅ Created grant for $($grant.auditor_email): $($grant.scope) - $($grant.object_id)" -ForegroundColor Green
    }

    # Create watermark policy
    Write-Host "🎨 Creating watermark policy..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/audit/admin/watermark-policy" -Method POST -Headers $headers -Body ($watermarkPolicy | ConvertTo-Json)
    Write-Host "✅ Created watermark policy" -ForegroundColor Green

    # Create sample PBC requests
    Write-Host "📋 Creating sample PBC requests..." -ForegroundColor Yellow
    
    # First, get auditor ID for PBC requests
    $auditorsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/audit/admin/auditors" -Method GET -Headers $headers
    $auditorId = $auditorsResponse.auditors[0].id

    $pbcRequests = @(
        @{
            title = "Q4 2025 Attestation Pack Review"
            detail = "Please provide access to Q4 2025 attestation packs for revenue recognition controls"
            due_at = "2026-01-15T23:59:59Z"
        },
        @{
            title = "Control Testing Evidence"
            detail = "Need evidence for automated controls testing for the period ending Dec 2025"
            due_at = "2026-01-20T23:59:59Z"
        }
    )

    foreach ($request in $pbcRequests) {
        $pbcHeaders = @{
            "X-Auditor-ID" = $auditorId
            "X-Company-ID" = $CompanyId
            "Content-Type" = "application/json"
        }
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/audit/requests" -Method POST -Headers $pbcHeaders -Body ($request | ConvertTo-Json)
        Write-Host "✅ Created PBC request: $($request.title)" -ForegroundColor Green
    }

    Write-Host "🎉 Auditor Workspace seeding completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test auditor login: POST /api/audit/session/login" -ForegroundColor White
    Write-Host "2. Verify magic code: POST /api/audit/session/verify" -ForegroundColor White
    Write-Host "3. List packs: GET /api/audit/packs" -ForegroundColor White
    Write-Host "4. Check PBC requests: GET /api/audit/requests" -ForegroundColor White

} catch {
    Write-Error "❌ Seeding failed: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}
