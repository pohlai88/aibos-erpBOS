import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],     // -> .mjs + .cjs
    dts: false,                  // -> index.d.ts
    sourcemap: true,            // -> .map
    clean: true,
    treeshake: true,
    target: "es2020",
    outDir: "dist",
    splitting: false,
    external: ["@aibos/contracts", "@aibos/ports", "@aibos/posting-rules", "@aibos/policies", "@aibos/db-adapter", "@aibos/utils"],
    tsconfig: "./tsconfig.json"
});
