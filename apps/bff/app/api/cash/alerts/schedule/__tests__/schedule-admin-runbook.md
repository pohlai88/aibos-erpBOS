# M15.2: Cash Alert Schedule Admin API - cURL Examples & Ops Notes

## 🚀 Quick Setup (1 minute)

### RBAC Setup

Ensure ops users have `cash:manage` capability:

```sql
-- Check current capabilities
SELECT role, caps FROM role_caps WHERE role IN ('admin', 'accountant', 'ops');

-- Add cash:manage to ops role if needed
UPDATE role_caps SET caps = caps || '["cash:manage"]' WHERE role = 'ops';
```

### Environment Variables

No additional env vars needed - uses existing auth system.

---

## 📡 API Endpoints

### GET Current Schedule

**Read current cash alert schedule for authenticated company**

```bash
curl -sS -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/cash/alerts/schedule
```

**Response Examples:**

**No schedule configured:**

```json
{
  "enabled": false,
  "reason": "no_schedule_configured"
}
```

**Schedule exists:**

```json
{
  "company_id": "company_123",
  "enabled": true,
  "hour_local": 8,
  "minute_local": 0,
  "timezone": "Asia/Ho_Chi_Minh",
  "scenario_code": "CFY26-01",
  "updated_at": "2025-01-27T10:30:00Z",
  "updated_by": "user_456"
}
```

### PUT Upsert Schedule

**Create or update cash alert schedule**

```bash
curl -sS -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "hour_local": 8,
    "minute_local": 0,
    "timezone": "Asia/Ho_Chi_Minh",
    "scenario_code": "CFY26-01"
  }' \
  http://localhost:3000/api/cash/alerts/schedule
```

**Response Examples:**

**Created new schedule:**

```json
{
  "scenario": "cash:CFY26-01",
  "company_id": "company_123",
  "created": true
}
```

**Updated existing schedule:**

```json
{
  "scenario": "cash:CFY26-01",
  "company_id": "company_123",
  "updated": true
}
```

**Error - Invalid scenario:**

```json
{
  "message": "Unknown cash version code: CFY26-INVALID",
  "available_scenarios": "Check /api/cash/versions for available scenarios"
}
```

**Error - Invalid timezone:**

```json
{
  "message": "Invalid timezone: Invalid/Timezone",
  "suggestion": "Use IANA timezone identifiers like 'Asia/Ho_Chi_Minh' or 'America/New_York'"
}
```

### DELETE Schedule

**Remove cash alert schedule**

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/cash/alerts/schedule
```

**Response:**

```json
{
  "company_id": "company_123",
  "deleted": true
}
```

---

## 🕐 Schedule Examples

### Different Time Zones

```bash
# 8:00 AM Vietnam time
curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true,"hour_local":8,"minute_local":0,"timezone":"Asia/Ho_Chi_Minh","scenario_code":"CFY26-01"}' \
  http://localhost:3000/api/cash/alerts/schedule

# 9:30 AM New York time
curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true,"hour_local":9,"minute_local":30,"timezone":"America/New_York","scenario_code":"CFY26-01"}' \
  http://localhost:3000/api/cash/alerts/schedule

# 2:00 PM London time
curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true,"hour_local":14,"minute_local":0,"timezone":"Europe/London","scenario_code":"CFY26-01"}' \
  http://localhost:3000/api/cash/alerts/schedule
```

### Different Scenarios

```bash
# Use baseline scenario
curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true,"hour_local":8,"minute_local":0,"timezone":"Asia/Ho_Chi_Minh","scenario_code":"CFY25-BL"}' \
  http://localhost:3000/api/cash/alerts/schedule

# Use working scenario
curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true,"hour_local":8,"minute_local":0,"timezone":"Asia/Ho_Chi_Minh","scenario_code":"CFY25-WIP"}' \
  http://localhost:3000/api/cash/alerts/schedule
```

### Disable Schedule

```bash
# Disable alerts (keep schedule for later)
curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":false,"hour_local":8,"minute_local":0,"timezone":"Asia/Ho_Chi_Minh","scenario_code":"CFY26-01"}' \
  http://localhost:3000/api/cash/alerts/schedule
```

---

## 🔧 Operations Notes

### Scheduler Behavior

- **Vercel Cron**: Runs at 01:00 UTC (08:00 Asia/Ho_Chi_Minh)
- **Per-Company Schedules**: Only process companies at their scheduled local time
- **Fallback Logic**: Companies without schedules use default behavior (company_settings or last approved scenario)

### Database Schema

```sql
-- Check schedule table
SELECT * FROM cash_alert_schedule ORDER BY company_id;

-- Check available scenarios
SELECT company_id, code, status FROM cash_forecast_version WHERE status = 'approved' ORDER BY company_id, updated_at DESC;
```

### Monitoring

```bash
# Check cron job logs
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/cash/alerts/cron/daily | jq '.summary'

# Check specific company processing
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/cash/alerts/run \
  -d '{"year":2025,"month":1,"scenario":"cash:CFY26-01"}' | jq '.breaches'
```

### Troubleshooting

**1. Schedule not working:**

- Check if `enabled = true`
- Verify timezone is correct IANA identifier
- Confirm scenario code exists and is approved
- Check cron job is running

**2. Wrong timezone:**

- Use IANA timezone identifiers (e.g., `Asia/Ho_Chi_Minh`, not `GMT+7`)
- Test with: `new Intl.DateTimeFormat('en-CA', { timeZone: 'YOUR_TZ' }).format(new Date())`

**3. Scenario not found:**

- Check available scenarios: `GET /api/cash/versions`
- Ensure scenario status is `approved`
- Verify scenario belongs to correct company

**4. RBAC issues:**

- Ensure user has `cash:manage` capability
- Check JWT token is valid and not expired
- Verify company_id matches authenticated user's company

### Audit Trail

- All schedule changes logged with `updated_by` and `updated_at`
- Use `updated_by` to track who made changes
- `updated_at` shows when schedule was last modified

---

## 🎯 Success Criteria

✅ **Schedule Admin Working When:**

- GET returns current schedule or "no_schedule_configured"
- PUT creates/updates schedule with validation
- DELETE removes schedule cleanly
- Invalid inputs return clear error messages
- RBAC properly restricts access

✅ **Scheduler Integration Working When:**

- Companies with schedules process only at scheduled time
- Companies without schedules use fallback logic
- Timezone conversion works correctly
- Scenario resolution uses schedule preferences

✅ **Production Ready When:**

- All companies have appropriate schedules configured
- Monitoring shows correct processing times
- Error handling covers edge cases
- Audit trail is complete

---

**🎉 Per-company cash alert schedules are now fully operational!**
