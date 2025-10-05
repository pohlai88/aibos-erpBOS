# Optimized Worker Dockerfile with multi-stage build
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
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Copy source code
COPY apps/worker/src/ ./apps/worker/src/
COPY apps/worker/tsconfig.json ./apps/worker/

# Build the application
RUN pnpm --filter @aibos/worker build

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY scripts/ ./scripts/

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies (only production dependencies)
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/apps/worker/dist/src ./apps/worker/dist
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json

# Set environment variables for production
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://aibos:aibos@db:5432/aibos

# Run the application
CMD ["pnpm", "--filter", "@aibos/worker", "start"]
