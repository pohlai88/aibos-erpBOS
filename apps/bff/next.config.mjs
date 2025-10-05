import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
export default {
    eslint: {
        // Disable ESLint during builds to avoid circular structure warnings
        ignoreDuringBuilds: true,
    },
    webpack: (config) => {
        // Alias for db-adapter to use built files
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname, 'app'),
            '@aibos/db-adapter': path.resolve(__dirname, '../../packages/adapters/db/dist'),
            '@aibos/db-adapter/schema': path.resolve(__dirname, '../../packages/adapters/db/dist/schema.js'),
        };
        return config;
    },
};
