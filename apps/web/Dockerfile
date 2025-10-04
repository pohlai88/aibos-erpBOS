# Optimized Web Dockerfile with multi-stage build
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
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Copy source code
COPY apps/web/app/ ./apps/web/app/
COPY apps/web/next.config.mjs ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/lib/ ./apps/web/lib/

# Build the application
RUN pnpm --filter @aibos/web build

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
COPY apps/web/package.json ./apps/web/

# Install dependencies (only production dependencies)
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Install curl for health checks
RUN apk add --no-cache curl

# Set environment variables for production
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Run the application
CMD ["pnpm", "--filter", "@aibos/web", "start"]
