/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Disable ESLint during builds to avoid circular structure warnings
        ignoreDuringBuilds: true,
    },
    transpilePackages: [
        "@aibos/api-client",
        "@aibos/contracts",
        "@aibos/ports",
        "@aibos/posting-rules",
        "@aibos/policies",
        "@aibos/services"
    ],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3000/api/:path*',
            },
        ];
    },
};

export default nextConfig;
