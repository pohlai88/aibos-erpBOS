import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/m01-core-ledger/test-setup.ts'],
    globals: true,
    include: ['tests/m01-core-ledger/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['tests/m01-core-ledger/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'tests/m01-core-ledger/fixtures/**',
        'tests/m01-core-ledger/**/*.test.*',
        'tests/m01-core-ledger/**/*.spec.*',
        'node_modules/',
        'test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../apps/web'),
      '@/api': path.resolve(__dirname, '../../apps/bff/app/api'),
      '@/lib': path.resolve(__dirname, '../../apps/bff/app/lib'),
      '@/hooks': path.resolve(__dirname, '../../apps/web/hooks'),
      '@/components': path.resolve(__dirname, '../../apps/web/components'),
      '@/app': path.resolve(__dirname, '../../apps/web/app'),
    },
  },
});
