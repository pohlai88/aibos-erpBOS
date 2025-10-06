import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'http/ping.schema.ts',
    'http/sales/sales-invoice.schema.ts',
    'http/purchase/purchase-invoice.schema.ts',
  ],
  format: ['esm', 'cjs'],
  dts: false, // d.ts from tsc
  clean: false, // Don't clean - preserve .d.ts files from tsc
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  target: 'es2022',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.js' : '.cjs' }; // keep .js for ESM, .cjs for CJS
  },
});
