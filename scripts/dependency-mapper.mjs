#!/usr/bin/env node
/**
 * dependency-mapper.mjs
 *
 * End-to-end lineage mapper aligned with AIBOS architecture boundaries.
 * Maps complete flow: DB → Adapters → Ports → Services → Policies/Posting-Rules → Contracts → API → UI
 *
 * Outputs:
 *  - JSON (default): Machine-readable dependency graph
 *  - Mermaid (.mmd): Diagram source for rendering
 *  - HTML: Interactive visualization with metrics
 *
 * Architecture Alignment:
 * This mapper respects the boundaries defined in eslint.config.js:
 *  - DB Layer:       packages/adapters/db/**
 *  - Adapters:       packages/adapters/**
 *  - Ports:          packages/ports/**
 *  - Services:       packages/services/**
 *  - Policies:       packages/policies/**
 *  - Posting Rules:  packages/posting-rules/**
 *  - Contracts:      packages/contracts/**
 *  - API (BFF):      apps/bff/app/api/**
 *  - UI (Web):       apps/web/**
 *  - Worker:         apps/worker/**
 *
 * Usage:
 *   node scripts/dependency-mapper.mjs [OPTIONS]
 *
 * Options:
 *   --format <json|mermaid|html>     Output format (default: json)
 *   --output <path>                  Output file path (default: stdout)
 *   --fail-on <none|violations|any>  CI exit behavior (default: violations)
 *   --samples <N>                    Number of sample files per edge (default: 5)
 *   --policy <path>                  Load allowed edges from JSON file
 *   --ignore "<glob1,glob2>"         Additional glob patterns to ignore (comma-separated)
 *
 * Examples:
 *   # Basic usage
 *   node scripts/dependency-mapper.mjs                                  # JSON to stdout
 *   node scripts/dependency-mapper.mjs --format html --output reports/dependency-map.html
 *
 *   # CI/CD usage
 *   node scripts/dependency-mapper.mjs --format html --output reports/deps.html --fail-on violations --samples 8
 *
 *   # Early scaffolding (don't fail on violations)
 *   node scripts/dependency-mapper.mjs --fail-on none --output reports/deps.json
 *
 *   # Custom policy file
 *   node scripts/dependency-mapper.mjs --policy policies/architecture-edges.json --format html
 *
 *   # Ignore additional patterns
 *   node scripts/dependency-mapper.mjs --ignore "apps/playground/,*.stories.tsx" --format json
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';

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

const format = getArg('--format', 'json'); // json|mermaid|html
const output = getArg('--output', '');
const failOn = getArg('--fail-on', 'violations'); // none|violations|any
const sampleLimit = Number.parseInt(getArg('--samples', '5'), 10) || 5;
const policyPath = getArg('--policy', '');
const extraIgnore = (getArg('--ignore', '') || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Ensure reports dir
const reportsDir = path.join(repoRoot, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Layer definitions (aligned with eslint-plugin-boundaries)
const LAYER_DEFINITIONS = {
  DB: {
    order: 1,
    patterns: ['packages/adapters/db/**/*.{ts,tsx,sql}'],
    color: '#3b82f6',
    description: 'Database schema, migrations, and ORM',
  },
  Adapters: {
    order: 2,
    patterns: ['packages/adapters/**/*.{ts,tsx}'],
    color: '#8b5cf6',
    description: 'External system adapters',
  },
  Ports: {
    order: 3,
    patterns: ['packages/ports/**/*.{ts,tsx}'],
    color: '#ec4899',
    description: 'Dependency inversion interfaces',
  },
  Services: {
    order: 4,
    patterns: ['packages/services/**/*.{ts,tsx}'],
    color: '#10b981',
    description: 'Business logic layer',
  },
  Policies: {
    order: 5,
    patterns: ['packages/policies/**/*.{ts,tsx,json}'],
    color: '#f59e0b',
    description: 'Business rules and policies',
  },
  PostingRules: {
    order: 5,
    patterns: ['packages/posting-rules/**/*.{ts,tsx,json,json5}'],
    color: '#f97316',
    description: 'Accounting posting rules',
  },
  Contracts: {
    order: 6,
    patterns: ['packages/contracts/**/*.{ts,tsx,json,yaml,yml}'],
    color: '#06b6d4',
    description: 'API contracts and types',
  },
  API: {
    order: 7,
    patterns: ['apps/bff/app/api/**/*.{ts,tsx}'],
    color: '#ef4444',
    description: 'Backend For Frontend API routes',
  },
  UI: {
    order: 8,
    patterns: ['apps/web/**/*.{ts,tsx}'],
    color: '#14b8a6',
    description: 'Web UI components and pages',
  },
  Worker: {
    order: 9,
    patterns: ['apps/worker/**/*.{ts,tsx,js}'],
    color: '#a855f7',
    description: 'Background job workers',
  },
};

