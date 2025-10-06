import { Project, SyntaxKind, VariableDeclarationKind } from 'ts-morph';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(process.cwd(), 'apps/bff/app/api');
const KIT_MODULE = process.env.API_KIT_ALIAS || '@/api/_kit';

// CLI flags
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry') || args.has('-n');
const REMOVE_OPTIONS = args.has('--remove-options');
const USE_IS_RESPONSE = args.has('--use-isresponse'); // opt-in
const FORCE = args.has('--force'); // override safe-skip

// Stats tracking
let updatedCount = 0,
  skippedRisky = 0,
  metaOnly = 0,
  totalScanned = 0;

const project = new Project({
  tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.json'),
});

function ensureKitImport(sf: import('ts-morph').SourceFile) {
  // Normalize any "@/api/kit" to KIT_MODULE to avoid split imports
  sf.getImportDeclarations()
    .filter(imp => imp.getModuleSpecifierValue() === '@/api/kit')
    .forEach(imp => imp.setModuleSpecifier(KIT_MODULE));

  // If multiple imports from KIT_MODULE exist (rare), merge into one
  const kitImports = sf
    .getImportDeclarations()
    .filter(imp => imp.getModuleSpecifierValue() === KIT_MODULE);
  if (kitImports.length > 1) {
    const allNames = new Set<string>();
    kitImports.forEach(imp =>
      imp.getNamedImports().forEach(n => allNames.add(n.getName()))
    );
    kitImports.slice(1).forEach(imp => imp.remove());
    const primary = kitImports[0];
    const existing = new Set(primary.getNamedImports().map(n => n.getName()));
    [...allNames].forEach(n => {
      if (!existing.has(n)) primary.addNamedImport(n);
    });
  }

  const existing = new Set<string>();
  let kitDecl = sf
    .getImportDeclarations()
    .find(imp => imp.getModuleSpecifierValue() === KIT_MODULE);
  sf.getImportDeclarations().forEach(imp => {
    imp.getNamedImports().forEach(named => existing.add(named.getName()));
  });

  // Decide what we actually need based on file text
  const text = sf.getFullText();
  const needs = new Set<string>();
  if (text.includes('withRouteErrors(')) needs.add('withRouteErrors');
  if (/\bisResponse\(/.test(text)) needs.add('isResponse');
  if (/\bok\(/.test(text)) needs.add('ok');
  if (/\bbadRequest\(/.test(text)) needs.add('badRequest');

  const toAdd = [...needs].filter(n => !existing.has(n));
  if (toAdd.length === 0) return false;

  if (!kitDecl) {
    sf.addImportDeclaration({
      moduleSpecifier: KIT_MODULE,
      namedImports: toAdd,
    });
  } else {
    const names = new Set(kitDecl.getNamedImports().map(n => n.getName()));
    toAdd.forEach(n => {
      if (!names.has(n)) kitDecl!.addNamedImport(n);
    });
  }
  return true;
}

function wrapWithRouteErrors(sf: import('ts-morph').SourceFile) {
  const exports = sf.getExportedDeclarations();
  let hasChanges = false;

  // If file already has const exports wrapped, skip those
  const wrappedConst = new Set(
    sf
      .getVariableStatements()
      .filter(
        vs =>
          vs.getDeclarationKind() === VariableDeclarationKind.Const &&
          /export/.test(vs.getText())
      )
      .flatMap(vs => vs.getDeclarations())
      .filter(d => /\bwithRouteErrors\s*\(/.test(d.getText()))
      .map(d => d.getName())
  );

  for (const [name, decls] of exports) {
    for (const d of decls) {
      if (d.getKind() === SyntaxKind.FunctionDeclaration) {
        const fn = d.asKindOrThrow(SyntaxKind.FunctionDeclaration);
        const methodName = fn.getName();
        if (!methodName) continue;

        // Optional: drop per-file OPTIONS if we use global CORS
        if (REMOVE_OPTIONS && methodName === 'OPTIONS') {
          const body = fn.getBodyText() ?? '';
          const harmless =
            /new\s+Response\(null,\s*\{\s*status:\s*204[\s\S]*?\}\s*\)/.test(
              body
            );
          if (!harmless) {
            console.warn(
              '⚠️  OPTIONS has custom logic, skip removal:',
              sf.getFilePath()
            );
          } else {
            fn.remove();
            hasChanges = true;
            continue;
          }
        }

        // Only transform HTTP verbs
        if (
          !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(
            methodName
          )
        )
          continue;
        if (wrappedConst.has(methodName)) continue; // already exported as wrapped const

        // Skip if already wrapped
        const bodyText = fn.getBodyText() ?? '';
        if (bodyText.includes('withRouteErrors')) continue;

        // Convert to const = withRouteErrors(async (req) => { ... })
        const params = fn
          .getParameters()
          .map((p: any) => p.getText())
          .join(', ');
        const body = bodyText;

        sf.addVariableStatement({
          declarationKind: VariableDeclarationKind.Const,
          declarations: [
            {
              name: methodName,
              initializer: `withRouteErrors(async (${params}) => { ${body} })`,
            },
          ],
          isExported: true,
        });

        fn.remove();
        hasChanges = true;
      }
    }
  }

  return hasChanges;
}

function swapJsonCalls(sf: any) {
  let hasChanges = false;

  sf.forEachDescendant((n: any) => {
    if (n.getKind() === SyntaxKind.CallExpression) {
      const ce = n;
      const text = ce.getExpression().getText();

      if (text === 'Response.json' || text === 'NextResponse.json') {
        const args = ce.getArguments();
        const dataArg = args[0]?.getText() ?? 'undefined';
        let status: string | undefined;
        const second = args[1];
        if (second) {
          const num = second
            .getFirstDescendantByKind?.(SyntaxKind.NumericLiteral)
            ?.getText();
          if (num && /^\d{3}$/.test(num)) status = num;
          // { status: 201, headers: ... }
          const statusProp = second.getFirstDescendant?.(
            (d: any) =>
              d.getKind() === SyntaxKind.PropertyAssignment &&
              d.getFirstChild()?.getText() === 'status'
          );
          const val = statusProp?.getLastChild()?.getText();
          if (!status && val && /^\d{3}$/.test(val)) status = val;
          // If headers present, warn (prefer manual migration / global CORS)
          if (
            second.getText().includes('headers') ||
            second.getText().includes('cookies') ||
            second.getText().includes('content-type') ||
            second.getText().includes('cache')
          ) {
            console.warn(
              '⚠️  Complex Response.json options detected; consider manual check:',
              sf.getFilePath()
            );
          }
        }
        const replacement = status
          ? `ok(${dataArg}, ${status})`
          : `ok(${dataArg})`;
        ce.replaceWithText(replacement);
        hasChanges = true;
      }
    }
  });

  return hasChanges;
}

function fixAuthInstanceof(sf: import('ts-morph').SourceFile) {
  if (!USE_IS_RESPONSE) return false; // keep current idiom by default
  const originalText = sf.getFullText();
  // Replace ANY <ident> instanceof Response  -> isResponse(<ident>)
  const replaced = originalText.replace(
    /\b([A-Za-z_]\w*)\s+instanceof\s+Response\b/g,
    'isResponse($1)'
  );

  if (replaced !== originalText) {
    sf.replaceWithText(replaced);
    return true;
  }

  return false;
}

function processFile(filePath: string) {
  try {
    totalScanned++;
    const sf = project.addSourceFileAtPath(filePath);

    // If the file only contains route metadata exports, skip quickly
    const text0 = sf.getFullText();
    const onlyMeta =
      /\bexport\s+const\s+(runtime|preferredRegion|dynamic|revalidate)\b/.test(
        text0
      ) &&
      !/\bexport\s+(async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\b/.test(
        text0
      );
    if (onlyMeta) {
      if (DRY_RUN) console.log('⏭️  Meta-only route file, skipping:', filePath);
      metaOnly++;
      return;
    }

    // SAFE MODE: skip likely non-JSON/complex responders unless --force
    if (!FORCE) {
      const t = sf.getFullText();
      const risky =
        t.includes('new Response(') ||
        t.includes('ReadableStream') ||
        t.includes('NextResponse.redirect');
      if (risky) {
        if (DRY_RUN)
          console.log(
            '⏭️  Would skip risky file (use --force to include):',
            filePath
          );
        else
          console.log(
            '⏭️  Skipping risky file (use --force to include):',
            filePath
          );
        skippedRisky++;
        return;
      }
    }
    let changed = false;

    // Run transforms in order so imports reflect final code usage
    changed = wrapWithRouteErrors(sf) || changed;
    changed = swapJsonCalls(sf) || changed;
    changed = fixAuthInstanceof(sf) || changed;
    changed = ensureKitImport(sf) || changed;

    if (changed) {
      if (!DRY_RUN) sf.saveSync();
      console.log(DRY_RUN ? '🧪 Would update:' : '✅ Updated:', filePath);
      updatedCount++;
    }
  } catch (error) {
    console.error('❌ Error processing:', filePath, error);
  }
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (entry.isFile() && /^route\.tsx?$/.test(entry.name)) {
      processFile(p);
    }
  }
}

console.log('🔧 Starting API pattern refactoring...');
console.log('📁 Scanning:', ROOT);
if (DRY_RUN) console.log('🧪 DRY RUN MODE - No files will be modified');
if (REMOVE_OPTIONS) console.log('🗑️  Will remove per-file OPTIONS handlers');
if (!USE_IS_RESPONSE)
  console.log(
    '🔒 Keeping `instanceof Response` (add --use-isresponse to convert)'
  );
if (!FORCE)
  console.log(
    '🛡️ Safe mode ON (skips streams/redirects/new Response) — add --force to override'
  );

walk(ROOT);

if (!DRY_RUN) project.saveSync();
console.log(
  DRY_RUN ? '🧪 Dry run completed.' : '✅ API pattern refactoring completed!'
);
console.log(
  "💡 Run 'pnpm api:wrap:check' to verify all routes are properly wrapped"
);
console.log(
  `📊 Summary: updated=${updatedCount} skipped_risky=${skippedRisky} meta_only=${metaOnly} total_scanned=${totalScanned}`
);
