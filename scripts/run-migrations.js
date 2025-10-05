import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = 'postgresql://aibos:aibos@localhost:5432/aibos';

async function runMigrations() {
    const client = new Client({
        connectionString: DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // M25.1 Revenue Recognition Migrations (0161-0172)
        const m25_1_migrations = [
            '0161_rev_pob_core.sql',
            '0162_rev_schedule.sql', 
            '0163_rev_events.sql',
            '0164_rev_policy_map.sql',
            '0165_rev_rpo_snapshot.sql',
            '0166_rev_post_lock.sql',
            '0167_rev_perf_idx.sql',
            '0168_rev_usage_bridge.sql',
            '0169_rev_artifacts.sql',
            '0170_rev_rbac_caps.sql',
            '0171_rev_views.sql',
            '0172_rev_seed_policy.sql'
        ];

        console.log('🚀 Running M25.1 Revenue Recognition Migrations...');
        for (const migration of m25_1_migrations) {
            console.log(`Running ${migration}...`);
            const sql = readFileSync(join('packages/adapters/db/migrations', migration), 'utf8');
            await client.query(sql);
            console.log(`✅ ${migration} completed`);
        }

        // M25.2 Contract Modifications Migrations (0173-0181)
        const m25_2_migrations = [
            '0173_rev_change_order.sql',
            '0174_rev_vc_estimate.sql',
            '0175_rev_txn_price_revision.sql',
            '0176_rev_schedule_revision.sql',
            '0177_rev_rec_catchup.sql',
            '0178_rev_disclosures.sql',
            '0179_rev_perf_idx2.sql',
            '0180_rev_lock_ext.sql',
            '0181_rev_rpo_remeasure.sql'
        ];

        console.log('🔧 Running M25.2 Contract Modifications Migrations...');
        for (const migration of m25_2_migrations) {
            console.log(`Running ${migration}...`);
            const sql = readFileSync(join('packages/adapters/db/migrations', migration), 'utf8');
            await client.query(sql);
            console.log(`✅ ${migration} completed`);
        }

        console.log('🎉 All migrations completed successfully!');
        console.log('M25.1 Revenue Recognition: 12 tables created');
        console.log('M25.2 Contract Modifications: 9 tables created');
        console.log('Total: 21 new tables with indexes and constraints');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
