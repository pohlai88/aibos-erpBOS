# AI-BOS ERP Business Operating System

AI-powered ERP Business Operating System built with modern TypeScript stack.

## Package Manager Policy

This repository is **pnpm-only**. All package management operations must use pnpm.

### Quick Commands

- **Install dependencies**: `pnpm install` or `pnpm i`
- **Add dependency**: `pnpm add <package>` (workspace) or `pnpm add <package> -w` (root)
- **Remove dependency**: `pnpm remove <package>`
- **Run scripts**: `pnpm <script>` or `pnpm run <script>`
- **Workspace operations**: `pnpm --filter <workspace> <command>`

### Enforcement

The repository includes automatic guards that will:

- ❌ **Hard-fail** any `npm` or `yarn` install attempts
- ✅ **Verify** pnpm usage before any package operations
- 🧹 **Block** non-pnpm lockfiles from being committed

### Development Setup

1. **Enable Corepack** (one-time setup):

   ```bash
   corepack enable
   corepack prepare pnpm@10.17.1 --activate
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start development**:
   ```bash
   pnpm dev
   ```

### Workspace Structure

This is a Turborepo monorepo with the following workspaces:

- `apps/bff` - Backend for Frontend API
- `apps/web` - Next.js web application
- `apps/worker` - Background worker processes
- `packages/*` - Shared packages and utilities

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests
- `pnpm type-check` - TypeScript type checking

### Troubleshooting

If you encounter package manager issues:

1. Ensure you're using pnpm: `pnpm --version`
2. Clear cache: `pnpm store prune`
3. Reinstall: `rm -rf node_modules && pnpm install`

For more information, visit [pnpm.io](https://pnpm.io/).
