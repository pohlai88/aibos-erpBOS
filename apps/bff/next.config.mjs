/** @type {import('next').NextConfig} */
export default {
    eslint: {
        // Disable ESLint during builds to avoid circular structure warnings
        ignoreDuringBuilds: true,
    },
};
