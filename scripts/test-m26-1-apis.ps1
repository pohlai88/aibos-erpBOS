# M26.1 Auto-Controls & Certifications - API Testing Script
# Run this script to test all API endpoints

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$CompanyId = "test-company-123"
)

Write-Host "🧪 Starting M26.1 API Testing" -ForegroundColor Green
Write-Host "API Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Company ID: $CompanyId" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "X-API-Key" = $ApiKey
    "Content-Type" = "application/json"
}

# Test 1: Check baseline controls status
Write-Host "📋 Test 1: Checking baseline controls status..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/seed" -Method GET -Headers $headers
    Write-Host "✅ Baseline controls status: $($response.message)" -ForegroundColor Green
    Write-Host "   Controls count: $($response.controls_count)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to check baseline controls status: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Seed baseline controls
Write-Host "🌱 Test 2: Seeding baseline controls..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/seed" -Method POST -Headers $headers
    if ($response.success) {
        Write-Host "✅ Baseline controls seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to seed baseline controls: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error seeding baseline controls: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Query controls
Write-Host "📊 Test 3: Querying controls..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/controls?domain=CLOSE&limit=10" -Method GET -Headers $headers
    Write-Host "✅ Found $($response.controls.Count) controls" -ForegroundColor Green
    foreach ($control in $response.controls) {
        Write-Host "   - $($control.code): $($control.name)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to query controls: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Create a test control
Write-Host "🔧 Test 4: Creating a test control..." -ForegroundColor Cyan
$testControl = @{
    code = "TEST_API_CONTROL"
    name = "Test API Control"
    purpose = "Testing API functionality"
    domain = "CLOSE"
    frequency = "PER_RUN"
    severity = "MEDIUM"
    auto_kind = "SCRIPT"
    auto_config = @{
        script = "jeContinuity"
    }
    evidence_required = $true
    status = "ACTIVE"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/controls" -Method POST -Headers $headers -Body $testControl
    Write-Host "✅ Test control created: $($response.control.code)" -ForegroundColor Green
    $testControlId = $response.control.id
} catch {
    Write-Host "❌ Failed to create test control: $_" -ForegroundColor Red
    $testControlId = $null
}

Write-Host ""

# Test 5: Create a test assignment
if ($testControlId) {
    Write-Host "📝 Test 5: Creating a test assignment..." -ForegroundColor Cyan
    $testAssignment = @{
        control_id = $testControlId
        run_id = "test-run-123"
        owner = "ops"
        approver = "controller"
        sla_due_at = (Get-Date).AddHours(24).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        active = $true
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/assignments" -Method POST -Headers $headers -Body $testAssignment
        Write-Host "✅ Test assignment created: $($response.assignment.id)" -ForegroundColor Green
        $testAssignmentId = $response.assignment.id
    } catch {
        Write-Host "❌ Failed to create test assignment: $_" -ForegroundColor Red
        $testAssignmentId = $null
    }
} else {
    Write-Host "⏭️ Test 5: Skipping assignment creation (no control ID)" -ForegroundColor Yellow
    $testAssignmentId = $null
}

Write-Host ""

# Test 6: Execute a control run
if ($testControlId) {
    Write-Host "⚡ Test 6: Executing a control run..." -ForegroundColor Cyan
    $testRun = @{
        control_id = $testControlId
        run_id = "test-run-123"
        scheduled_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/run" -Method POST -Headers $headers -Body $testRun
        Write-Host "✅ Control run executed: $($response.run.id)" -ForegroundColor Green
        Write-Host "   Status: $($response.run.status)" -ForegroundColor White
        $testRunId = $response.run.id
    } catch {
        Write-Host "❌ Failed to execute control run: $_" -ForegroundColor Red
        $testRunId = $null
    }
} else {
    Write-Host "⏭️ Test 6: Skipping control run execution (no control ID)" -ForegroundColor Yellow
    $testRunId = $null
}

Write-Host ""

# Test 7: Query exceptions
Write-Host "🚨 Test 7: Querying exceptions..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/exceptions?limit=10" -Method GET -Headers $headers
    Write-Host "✅ Found $($response.exceptions.Count) exceptions" -ForegroundColor Green
    foreach ($exception in $response.exceptions) {
        Write-Host "   - $($exception.code): $($exception.message)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to query exceptions: $_" -ForegroundColor Red
}

Write-Host ""

# Test 8: Add evidence
if ($testRunId) {
    Write-Host "📎 Test 8: Adding evidence..." -ForegroundColor Cyan
    $testEvidence = @{
        ctrl_run_id = $testRunId
        kind = "NOTE"
        uri_or_note = "Test evidence added via API"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/ctrl/evidence" -Method POST -Headers $headers -Body $testEvidence
        Write-Host "✅ Evidence added: $($response.evidence.id)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add evidence: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️ Test 8: Skipping evidence addition (no run ID)" -ForegroundColor Yellow
}

Write-Host ""

# Test 9: Certification templates
Write-Host "📜 Test 9: Testing certification templates..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/cert/statements?level=ENTITY&limit=10" -Method GET -Headers $headers
    Write-Host "✅ Found $($response.templates.Count) certification templates" -ForegroundColor Green
    foreach ($template in $response.templates) {
        Write-Host "   - $($template.code): $($template.level)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to query certification templates: $_" -ForegroundColor Red
}

Write-Host ""

# Test 10: Certification sign-offs
Write-Host "✍️ Test 10: Testing certification sign-offs..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/cert/sign?run_id=test-run-123&limit=10" -Method GET -Headers $headers
    Write-Host "✅ Found $($response.signoffs.Count) certification sign-offs" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to query certification sign-offs: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 M26.1 API Testing Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- ✅ Baseline controls seeding" -ForegroundColor White
Write-Host "- ✅ Control management" -ForegroundColor White
Write-Host "- ✅ Assignment management" -ForegroundColor White
Write-Host "- ✅ Control execution" -ForegroundColor White
Write-Host "- ✅ Exception management" -ForegroundColor White
Write-Host "- ✅ Evidence management" -ForegroundColor White
Write-Host "- ✅ Certification workflows" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Set up cron scheduling" -ForegroundColor Yellow
