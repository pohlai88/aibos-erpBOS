import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/fx.ts', 'src/tax.ts'], // ensure dist/fx.js + dist/tax.js exist
  format: ['esm', 'cjs'],
  dts: false,
  clean: false, // Don't clean - preserve .d.ts files from tsc
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  target: 'es2022',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.js' : '.cjs' };
  },
});