/**
 * Discover files by layer
 */
async function discoverFiles() {
  const files = {};
  const stats = {};

  for (const [layerName, config] of Object.entries(LAYER_DEFINITIONS)) {
    const discovered = await fg(config.patterns, {
      cwd: repoRoot,
      dot: false,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        ...extraIgnore,
      ],
    });

    files[layerName] = discovered;
    stats[layerName] = {
      fileCount: discovered.length,
      patterns: config.patterns,
      order: config.order,
    };
  }

  return { files, stats };
}

/**
 * Normalize file path to layer
 */
function normalizeLayer(filePath) {
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/');

  // Order matters: check most specific first
  if (rel.startsWith('packages/adapters/db/')) return 'DB';
  if (rel.startsWith('packages/adapters/')) return 'Adapters';
  if (rel.startsWith('packages/ports/')) return 'Ports';
  if (rel.startsWith('packages/services/')) return 'Services';
  if (rel.startsWith('packages/policies/')) return 'Policies';
  if (rel.startsWith('packages/posting-rules/')) return 'PostingRules';
  if (rel.startsWith('packages/contracts/')) return 'Contracts';
  if (rel.startsWith('apps/bff/app/api/')) return 'API';
  if (rel.startsWith('apps/web/')) return 'UI';
  if (rel.startsWith('apps/worker/')) return 'Worker';

  return 'Other';
}

/**
 * Run dependency-cruiser to get import graph
 */
function getDependencyCruiserData() {
  try {
    console.error('[dependency-mapper] Running dependency-cruiser...');
    const cmd = `npx dependency-cruiser --config .dependency-cruiser.js --output-type json .`;
    const out = execSync(cmd, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large repos
    }).toString();
    return JSON.parse(out);
  } catch (e) {
    console.error(
      '[dependency-mapper] Warning: dependency-cruiser failed, using empty graph'
    );
    return { modules: [] };
  }
}

/**
 * Build layer-to-layer dependency graph
 */
