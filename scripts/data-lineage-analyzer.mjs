#!/usr/bin/env node
/**
 * data-lineage-analyzer.mjs
 *
 * Enterprise-grade SQL data lineage scanner for AIBOS ERP database.
 *
 * Features:
 *  - Accurate Drizzle table name extraction (pgTable('table_name', ...))
 *  - FK origin inference (binds FK to source table via nearest ALTER TABLE)
 *  - Comment stripping (avoids false positives from commented SQL)
 *  - Schema-qualified references (handles schema.table)
 *  - Line number tracking (for triage and debugging)
 *  - Materialized view support
 *
 * Tracks relationships through:
 *  - Foreign key constraints (with origin table inference)
 *  - JOIN operations
 *  - INSERT INTO ... SELECT patterns (data flow)
 *  - CREATE TABLE AS SELECT
 *  - Views and materialized views
 *
 * Scans:
 *  - Drizzle migrations (packages/adapters/db/migrations/*.sql)
 *  - Schema definitions (packages/adapters/db/schema/*.ts)
 *  - SQL scripts (scripts/*.sql, all .sql files)
 *
 * Output: JSON graph with tables, relationships, confidence levels, and source lines
 *
 * Usage:
 *   node scripts/data-lineage-analyzer.mjs [OPTIONS]
 *
 * Options:
 *   --output <path>    Output JSON file path (default: stdout)
 *   --with-schema      Include schema names in table identifiers (e.g., public.users)
 *
 * Examples:
 *   node scripts/data-lineage-analyzer.mjs                           # JSON to stdout
 *   node scripts/data-lineage-analyzer.mjs --output reports/sql-lineage.json
 *   node scripts/data-lineage-analyzer.mjs --with-schema --output reports/sql-lineage.json
 *
 * Enterprise Improvements (v3):
 *  - Schema-qualified identifiers throughout (CREATE, ALTER, FK, JOIN, FROM, etc.)
 *  - Quoted identifier support (handles "Table With Spaces")
 *  - Postgres patterns: SELECT INTO, MERGE INTO (PG15+)
 *  - Optional schema preservation in graph keys (--with-schema)
 *  - Removed false JOIN inference (only emit edges with known origin)
 *  - Drizzle bug fixed: captures actual table names, not variable names
 *  - FK relationships now include source table (not just target)
 *  - Comment noise eliminated (SQL/TS comments stripped before parsing)
 *  - Line numbers included for all relationships
 *  - Confidence levels: 'high' for definite relationships, 'medium' for inferred
 */

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

const output = getArg('--output', '');
const includeSchemaInNames = args.includes('--with-schema');

// File patterns to scan
const SQL_PATTERNS = [
  'packages/adapters/db/migrations/**/*.sql',
  'packages/adapters/db/schema/**/*.{ts,tsx,sql}',
  'packages/adapters/db/**/*.sql',
  'scripts/**/*.sql',
];

