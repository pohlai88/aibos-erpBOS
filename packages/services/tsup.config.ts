import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/ledger.ts",
    "src/posting.ts",
    "src/posting-pi.ts",
    "src/ping.ts",
    "src/reports/cash-builder.ts",
    "src/reversal.ts"
  ],
  format: ["esm", "cjs"],
  dts: false,           // d.ts from tsc
  clean: false,               // Don't clean - preserve .d.ts files from tsc
  outDir: "dist",
  splitting: false,
  treeshake: true,
  target: "es2022",
  outExtension({ format }) {
    return { js: format === "esm" ? ".js" : ".cjs" };
  }
});