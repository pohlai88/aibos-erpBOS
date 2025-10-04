# M25.1 & M25.2 Migration Script (PowerShell)
# Run migrations in order for Revenue Recognition and Contract Modifications

Write-Host "🚀 Starting M25.1 & M25.2 Migration Process" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Set database connection (adjust as needed)
$DB_URL = if ($env:DB_URL) { $env:DB_URL } else { "postgresql://user:password@localhost:5432/aibos_erp" }

# M25.1 Revenue Recognition Migrations (0161-0172)
Write-Host "📋 Running M25.1 Revenue Recognition Migrations..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor Cyan

$m25_1_migrations = @(
    "0161_rev_pob_core.sql",
    "0162_rev_schedule.sql", 
    "0163_rev_events.sql",
    "0164_rev_policy_map.sql",
    "0165_rev_rpo_snapshot.sql",
    "0166_rev_post_lock.sql",
    "0167_rev_perf_idx.sql",
    "0168_rev_usage_bridge.sql",
    "0169_rev_artifacts.sql",
    "0170_rev_rbac_caps.sql",
    "0171_rev_views.sql",
    "0172_rev_seed_policy.sql"
)

foreach ($migration in $m25_1_migrations) {
    Write-Host "Running $migration..." -ForegroundColor Yellow
    psql -d $DB_URL -f "packages/adapters/db/migrations/$migration"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error running $migration" -ForegroundColor Red
        exit 1
    }
}

# M25.2 Contract Modifications Migrations (0173-0181)
Write-Host ""
Write-Host "🔧 Running M25.2 Contract Modifications Migrations..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

$m25_2_migrations = @(
    "0173_rev_change_order.sql",
    "0174_rev_vc_estimate.sql",
    "0175_rev_txn_price_revision.sql",
    "0176_rev_schedule_revision.sql",
    "0177_rev_rec_catchup.sql",
    "0178_rev_disclosures.sql",
    "0179_rev_perf_idx2.sql",
    "0180_rev_lock_ext.sql",
    "0181_rev_rpo_remeasure.sql"
)

foreach ($migration in $m25_2_migrations) {
    Write-Host "Running $migration..." -ForegroundColor Yellow
    psql -d $DB_URL -f "packages/adapters/db/migrations/$migration"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error running $migration" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Migration Process Complete!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "M25.1 Revenue Recognition: 12 tables created" -ForegroundColor White
Write-Host "M25.2 Contract Modifications: 9 tables created" -ForegroundColor White
Write-Host "Total: 21 new tables with indexes and constraints" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy services and API routes" -ForegroundColor White
Write-Host "2. Configure RBAC capabilities" -ForegroundColor White
Write-Host "3. Set up cron jobs" -ForegroundColor White
Write-Host "4. Test integration" -ForegroundColor White
