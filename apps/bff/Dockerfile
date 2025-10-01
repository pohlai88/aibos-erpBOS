# BFF Dockerfile for stable testing
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./

# Copy workspace packages (excluding node_modules)
COPY packages/ ./packages/
COPY apps/bff/package.json ./apps/bff/
COPY apps/bff/app/ ./apps/bff/app/
COPY apps/bff/next.config.mjs ./apps/bff/
COPY apps/bff/tsconfig.json ./apps/bff/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://aibos:aibos@db:5432/aibos

# Start the application
CMD ["pnpm", "--filter", "@aibos/bff", "start"]
