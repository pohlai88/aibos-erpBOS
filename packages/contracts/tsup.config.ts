import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/reports/cash.ts", "src/common/result.ts"],
  format: ["esm", "cjs"],
  dts: false,           // d.ts from tsc
  clean: true,
  outDir: "dist",
  splitting: false,
  treeshake: true,
  target: "es2022",
  outExtension({ format }) {
    return { js: format === "esm" ? ".js" : ".cjs" }; // keep .js for ESM, .cjs for CJS
  }
});