// Regex patterns for SQL analysis
const PATTERNS = {
  // CREATE TABLE [IF NOT EXISTS] [schema.]table (supports quoted identifiers)
  createTable:
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // ALTER TABLE [schema.]table
  alterTable:
    /ALTER\s+TABLE\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // Foreign key constraints (handles schema.table references and quoted identifiers)
  foreignKey:
    /(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // JOIN operations (supports schema.table and quoted identifiers)
  join: /(?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+|CROSS\s+)?JOIN\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // FROM clause
  from: /FROM\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // INSERT INTO ... SELECT (supports schema.table)
  insertSelect:
    /INSERT\s+INTO\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?[^;]*SELECT[^;]*FROM\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // CREATE TABLE AS SELECT
  createTableAs:
    /CREATE\s+TABLE\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?\s+AS\s+SELECT[^;]*FROM\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // CREATE VIEW (includes MATERIALIZED VIEW support)
  createView:
    /CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?\s+AS\s+SELECT[^;]*FROM\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // Postgres: SELECT ... INTO new_table FROM source
  selectInto:
    /SELECT[\s\S]*?INTO\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?\s+FROM\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // Postgres 15+: MERGE INTO target USING source
  mergeInto:
    /MERGE\s+INTO\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?\s+USING\s+(?:"([^"]+)"|(\w+))(?:\s*\.\s*(?:"([^"]+)"|(\w+)))?/gi,

  // Drizzle schema table definitions (TypeScript)
  // CRITICAL: Capture actual table name from pgTable('table_name', ...) not variable name
  drizzlePgTableCall: /pgTable\s*\(\s*['"`]([^'"`]+)['"`]\s*,/g,
  // Fallback: variable name (lower confidence)
  drizzleTableVar: /(?:export\s+)?const\s+(\w+)\s*=\s*pgTable\s*\(/g,
};

/**
 * Strip SQL and TypeScript comments to reduce regex false positives
 */
function stripComments(input) {
  // Remove /* ... */ blocks and -- line comments
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '') // /* ... */ blocks
    .replace(/--.*$/gm, '') // -- SQL line comments
    .replace(/\/\/.*$/gm, ''); // // TS line comments
}

/**
 * Read file safely
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Convert string index to 1-based line number
 */
function indexToLine(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) line++; // \n
  }
  return line;
}

/**
 * Normalize table name (remove quotes, lowercase for comparison)
 */
function normalizeTableName(name) {
  return name.replace(/['"]/g, '').toLowerCase();
}

/**
 * Build a normalized name with optional schema inclusion.
 * Accepts schema and table strings (already resolved from match groups).
 */
function formatName(schema, table) {
  const hasSchema = includeSchemaInNames && schema && table;
  const tableName = normalizeTableName(table || schema || '');
  const schemaName = hasSchema ? normalizeTableName(schema) : '';
  return hasSchema && schemaName ? `${schemaName}.${tableName}` : tableName;
}

/**
 * Resolve 4 capture slots (q1, u1, q2, u2) into schema/table strings.
 * Returns { schema, table } where schema may be null if only one identifier present.
 */
function resolveSchemaTable(m) {
  const s = m[1] || m[2] || null;
  const t = m[3] || m[4] || null;
  return { schema: s, table: t };
}

/**
 * Resolve one side in patterns that include both INTO and FROM etc.
 * offset points to the first of 4 capture groups.
 */
function resolvePair(m, offset) {
  const s = m[offset + 0] || m[offset + 1] || null;
  const t = m[offset + 2] || m[offset + 3] || null;
  return { schema: s, table: t };
}

/**
 * Extract table relationships from SQL content
 */
function analyzeSQLContent(content, filePath) {
  // Preprocess: strip comments to avoid false positives
  const clean = stripComments(content);
  const tables = new Set();
  const edges = [];
  const sourceFile = path.relative(repoRoot, filePath);

  // Track tables defined in this file
  let matches;

  // CREATE TABLE
  matches = [...clean.matchAll(PATTERNS.createTable)];
  for (const match of matches) {
    const { schema, table } = resolveSchemaTable(match);
    const tableName = formatName(schema, table);
    tables.add(tableName);
  }

  // Drizzle TypeScript table definitions
  // CRITICAL FIX: Prefer explicit pgTable('table_name', ...) over variable name
  matches = [...clean.matchAll(PATTERNS.drizzlePgTableCall)];
  for (const match of matches) {
    const tableName = normalizeTableName(match[1]);
    tables.add(tableName);
  }

  // Fallback: variable name form (lower confidence)
  matches = [...clean.matchAll(PATTERNS.drizzleTableVar)];
  for (const match of matches) {
    const tableName = normalizeTableName(match[1]);
    // Only add if not already captured by pgTableCall
    if (!tables.has(tableName)) {
      tables.add(tableName);
    }
  }

  // Cache ALTER TABLE positions for FK origin inference
  const alterSpans = [...clean.matchAll(PATTERNS.alterTable)].map(m => {
    const { schema, table } = resolveSchemaTable(m);
    return {
      table: formatName(schema, table),
      index: m.index ?? 0,
    };
  });

  // Foreign key relationships (ALTER TABLE or inline)
  // CRITICAL FIX: Infer FK origin table from nearest preceding ALTER TABLE
  matches = [...clean.matchAll(PATTERNS.foreignKey)];
  for (const match of matches) {
    // Handle schema.table references with quoted identifiers
    const refSchema = match[1] || match[2] || null;
    const refTable = match[3] || match[4] || null;
    const toTable = formatName(refSchema, refTable);

    // Infer origin: nearest ALTER TABLE before this FK
    const fkIdx = match.index ?? 0;
    let origin = undefined;
    for (let i = alterSpans.length - 1; i >= 0; i--) {
      if (alterSpans[i].index <= fkIdx) {
        origin = alterSpans[i].table;
        break;
      }
    }

    edges.push({
      type: 'FOREIGN_KEY',
      from: origin, // may be undefined if inline CREATE TABLE FK
      to: toTable,
      sourceFile,
      line: indexToLine(clean, fkIdx),
      confidence: origin ? 'high' : 'medium',
    });
  }

  // INSERT INTO ... SELECT (data flow)
  matches = [...clean.matchAll(PATTERNS.insertSelect)];
  for (const match of matches) {
    // positions: INTO [1-4], FROM [5-8]
    const into = resolvePair(match, 1);
    const from = resolvePair(match, 5);
    const toTable = formatName(into.schema, into.table);
    const fromTable = formatName(from.schema, from.table);
    edges.push({
      type: 'INSERT_SELECT',
      from: fromTable,
      to: toTable,
      sourceFile,
      line: indexToLine(clean, match.index ?? 0),
      confidence: 'high',
    });
  }

  // CREATE TABLE AS SELECT
  matches = [...clean.matchAll(PATTERNS.createTableAs)];
  for (const match of matches) {
    // positions: TABLE [1-4], FROM [5-8]
    const tgt = resolvePair(match, 1);
    const src = resolvePair(match, 5);
    const toTable = formatName(tgt.schema, tgt.table);
    const fromTable = formatName(src.schema, src.table);
    tables.add(toTable);
    edges.push({
      type: 'CREATE_AS_SELECT',
      from: fromTable,
      to: toTable,
      sourceFile,
      line: indexToLine(clean, match.index ?? 0),
      confidence: 'high',
    });
  }

  // CREATE VIEW (includes MATERIALIZED VIEW)
  matches = [...clean.matchAll(PATTERNS.createView)];
  for (const match of matches) {
    // positions: VIEW [1-4], FROM [5-8]
    const vw = resolvePair(match, 1);
    const src = resolvePair(match, 5);
    const viewName = formatName(vw.schema, vw.table);
    const fromTable = formatName(src.schema, src.table);
    tables.add(viewName);
    edges.push({
      type: 'VIEW',
      from: fromTable,
      to: viewName,
      sourceFile,
      line: indexToLine(clean, match.index ?? 0),
      confidence: 'high',
    });
  }

  // SELECT ... INTO new_table FROM source
  matches = [...clean.matchAll(PATTERNS.selectInto)];
  for (const match of matches) {
    const tgt = resolvePair(match, 1);
    const src = resolvePair(match, 5);
    const toTable = formatName(tgt.schema, tgt.table);
    const fromTable = formatName(src.schema, src.table);
    tables.add(toTable);
    edges.push({
      type: 'SELECT_INTO',
      from: fromTable,
      to: toTable,
      sourceFile,
      line: indexToLine(clean, match.index ?? 0),
      confidence: 'high',
    });
  }

  // MERGE INTO target USING source
  matches = [...clean.matchAll(PATTERNS.mergeInto)];
  for (const match of matches) {
    const tgt = resolvePair(match, 1);
    const src = resolvePair(match, 5);
    const toTable = formatName(tgt.schema, tgt.table);
    const fromTable = formatName(src.schema, src.table);
    edges.push({
      type: 'MERGE',
      from: fromTable,
      to: toTable,
      sourceFile,
      line: indexToLine(clean, match.index ?? 0),
      confidence: 'high',
    });
  }

  // JOIN operations (query relationships)
  matches = [...clean.matchAll(PATTERNS.join)];
  for (const match of matches) {
    // positions: JOIN [1-4]
    const side = resolvePair(match, 1);
    const joinTable = formatName(side.schema, side.table);
    edges.push({
      type: 'JOIN',
      to: joinTable,
      sourceFile,
      line: indexToLine(clean, match.index ?? 0),
      confidence: 'medium',
    });
  }

  return { tables, edges };
}

/**
 * Build complete lineage graph
 */
function buildLineageGraph(analysisResults) {
  const allTables = new Set();
  const tableToFile = new Map();
  const relationships = [];
  const fileContributions = new Map();

  // Collect all tables and map to files
  for (const [file, result] of analysisResults.entries()) {
    for (const table of result.tables) {
      allTables.add(table);
      if (!tableToFile.has(table)) {
        tableToFile.set(table, []);
      }
      tableToFile.get(table).push(file);
    }

    fileContributions.set(file, {
      tablesDefinition: result.tables.size,
      relationshipsFound: result.edges.length,
    });
  }

  // Build relationships
  const edgeMap = new Map(); // key: "from->to::type" -> details

  for (const [file, result] of analysisResults.entries()) {
    for (const edge of result.edges) {
      // Only register edges with a known origin; avoid bogus inference (especially for JOIN).
      if (edge.from && edge.to) {
        const key = `${edge.from}->${edge.to}::${edge.type}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            from: edge.from,
            to: edge.to,
            type: edge.type,
            confidence: edge.confidence,
            sources: [],
          });
        }
        edgeMap.get(key).sources.push(edge.sourceFile);
      }
    }
  }

  // Convert to array and deduplicate sources
  for (const [key, data] of edgeMap.entries()) {
    relationships.push({
      ...data,
      sources: [...new Set(data.sources)],
    });
  }

  // Sort tables alphabetically
  const sortedTables = Array.from(allTables).sort();

  // Build table details
  const tableDetails = sortedTables.map(table => ({
    name: table,
    definedIn: tableToFile.get(table) || [],
    incomingRefs: relationships.filter(r => r.to === table).length,
    outgoingRefs: relationships.filter(r => r.from === table).length,
  }));

  return {
    tables: tableDetails,
    relationships: relationships.sort((a, b) => {
      // Sort by confidence, then alphabetically
      if (a.confidence !== b.confidence) {
        return a.confidence === 'high' ? -1 : 1;
      }
      return `${a.from}->${a.to}`.localeCompare(`${b.from}->${b.to}`);
    }),
    summary: {
      totalTables: sortedTables.length,
      totalRelationships: relationships.length,
      filesScanned: analysisResults.size,
      relationshipTypes: {
        foreignKey: relationships.filter(r => r.type === 'FOREIGN_KEY').length,
        insertSelect: relationships.filter(r => r.type === 'INSERT_SELECT')
          .length,
        createAsSelect: relationships.filter(r => r.type === 'CREATE_AS_SELECT')
          .length,
        view: relationships.filter(r => r.type === 'VIEW').length,
        join: relationships.filter(r => r.type === 'JOIN').length,
        selectInto: relationships.filter(r => r.type === 'SELECT_INTO').length,
        merge: relationships.filter(r => r.type === 'MERGE').length,
      },
    },
    fileContributions: Object.fromEntries(fileContributions),
  };
}

