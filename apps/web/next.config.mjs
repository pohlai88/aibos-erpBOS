export default {
    eslint: {
        // Disable ESLint during builds to avoid circular structure warnings
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3000/api/:path*',
            },
        ];
    },
};