function buildLayerGraph(cruiseData) {
  const nodes = Object.keys(LAYER_DEFINITIONS);
  const edges = new Map(); // key "LayerA->LayerB" -> { count, files: Set }
  const violations = [];
  const orphans = new Set();
  const indegree = new Map(nodes.map(n => [n, 0]));
  const outdegree = new Map(nodes.map(n => [n, 0]));
  const violationsByEdge = new Map(); // "A->B" -> count

  // Expected flow (dependency-cruiser direction: "who imports" -> "what it imports")
  // This is the CORRECT direction - source file → resolved dependency
  let allowedEdges = new Set([
    // Adapters import from DB layer (ORM, migrations)
    'Adapters->DB',
    // Adapters implement port interfaces
    'Adapters->Ports',
    // API (BFF) imports from Services and Contracts
    'API->Services',
    'API->Contracts',
    'API->Policies',
    'API->PostingRules',
    'API->Adapters',
    'API->Ports',
    // Services import from Ports (dependency inversion)
    'Services->Ports',
    'Services->Policies',
    'Services->PostingRules',
    'Services->Contracts',
    // UI imports from Contracts (types/API client)
    'UI->Contracts',
    // Worker imports from Services or lower layers
    'Worker->Services',
    'Worker->Adapters',
    'Worker->Ports',
    // Ports can import Contracts (shared DTOs/types)
    'Ports->Contracts',
    // Policies and PostingRules can import Contracts
    'Policies->Contracts',
    'PostingRules->Contracts',
    // Self-references are OK
    ...nodes.map(n => `${n}->${n}`),
  ]);

  // Optional external policy file
  if (policyPath) {
    try {
      const policyAbs = path.isAbsolute(policyPath)
        ? policyPath
        : path.join(repoRoot, policyPath);
      const policy = JSON.parse(fs.readFileSync(policyAbs, 'utf8'));
      if (Array.isArray(policy.allowedEdges)) {
        allowedEdges = new Set([
          ...policy.allowedEdges,
          ...nodes.map(n => `${n}->${n}`),
        ]);
        console.error(
          `[dependency-mapper] Using policy from ${policyAbs} with ${policy.allowedEdges.length} edges`
        );
      }
    } catch (e) {
      console.error(
        '[dependency-mapper] Warning: failed to load --policy file:',
        e.message
      );
    }
  }

  const fileLayers = new Map();

  for (const mod of cruiseData.modules || []) {
    const fromLayer = normalizeLayer(mod.source);
    fileLayers.set(mod.source, fromLayer);

    if (!mod.dependencies || mod.dependencies.length === 0) {
      if (fromLayer !== 'Other') {
        orphans.add(mod.source);
      }
    }

    for (const dep of mod.dependencies || []) {
      const toLayer = normalizeLayer(dep.resolved);
      fileLayers.set(dep.resolved, toLayer);

      if (fromLayer === 'Other' || toLayer === 'Other') continue;
      if (fromLayer === toLayer) continue; // Skip self-references for cleaner graph

      const key = `${fromLayer}->${toLayer}`;

      if (!edges.has(key)) {
        edges.set(key, {
          count: 0,
          files: new Set(),
          allowed: allowedEdges.has(key),
        });
      }

      const edge = edges.get(key);
      edge.count++;
      edge.files.add(`${mod.source} -> ${dep.resolved}`);
      // degree counts (include both allowed and violations)
      outdegree.set(fromLayer, (outdegree.get(fromLayer) || 0) + 1);
      indegree.set(toLayer, (indegree.get(toLayer) || 0) + 1);

      // Track violations
      if (!allowedEdges.has(key)) {
        violations.push({
          from: fromLayer,
          to: toLayer,
          sourceFile: mod.source,
          targetFile: dep.resolved,
          message: `Unexpected dependency: ${fromLayer} should not import from ${toLayer}`,
        });
        violationsByEdge.set(key, (violationsByEdge.get(key) || 0) + 1);
      }
    }
  }

  const edgeList = [];
  for (const [key, data] of edges.entries()) {
    const [from, to] = key.split('->');
    edgeList.push({
      from,
      to,
      weight: data.count,
      allowed: data.allowed,
      sampleFiles: Array.from(data.files).slice(0, sampleLimit),
    });
  }

  return {
    nodes: nodes.map(n => ({
      name: n,
      ...LAYER_DEFINITIONS[n],
    })),
    edges: edgeList,
    violations,
    orphans: Array.from(orphans),
    layerDegree: nodes.map(n => ({
      layer: n,
      indegree: indegree.get(n) || 0,
      outdegree: outdegree.get(n) || 0,
    })),
    violationsByEdge: Array.from(violationsByEdge.entries())
      .map(([k, count]) => ({ edge: k, count }))
      .sort((a, b) => b.count - a.count),
    summary: {
      totalFiles: cruiseData.modules?.length || 0,
      totalEdges: edgeList.reduce((sum, e) => sum + e.weight, 0),
      violationCount: violations.length,
      orphanCount: orphans.size,
    },
  };
}

/**
 * Render as JSON
 */
function toJSON(graph, files) {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      graph,
      layerDegree: graph.layerDegree,
      violationsByEdge: graph.violationsByEdge,
      filesByLayer: Object.fromEntries(
        Object.entries(files).map(([layer, paths]) => [
          layer,
          { count: paths.length, files: paths.slice(0, 10) },
        ])
      ),
    },
    null,
    2
  );
}

/**
 * Render as Mermaid diagram
 */
function toMermaid(graph) {
  const lines = [
    '%%{init: {"theme": "base", "themeVariables": {"fontSize": "16px"}}}%%',
    'flowchart TD',
  ];

  // Add nodes with styling
  for (const node of graph.nodes) {
    lines.push(`  ${node.name}["${node.name}<br/>${node.description}"]`);
    lines.push(
      `  style ${node.name} fill:${node.color},stroke:#333,stroke-width:2px,color:#fff`
    );
  }

  lines.push('');

  // Add edges (sort by span - show cross-layer dependencies prominently)
  const sortedEdges = graph.edges
    .filter(e => e.allowed) // Only show allowed edges in main diagram
    .sort((a, b) => {
      const aSpan = Math.abs(
        LAYER_DEFINITIONS[a.to].order - LAYER_DEFINITIONS[a.from].order
      );
      const bSpan = Math.abs(
        LAYER_DEFINITIONS[b.to].order - LAYER_DEFINITIONS[b.from].order
      );
      return bSpan - aSpan; // show longer-span edges first for clarity
    });

  for (const edge of sortedEdges) {
    lines.push(`  ${edge.from} -->|${edge.weight}| ${edge.to}`);
  }

  // Add violations as dotted lines
  if (graph.violations.length > 0) {
    lines.push('\n  %% Violations (should not exist)');
    const violationEdges = new Map();
    for (const v of graph.violations) {
      const key = `${v.from}->${v.to}`;
      violationEdges.set(key, (violationEdges.get(key) || 0) + 1);
    }
    for (const [key, count] of violationEdges.entries()) {
      const [from, to] = key.split('->');
      lines.push(`  ${from} -.->|⚠️ ${count}| ${to}`);
    }
  }

  return lines.join('\n');
}