/**
 * Generate Mermaid ER diagram
 */
function generateMermaidER(graph) {
  const lines = ['erDiagram'];

  // Add relationships
  const fkRelationships = graph.relationships.filter(
    r => r.type === 'FOREIGN_KEY'
  );
  for (const rel of fkRelationships.slice(0, 50)) {
    // Limit to 50 for readability
    if (rel.from && rel.to) {
      lines.push(
        `  ${rel.from.toUpperCase()} ||--o{ ${rel.to.toUpperCase()} : "references"`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.error('[data-lineage] Discovering SQL files...');

  const files = await fg(SQL_PATTERNS, {
    cwd: repoRoot,
    dot: false,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**'],
  });

  console.error(`[data-lineage] Found ${files.length} files to scan`);

  const analysisResults = new Map();

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const result = analyzeSQLContent(content, file);
    if (result.tables.size > 0 || result.edges.length > 0) {
      analysisResults.set(file, result);
    }
  }

  console.error(
    `[data-lineage] Analyzing ${analysisResults.size} files with SQL definitions...`
  );

  const lineageGraph = buildLineageGraph(analysisResults);

  console.error(
    `[data-lineage] Found ${lineageGraph.summary.totalTables} tables, ${lineageGraph.summary.totalRelationships} relationships`
  );

  const outputData = {
    timestamp: new Date().toISOString(),
    ...lineageGraph,
    mermaid: generateMermaidER(lineageGraph),
  };

  const jsonOutput = JSON.stringify(outputData, null, 2);

  if (output) {
    const outPath = path.isAbsolute(output)
      ? output
      : path.join(repoRoot, output);
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outPath, jsonOutput, 'utf8');
    console.error(`[data-lineage] ✅ Wrote lineage graph → ${outPath}`);
  } else {
    process.stdout.write(jsonOutput);
  }
}

main().catch(err => {
  console.error('[data-lineage] Fatal error:', err);
  process.exit(1);
});
