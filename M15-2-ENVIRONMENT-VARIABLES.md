# M15.2: Cash Alert Schedule - Environment Variables

## Required Environment Variables

### Database

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/aibos
```

## Optional Environment Variables

### Dispatcher Configuration

```bash
# SMTP Configuration for email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourcompany.com
SMTP_PASS=your-app-password
ALERTS_FROM_EMAIL=alerts@yourcompany.com

# Webhook URL for external integrations
WEBHOOK_URL=https://your-webhook-endpoint.com/cash-alerts
```

### Rate Limiting & Performance

```bash
# Maximum companies to process per batch (default: 50)
MAX_COMPANIES_PER_BATCH=50

# Maximum retry attempts for dispatch failures (default: 3)
MAX_DISPATCH_RETRIES=3

# Base delay for exponential backoff in milliseconds (default: 1000)
DISPATCH_BASE_DELAY_MS=1000
```

### Idempotency Configuration

```bash
# Dedupe window in hours (default: 24)
CASH_ALERTS_DEDUPE_WINDOW_HOURS=24
```

## Vercel Deployment

### Required Vercel Environment Variables

```bash
# Add these in your Vercel dashboard under Settings > Environment Variables

# Database
DATABASE_URL=postgresql://...

# SMTP (if using email alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourcompany.com
SMTP_PASS=your-app-password
ALERTS_FROM_EMAIL=alerts@yourcompany.com

# Optional: Performance tuning
MAX_COMPANIES_PER_BATCH=25
MAX_DISPATCH_RETRIES=2
DISPATCH_BASE_DELAY_MS=500
CASH_ALERTS_DEDUPE_WINDOW_HOURS=12
```

### Vercel Cron Configuration

The `vercel.json` file is already configured with:

```json
{
  "crons": [
    {
      "path": "/api/cash/alerts/cron/daily",
      "schedule": "0 1 * * *"
    }
  ]
}
```

## Testing Configuration

### Local Development

```bash
# Set these for local testing
export API_KEY="ak_test_123:secret123"
export COMPANY_ID="company_123"
export DATABASE_URL="postgresql://localhost:5432/aibos"

# Optional: Test with different timezones
export TEST_TIMEZONE="America/New_York"
```

### Production Checklist

- [ ] Database connection string configured
- [ ] SMTP credentials set (if using email alerts)
- [ ] Webhook URL configured (if using webhook alerts)
- [ ] Rate limiting configured for your scale
- [ ] Idempotency window configured
- [ ] Vercel cron job deployed
- [ ] RBAC permissions verified (`cash:manage` capability)

## Monitoring & Observability

### Logs to Monitor

```bash
# Success logs
📧 Email sent to X recipients for company Y
🔗 Webhook dispatched for company Y
📊 Batch dispatch complete: X notifications sent to Y companies
🔒 Idempotency recorded: key (expires in Xh)

# Warning logs
⚠️ No dispatch configured for company Y - X breaches ignored
⚠️ Batch size X exceeds limit Y, processing in chunks
⚠️ Attempt X failed, retrying in Yms

# Error logs
❌ Email dispatch failed for company Y after X retries
❌ Webhook dispatch failed for company Y after X retries
❌ Failed to log audit event
❌ Failed to check idempotency
```

### Metrics to Track

- `company_id`: Company identifier
- `scenario`: Cash forecast scenario code
- `breaches_count`: Number of alert breaches
- `duration_ms`: Processing time
- `dispatched_count`: Number of notifications sent
- `mode`: Dispatch mode (email/webhook/noop)