/**
 * Render as HTML dashboard
 */
function toHTML(graph) {
  const violationRows = graph.violations
    .slice(0, 20) // Limit to first 20
    .map(
      v => `
      <tr>
        <td><code>${v.from}</code></td>
        <td><code>${v.to}</code></td>
        <td title="${v.sourceFile}"><code>${path.basename(v.sourceFile)}</code></td>
        <td>${v.message}</td>
      </tr>
    `
    )
    .join('\n');

  const edgeRows = graph.edges
    .sort((a, b) => b.weight - a.weight)
    .map(
      e => `
      <tr>
        <td><code>${e.from}</code></td>
        <td><code>${e.to}</code></td>
        <td>${e.weight}</td>
        <td>${e.allowed ? '✅ Allowed' : '⚠️ Violation'}</td>
      </tr>
    `
    )
    .join('\n');

  const degreeRows = graph.layerDegree
    .sort((a, b) => b.indegree + b.outdegree - (a.indegree + a.outdegree))
    .map(
      d => `
      <tr>
        <td><code>${d.layer}</code></td>
        <td>${d.indegree}</td>
        <td>${d.outdegree}</td>
      </tr>
    `
    )
    .join('\n');

  const offendingRows = (graph.violationsByEdge || [])
    .slice(0, 15)
    .map(v => {
      const [from, to] = v.edge.split('->');
      return `
        <tr>
          <td><code>${from}</code></td>
          <td><code>${to}</code></td>
          <td>${v.count}</td>
        </tr>
      `;
    })
    .join('\n');

  const orphanList = graph.orphans
    .slice(0, 50)
    .map(f => `<li><code>${path.relative(repoRoot, f)}</code></li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIBOS Dependency Map</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 24px;
      background: #0f172a;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 8px; color: #fff; }
    h2 { font-size: 1.5rem; margin: 32px 0 16px; color: #cbd5e1; border-bottom: 2px solid #334155; padding-bottom: 8px; }
    h3 { font-size: 1.25rem; margin: 24px 0 12px; color: #94a3b8; }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 16px;
    }
    .stat-card h3 { margin: 0 0 8px; font-size: 0.875rem; color: #94a3b8; text-transform: uppercase; }
    .stat-card .value { font-size: 2rem; font-weight: bold; color: #fff; }
    .stat-card.error .value { color: #ef4444; }
    .stat-card.warn .value { color: #f59e0b; }
    .stat-card.success .value { color: #10b981; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    th {
      background: #334155;
      color: #f1f5f9;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.875rem;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #293548; }
    
    code {
      background: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #06b6d4;
    }
    
    .alert {
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid;
    }
    .alert.error {
      background: #7f1d1d;
      border-color: #ef4444;
      color: #fecaca;
    }
    .alert.warn {
      background: #78350f;
      border-color: #f59e0b;
      color: #fed7aa;
    }
    .alert.info {
      background: #164e63;
      border-color: #06b6d4;
      color: #a5f3fc;
    }
    .alert.success {
      background: #14532d;
      border-color: #10b981;
      color: #a7f3d0;
    }
    
    .timestamp {
      color: #64748b;
      font-size: 0.875rem;
      margin-bottom: 24px;
    }
    
    ul { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    
    .empty { text-align: center; padding: 32px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗺️ AIBOS Dependency Map</h1>
    <p class="timestamp">Generated: ${new Date().toISOString()}</p>
    
    <div class="stats">
      <div class="stat-card">
        <h3>Total Files</h3>
        <div class="value">${graph.summary.totalFiles}</div>
      </div>
      <div class="stat-card">
        <h3>Dependencies</h3>
        <div class="value">${graph.summary.totalEdges}</div>
      </div>
      <div class="stat-card ${graph.summary.violationCount > 0 ? 'error' : 'success'}">
        <h3>Violations</h3>
        <div class="value">${graph.summary.violationCount}</div>
      </div>
      <div class="stat-card ${graph.summary.orphanCount > 0 ? 'warn' : 'success'}">
        <h3>Orphan Files</h3>
        <div class="value">${graph.summary.orphanCount}</div>
      </div>
    </div>
    
    ${
      graph.summary.violationCount === 0 && graph.summary.orphanCount === 0
        ? '<div class="alert success">✅ No violations detected! Architecture boundaries are respected.</div>'
        : ''
    }
    
    ${
      graph.summary.violationCount > 0
        ? `<div class="alert error">⚠️ <strong>${graph.summary.violationCount} architecture violations detected.</strong> See details below.</div>`
        : ''
    }
    
    <h2>📊 Architecture Layers</h2>
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Layer</th>
          <th>Description</th>
          <th>Color</th>
        </tr>
      </thead>
      <tbody>
        ${graph.nodes
          .map(
            n => `
          <tr>
            <td>${n.order}</td>
            <td><code>${n.name}</code></td>
            <td>${n.description}</td>
            <td><span style="display:inline-block;width:20px;height:20px;background:${n.color};border-radius:4px;"></span> ${n.color}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    
    <h2>🔗 Layer Dependencies</h2>
    <table>
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Imports</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${edgeRows || '<tr><td colspan="4" class="empty">No dependencies found</td></tr>'}
      </tbody>
    </table>

    <h2>🧭 Layer Connectivity</h2>
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Incoming</th>
          <th>Outgoing</th>
        </tr>
      </thead>
      <tbody>
        ${degreeRows || '<tr><td colspan="3" class="empty">No connectivity data</td></tr>'}
      </tbody>
    </table>
    
    ${
      graph.violations.length > 0
        ? `
      <h2>⚠️ Architecture Violations</h2>
      <div class="alert warn">
        These imports violate the architecture boundaries defined in <code>eslint.config.js</code>.
        Fix by refactoring dependencies to follow the correct flow.
      </div>
      <table>
        <thead>
          <tr>
            <th>From Layer</th>
            <th>To Layer</th>
            <th>Source File</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          ${violationRows}
        </tbody>
      </table>
      <h3>Top Offending Edges</h3>
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Violations</th>
          </tr>
        </thead>
        <tbody>
          ${offendingRows || '<tr><td colspan="3" class="empty">No aggregated violations</td></tr>'}
        </tbody>
      </table>
    `
        : ''
    }
    
    ${
      graph.orphans.length > 0
        ? `
      <h2>🔶 Orphan Files</h2>
      <div class="alert warn">
        These files have no outgoing dependencies. They may be unused or entry points.
      </div>
      <ul>
        ${orphanList}
      </ul>
      ${graph.orphans.length > 50 ? `<p><em>... and ${graph.orphans.length - 50} more</em></p>` : ''}
    `
        : ''
    }
    
    <h2>📖 Reference</h2>
    <div class="alert info">
      <strong>Expected Architecture Flow:</strong><br>
      DB → Adapters → Ports → Services → Policies/PostingRules → Contracts → API (BFF) → UI/Worker
      <br><br>
      See <code>eslint.config.js</code> for full boundary definitions.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Main execution
 */
async function main() {
  console.error('[dependency-mapper] Discovering files...');
  const { files, stats } = await discoverFiles();

  console.error('[dependency-mapper] Analyzing dependencies...');
  const cruiseData = getDependencyCruiserData();

  console.error('[dependency-mapper] Building layer graph...');
  const graph = buildLayerGraph(cruiseData);

  console.error(
    `[dependency-mapper] Found ${graph.summary.totalFiles} files, ${graph.summary.totalEdges} dependencies`
  );
  if (graph.summary.violationCount > 0) {
    console.error(
      `[dependency-mapper] ⚠️  ${graph.summary.violationCount} violations detected`
    );
  }
  if (graph.summary.orphanCount > 0) {
    console.error(
      `[dependency-mapper] ⚠️  ${graph.summary.orphanCount} orphan files detected`
    );
  }

  let content = '';
  if (format === 'mermaid') {
    content = toMermaid(graph);
  } else if (format === 'html') {
    content = toHTML(graph);
  } else {
    content = toJSON(graph, files);
  }

  if (output) {
    const outPath = path.isAbsolute(output)
      ? output
      : path.join(repoRoot, output);
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outPath, content, 'utf8');
    console.error(`[dependency-mapper] ✅ Wrote ${format} → ${outPath}`);
  } else {
    process.stdout.write(content);
  }

  // Exit with error based on --fail-on option (for CI)
  if (
    failOn === 'any' &&
    (graph.summary.violationCount > 0 || graph.summary.orphanCount > 50)
  ) {
    console.error('[dependency-mapper] ❌ Failing due to --fail-on=any');
    process.exit(1);
  }
  if (failOn === 'violations' && graph.summary.violationCount > 0) {
    console.error('[dependency-mapper] ❌ Failing due to violations');
    process.exit(1);
  }
  // failOn === 'none': never exit with error
}

main().catch(err => {
  console.error('[dependency-mapper] Fatal error:', err);
  process.exit(1);
});
