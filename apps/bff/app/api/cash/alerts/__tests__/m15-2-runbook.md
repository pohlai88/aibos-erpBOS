# M15.2: Daily Cash/Liquidity Alerts - 5-Minute Runbook

## 🚀 Quick Setup (5 minutes)

### 1) Pick Your Scheduler

**Option A: Vercel Cron (Recommended)**

- ✅ Already configured in `vercel.json`
- Runs at **01:00 UTC** (08:00 Asia/Ho_Chi_Minh)
- Deploy → Vercel UI will show the cron job

**Option B: Inngest (Platform-agnostic)**

- Deploy the Inngest functions
- Open Inngest UI → confirm function is active
- Configure cron schedule in Inngest dashboard

### 2) Database Migration (Optional)

If you want per-company scheduling:

```bash
# Apply the cash_alert_schedule table
psql -d your_db -f packages/adapters/db/migrations/0034_cash_alert_schedule.sql
```

### 3) Environment Variables

Set these for production email/webhook dispatch:

```bash
# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey-or-username
SMTP_PASS=supersecret
ALERTS_FROM_EMAIL=alerts@yourdomain.com

# Optional: Webhook URL for testing
WEBHOOK_URL=https://webhook.site/your-unique-id
```

### 4) Dry Run Testing

**Test the alerts evaluation:**

```bash
curl -X POST "https://your-domain.com/api/cash/alerts/run" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "month": 1,
    "scenario": "cash:CFY26-01"
  }'
```

**Test the cron endpoint manually:**

```bash
curl -X GET "https://your-domain.com/api/cash/alerts/cron/daily" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5) Observability Setup

**Check logs for:**

- `company_id`, `scenario`, `breaches_count`, `duration_ms`
- Email/webhook dispatch success/failure
- Circuit breaker states

**Monitor metrics:**

- `cash_alert_breaches_total`
- `cash_alert_dispatch_total`
- Processing success rate
- Cache hit rates

## 🔧 Configuration Options

### Per-Company Schedule (Optional)

Insert company-specific schedules:

```sql
INSERT INTO cash_alert_schedule (company_id, enabled, hour_local, minute_local, timezone, scenario_code, updated_by)
VALUES
  ('company-1', true, 8, 0, 'Asia/Ho_Chi_Minh', 'CFY26-01', 'admin'),
  ('company-2', true, 9, 30, 'America/New_York', 'CFY26-02', 'admin');
```

### Alert Rule Configuration

Create alert rules for each company:

```bash
curl -X POST "https://your-domain.com/api/cash/alerts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Low Cash Alert",
    "type": "min_cash",
    "threshold_num": 10000,
    "delivery": {
      "email": ["finance@company.com"],
      "webhook": "https://webhook.site/company-alerts"
    }
  }'
```

## 📊 Monitoring & Troubleshooting

### Health Checks

**System Health:**

```bash
curl "https://your-domain.com/api/cash/alerts/cron/daily" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.health_status'
```

**Circuit Breaker States:**

```bash
curl "https://your-domain.com/api/cash/alerts/cron/daily" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.circuit_breakers'
```

### Common Issues

**1. No breaches detected:**

- Check if cash flow data exists for the scenario
- Verify alert rules are active (`is_active = true`)
- Confirm threshold values are appropriate

**2. Email not sending:**

- Verify SMTP credentials
- Check FROM_EMAIL is allowed by your ESP
- Test SMTP connection manually

**3. Webhook failures:**

- Verify webhook URL is accessible
- Check webhook endpoint accepts POST requests
- Monitor webhook response times

**4. Cron not running:**

- Check Vercel cron job status in dashboard
- Verify cron schedule syntax
- Check for authentication errors

### Performance Tuning

**Batch Size Optimization:**

- Default: 50 companies per batch
- Adjust based on your company count
- Monitor memory usage and processing time

**Concurrency Settings:**

- Default: 5 concurrent operations
- Increase for faster processing
- Decrease if hitting rate limits

**Cache Configuration:**

- Default TTL: 5 minutes
- Adjust based on data update frequency
- Monitor cache hit rates

## 🎯 Success Criteria

✅ **Deployment Complete When:**

- Cron job runs successfully at scheduled time
- Companies receive alerts when thresholds breached
- Email/webhook delivery confirmed
- No errors in logs
- Performance metrics within acceptable ranges

✅ **Production Ready When:**

- All companies have appropriate alert rules
- Delivery methods configured and tested
- Monitoring and alerting set up
- Backup/disaster recovery procedures documented

## 📞 Support

**Logs Location:**

- Vercel: Function logs in dashboard
- Inngest: Function execution logs in UI
- Application: Structured JSON logs

**Key Metrics to Monitor:**

- Processing success rate > 95%
- Average processing time < 30 seconds
- Cache hit rate > 80%
- Circuit breaker state = CLOSED

---

**🎉 You're all set! Your daily cash/liquidity alerts are now running at enterprise scale.**
