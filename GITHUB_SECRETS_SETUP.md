# 🔐 GitHub Secrets Setup Guide

This guide explains how to configure GitHub Secrets for the AI-BOS ERP System to securely manage sensitive credentials and API keys in CI/CD workflows and deployments.

## 📋 Table of Contents

- [Overview](#overview)
- [Required Secrets](#required-secrets)
- [Setting Up Secrets in GitHub](#setting-up-secrets-in-github)
- [Using Secrets in GitHub Actions](#using-secrets-in-github-actions)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

GitHub Secrets provide a secure way to store sensitive information that your workflows and applications need. These secrets are encrypted and only exposed to selected GitHub Actions workflows.

### Types of Secrets

1. **Repository Secrets**: Available to all workflows in the repository
2. **Environment Secrets**: Specific to deployment environments (dev, staging, production)
3. **Organization Secrets**: Shared across multiple repositories (for enterprise)

---

## 🔑 Required Secrets

### Database Configuration

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `DATABASE_URL` | PostgreSQL connection string for production | `postgresql://user:pass@host:5432/db` | ✅ Yes |
| `DATABASE_URL_STAGING` | PostgreSQL connection string for staging | `postgresql://user:pass@host:5432/db_staging` | ⚠️ Recommended |
| `DATABASE_URL_DEV` | PostgreSQL connection string for development | `postgresql://user:pass@host:5432/db_dev` | ⚠️ Recommended |

### Payment Gateway Secrets

#### Stripe Configuration

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_xxx...` | ✅ Yes (if using Stripe) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxx...` | ✅ Yes (if using Stripe) |
| `STRIPE_SECRET_KEY_TEST` | Stripe test API key | `sk_test_xxx...` | ⚠️ Recommended |

#### Adyen Configuration

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `ADYEN_API_KEY` | Adyen API key | `AQE...` | ✅ Yes (if using Adyen) |
| `ADYEN_HMAC_KEY` | Adyen HMAC key for webhooks | `xxx...` | ✅ Yes (if using Adyen) |

#### PayPal Configuration

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `PAYPAL_CLIENT_ID` | PayPal client ID | `xxx...` | ✅ Yes (if using PayPal) |
| `PAYPAL_SECRET` | PayPal secret | `xxx...` | ✅ Yes (if using PayPal) |

### Application Configuration

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `PORTAL_BASE_URL` | Base URL for customer portal | `https://portal.yourdomain.com` | ✅ Yes |
| `RECEIPTS_FROM_EMAIL` | Email address for sending receipts | `ar-billing@yourdomain.com` | ✅ Yes |
| `PAY_GATEWAY` | Default payment gateway | `STRIPE` or `ADYEN` or `PAYPAL` or `MOCK` | ⚠️ Recommended |
| `REDIS_URL` | Redis connection URL for caching | `redis://host:6379` | ⚠️ Optional |

### CI/CD Secrets

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `VERCEL_TOKEN` | Vercel deployment token | `xxx...` | ✅ Yes (if using Vercel) |
| `DOCKER_USERNAME` | Docker Hub username | `youruser` | ⚠️ Optional |
| `DOCKER_PASSWORD` | Docker Hub password/token | `xxx...` | ⚠️ Optional |

### Security & Authentication

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-key-here` | ✅ Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | `generated-secret-key` | ✅ Yes |
| `NEXTAUTH_URL` | NextAuth.js callback URL | `https://yourdomain.com` | ✅ Yes |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | `32-byte-hex-string` | ✅ Yes |

---

## 🛠️ Setting Up Secrets in GitHub

### Method 1: Using GitHub Web UI

#### For Repository Secrets:

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name (e.g., `DATABASE_URL`)
6. Enter the secret value
7. Click **Add secret**

#### For Environment Secrets:

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Environments**
4. Select or create an environment (e.g., `production`, `staging`)
5. Click **Add secret** in the Environment secrets section
6. Enter the secret name and value
7. Click **Add secret**

### Method 2: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Add a repository secret
gh secret set DATABASE_URL --body "postgresql://user:pass@host:5432/db"

# Add multiple secrets from a file
gh secret set DATABASE_URL < database_url.txt

# Add environment-specific secret
gh secret set DATABASE_URL --env production --body "postgresql://..."

# List all secrets
gh secret list

# Delete a secret
gh secret remove DATABASE_URL
```

### Method 3: Using GitHub API

```bash
# Using curl with GitHub Personal Access Token
curl -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/pohlai88/aibos-erpBOS/actions/secrets/DATABASE_URL \
  -d '{"encrypted_value":"YOUR_ENCRYPTED_VALUE","key_id":"YOUR_KEY_ID"}'
```

---

## 🚀 Using Secrets in GitHub Actions

### Example Workflow Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
        run: pnpm build

      - name: Run tests
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: pnpm test

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: vercel deploy --prod --token=$VERCEL_TOKEN
```

### Using Secrets in Docker Builds

```yaml
- name: Build Docker image
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    docker build \
      --build-arg DATABASE_URL="$DATABASE_URL" \
      -t aibos-erp:latest .

- name: Push to Docker Hub
  env:
    DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
    DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
  run: |
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    docker push aibos-erp:latest
```

### Environment-Specific Secrets

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - staging
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: 
      name: ${{ github.ref == 'refs/heads/main' && 'production' || github.ref == 'refs/heads/staging' && 'staging' || 'development' }}
    
    steps:
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          PAY_GATEWAY: ${{ secrets.PAY_GATEWAY }}
        run: |
          echo "Deploying to ${{ github.event.environment.name }}"
          # Deployment commands here
```

---

## ✅ Best Practices

### 1. **Never Commit Secrets to Git**

```bash
# Always add sensitive files to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore
```

### 2. **Use Different Secrets for Different Environments**

```bash
# Development
DATABASE_URL_DEV=postgresql://localhost:5432/dev_db

# Staging
DATABASE_URL_STAGING=postgresql://staging-host:5432/staging_db

# Production
DATABASE_URL=postgresql://prod-host:5432/prod_db
```

### 3. **Rotate Secrets Regularly**

- Rotate API keys every 90 days
- Rotate database passwords every 6 months
- Rotate JWT secrets annually
- Update webhook secrets when compromised

### 4. **Limit Secret Access**

- Use environment-specific secrets for production
- Require approvals for production deployments
- Use branch protection rules
- Enable audit logging

### 5. **Use Secret Scanning**

GitHub automatically scans for exposed secrets. Enable additional protections:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 6. **Validate Secrets Before Use**

```typescript
// apps/bff/app/lib/env.ts
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

### 7. **Use Secret References in Docker**

```dockerfile
# apps/bff/Dockerfile
FROM node:18-alpine

# Don't hardcode secrets in Dockerfile
# Use build args or runtime environment variables
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

CMD ["pnpm", "start"]
```

### 8. **Encrypt Sensitive Configuration Files**

For local development, use tools like `git-crypt` or `sops`:

```bash
# Install git-crypt
brew install git-crypt

# Initialize git-crypt
git-crypt init

# Add files to encrypt
echo ".env.production" > .gitattributes
echo ".env.production filter=git-crypt diff=git-crypt" >> .gitattributes
```

### 9. **Document All Required Secrets**

Maintain a checklist of required secrets in your repository:

```markdown
## Required Secrets Checklist

- [ ] DATABASE_URL
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] JWT_SECRET
- [ ] NEXTAUTH_SECRET
- [ ] PORTAL_BASE_URL
```

### 10. **Use Secret Management Services**

For production deployments, consider using:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**

---

## 🔍 Troubleshooting

### Secret Not Found Error

**Problem**: Workflow fails with "Secret DATABASE_URL not found"

**Solution**:
1. Verify the secret name matches exactly (case-sensitive)
2. Check if secret is set in correct environment
3. Ensure workflow has access to the secret

```yaml
# Verify secret exists
- name: Check secret
  run: |
    if [ -z "${{ secrets.DATABASE_URL }}" ]; then
      echo "DATABASE_URL is not set"
      exit 1
    fi
```

### Secret Value Contains Special Characters

**Problem**: Secret value with special characters breaks the workflow

**Solution**:
- Use GitHub UI to set secrets (it handles encoding)
- Or properly escape values in CLI:

```bash
# Properly quote the secret value
gh secret set DATABASE_URL --body 'postgresql://user:pa$$word@host:5432/db'
```

### Secret Not Updating

**Problem**: Updated secret doesn't reflect in workflow

**Solution**:
1. Re-run the workflow (secrets are cached)
2. Clear GitHub Actions cache
3. Verify secret was actually updated in Settings

```bash
# Force workflow re-run
gh workflow run deploy.yml
```

### Environment Secret vs Repository Secret Conflict

**Problem**: Wrong secret value is being used

**Solution**: Environment secrets take precedence over repository secrets. Check:

```yaml
jobs:
  deploy:
    environment: production  # This will use environment secrets first
```

### Testing Secrets Locally

**Problem**: Need to test workflow with secrets locally

**Solution**: Use `act` to run GitHub Actions locally:

```bash
# Install act
brew install act

# Create .secrets file (don't commit!)
cat > .secrets << EOF
DATABASE_URL=postgresql://localhost:5432/test
STRIPE_SECRET_KEY=sk_test_xxx
EOF

# Run workflow locally
act -s-file .secrets
```

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI Secrets Guide](https://cli.github.com/manual/gh_secret)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Docker Secrets Management](https://docs.docker.com/engine/swarm/secrets/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 🆘 Getting Help

If you encounter issues with GitHub Secrets:

1. **Check GitHub Status**: [githubstatus.com](https://www.githubstatus.com/)
2. **Review Workflow Logs**: Check detailed logs in Actions tab
3. **Create an Issue**: Open an issue in this repository
4. **Contact Team**: Reach out to the DevOps team

---

**Last Updated**: 2025-12-28  
**Maintained by**: AI-BOS DevOps Team

---

**Remember**: Secrets are powerful security tools. Handle them with care! 🔒
