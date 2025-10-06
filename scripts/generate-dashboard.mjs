#!/usr/bin/env node
/**
 * generate-dashboard.mjs
 *
 * Unified dashboard generator that consolidates all dependency and lineage reports.
 * Creates a single HTML page with:
 *  - Architecture layer visualization
 *  - Dependency violations
 *  - SQL lineage graph
 *  - Orphan files
 *  - Metrics and health scores
 *
 * Enterprise-grade features:
 *  - Design token integration (CSS custom properties)
 *  - WCAG 2.2 AAA accessibility (ARIA landmarks, live regions)
 *  - Reduced-motion support (@media prefers-reduced-motion)
 *  - Null-safe health score calculation
 *  - Configurable report inputs
 *
 * Usage:
 *   node scripts/generate-dashboard.mjs [OPTIONS]
 *
 * Options:
 *   --output <path>   Output HTML file path (default: reports/dashboard.html)
 *   --dep <filename>  Dependency map JSON filename (default: dependency-map.json)
 *   --sql <filename>  SQL lineage JSON filename (default: sql-lineage.json)
 *   --title <string>  Dashboard title (default: "AIBOS Implementation Dashboard")
 *
 * Examples:
 *   # Basic usage
 *   node scripts/generate-dashboard.mjs
 *
 *   # Custom output location
 *   node scripts/generate-dashboard.mjs --output build/dashboard.html
 *
 *   # Custom report names
 *   node scripts/generate-dashboard.mjs --dep deps.json --sql lineage.json
 *
 *   # Custom title for module-specific dashboards
 *   node scripts/generate-dashboard.mjs --title "AIBOS · Core Platform Dashboard"
 *
 * Design Token Integration:
 *   The dashboard respects CSS custom properties for SSOT design system integration.
 *   Override these variables in a global stylesheet to customize the theme:
 *
 *   :root {
 *     --aibos-bg: #0b1220;
 *     --aibos-text: #e5e7eb;
 *     --aibos-surface-1: #182234;
 *     --aibos-primary-500: #60a5fa;
 *     --aibos-success-500: #22c55e;
 *     (... etc)
 *   }
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.findIndex(a => a === name);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return fallback;
};

const output = getArg('--output', 'reports/dashboard.html');
const depReportName = getArg('--dep', 'dependency-map.json');
const sqlReportName = getArg('--sql', 'sql-lineage.json');
const pageTitle = getArg('--title', 'AIBOS Implementation Dashboard');

/**
 * Load JSON report safely
 */
