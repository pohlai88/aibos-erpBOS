#!/usr/bin/env node

/**
 * Add @api:nonstandard tags to routes that legitimately use new Response()
 * 
 * Categories:
 * - Health checks: /healthz, /readyz
 * - CORS/OPTIONS handlers: All OPTIONS methods
 * - File operations: Import/export routes with custom headers
 * - Reports: Routes returning custom content types
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.resolve('apps/bff/app/api');

// Routes that need @api:nonstandard tags
const ROUTES_TO_TAG = [
    // Health checks
    'healthz/route.ts',
    'readyz/route.ts',

    // CORS/OPTIONS handlers (all routes with OPTIONS methods)
    'cashflow/bank/balances/route.ts',
    'cashflow/bank/import/route.ts',
    'cashflow/consolidated/run/route.ts',
    'cashflow/direct13/run/route.ts',
    'cashflow/drivers/import/route.ts',
    'cashflow/indirect/run/route.ts',
    'cashflow/map/route.ts',
    'cashflow/scenarios/route.ts',
    'consol/policy/cta/route.ts',
    'consol/policy/ledger/route.ts',
    'consol/policy/nci/route.ts',
    'consol/policy/rate/route.ts',
    'consol/policy/rate-override/route.ts',
    'ic/auto-match/route.ts',
    'ic/elim-rules/route.ts',
    'ic/proposals/decision/route.ts',
    'ic/proposals/route.ts',
    'inventory/summary/route.ts',
    'journals/[id]/route.ts',
    'payments/bank/import/route.ts',
    'payments/kyc/route.ts',
    'payments/limits/route.ts',
    'payments/payment-pref/route.ts',
    'payments/policy/route.ts',
    'payments/policy/supplier/route.ts',
    'payments/run/approve/route.ts',
    'payments/run/approve2/route.ts',
    'payments/run/create/route.ts',
    'payments/run/execute/route.ts',
    'payments/run/export/route.ts',
    'payments/run/review/route.ts',
    'payments/run/select/route.ts',
    'payments/runs/route.ts',
    'payments/sanctions/decision/route.ts',
    'payments/sanctions/denylist/route.ts',
    'payments/sanctions/screen/route.ts',
    'payments/supplier-bank/route.ts',
    'ping/route.ts',
    'reports/aging/route.ts',
];

function addNonstandardTag(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if tag already exists
        if (content.includes('@api:nonstandard')) {
            console.log(`⏭️  Already tagged: ${filePath}`);
            return false;
        }

        // Determine the appropriate tag based on file content
        let tag = '// @api:nonstandard (new Response)';

        if (filePath.includes('healthz') || filePath.includes('readyz')) {
            tag = '// @api:nonstandard (health check)';
        } else if (content.includes('OPTIONS') && content.includes('Access-Control-Allow-Origin')) {
            tag = '// @api:nonstandard (CORS headers)';
        } else if (filePath.includes('import') || filePath.includes('export')) {
            tag = '// @api:nonstandard (file operation headers)';
        } else if (filePath.includes('reports')) {
            tag = '// @api:nonstandard (report headers)';
        }

        // Add tag at the top of the file
        const lines = content.split('\n');
        const newContent = [tag, '', ...lines].join('\n');

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Tagged: ${filePath}`);
        return true;

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🏷️  Adding @api:nonstandard tags to legitimate routes...\n');

    let taggedCount = 0;

    for (const route of ROUTES_TO_TAG) {
        const filePath = path.join(API_DIR, route);
        if (fs.existsSync(filePath)) {
            if (addNonstandardTag(filePath)) {
                taggedCount++;
            }
        } else {
            console.log(`⚠️  File not found: ${filePath}`);
        }
    }

    console.log(`\n📊 Summary: ${taggedCount} routes tagged with @api:nonstandard`);
    console.log('💡 Run "node scripts/check-api-wrappers.js" to verify compliance');
}

if (require.main === module) {
    main();
}

module.exports = { addNonstandardTag };
