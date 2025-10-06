#!/usr/bin/env node
/**
 * AIBOS ERP - Dependency Mapper
 * 
 * Maps the complete dependency chain for each module:
 * Database → Services → API → Contracts → UI
 * 
 * Identifies:
 * - Broken links (API without DB, UI without API)
 * - Orphaned code (half-finished features)
 * - Completion status (what's blocking go-live)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Module mapping based on migration prefixes and actual structure
const MODULE_DEFINITIONS = {
    'M1': { name: 'Core Ledger', migrationPrefix: null, schemaFile: 'schema.ts', apiPath: 'ledger', servicePath: 'ledger' },
    'M2': { name: 'Journal Entries', migrationPrefix: null, schemaFile: 'schema.ts', apiPath: 'journals', servicePath: 'journal' },
    'M3': { name: 'Trial Balance', migrationPrefix: null, schemaFile: 'schema.ts', apiPath: 'reports', servicePath: null },
    'M4': { name: 'Accounts Receivable', migrationPrefix: '01', schemaFile: 'schema/ar.ts', apiPath: 'ar', servicePath: 'ar' },
    'M5': { name: 'Accounts Payable', migrationPrefix: '0084', schemaFile: 'schema/payments.ts', apiPath: 'purchase-invoices', servicePath: 'posting-pi' },
    'M6': { name: 'Cash Management', migrationPrefix: '0029', schemaFile: 'schema.ts', apiPath: 'cash', servicePath: 'cash' },
    'M7': { name: 'Bank Reconciliation', migrationPrefix: '0099', schemaFile: 'schema/payments.ts', apiPath: 'bank', servicePath: 'bank' },
    'M8': { name: 'Fixed Assets', migrationPrefix: '0031', schemaFile: 'schema.ts', apiPath: 'assets', servicePath: 'assets' },
    'M9': { name: 'CAPEX Planning', migrationPrefix: '0032', schemaFile: 'schema.ts', apiPath: 'capex', servicePath: 'capex' },
    'M10': { name: 'Intangible Assets', migrationPrefix: '0035', schemaFile: 'schema.ts', apiPath: 'intangibles', servicePath: 'intangibles' },
    'M11': { name: 'Inventory', migrationPrefix: null, schemaFile: 'schema.ts', apiPath: 'inventory', servicePath: 'inventory' },
    'M12': { name: 'Revenue Recognition', migrationPrefix: '0161', schemaFile: 'schema/revenue.ts', apiPath: 'rev', servicePath: 'revenue' },
    'M13': { name: 'Tax Management', migrationPrefix: '0055', schemaFile: 'schema/tax_return.ts', apiPath: 'tax', servicePath: 'tax' },
    'M14': { name: 'Budget Planning', migrationPrefix: '0015', schemaFile: 'schema.ts', apiPath: 'budgets', servicePath: 'budgets' },
    'M15': { name: 'Cash Flow Forecasting', migrationPrefix: '0076', schemaFile: 'schema.ts', apiPath: 'forecast', servicePath: 'forecast' },
    'M16': { name: 'Allocation Engine', migrationPrefix: '0050', schemaFile: 'schema/alloc.ts', apiPath: 'alloc', servicePath: 'alloc' },
    'M17': { name: 'Consolidation', migrationPrefix: '0061', schemaFile: 'schema/consol.ts', apiPath: 'consol', servicePath: 'consol' },
    'M18': { name: 'Intercompany', migrationPrefix: '0062', schemaFile: 'schema/consol.ts', apiPath: 'ic', servicePath: 'ic' },
    'M19': { name: 'Multi-Currency', migrationPrefix: '0040', schemaFile: 'schema.ts', apiPath: 'fx', servicePath: 'fx' },
    'M20': { name: 'Close Management', migrationPrefix: '0190', schemaFile: 'schema/close.ts', apiPath: 'close', servicePath: 'close' },
    'M21': { name: 'Evidence Management', migrationPrefix: '0220', schemaFile: 'schema/evidence.ts', apiPath: 'evidence', servicePath: 'evidence' },
    'M22': { name: 'Attestation', migrationPrefix: '0250', schemaFile: 'schema/attest.ts', apiPath: 'attest', servicePath: 'attest' },
    'M23': { name: 'Payment Processing', migrationPrefix: '0084', schemaFile: 'schema/payments.ts', apiPath: 'payments', servicePath: 'payments' },
    'M24': { name: 'AR Collections', migrationPrefix: '0114', schemaFile: 'schema/ar.ts', apiPath: 'ar', servicePath: 'ar' },
    'M25': { name: 'Customer Portal', migrationPrefix: '0130', schemaFile: 'schema/ar.ts', apiPath: 'portal', servicePath: 'portal' },
    'M26': { name: 'Recurring Billing', migrationPrefix: '0147', schemaFile: 'schema/rb.ts', apiPath: 'rb', servicePath: 'rb' },
    'M27': { name: 'SOX Controls', migrationPrefix: '0230', schemaFile: 'schema/sox.ts', apiPath: 'sox', servicePath: 'sox' },
    'M28': { name: 'ITGC', migrationPrefix: '0270', schemaFile: 'schema/itgc.ts', apiPath: 'itgc', servicePath: 'itgc' },
    'M29': { name: 'Operations Automation', migrationPrefix: '0280', schemaFile: 'schema/opscc.ts', apiPath: 'ops', servicePath: 'ops' },
    'M30': { name: 'Close Insights', migrationPrefix: '0210', schemaFile: 'schema/insights.ts', apiPath: 'insights', servicePath: 'insights' },
    'M31': { name: 'Lease Accounting', migrationPrefix: '0295', schemaFile: 'schema/lease.ts', apiPath: 'leases', servicePath: 'leases' },
    'M32': { name: 'Sublease Management', migrationPrefix: '0317', schemaFile: 'schema/lease.ts', apiPath: 'subleases', servicePath: 'subleases' },
    'M33': { name: 'Sale-Leaseback', migrationPrefix: '0319', schemaFile: 'schema/lease.ts', apiPath: 'slb', servicePath: 'slb' },
};

class DependencyMapper {
    constructor() {
        this.results = {};
        this.migrations = [];
        this.apiEndpoints = [];
    }

    async scan() {
        console.log('🔍 Scanning AIBOS ERP Dependencies...\n');

        // Scan all layers
        await this.scanMigrations();
        await this.scanSchemas();
        await this.scanServices();
        await this.scanAPIs();
        await this.scanContracts();
        await this.scanUI();

        // Map dependencies
        this.mapDependencies();

        return this.results;
    }

    async scanMigrations() {
        const migrationsDir = path.join(projectRoot, 'packages/adapters/db/migrations');

        if (!fs.existsSync(migrationsDir)) {
            console.log('⚠️  Migrations directory not found');
            return;
        }

        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
        this.migrations = files.map(f => ({
            number: f.split('_')[0],
            name: f,
            path: path.join(migrationsDir, f)
        }));

        console.log(`✅ Found ${this.migrations.length} migrations`);
    }

    async scanSchemas() {
        const schemaDir = path.join(projectRoot, 'packages/adapters/db/src');

        if (!fs.existsSync(schemaDir)) {
            console.log('⚠️  Schema directory not found');
            return;
        }

        console.log(`✅ Schema directory exists`);
    }

    async scanServices() {
        const servicesDir = path.join(projectRoot, 'packages/services/src');

        if (!fs.existsSync(servicesDir)) {
            console.log('⚠️  Services directory not found');
            return;
        }

        const files = this.getAllFiles(servicesDir);
        console.log(`✅ Found ${files.length} service files`);
    }

    async scanAPIs() {
        const apiDir = path.join(projectRoot, 'apps/bff/app/api');

        if (!fs.existsSync(apiDir)) {
            console.log('⚠️  API directory not found');
            return;
        }

        const routeFiles = this.getAllFiles(apiDir).filter(f => f.endsWith('route.ts'));
        this.apiEndpoints = routeFiles.map(f => {
            const relativePath = path.relative(apiDir, f);
            return {
                path: relativePath,
                fullPath: f
            };
        });

        console.log(`✅ Found ${this.apiEndpoints.length} API endpoints`);
    }

    async scanContracts() {
        const contractsDir = path.join(projectRoot, 'packages/contracts');

        if (!fs.existsSync(contractsDir)) {
            console.log('⚠️  Contracts directory not found');
            return;
        }

        console.log(`✅ Contracts directory exists`);
    }

    async scanUI() {
        const uiDir = path.join(projectRoot, 'apps/web');

        if (fs.existsSync(uiDir)) {
            console.log(`✅ UI directory exists`);
        } else {
            console.log(`⚠️  UI directory not found (apps/web)`);
        }
    }

    mapDependencies() {
        console.log('\n📊 Mapping Dependencies...\n');

        for (const [moduleId, moduleDef] of Object.entries(MODULE_DEFINITIONS)) {
            const result = {
                id: moduleId,
                name: moduleDef.name,
                layers: {
                    database: this.checkDatabase(moduleDef),
                    services: this.checkServices(moduleDef),
                    api: this.checkAPI(moduleDef),
                    contracts: this.checkContracts(moduleDef),
                    ui: this.checkUI(moduleDef)
                },
                status: 'unknown',
                completeness: 0,
                issues: [],
                recommendations: [],
                blockers: []
            };

            // Calculate completeness
            const layers = Object.values(result.layers);
            const presentLayers = layers.filter(l => l.exists).length;
            result.completeness = Math.round((presentLayers / layers.length) * 100);

            // Analyze dependencies and identify issues
            this.analyzeDependencies(result);

            // Determine status
            if (result.blockers.length > 0) {
                result.status = 'broken';
            } else if (result.completeness === 100) {
                result.status = 'complete';
            } else if (result.completeness >= 40) {
                result.status = 'partial';
            } else if (result.completeness > 0) {
                result.status = 'started';
            } else {
                result.status = 'not_started';
            }

            this.results[moduleId] = result;
        }
    }

    checkDatabase(moduleDef) {
        const { migrationPrefix, schemaFile } = moduleDef;

        const result = {
            exists: false,
            migrations: [],
            schema: null
        };

        // Check migrations
        if (migrationPrefix) {
            result.migrations = this.migrations.filter(m =>
                m.number.startsWith(migrationPrefix)
            );
            result.exists = result.migrations.length > 0;
        }

        // Check schema
        const schemaPath = path.join(projectRoot, 'packages/adapters/db/src', schemaFile);
        if (fs.existsSync(schemaPath)) {
            result.schema = schemaFile;
            result.exists = true;
        }

        return result;
    }

    checkServices(moduleDef) {
        const { servicePath } = moduleDef;

        if (!servicePath) {
            return { exists: false, notRequired: true };
        }

        const serviceDirPath = path.join(projectRoot, 'packages/services/src', servicePath);
        const serviceFilePath = path.join(projectRoot, 'packages/services/src', `${servicePath}.ts`);

        if (fs.existsSync(serviceDirPath)) {
            const files = this.getAllFiles(serviceDirPath);
            return { exists: true, path: servicePath, fileCount: files.length };
        }

        if (fs.existsSync(serviceFilePath)) {
            const content = fs.readFileSync(serviceFilePath, 'utf8');
            return { exists: true, path: `${servicePath}.ts`, lines: content.split('\n').length };
        }

        return { exists: false };
    }

    checkAPI(moduleDef) {
        const { apiPath } = moduleDef;

        if (!apiPath) {
            return { exists: false, notRequired: true };
        }

        const apiDirPath = path.join(projectRoot, 'apps/bff/app/api', apiPath);

        if (!fs.existsSync(apiDirPath)) {
            return { exists: false };
        }

        const routeFiles = this.getAllFiles(apiDirPath).filter(f => f.endsWith('route.ts'));

        return {
            exists: routeFiles.length > 0,
            path: apiPath,
            endpoints: routeFiles.length
        };
    }

    checkContracts(moduleDef) {
        const { apiPath } = moduleDef;

        if (!apiPath) {
            return { exists: false, notRequired: true };
        }

        const contractsPath = path.join(projectRoot, 'packages/contracts/http', apiPath);

        if (fs.existsSync(contractsPath)) {
            const files = this.getAllFiles(contractsPath);
            return { exists: true, path: apiPath, fileCount: files.length };
        }

        return { exists: false };
    }

    checkUI(moduleDef) {
        const { apiPath } = moduleDef;

        if (!apiPath) {
            return { exists: false, notRequired: true };
        }

        // Check multiple possible UI locations
        const uiPaths = [
            path.join(projectRoot, 'apps/web/app/(dashboard)', apiPath),
            path.join(projectRoot, 'apps/web/app', apiPath),
            path.join(projectRoot, 'apps/web/src/pages', apiPath)
        ];

        for (const uiPath of uiPaths) {
            if (fs.existsSync(uiPath)) {
                const files = this.getAllFiles(uiPath);
                return { exists: true, path: uiPath, fileCount: files.length };
            }
        }

        return { exists: false };
    }

    analyzeDependencies(result) {
        const { layers } = result;

        // Critical: API exists but no database
        if (layers.api.exists && !layers.database.exists) {
            result.blockers.push('🚨 CRITICAL: API exists but NO DATABASE - endpoints will crash!');
            result.issues.push('Missing database schema/migrations');
        }

        // Critical: UI exists but no API
        if (layers.ui.exists && !layers.api.exists) {
            result.blockers.push('🚨 CRITICAL: UI exists but NO API - frontend will fail!');
            result.issues.push('Missing API endpoints');
        }

        // Warning: API exists but no services
        if (layers.api.exists && !layers.services.exists && !layers.services.notRequired) {
            result.issues.push('⚠️  WARNING: API exists but no business logic services');
            result.recommendations.push('Add business logic layer');
        }

        // Orphaned: Database + Services but no API
        if (layers.database.exists && layers.services.exists && !layers.api.exists) {
            result.issues.push('🔶 ORPHANED: Backend code exists but no API - unused code!');
            result.recommendations.push('Either create API endpoints or remove orphaned code');
        }

        // Incomplete: Backend complete but no UI
        if (layers.api.exists && layers.database.exists && !layers.ui.exists) {
            result.recommendations.push('📝 TODO: Backend complete - add frontend UI');
        }

        // Missing contracts
        if (layers.api.exists && !layers.contracts.exists) {
            result.recommendations.push('📝 TODO: Add type contracts for API');
        }

        // Missing migrations
        if (layers.database.schema && layers.database.migrations.length === 0) {
            result.issues.push('⚠️  WARNING: Schema exists but no migrations - deployment will fail');
        }
    }

    getAllFiles(dir) {
        const files = [];
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    files.push(...this.getAllFiles(fullPath));
                } else {
                    files.push(fullPath);
                }
            }
        } catch (e) {
            // Skip
        }
        return files;
    }

    printReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 DEPENDENCY MAPPING REPORT');
        console.log('='.repeat(80) + '\n');

        const statuses = {
            complete: [],
            partial: [],
            broken: [],
            started: [],
            not_started: []
        };

        for (const result of Object.values(this.results)) {
            statuses[result.status].push(result);
        }

        // Summary
        console.log('📈 SUMMARY:');
        console.log(`✅ Complete: ${statuses.complete.length} modules (ready to ship)`);
        console.log(`🔄 Partial: ${statuses.partial.length} modules (in progress)`);
        console.log(`🚨 Broken: ${statuses.broken.length} modules (CRITICAL - need immediate fix)`);
        console.log(`🔶 Started: ${statuses.started.length} modules (early stage)`);
        console.log(`❌ Not Started: ${statuses.not_started.length} modules\n`);

        // Critical issues first
        if (statuses.broken.length > 0) {
            console.log('🚨 CRITICAL - BROKEN MODULES (FIX THESE FIRST):');
            console.log('='.repeat(80));
            for (const result of statuses.broken) {
                this.printModuleDetail(result);
            }
        }

        // Partial modules
        if (statuses.partial.length > 0) {
            console.log('\n🔄 PARTIAL MODULES (COMPLETE THESE):');
            console.log('='.repeat(80));
            for (const result of statuses.partial) {
                this.printModuleDetail(result);
            }
        }

        // Complete modules
        if (statuses.complete.length > 0) {
            console.log('\n✅ COMPLETE MODULES (READY TO SHIP):');
            console.log('='.repeat(80));
            for (const result of statuses.complete) {
                console.log(`  ${result.id}: ${result.name} [${result.completeness}%]`);
            }
        }
    }

    printModuleDetail(result) {
        console.log(`\n${result.id}: ${result.name} [${result.completeness}%]`);
        console.log('-'.repeat(80));

        // Layer status
        console.log('Layers:');
        const layerLabels = {
            database: '🗄️  Database',
            services: '⚙️  Services',
            api: '🔌 API',
            contracts: '📋 Contracts',
            ui: '🎨 UI'
        };

        for (const [layer, info] of Object.entries(result.layers)) {
            if (info.notRequired) {
                console.log(`  ⚪ ${layerLabels[layer]}: Not Required`);
                continue;
            }

            const status = info.exists ? '✅' : '❌';
            let detail = '';

            if (info.exists) {
                if (info.migrations) detail = `${info.migrations.length} migrations`;
                else if (info.endpoints) detail = `${info.endpoints} endpoints`;
                else if (info.fileCount) detail = `${info.fileCount} files`;
                else if (info.lines) detail = `${info.lines} lines`;
                else detail = 'exists';
            } else {
                detail = 'MISSING';
            }

            console.log(`  ${status} ${layerLabels[layer]}: ${detail}`);
        }

        // Blockers (critical issues)
        if (result.blockers.length > 0) {
            console.log('\n🚨 BLOCKERS (must fix to go live):');
            for (const blocker of result.blockers) {
                console.log(`  ${blocker}`);
            }
        }

        // Issues
        if (result.issues.length > 0) {
            console.log('\n⚠️  Issues:');
            for (const issue of result.issues) {
                console.log(`  ${issue}`);
            }
        }

        // Recommendations
        if (result.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            for (const rec of result.recommendations) {
                console.log(`  ${rec}`);
            }
        }
    }

    saveReport() {
        const reportPath = path.join(projectRoot, 'dependency-map.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Full report saved to: ${reportPath}`);

        // Also generate a simple HTML report
        this.generateHTMLReport();
    }

    generateHTMLReport() {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>AIBOS ERP - Dependency Map</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
    .module { background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .module.broken { border-left: 5px solid #e74c3c; }
    .module.partial { border-left: 5px solid #f39c12; }
    .module.complete { border-left: 5px solid #27ae60; }
    .layer { display: inline-block; padding: 5px 10px; margin: 5px; border-radius: 5px; font-size: 0.9em; }
    .layer.exists { background: #d5f4e6; color: #27ae60; }
    .layer.missing { background: #fadbd8; color: #e74c3c; }
    .blocker { background: #fadbd8; padding: 10px; margin: 10px 0; border-left: 3px solid #e74c3c; border-radius: 5px; }
    .recommendation { background: #e8f4fd; padding: 10px; margin: 10px 0; border-left: 3px solid #3498db; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 AIBOS ERP - Dependency Map</h1>
    <p>Complete system dependency analysis</p>
  </div>
  ${Object.values(this.results).map(r => this.generateModuleHTML(r)).join('')}
</body>
</html>`;

        const htmlPath = path.join(projectRoot, 'dependency-map.html');
        fs.writeFileSync(htmlPath, html);
        console.log(`📊 HTML report saved to: ${htmlPath}`);
    }

    generateModuleHTML(result) {
        const layerHTML = Object.entries(result.layers).map(([name, info]) => {
            if (info.notRequired) return '';
            const className = info.exists ? 'exists' : 'missing';
            const label = name.charAt(0).toUpperCase() + name.slice(1);
            return `<span class="layer ${className}">${label}</span>`;
        }).join('');

        const blockersHTML = result.blockers.length > 0
            ? `<div class="blocker">${result.blockers.join('<br>')}</div>`
            : '';

        const recsHTML = result.recommendations.length > 0
            ? `<div class="recommendation">${result.recommendations.join('<br>')}</div>`
            : '';

        return `
      <div class="module ${result.status}">
        <h3>${result.id}: ${result.name} [${result.completeness}%]</h3>
        <div>${layerHTML}</div>
        ${blockersHTML}
        ${recsHTML}
      </div>
    `;
    }
}

// Run the mapper
const mapper = new DependencyMapper();
await mapper.scan();
mapper.printReport();
mapper.saveReport();

console.log('\n✅ Dependency mapping complete!');
console.log('\n💡 Next steps:');
console.log('  1. Fix BROKEN modules first (critical blockers)');
console.log('  2. Complete PARTIAL modules (in progress)');
console.log('  3. Review dependency-map.html for visual overview');
console.log('  4. Use dependency-map.json for CI/CD integration');
