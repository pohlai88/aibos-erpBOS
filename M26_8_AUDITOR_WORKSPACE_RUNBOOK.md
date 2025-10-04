# M26.8 — Auditor Workspace Runbook

## Overview

The Auditor Workspace provides external auditors with secure, time-boxed access to audit evidence through a read-only portal with immutable packs, watermarked previews, expiring access, redaction, and full audit trails.

## Key Features

- **Auditor Accounts**: External auditor accounts with company-scoped, time-boxed access
- **Least-privilege Grants**: Pick exact objects (attestation packs, control runs, journal extracts) they can see
- **Secure Viewer**: Streaming previews with dynamic watermark, on-the-fly redaction, and download controls
- **Request Queue**: Auditors submit PBC/follow-ups; owners respond with evidence links
- **Immutable Packs**: Pulls from M26.4 eBinder packs (content-addressed SHA256); verifies hash
- **End-to-end Audit Trail**: Who saw what, when, for how long; session bind + IP/device fingerprint
- **Auto-Expiry & Revocation**: One-click revocation; reminder/escalation jobs

## Database Schema

### Core Tables (Migrations 0260-0269)

- `audit_auditor`: External auditor accounts
- `audit_grant`: Least-privilege grants for specific objects
- `audit_session`: Auditor session management with device binding
- `audit_access_log`: Complete audit trail of all actions
- `audit_request`: PBC/follow-up requests from auditors
- `audit_request_msg`: Threaded Q&A and responses
- `audit_watermark_policy`: Watermark configuration per company
- `audit_dl_key`: Short-lived download keys (defense in depth)

## API Endpoints

### Admin (Internal RBAC)

```bash
# Create/update auditor
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"email":"ext.audit@firm.com","display_name":"External Auditor","status":"ACTIVE"}' \
  http://localhost:3000/api/audit/admin/auditors

# Issue grant
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"auditor_email":"ext.audit@firm.com","scope":"ATTEST_PACK","object_id":"<pack_id>","can_download":false,"expires_at":"2026-02-28T23:59:59Z"}' \
  http://localhost:3000/api/audit/admin/grants

# Revoke grant
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"grant_id":"<grant_id>"}' \
  http://localhost:3000/api/audit/admin/grants/revoke

# Query auditors
curl -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/audit/admin/auditors?status=ACTIVE&limit=50"

# Query grants
curl -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/audit/admin/grants?auditor_id=<auditor_id>&scope=ATTEST_PACK"
```

### Sessions (External)

```bash
# Create session (magic link)
curl -X POST -H "content-type: application/json" \
  -d '{"email":"ext.audit@firm.com"}' \
  http://localhost:3000/api/audit/session/login

# Verify magic code
curl -X POST -H "content-type: application/json" \
  -d '{"magic_code":"123456"}' \
  http://localhost:3000/api/audit/session/verify
```

### Workspace (Auditor)

```bash
# List available packs
curl -H "X-Auditor-ID: <auditor_id>" -H "X-Company-ID: <company_id>" \
  "http://localhost:3000/api/audit/packs?search=Q4&limit=20"

# Get pack details
curl -H "X-Auditor-ID: <auditor_id>" -H "X-Company-ID: <company_id>" \
  "http://localhost:3000/api/audit/packs/<pack_id>"

# Request download key
curl -X POST -H "X-Auditor-ID: <auditor_id>" -H "X-Company-ID: <company_id>" \
  -H "content-type: application/json" \
  -d '{"grant_id":"<grant_id>"}' \
  http://localhost:3000/api/audit/packs/<pack_id>/download

# Download file with key
curl "http://localhost:3000/api/audit/dl/<download_key>"
```

### Requests (PBC Management)

