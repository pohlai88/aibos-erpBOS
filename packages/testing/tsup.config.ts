import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // -> .mjs + .cjs
  dts: false, // -> tsc -b handles types
  sourcemap: true, // -> .map
  clean: false, // Don't clean - preserve .d.ts files from tsc
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
  splitting: false,
});
