# Database Status Web Dashboard Generator
# Clean HTML with NO Unicode characters - pure ASCII

param(
    [switch]$Help,
    [switch]$Open
)

if ($Help) {
    Write-Host "Database Status Web Dashboard Generator" -ForegroundColor Green
    Write-Host "Usage: .\scripts\db-status-web.ps1 [-Open]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Cyan
    Write-Host "  - Generate a clean HTML dashboard with Mermaid diagrams" -ForegroundColor White
    Write-Host "  - Show database schema relationships visually" -ForegroundColor White
    Write-Host "  - Provide clickable action buttons" -ForegroundColor White
    Write-Host "  - Open in browser automatically (with -Open flag)" -ForegroundColor White
    exit 0
}

# Set environment
$env:DATABASE_URL = "postgresql://aibos:aibos@localhost:5432/aibos"

Write-Host "Generating Clean Database Status Dashboard..." -ForegroundColor Blue

# Check if database is running
$dbRunning = $false
try {
    docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT 1;" | Out-Null
    $dbRunning = $true
} catch {
    $dbRunning = $false
}

# Count migration files
$migrationFiles = Get-ChildItem -Path "packages/adapters/db/migrations" -Filter "*.sql" | Where-Object { $_.Name -notlike "meta*" }
$totalMigrations = $migrationFiles.Count

# Check migration tracking
$hasMigrationTable = $false
$appliedCount = 0
if ($dbRunning) {
    try {
        $migrationTable = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%drizzle%';" 2>$null
        if ($migrationTable -match "__drizzle_migrations") {
            $hasMigrationTable = $true
            $appliedResult = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT COUNT(*) as applied FROM __drizzle_migrations;" 2>$null
            $appliedCount = ($appliedResult -split '\s+')[3]
        }
    } catch {
        $hasMigrationTable = $false
    }
}

# Check database tables
$tableCount = 0
$keyTablesStatus = @{}
if ($dbRunning) {
    try {
        $tableCountResult = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
        $tableCount = ($tableCountResult -split '\s+')[3]
        
        # Check key tables
        $keyTables = @("company", "account", "journal", "playbook_action")
        foreach ($table in $keyTables) {
            $exists = docker exec aibos-postgres psql -U aibos -d aibos -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>$null
            $keyTablesStatus[$table] = ($exists -match "t")
        }
    } catch {
        # Handle errors silently
    }
}

# Determine status and action needed
$statusLevel = "good"
$statusText = "GOOD"
$statusTitle = "Everything Looks Good!"
$statusDescription = "You are in perfect development mode. Continue with your work!"
$quickAction = "pnpm db:reset -Confirm"
$quickActionNote = "Fresh database for development"

# Check if we have unapplied migrations that could cause issues
if ($totalMigrations -gt 0 -and $appliedCount -eq 0) {
    $statusLevel = "warning"
    $statusText = "WARN"
    $statusTitle = "Schema Out of Sync!"
    $statusDescription = "You have $totalMigrations migration files but 0 are applied. This causes TypeScript errors."
    $quickAction = "pnpm db:reset -Confirm"
    $quickActionNote = "Reset database to match current schema (fixes TypeScript errors)"
}

# Check if database is not running
if (-not $dbRunning) {
    $statusLevel = "error"
    $statusText = "ERROR"
    $statusTitle = "Database Not Running!"
    $statusDescription = "Your database is not running. Start it to begin development."
    $quickAction = "pnpm db:up"
    $quickActionNote = "Start your database first"
}

