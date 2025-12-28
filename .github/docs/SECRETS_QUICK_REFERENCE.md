# GitHub Secrets Quick Reference

> 📘 For the complete guide, see [GITHUB_SECRETS_SETUP.md](../../GITHUB_SECRETS_SETUP.md) in the root directory.

## 🚀 Quick Setup

### Add a Secret via GitHub CLI

```bash
gh secret set SECRET_NAME --body "secret-value"
```

### Add a Secret via GitHub UI

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Enter name and value
4. Click **Add secret**

## 📋 Required Secrets Checklist

### Essential (Required for Production)

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - JWT token signing key
- [ ] `NEXTAUTH_SECRET` - NextAuth.js secret
- [ ] `NEXTAUTH_URL` - Application base URL
- [ ] `PORTAL_BASE_URL` - Customer portal URL
- [ ] `RECEIPTS_FROM_EMAIL` - Email for receipts

### Payment Gateways (Based on your setup)

**Stripe:**
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

**Adyen:**
- [ ] `ADYEN_API_KEY`
- [ ] `ADYEN_HMAC_KEY`

**PayPal:**
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_SECRET`

### CI/CD (Optional but Recommended)

- [ ] `VERCEL_TOKEN` - For Vercel deployments
- [ ] `DOCKER_USERNAME` - For Docker Hub
- [ ] `DOCKER_PASSWORD` - For Docker Hub

## 🔄 Using in Workflows

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

## ⚠️ Important Notes

1. **Never commit secrets** to Git
2. **Use different secrets** for dev/staging/prod
3. **Rotate secrets** regularly (90 days for API keys)
4. **Secret names** are case-sensitive
5. **Environment secrets** override repository secrets

## 🆘 Troubleshooting

**Secret not found?**
- Check the secret name (case-sensitive)
- Verify it's in the correct environment
- Re-run the workflow

**Need to update a secret?**
```bash
gh secret set SECRET_NAME --body "new-value"
```

**List all secrets:**
```bash
gh secret list
```

---

**Need more help?** See the [complete guide](../../GITHUB_SECRETS_SETUP.md) or contact DevOps team.