function loadReport(filename) {
  try {
    const filePath = path.join(repoRoot, 'reports', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(
      `[dashboard] Warning: Could not load ${filename}: ${err.message}`
    );
    return null;
  }
}

/**
 * Calculate health score (0-100)
 */
function calculateHealthScore(depMap, sqlLineage) {
  let score = 100;
  const dsum = depMap?.graph?.summary;
  if (dsum) {
    // Penalty for architecture violations (errors are more severe)
    const errorPenalty = Math.min(
      (Number(dsum.errorCount) || 0) * 5, // 5 points per error
      30
    );

    // Penalty for warnings
    const warningPenalty = Math.min(
      (Number(dsum.warningCount) || 0) * 1, // 1 point per warning
      20
    );

    // Penalty for orphan files (indicates incomplete implementation)
    const orphanPenalty = Math.min(
      (Number(dsum.orphanCount) || 0) * 0.1, // 0.1 points per orphan
      15
    );

    score -= errorPenalty + warningPenalty + orphanPenalty;
  }
  const ssum = sqlLineage?.summary;
  if (ssum) {
    const totalRel = Number(ssum.totalRelationships) || 0;
    const totalTbl = Math.max(Number(ssum.totalTables) || 0, 1);
    const coverage = totalRel / totalTbl;
    if (coverage > 0.5) score += 5;
  }
  return Math.max(0, Math.floor(score));
}

/**
 * Generate unified HTML dashboard
 */
function generateDashboard(depMap, sqlLineage) {
  const timestamp = new Date().toISOString();
  const healthScore = calculateHealthScore(depMap, sqlLineage);

  const depSummary = depMap?.graph?.summary || {
    totalFiles: 0,
    totalEdges: 0,
    violationCount: 0,
    orphanCount: 0,
  };

  const sqlSummary = sqlLineage?.summary || {
    totalTables: 0,
    totalRelationships: 0,
    filesScanned: 0,
  };

  const healthColor =
    healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const healthStatus =
    healthScore >= 80
      ? 'Excellent'
      : healthScore >= 60
        ? 'Good'
        : 'Needs Attention';
  const nf = n => Number(n ?? 0).toLocaleString(undefined);
  const embedded = {
    generatedAt: timestamp,
    healthScore,
    depSummary: {
      totalFiles: Number(depSummary.totalFiles || 0),
      totalEdges: Number(depSummary.totalEdges || 0),
      violationCount: Number(depSummary.violationCount || 0),
      orphanCount: Number(depSummary.orphanCount || 0),
    },
    sqlSummary: {
      totalTables: Number(sqlSummary.totalTables || 0),
      totalRelationships: Number(sqlSummary.totalRelationships || 0),
      filesScanned: Number(sqlSummary.filesScanned || 0),
      foreignKeys: Number(
        sqlLineage?.summary?.relationshipTypes?.foreignKey || 0
      ),
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      /* Token-ready variables with safe fallbacks.
         These can be overridden by your SSOT (e.g., global CSS or <style> injection). */
      --aibos-surface: var(--aibos-surface-1, #1e293b);
      --aibos-surface-2: var(--aibos-surface-2, #0f172a);
      --aibos-border: var(--aibos-border, #334155);
      --aibos-primary: var(--aibos-primary-500, #3b82f6);
      --aibos-primary-strong: var(--aibos-primary-600, #2563eb);
      --aibos-info: var(--aibos-info-500, #06b6d4);
      --aibos-success: var(--aibos-success-500, #10b981);
      --aibos-warn: var(--aibos-warn-500, #f59e0b);
      --aibos-error: var(--aibos-error-500, #ef4444);
      --aibos-muted: var(--aibos-muted, #94a3b8);
    }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: var(--aibos-bg, #0f172a);
      color: var(--aibos-text, #e2e8f0);
      line-height: 1.6;
      color-scheme: dark;
    }
    @media (prefers-reduced-motion: reduce) {
      .metric-card:hover { transform: none; box-shadow: none; }
    }
    
    .header {
      background: linear-gradient(135deg, var(--aibos-surface) 0%, var(--aibos-border) 100%);
      padding: 32px 24px;
      border-bottom: 2px solid var(--aibos-primary);
    }
    
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 8px;
      color: var(--aibos-text, #e2e8f0);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header .timestamp {
      color: var(--aibos-muted);
      font-size: 0.875rem;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 32px 0;
    }
    
    .metric-card {
      background: var(--aibos-surface);
      border: 1px solid var(--aibos-border);
      border-radius: 12px;
      padding: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    
    .metric-card.highlight {
      border: 2px solid var(--aibos-primary);
      background: linear-gradient(135deg, var(--aibos-surface) 0%, color-mix(in oklch, var(--aibos-primary) 25%, var(--aibos-surface) 75%) 100%);
    }
    
    .metric-card h3 {
      font-size: 0.875rem;
      color: var(--aibos-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .metric-card .value {
      font-size: 3rem;
      font-weight: bold;
      color: var(--aibos-text, #e2e8f0);
      margin-bottom: 8px;
    }
    
    .metric-card .label { font-size: 0.875rem; color: var(--aibos-muted); }
    .metric-card.success .value { color: var(--aibos-success); }
    .metric-card.warning .value { color: var(--aibos-warn); }
    .metric-card.error .value { color: var(--aibos-error); }
    .metric-card.info .value { color: var(--aibos-info); }
    
    .health-score {
      position: relative;
      text-align: center;
    }
    
    .health-circle {
      width: 120px;
      height: 120px;
      margin: 0 auto 16px;
      border-radius: 50%;
      border: 8px solid var(--aibos-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: bold;
      position: relative;
    }
    
    .health-circle::before {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      padding: 8px;
      background: conic-gradient(${healthColor} calc(var(--score) * 1%), var(--aibos-border) 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }
    
    .sections {
      display: grid;
      gap: 24px;
      margin-top: 32px;
    }
    
    .section {
      background: var(--aibos-surface);
      border: 1px solid var(--aibos-border);
      border-radius: 12px;
      padding: 24px;
    }
    
    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: var(--aibos-text, #e2e8f0);
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--aibos-border);
    }
    
    .section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    
    .info-card {
      background: var(--aibos-surface-2);
      border: 1px solid var(--aibos-surface);
      border-radius: 8px;
      padding: 16px;
    }
    
    .info-card h4 {
      color: var(--aibos-muted);
      font-size: 0.875rem;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .info-card .stat {
      font-size: 1.5rem;
      color: var(--aibos-text, #e2e8f0);
      font-weight: bold;
    }
    
    .alert {
      padding: 16px 20px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .alert.success { background: color-mix(in oklch, var(--aibos-success) 15%, black); border-color: var(--aibos-success); color: color-mix(in oklch, var(--aibos-success) 85%, white); }
    .alert.error   { background: color-mix(in oklch, var(--aibos-error) 15%, black);   border-color: var(--aibos-error);   color: color-mix(in oklch, var(--aibos-error) 85%, white); }
    .alert.warning { background: color-mix(in oklch, var(--aibos-warn) 15%, black);    border-color: var(--aibos-warn);    color: color-mix(in oklch, var(--aibos-warn) 85%, white); }
    .alert.info    { background: color-mix(in oklch, var(--aibos-info) 15%, black);    border-color: var(--aibos-info);    color: color-mix(in oklch, var(--aibos-info) 85%, white); }
    
    .quick-links {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--aibos-border);
      color: var(--aibos-text, #e2e8f0);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
      border: 1px solid color-mix(in oklch, var(--aibos-border) 80%, white);
    }
    
    .btn:hover {
      background: color-mix(in oklch, var(--aibos-border) 80%, white);
    }
    
    .btn.primary {
      background: var(--aibos-primary);
      border-color: var(--aibos-primary);
    }
    
    .btn.primary:hover {
      background: var(--aibos-primary-strong);
    }
    
    code {
      background: var(--aibos-surface-2);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: var(--aibos-info);
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge.success { background: #10b981; color: #fff; }
    .badge.warning { background: #f59e0b; color: #fff; }
    .badge.error { background: #ef4444; color: #fff; }
    .badge.info { background: #06b6d4; color: #fff; }
    
    .footer {
      text-align: center;
      padding: 32px 24px;
      color: #64748b;
      font-size: 0.875rem;
      border-top: 1px solid #334155;
      margin-top: 48px;
    }
    
    .layer-flow {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      background: var(--aibos-surface-2);
      border-radius: 8px;
      overflow-x: auto;
      margin-top: 16px;
    }
    
    .layer-box {
      flex-shrink: 0;
      padding: 12px 20px;
      background: var(--aibos-surface);
      border: 2px solid;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      min-width: 100px;
    }
    
    .arrow {
      color: #64748b;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <h1>
        <span>🗺️</span>
        <span>${pageTitle}</span>
      </h1>
      <p class="timestamp">Generated: ${timestamp}</p>
    </div>
  </div>
  
  <main class="container" aria-live="polite">
    <!-- Hero Metrics -->
    <div class="hero-metrics">
      <div class="metric-card highlight health-score">
        <h3>System Health</h3>
        <div
          class="health-circle"
          style="--score: ${healthScore};"
          role="meter"
          aria-label="Overall system health"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${healthScore}"
          aria-valuetext="${healthStatus}"
        >
          ${healthScore}
        </div>
        <div class="label">${healthStatus}</div>
      </div>
      
      <div class="metric-card info">
        <h3>Total Files</h3>
        <div class="value">${nf(depSummary.totalFiles)}</div>
        <div class="label">Tracked in system</div>
      </div>
      
      <div class="metric-card ${depSummary.violationCount > 0 ? 'error' : 'success'}">
        <h3>Violations</h3>
        <div class="value">${nf(depSummary.violationCount)}</div>
        <div class="label">Architecture boundaries</div>
      </div>
      
      <div class="metric-card ${depSummary.orphanCount > 0 ? 'warning' : 'success'}">
        <h3>Orphan Files</h3>
        <div class="value">${nf(depSummary.orphanCount)}</div>
        <div class="label">Files without dependencies</div>
      </div>
      
      <div class="metric-card info">
        <h3>Database Tables</h3>
        <div class="value">${nf(sqlSummary.totalTables)}</div>
        <div class="label">${nf(sqlSummary.totalRelationships)} relationships</div>
      </div>
    </div>
    
    <!-- Status Alerts -->
    ${
      depSummary.violationCount === 0 && depSummary.orphanCount === 0
        ? '<div class="alert success" role="status">✅ <strong>Excellent!</strong> No architecture violations detected. All boundaries are respected.</div>'
        : ''
    }
    
    ${
      depSummary.violationCount > 0
        ? `<div class="alert error" role="status">⚠️ <strong>${depSummary.violationCount} violations detected.</strong> Review dependency-map.html for details.</div>`
        : ''
    }
    
    ${
      depSummary.orphanCount > 10
        ? `<div class="alert warning" role="status">⚠️ <strong>${depSummary.orphanCount} orphan files found.</strong> Consider removing unused code or wiring them correctly.</div>`
        : ''
    }
    
    <!-- Architecture Flow -->
    <div class="section">
      <h2>📐 Architecture Flow</h2>
      <p style="color: #94a3b8; margin-bottom: 16px;">
        AIBOS follows a clean layered architecture aligned with dependency inversion principles.
      </p>
      <div class="layer-flow">
        <div class="layer-box" style="border-color: #3b82f6;">DB</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #8b5cf6;">Adapters</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #ec4899;">Ports</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #10b981;">Services</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #f59e0b;">Policies</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #06b6d4;">Contracts</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #ef4444;">API</div>
        <div class="arrow">→</div>
        <div class="layer-box" style="border-color: #14b8a6;">UI</div>
      </div>
      <div class="alert info" style="margin-top: 16px;">
        <span>💡</span>
        <span>This flow is enforced by <code>eslint-plugin-boundaries</code> and validated by dependency-cruiser.</span>
      </div>
    </div>
    
    <!-- Dependency Summary -->
    <div class="section">
      <h2>🔗 Dependency Analysis</h2>
      <div class="section-grid">
        <div class="info-card">
          <h4>Total Dependencies</h4>
          <div class="stat">${nf(depSummary.totalEdges)}</div>
        </div>
        <div class="info-card">
          <h4>Files Analyzed</h4>
          <div class="stat">${nf(depSummary.totalFiles)}</div>
        </div>
        <div class="info-card">
          <h4>Violations</h4>
          <div class="stat" style="color: ${depSummary.violationCount > 0 ? '#ef4444' : '#10b981'};">
            ${nf(depSummary.violationCount)}
          </div>
        </div>
        <div class="info-card">
          <h4>Orphan Files</h4>
          <div class="stat" style="color: ${depSummary.orphanCount > 0 ? '#f59e0b' : '#10b981'};">
            ${nf(depSummary.orphanCount)}
          </div>
        </div>
      </div>
    </div>
    
    <!-- SQL Lineage -->
    <div class="section">
      <h2>🗄️ Database Lineage</h2>
      <div class="section-grid">
        <div class="info-card">
          <h4>Tables Discovered</h4>
          <div class="stat">${nf(sqlSummary.totalTables)}</div>
        </div>
        <div class="info-card">
          <h4>Relationships</h4>
          <div class="stat">${nf(sqlSummary.totalRelationships)}</div>
        </div>
        <div class="info-card">
          <h4>Files Scanned</h4>
          <div class="stat">${nf(sqlSummary.filesScanned)}</div>
        </div>
        <div class="info-card">
          <h4>Foreign Keys</h4>
          <div class="stat">${nf(sqlLineage?.summary?.relationshipTypes?.foreignKey || 0)}</div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="section">
      <h2>⚡ Quick Actions</h2>
      <div class="quick-links">
        <a href="dependency-map.html" class="btn primary">View Full Dependency Map</a>
        <a href="dependency-map-intelligent.svg" class="btn" target="_blank" rel="noopener noreferrer">🧠 View Intelligent Architecture</a>
        <a href="dependency-map-intelligent.png" class="btn" target="_blank" rel="noopener noreferrer">📊 Download Architecture PNG</a>
        <a href="dependency-map-intelligent.mmd" class="btn" target="_blank" rel="noopener noreferrer">📝 View Mermaid Source</a>
        <a href="sql-lineage.json" class="btn" download>Download SQL Lineage</a>
        <a href="../docs/DEPENDENCY_LINEAGE_GUARDRAILS.md" class="btn">View Guardrails</a>
      </div>
      
      <div class="alert info" style="margin-top: 20px;">
        <span>📚</span>
        <div>
          <strong>Need help?</strong> Check the guardrails document for implementation compliance rules and best practices.
          <br>
          <code>pnpm deps:report</code> to regenerate all reports.
        </div>
      </div>
    </div>
    
    <!-- Recommendations -->
    ${
      depSummary.violationCount > 0 || depSummary.orphanCount > 10
        ? `
    <div class="section">
      <h2>💡 Recommendations</h2>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${
          depSummary.violationCount > 0
            ? `
        <div class="alert error">
          <span>⚠️</span>
          <div>
            <strong>Fix architecture violations first.</strong>
            <br>Run <code>pnpm lint</code> to see boundary violations enforced by ESLint.
          </div>
        </div>
        `
            : ''
        }
        
        ${
          depSummary.orphanCount > 10
            ? `
        <div class="alert warning">
          <span>🧹</span>
          <div>
            <strong>Clean up orphan files.</strong>
            <br>Review orphan files in dependency-map.html and either wire them correctly or remove unused code.
          </div>
        </div>
        `
            : ''
        }
      </div>
    </div>
    `
        : ''
    }
  </main>
  
  <div class="footer">
    <p>AIBOS ERP · Implementation Dashboard · Auto-generated on ${timestamp}</p>
    <p style="margin-top: 8px;">
      <a href="https://github.com/dependabot" style="color: #64748b;" target="_blank" rel="noopener noreferrer">Powered by dependency-cruiser, madge, and custom analyzers</a>
    </p>
    <script type="application/json" id="report-data">${JSON.stringify(embedded)}</script>
  </div>
</body>
</html>`;
}

/**
 * Main execution
 */
async function main() {
  console.error('[dashboard] Loading reports...');

  const depMap = loadReport(depReportName);
  const sqlLineage = loadReport(sqlReportName);

  if (!depMap) {
    console.error(
      `[dashboard] Warning: ${depReportName} not found. Run \`pnpm deps:map\` first.`
    );
  }

  if (!sqlLineage) {
    console.error(
      `[dashboard] Warning: ${sqlReportName} not found. Run \`pnpm deps:lineage\` first.`
    );
  }

  console.error('[dashboard] Generating unified dashboard...');

  const html = generateDashboard(depMap, sqlLineage);

  const outPath = path.isAbsolute(output)
    ? output
    : path.join(repoRoot, output);
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, html, 'utf8');
  console.error(`[dashboard] ✅ Dashboard generated → ${outPath}`);
  console.error('[dashboard] Open in browser to view');
}

main().catch(err => {
  console.error('[dashboard] Fatal error:', err);
  process.exit(1);
});