# Generate HTML
$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Status Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 1.5rem;
            font-weight: 400;
            line-height: 1.6;
            color: #1f2937;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }

        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            letter-spacing: -0.025em;
        }

        .header p {
            font-size: 1.25rem;
            opacity: 0.9;
            font-weight: 400;
        }

        .content {
            padding: 2rem;
        }

        .quick-status {
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border: 2px solid;
        }

        .quick-status.good {
            background: #ecfdf5;
            border-color: #10b981;
        }

        .quick-status.warning {
            background: #fef3c7;
            border-color: #f59e0b;
        }

        .quick-status.error {
            background: #fef2f2;
            border-color: #ef4444;
        }

        .status-icon {
            font-size: 1.5rem;
            font-weight: bold;
            margin-right: 1rem;
            display: inline-block;
            width: 80px;
            text-align: center;
            padding: 0.5rem;
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.2);
        }

        .status-icon.good {
            color: #10b981;
        }

        .status-icon.warning {
            color: #f59e0b;
        }

        .status-icon.error {
            color: #ef4444;
        }

        .status-title {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .status-title.good {
            color: #065f46;
        }

        .status-title.warning {
            color: #92400e;
        }

        .status-title.error {
            color: #991b1b;
        }

        .status-description {
            margin: 0.25rem 0 0 0;
            font-size: 1rem;
        }

        .status-description.good {
            color: #047857;
        }

        .status-description.warning {
            color: #b45309;
        }

        .status-description.error {
            color: #dc2626;
        }

        .quick-action {
            background: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            border: 1px solid;
        }

        .quick-action.good {
            border-color: #a7f3d0;
        }

        .quick-action.warning {
            border-color: #fcd34d;
        }

        .quick-action.error {
            border-color: #fecaca;
        }

        .quick-action-label {
            font-weight: 600;
        }

        .quick-action-label.good {
            color: #065f46;
        }

        .quick-action-label.warning {
            color: #92400e;
        }

        .quick-action-label.error {
            color: #991b1b;
        }

        .quick-action-code {
            background: #f9fafb;
            color: #374151;
            padding: 0.75rem;
            border-radius: 0.5rem;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
            font-size: 1rem;
            font-weight: 600;
            margin: 0.75rem 0;
            display: block;
            border: 1px solid #e5e7eb;
        }

        .quick-action-code.good {
            background: #f0fdf4;
            color: #166534;
        }

        .quick-action-code.warning {
            background: #fffbeb;
            color: #92400e;
        }

        .quick-action-code.error {
            background: #fef2f2;
            color: #991b1b;
        }

        /* Command Container */
        .command-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 0.75rem 1rem;
            margin: 0.5rem 0;
        }

        .command-container .quick-action-code {
            flex: 1;
            background: transparent;
            border: none;
            padding: 0;
            margin: 0;
            font-size: 0.9rem;
        }

        .copy-btn {
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            min-width: 32px;
            height: 32px;
        }

        .copy-btn:hover {
            background: #0056b3;
            transform: scale(1.05);
        }

        .copy-btn:active {
            transform: scale(0.95);
        }

        .copy-btn svg {
            width: 16px;
            height: 16px;
        }

        .quick-action-note {
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }

        .quick-action-note.good {
            color: #047857;
        }

        .quick-action-note.warning {
            color: #b45309;
        }

        .quick-action-note.error {
            color: #dc2626;
        }

        /* Problem Section */
        .problem-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .problem-section.warning {
            background: #fff3cd;
            border-color: #ffeaa7;
        }

        .problem-section.error {
            background: #f8d7da;
            border-color: #f5c6cb;
        }

        .problem-section h3 {
            color: #856404;
            margin-bottom: 1rem;
            font-size: 1.2rem;
            font-weight: 600;
        }

        .problem-section.error h3 {
            color: #721c24;
        }

        .problem-content p {
            margin-bottom: 0.75rem;
            line-height: 1.5;
        }

        .problem-content p:last-child {
            margin-bottom: 0;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .status-card {
            background: white;
            border-radius: 0.75rem;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }

        .status-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
        }

        .status-card.success {
            border-left: 4px solid #10b981;
        }

        .status-card.warning {
            border-left: 4px solid #f59e0b;
        }

        .status-card.danger {
            border-left: 4px solid #ef4444;
        }

        .status-card h3 {
            color: #1f2937;
            margin-bottom: 1rem;
            font-size: 1.125rem;
            font-weight: 600;
            letter-spacing: -0.025em;
        }

        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
        }

        .status-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .status-label {
            font-weight: 500;
            color: #6b7280;
            font-size: 0.875rem;
        }

        .status-value {
            font-weight: 600;
            color: #1f2937;
            font-size: 0.875rem;
        }

        .status-value.success {
            color: #10b981;
        }

        .status-value.danger {
            color: #ef4444;
        }

        .status-value.warning {
            color: #f59e0b;
        }

        .actions {
            background: #f9fafb;
            border-radius: 0.75rem;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e5e7eb;
        }

        .actions h3 {
            color: #1f2937;
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            font-weight: 600;
            letter-spacing: -0.025em;
        }

        .action-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .action-btn {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            padding: 0.875rem 1.25rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            letter-spacing: 0.025em;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .action-btn.success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .action-btn.warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .action-btn.danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .section {
            background: white;
            border-radius: 0.75rem;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .section h3 {
            color: #1f2937;
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            font-weight: 600;
            letter-spacing: -0.025em;
        }

        .issues-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }

        .issue-card {
            border-radius: 0.5rem;
            padding: 1rem;
            border: 1px solid;
        }

        .issue-card.error {
            background: #fef2f2;
            border-color: #fecaca;
        }

        .issue-card.warning {
            background: #fef3c7;
            border-color: #fcd34d;
        }

        .issue-card.success {
            background: #ecfdf5;
            border-color: #a7f3d0;
        }

        .issue-card h4 {
            margin-bottom: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
        }

        .issue-card.error h4 {
            color: #991b1b;
        }

        .issue-card.warning h4 {
            color: #92400e;
        }

        .issue-card.success h4 {
            color: #065f46;
        }

        .issue-card p {
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
        }

        .issue-card.error p {
            color: #dc2626;
        }

        .issue-card.warning p {
            color: #b45309;
        }

        .issue-card.success p {
            color: #047857;
        }

        .issue-card code {
            background: #f9fafb;
            color: #374151;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
        }

        .issue-card.error code {
            background: #fef2f2;
            color: #991b1b;
        }

        .issue-card.warning code {
            background: #fffbeb;
            color: #92400e;
        }

        .issue-card.success code {
            background: #f0fdf4;
            color: #166534;
        }

        .phase-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }

        .phase-card {
            background: white;
            border-radius: 0.75rem;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }

        .phase-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .phase-card.development {
            border-left: 4px solid #10b981;
        }

        .phase-card.production {
            border-left: 4px solid #ef4444;
        }

        .phase-card h4 {
            margin-bottom: 1rem;
            font-size: 1.125rem;
            font-weight: 600;
            letter-spacing: -0.025em;
        }

        .phase-card.development h4 {
            color: #10b981;
        }

        .phase-card.production h4 {
            color: #ef4444;
        }

        .command-block {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin: 0.5rem 0;
            border: 1px solid #e5e7eb;
        }

        .command-block code {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            background: none;
            padding: 0;
        }

        .command-block small {
            color: #6b7280;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
        }

        .benefit-box {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            border: 1px solid #e5e7eb;
        }

        .benefit-box.development {
            background: #ecfdf5;
            border-color: #a7f3d0;
        }

        .benefit-box.production {
            background: #fef2f2;
            border-color: #fecaca;
        }

        .mermaid {
            background: white;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 1rem 0;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            overflow-x: auto;
        }

        .mermaid svg {
            max-width: 100%;
            height: auto;
        }

        .footer {
            background: #1f2937;
            color: white;
            padding: 2rem;
            text-align: center;
            font-weight: 400;
        }

        .footer a {
            color: #60a5fa;
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .footer p {
            margin-bottom: 0.5rem;
        }

        .footer p:last-child {
            margin-bottom: 0;
            color: #9ca3af;
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .header {
                padding: 2rem 1rem;
            }

            .header h1 {
                font-size: 2rem;
            }

            .content {
                padding: 1rem;
            }

            .status-grid {
                grid-template-columns: 1fr;
            }

            .action-buttons {
                grid-template-columns: 1fr;
            }

            .issues-grid {
                grid-template-columns: 1fr;
            }

            .phase-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Database Status Dashboard</h1>
            <p>Real-time database migration and schema status with visual diagrams</p>
        </div>
        
        <div class="content">
            <!-- Quick Status & Fix Section -->
            <div class="quick-status $statusLevel">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <div class="status-icon $statusLevel">$statusText</div>
                    <div>
                        <h2 class="status-title $statusLevel">$statusTitle</h2>
                        <p class="status-description $statusLevel">$statusDescription</p>
                    </div>
                </div>
                <div class="quick-action $statusLevel">
                    <div class="quick-action-label $statusLevel">Quick Action:</div>
                    <div class="command-container">
                        <code class="quick-action-code $statusLevel" id="quickCommand">$quickAction</code>
                        <button class="copy-btn" onclick="copyCommand()" title="Copy to clipboard">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="quick-action-note $statusLevel">$quickActionNote</div>
                </div>
            </div>

            <!-- What's Wrong? Section (only show if there's an issue) -->
            $(if ($statusLevel -ne "good") {
                $problemContent = ""
                if ($statusLevel -eq "warning") {
                    $problemContent = @"
                    <p><strong>Problem:</strong> Your database schema is out of sync with your code.</p>
                    <p><strong>Impact:</strong> This causes TypeScript errors because your code expects database columns that don't exist yet.</p>
                    <p><strong>Solution:</strong> Run the command above to fix it immediately.</p>
"@
                } elseif ($statusLevel -eq "error") {
                    $problemContent = @"
                    <p><strong>Problem:</strong> Your database is not running.</p>
                    <p><strong>Impact:</strong> You cannot develop or test your application.</p>
                    <p><strong>Solution:</strong> Start your database first using the command above.</p>
"@
                }
                @"
            <div class="problem-section $statusLevel">
                <h3>What's Wrong?</h3>
                <div class="problem-content">
$problemContent
                </div>
            </div>
"@
            })

            <div class="status-grid">
                <div class="status-card $(if ($dbRunning) { 'success' } else { 'danger' })">
                    <h3>Database Connection</h3>
                    <div class="status-item">
                        <span class="status-label">Status</span>
                        <span class="status-value $(if ($dbRunning) { 'success' } else { 'danger' })">$(if ($dbRunning) { 'Connected' } else { 'Disconnected' })</span>
                    </div>
                </div>
                
                <div class="status-card $(if ($isDevelopmentMode) { 'warning' } else { 'success' })">
                    <h3>Migration Status</h3>
                    <div class="status-item">
                        <span class="status-label">Approach</span>
                        <span class="status-value $(if ($isDevelopmentMode) { 'warning' } else { 'success' })">$currentApproach</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Applied</span>
                        <span class="status-value">$appliedCount / $totalMigrations</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Total Files</span>
                        <span class="status-value">$totalMigrations</span>
                    </div>
                </div>
                
                <div class="status-card success">
                    <h3>Database Schema</h3>
                    <div class="status-item">
                        <span class="status-label">Total Tables</span>
                        <span class="status-value">$tableCount</span>
                    </div>
                    $(foreach ($table in $keyTablesStatus.Keys) {
                        $status = if ($keyTablesStatus[$table]) { 'success' } else { 'danger' }
                        $icon = if ($keyTablesStatus[$table]) { 'EXISTS' } else { 'MISSING' }
                        "<div class='status-item'><span class='status-label'>$table</span><span class='status-value $status'>$icon</span></div>"
                    })
                </div>
            </div>
            
            <div class="actions">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button class="action-btn success" onclick="runCommand('db:reset -Confirm')">Reset Database</button>
                    <button class="action-btn" onclick="runCommand('db:status')">Check Status</button>
                    <button class="action-btn warning" onclick="runCommand('db:generate')">Generate Migration</button>
                    <button class="action-btn danger" onclick="runCommand('db:migrate')">Run Migrations</button>
                    <button class="action-btn" onclick="runCommand('db:studio')">Open Studio</button>
                    <button class="action-btn" onclick="runCommand('db:up')">Start Database</button>
                </div>
            </div>
            
            <div class="section">
                <h3>Common Issues & Quick Fixes</h3>
                <div class="issues-grid">
                    <div class="issue-card error">
                        <h4>[ERROR] Database Won't Start</h4>
                        <p>Port 5432 already in use</p>
                        <code>pnpm db:down && pnpm db:up</code>
                    </div>
                    <div class="issue-card warning">
                        <h4>[WARNING] Schema Out of Sync</h4>
                        <p>Database doesn't match code</p>
                        <code>pnpm db:reset -Confirm</code>
                    </div>
                    <div class="issue-card warning">
                        <h4>[WARNING] Migration Conflicts</h4>
                        <p>Multiple migration files</p>
                        <code>pnpm db:reset -Confirm</code>
                    </div>
                    <div class="issue-card success">
                        <h4>[SUCCESS] Everything Works</h4>
                        <p>Continue development</p>
                        <code>pnpm db:reset -Confirm</code>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>Phase-Based Guidelines</h3>
                <div class="phase-grid">
                    <div class="phase-card development">
                        <h4>Development Phase</h4>
                        <div style="margin-bottom: 1rem;">
                            <strong>Current Status:</strong> $(if ($isDevelopmentMode) { '[OK] You are in Development Mode' } else { '[SWITCH] Switch to Development Mode' })
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <strong>Daily Commands:</strong>
                            <div class="command-block">
                                <code>pnpm db:reset -Confirm</code>
                                <small>Fresh database with current schema (fast)</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <strong>Before Committing:</strong>
                            <div class="command-block">
                                <code>pnpm db:generate</code>
                                <small>Create migration file for team</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <strong>Check Status:</strong>
                            <div class="command-block">
                                <code>pnpm db:dashboard</code>
                                <small>Visual status with diagrams</small>
                            </div>
                        </div>
                        <div class="benefit-box development">
                            <strong>[BENEFITS] Benefits:</strong> Fast iterations, current schema, skip $totalMigrations migration files
                        </div>
                    </div>
                    
                    <div class="phase-card production">
                        <h4>Production Phase</h4>
                        <div style="margin-bottom: 1rem;">
                            <strong>Current Status:</strong> $(if ($isDevelopmentMode) { '[SWITCH] You are in Development Mode' } else { '[OK] You are in Production Mode' })
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <strong>Deploy Commands:</strong>
                            <div class="command-block">
                                <code>pnpm db:migrate</code>
                                <small>Run all $totalMigrations migration files</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <strong>Check Status:</strong>
                            <div class="command-block">
                                <code>pnpm db:dashboard</code>
                                <small>Monitor migration progress</small>
                            </div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <strong>Data Inspection:</strong>
                            <div class="command-block">
                                <code>pnpm db:studio</code>
                                <small>Database GUI for production data</small>
                            </div>
                        </div>
                        <div class="benefit-box production">
                            <strong>[IMPORTANT] Important:</strong> Never use db:push or db:reset in production
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>Database Schema Overview</h3>
                <div class="mermaid">
erDiagram
    COMPANY ||--o{ ACCOUNT : "has"
    COMPANY ||--o{ JOURNAL : "posts"
    COMPANY ||--o{ PLAYBOOK_ACTION : "uses"
    
    JOURNAL ||--o{ JOURNAL_LINE : "contains"
    ACCOUNT ||--o{ JOURNAL_LINE : "references"
    
    COMPANY {
        string id PK
        string code UK
        string name
        string currency
    }
    
    ACCOUNT {
        string id PK
        string company_id FK
        string code
        string name
        string type
        string normal_balance
    }
    
    JOURNAL {
        string id PK
        string company_id FK
        timestamp posting_date
        string currency
        string source_doctype
        string source_id
        string idempotency_key UK
    }
    
    JOURNAL_LINE {
        string id PK
        string journal_id FK
        string account_code
        string dc
        decimal amount
        string currency
    }
    
    PLAYBOOK_ACTION {
        string id PK
        string action_id UK
        string name
        string description
        boolean enabled
    }
                </div>
            </div>
            
            <div class="section">
                <h3>Development Workflow Process</h3>
                <div class="mermaid">
flowchart TD
    A[Start Development] --> B{Database Running?}
    B -->|No| C[pnpm db:up]
    B -->|Yes| D[Make Schema Changes]
    C --> D
    D --> E[Build Schema]
    E --> F[pnpm db:reset -Confirm]
    F --> G[Test Changes]
    G --> H{Ready to Commit?}
    H -->|No| D
    H -->|Yes| I[pnpm db:generate]
    I --> J[Commit Changes]
    J --> K[Deploy to Production]
    K --> L[pnpm db:migrate]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style I fill:#fff3e0
    style L fill:#ffebee
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Complete Guide: DATABASE_WORKFLOW.md | Quick Reference: DB_COMMANDS.md</p>
            <p>Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <script>
        // Initialize Mermaid
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'base',
            themeVariables: {
                primaryColor: '#3b82f6',
                primaryTextColor: '#1f2937',
                primaryBorderColor: '#1d4ed8',
                lineColor: '#6b7280',
                sectionBkgColor: '#f9fafb',
                altSectionBkgColor: '#f3f4f6',
                gridColor: '#e5e7eb',
                textColor: '#374151'
            }
        });
        
        // Command execution function
        function runCommand(command) {
            // Copy command to clipboard
            navigator.clipboard.writeText('pnpm ' + command).then(function() {
                alert('Command copied to clipboard: pnpm ' + command);
            });
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            location.reload();
        }, 30000);

        // Copy command function
        function copyCommand() {
            const commandElement = document.getElementById('quickCommand');
            const commandText = commandElement.textContent;
            
            navigator.clipboard.writeText(commandText).then(function() {
                // Visual feedback
                const btn = document.querySelector('.copy-btn');
                const originalHTML = btn.innerHTML;
                
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
                btn.style.background = '#28a745';
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '#007bff';
                }, 1500);
            }).catch(function(err) {
                console.error('Failed to copy: ', err);
                alert('Failed to copy command. Please copy manually.');
            });
        }
    </script>
</body>
</html>
"@

# Save HTML file
$htmlFile = "database-status.html"
$html | Out-File -FilePath $htmlFile -Encoding UTF8

Write-Host "Clean HTML dashboard generated: $htmlFile" -ForegroundColor Green

if ($Open) {
    Write-Host "Opening dashboard in browser..." -ForegroundColor Blue
    Start-Process $htmlFile
} else {
    Write-Host "To open dashboard: Start-Process $htmlFile" -ForegroundColor Yellow
    Write-Host "Or run: .\scripts\db-status-web.ps1 -Open" -ForegroundColor Yellow
}