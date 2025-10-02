import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.{test,spec}.{js,ts,tsx}'],
        exclude: ['node_modules', '.next', 'dist'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './app'),
            '@contracts': resolve(__dirname, '../../packages/contracts/src'),
            '@db': resolve(__dirname, '../../packages/adapters/db/src'),
        },
    },
});
