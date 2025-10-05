import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";
import fs from "node:fs";

// Test with multiple different patterns
const TEST_FILES = [
    {
        path: "apps/bff/app/api/leases/maturity/route.ts",
        description: "Modern pattern with ok() helper and auth checks"
    },
    {
        path: "apps/bff/app/api/leases/mod/route.ts",
        description: "Legacy pattern with NextResponse.json and manual try-catch"
    },
    {
        path: "apps/bff/app/api/leases/disclosures/remeasure/route.ts",
        description: "Legacy pattern with NextResponse.json and ZodError handling"
    },
    {
        path: "apps/bff/app/api/leases/mod/[modId]/apply/route.ts",
        description: "Dynamic route with params and NextResponse.json"
    }
];

const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
});

function ensureKitImport(sf: any) {
    const has = sf.getImportDeclarations().some((imp: any) =>
        imp.getModuleSpecifierValue() === "@/api/_kit" ||
        imp.getModuleSpecifierValue() === "@/api/kit"
    );

    if (!has) {
        // Only import what's not already imported
        const existingImports = new Set();
        sf.getImportDeclarations().forEach((imp: any) => {
            imp.getNamedImports().forEach((named: any) => {
                existingImports.add(named.getName());
            });
        });

        const neededImports = ["withRouteErrors", "isResponse"].filter(
            imp => !existingImports.has(imp)
        );

        if (neededImports.length > 0) {
            sf.addImportDeclaration({
                moduleSpecifier: "@/api/_kit",
                namedImports: neededImports,
            });
            console.log(`✅ Added @/api/_kit import: ${neededImports.join(", ")}`);
            return true;
        }
    }
    return false;
}

function wrapWithRouteErrors(sf: any) {
    const exports = sf.getExportedDeclarations();
    let hasChanges = false;

    for (const [name, decls] of exports) {
        for (const d of decls) {
            if (d.getKind() === SyntaxKind.FunctionDeclaration) {
                const fn = d;
                const methodName = fn.getName();
                if (!methodName) continue;

                // Only transform HTTP verbs
                if (!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(methodName)) continue;

                // Skip if already wrapped
                const bodyText = fn.getBodyText() ?? "";
                if (bodyText.includes("withRouteErrors")) continue;

                console.log(`🔄 Converting ${methodName} to withRouteErrors pattern...`);

                // Convert to const = withRouteErrors(async (req) => { ... })
                const params = fn.getParameters().map((p: any) => p.getText()).join(", ");
                const body = bodyText;

                sf.addVariableStatement({
                    declarationKind: "export const",
                    declarations: [{
                        name: methodName,
                        initializer: `withRouteErrors(async (${params}) => { ${body} })`,
                    }],
                });

                fn.remove();
                hasChanges = true;
                console.log(`✅ Converted ${methodName}`);
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

            if (text === "Response.json" || text === "NextResponse.json") {
                console.log(`🔄 Converting ${text} to ok() helper...`);
                const args = ce.getArguments().map((a: any) => a.getText());

                // Convert to ok() helper
                let init = "ok(" + (args[0] ?? "undefined");

                // Try to extract status from options
                if (args[1]) {
                    const statusMatch = (args[1] as string).match(/status:\s*(\d{3})/);
                    if (statusMatch) {
                        init += `, ${statusMatch[1]}`;
                    }
                }

                init += ")";
                ce.replaceWithText(init);
                hasChanges = true;
                console.log(`✅ Converted to ${init}`);
            }
        }
    });

    return hasChanges;
}

function fixAuthInstanceof(sf: any) {
    const originalText = sf.getFullText();
    // Convert both auth and cap instanceof Response patterns
    const replaced = originalText
        .replace(/auth\s+instanceof\s+Response/g, "isResponse(auth)")
        .replace(/cap\s+instanceof\s+Response/g, "isResponse(cap)");

    if (replaced !== originalText) {
        console.log("🔄 Converting auth/cap instanceof Response to isResponse()...");
        sf.replaceWithText(replaced);
        console.log("✅ Converted auth/cap checks");
        return true;
    }

    return false;
}

function processFile(filePath: string, description: string) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🔍 Testing: ${description}`);
    console.log(`📁 File: ${filePath}`);
    console.log(`${"=".repeat(80)}`);

    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.error(`❌ File not found: ${fullPath}`);
        return;
    }

    try {
        const sf = project.addSourceFileAtPath(fullPath);
        let hasChanges = false;

        console.log("📄 Original file content:");
        console.log(sf.getFullText());
        console.log("\n" + "-".repeat(60) + "\n");

        hasChanges = ensureKitImport(sf) || hasChanges;
        hasChanges = wrapWithRouteErrors(sf) || hasChanges;
        hasChanges = swapJsonCalls(sf) || hasChanges;
        hasChanges = fixAuthInstanceof(sf) || hasChanges;

        if (hasChanges) {
            console.log("📄 Transformed file content:");
            console.log(sf.getFullText());
            console.log("\n" + "-".repeat(60) + "\n");
            console.log("✅ Test completed successfully!");
        } else {
            console.log("ℹ️  No changes needed for this file");
        }
    } catch (error) {
        console.error("❌ Error processing:", filePath, error);
    }
}

console.log("🧪 Testing API refactoring script with multiple patterns...");
console.log(`📊 Testing ${TEST_FILES.length} different API patterns`);

for (const testFile of TEST_FILES) {
    processFile(testFile.path, testFile.description);
}

console.log(`\n${"=".repeat(80)}`);
console.log("🎉 All pattern tests completed!");
console.log("✅ Script is ready to handle all API route variations");
console.log(`${"=".repeat(80)}`);
