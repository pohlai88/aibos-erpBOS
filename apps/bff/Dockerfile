# Optimized BFF Dockerfile with multi-stage build
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY scripts/ ./scripts/

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/bff/package.json ./apps/bff/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Copy source code
COPY apps/bff/app/ ./apps/bff/app/
COPY apps/bff/next.config.mjs ./apps/bff/
COPY apps/bff/tsconfig.json ./apps/bff/
COPY apps/bff/src/ ./apps/bff/src/

# Build the application
RUN pnpm --filter @aibos/bff build

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY scripts/ ./scripts/

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/bff/package.json ./apps/bff/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/apps/bff/.next/ ./apps/bff/.next/
COPY --from=builder /app/apps/bff/public/ ./apps/bff/public/
COPY apps/bff/next.config.mjs ./apps/bff/

# Expose port
EXPOSE 3000

# Install curl for health checks
RUN apk add --no-cache curl

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://aibos:aibos@db:5432/aibos

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/healthz || exit 1

# Start the application
CMD ["pnpm", "--filter", "@aibos/bff", "start"]
