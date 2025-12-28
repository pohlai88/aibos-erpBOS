# .github Directory

This directory contains GitHub-specific configuration and documentation.

## 📁 Structure

```
.github/
├── docs/
│   └── SECRETS_QUICK_REFERENCE.md  # Quick reference for GitHub Secrets
├── workflows/
│   └── example-deploy.yml          # Example workflow using secrets
└── README.md                        # This file
```

## 🔐 GitHub Secrets

For complete information about setting up and managing GitHub Secrets, see:

- **[Complete Guide](../GITHUB_SECRETS_SETUP.md)** - Comprehensive setup and best practices
- **[Quick Reference](./docs/SECRETS_QUICK_REFERENCE.md)** - Quick checklist and commands

## 🚀 GitHub Actions Workflows

### Current Workflows

- **example-deploy.yml** - Template workflow showing how to use secrets in deployments

### Creating New Workflows

When creating new workflows:

1. Use the example workflow as a template
2. Reference secrets using `${{ secrets.SECRET_NAME }}`
3. Use environment-specific secrets for staging/production
4. Follow the naming conventions in the secrets guide
5. Test workflows on non-production branches first

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Repository README](../README.md)

## 🔒 Security Notes

⚠️ **Important:**
- Never commit secrets to this repository
- All secret values should be stored in GitHub Secrets
- Use different secrets for different environments
- Rotate secrets regularly

---

**For questions or issues, contact the DevOps team.**