```bash
# Open PBC request
curl -X POST -H "X-Auditor-ID: <auditor_id>" -H "X-Company-ID: <company_id>" \
  -H "content-type: application/json" \
  -d '{"title":"Provide JE continuity detail for Nov","detail":"Need CSV extract by account","due_at":"2026-01-15T23:59:59Z"}' \
  http://localhost:3000/api/audit/requests

# Reply to PBC request (internal)
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"request_id":"<request_id>","body":"Please find attached evidence","evd_record_id":"<evidence_id>"}' \
  http://localhost:3000/api/audit/requests/reply

# Query requests
curl -H "X-Auditor-ID: <auditor_id>" -H "X-Company-ID: <company_id>" \
  "http://localhost:3000/api/audit/requests?state=OPEN&limit=20"
```

### Cron Jobs

```bash
# Clean up expired data
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"dry_run":false}' \
  http://localhost:3000/api/audit/cron/expire

# Send reminders
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"grant_hours_ahead":24,"request_hours_overdue":24}' \
  http://localhost:3000/api/audit/cron/remind
```

## RBAC Capabilities

- `audit:admin`: Create auditors, grants, revoke access
- `audit:respond`: Reply to requests, attach evidence
- `audit:view`: Internal read access to workspace dashboards

## Security Features

### Access Control
- External auditors only see whitelisted object_ids via grants
- Downloads are off unless explicitly enabled per grant
- All previews watermarked + redacted (leveraging M26.4 redaction patterns)

### Session Security
- Magic code authentication (6-digit, 15-minute expiry)
- Device binding (IP + User-Agent logging)
- Session tokens with expiration

### Download Security
- Short-lived download keys (5-minute expiry, one-time use)
- Hash verification for pack files
- Complete audit trail of all access

### Watermarking
- Dynamic watermark with company name, auditor email, timestamp
- Configurable opacity, font size, color, diagonal placement
- Applied to all preview streams

## Workflow Examples

### Grant Flow (Internal)
1. Create auditor account with email
2. Issue specific grants (e.g., 10 attestation packs + 2 control runs)
3. Set expiry date and download permissions
4. Auditor receives email with magic link
5. Auditor accesses workspace with granted items only

### Auditor View Flow
1. Auditor logs in with magic code
2. Dashboard shows only granted items
3. Clicking pack opens watermarked preview
4. Can open PBC Request inline if needed
5. If downloads permitted, request download key
6. Download key valid for 5 minutes, single use

### Owner Reply Flow
1. Owner sees PBC queue in internal dashboard
2. Attaches evidence (M26.4) or points to existing pack
3. Replies with explanation
4. Marks request as responded/closed

### Expiry Flow
1. At expiry, sessions & grants automatically expire
2. Links return 410 Gone
3. Events emitted for cleanup
4. Reminder notifications sent before expiry

## Monitoring & Maintenance

### Housekeeping Jobs
- Clean up expired sessions, download keys, grants
- Send reminder notifications for expiring grants
- Send overdue notifications for PBC requests
- Clean up old access logs (keep 90 days)

### Audit Trail
- Complete log of all auditor actions (VIEW, DOWNLOAD, DENY, EXPIRED)
- Session binding with IP/User-Agent
- Metadata capture for compliance

### Performance
- Optimized indexes for common query patterns
- Cached watermark policies
- Efficient grant validation

## Integration Points

- **M26.4 Evidence Vault**: Immutable packs, redaction rules
- **M26.6 Close Cockpit**: Control runs, close tasks
- **M26.7 Attestations**: Attestation packs, campaigns
- **Outbox Events**: Grant issued/expired, PBC opened/responded

## Troubleshooting

### Common Issues
1. **Magic code expired**: Regenerate session
2. **Grant expired**: Check expiry date, issue new grant
3. **Download denied**: Verify can_download flag on grant
4. **Access denied**: Check grant exists and not expired

### Debugging
- Check `audit_access_log` for access attempts
- Verify session validity in `audit_session`
- Confirm grant status in `audit_grant`
- Review outbox events for notifications

## Future Enhancements

- **M26.9**: ITGC/UAR Attestations integration
- **M27**: Planning & Ops Command Center auditor KPIs
- **SOC-2**: Evidence bundles via same pack mechanism
- **SSO Integration**: Enterprise SSO for auditor authentication
- **Advanced Watermarking**: PDF-specific watermarking with positioning
- **Bulk Operations**: Bulk grant management for large audits
