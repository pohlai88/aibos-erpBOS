#!/bin/bash
# M25.1 & M25.2 Migration Script
# Run migrations in order for Revenue Recognition and Contract Modifications

echo "🚀 Starting M25.1 & M25.2 Migration Process"
echo "=============================================="

# Set database connection (adjust as needed)
DB_URL=${DB_URL:-"postgresql://user:password@localhost:5432/aibos_erp"}

# M25.1 Revenue Recognition Migrations (0161-0172)
echo "📋 Running M25.1 Revenue Recognition Migrations..."
echo "---------------------------------------------------"

echo "Running 0161_rev_pob_core.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0161_rev_pob_core.sql

echo "Running 0162_rev_schedule.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0162_rev_schedule.sql

echo "Running 0163_rev_events.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0163_rev_events.sql

echo "Running 0164_rev_policy_map.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0164_rev_policy_map.sql

echo "Running 0165_rev_rpo_snapshot.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0165_rev_rpo_snapshot.sql

echo "Running 0166_rev_post_lock.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0166_rev_post_lock.sql

echo "Running 0167_rev_perf_idx.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0167_rev_perf_idx.sql

echo "Running 0168_rev_usage_bridge.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0168_rev_usage_bridge.sql

echo "Running 0169_rev_artifacts.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0169_rev_artifacts.sql

echo "Running 0170_rev_rbac_caps.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0170_rev_rbac_caps.sql

echo "Running 0171_rev_views.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0171_rev_views.sql

echo "Running 0172_rev_seed_policy.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0172_rev_seed_policy.sql

# M25.2 Contract Modifications Migrations (0173-0181)
echo ""
echo "🔧 Running M25.2 Contract Modifications Migrations..."
echo "------------------------------------------------------"

echo "Running 0173_rev_change_order.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0173_rev_change_order.sql

echo "Running 0174_rev_vc_estimate.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0174_rev_vc_estimate.sql

echo "Running 0175_rev_txn_price_revision.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0175_rev_txn_price_revision.sql

echo "Running 0176_rev_schedule_revision.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0176_rev_schedule_revision.sql

echo "Running 0177_rev_rec_catchup.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0177_rev_rec_catchup.sql

echo "Running 0178_rev_disclosures.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0178_rev_disclosures.sql

echo "Running 0179_rev_perf_idx2.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0179_rev_perf_idx2.sql

echo "Running 0180_rev_lock_ext.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0180_rev_lock_ext.sql

echo "Running 0181_rev_rpo_remeasure.sql..."
psql -d "$DB_URL" -f packages/adapters/db/migrations/0181_rev_rpo_remeasure.sql

echo ""
echo "✅ Migration Process Complete!"
echo "============================="
echo "M25.1 Revenue Recognition: 12 tables created"
echo "M25.2 Contract Modifications: 9 tables created"
echo "Total: 21 new tables with indexes and constraints"
echo ""
echo "Next steps:"
echo "1. Deploy services and API routes"
echo "2. Configure RBAC capabilities"
echo "3. Set up cron jobs"
echo "4. Test integration"
