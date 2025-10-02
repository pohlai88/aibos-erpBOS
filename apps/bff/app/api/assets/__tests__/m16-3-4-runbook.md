# M16.3/M16.4: Advanced Asset Management Runbook

## 🚀 **Quick Start (10 minutes)**

This runbook covers the **M16.3** and **M16.4** advanced features: Ops UI, Unpost/Repost, Proration, Impairments, and FX Presentation Lock.

---

## 📋 **Prerequisites**

- ✅ **M16 + M16.1 + M16.2** modules deployed and tested
- ✅ **RBAC** configured with `capex:manage` capability
- ✅ **Asset class references** and **posting maps** seeded
- ✅ **API keys** with appropriate scopes

---

## 🔧 **RBAC Setup**

Ensure your finance operations team has the `capex:manage` capability:

```sql
-- Add capex:manage to your role assignments
INSERT INTO api_key_scopes (api_key_id, scope)
VALUES ('<your-api-key-id>', 'capex:manage')
ON CONFLICT DO NOTHING;
```

---

## ⚙️ **Configuration Management**

### **1. Assets Configuration**

```bash
# Get current configuration
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/assets/config
```

**Expected Response:**

```json
{
  "ok": true,
  "data": {
    "company_id": "company-123",
    "proration_enabled": false,
    "proration_basis": "days_in_month",
    "fx_presentation_policy": "post_month",
    "created_at": "2025-11-01T00:00:00Z",
    "updated_at": "2025-11-01T00:00:00Z"
  }
}
```

### **2. Update Configuration**

```bash
# Enable proration and set FX policy
curl -sS -X PUT -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "proration_enabled": true,
    "proration_basis": "days_in_month",
    "fx_presentation_policy": "post_month"
  }' \
  http://localhost:3000/api/assets/config
```

---

## 💰 **Asset Impairments**

### **1. Create Impairment**

```bash
# CAPEX impairment
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "plan_kind": "capex",
    "plan_id": "plan-123",
    "date": "2025-11-15",
    "amount": 25000,
    "memo": "Plant write-down due to damage"
  }' \
  http://localhost:3000/api/assets/impairments
```

**Expected Response:**

```json
{
  "ok": true,
  "data": {
    "id": "imp-123",
    "created": true,
    "journal_id": "journal-456"
  }
}
```

### **2. List Impairments**

```bash
# List all impairments
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/assets/impairments

# Filter by plan kind
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/assets/impairments?plan_kind=capex"

# Filter by specific plan
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/assets/impairments?plan_id=plan-123"
```

---

## 🔄 **Unpost/Repost Operations**

### **1. Dry-Run Unposting**

```bash
# Check what would be unposted
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": true
  }' \
  http://localhost:3000/api/assets/unpost
```

**Expected Response:**

```json
{
  "ok": true,
  "data": {
    "dry_run": true,
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "plans": 2,
    "lines": 2,
    "total_amount": 1500.0,
    "journals_to_reverse": ["journal-1", "journal-2"],
    "sample": [
      {
        "plan_id": "plan-1",
        "amount": 1000.0,
        "journal_id": "journal-1"
      }
    ],
    "warnings": []
  }
}
```

### **2. Execute Unposting**

```bash
# Actually unpost the entries
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": false
  }' \
  http://localhost:3000/api/assets/unpost
```

### **3. Selective Unposting**

```bash
# Unpost specific plans only
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "plan_ids": ["plan-1", "plan-3"],
    "dry_run": false
  }' \
  http://localhost:3000/api/assets/unpost
```

---

## 🎯 **UI Draft Caching**

### **1. Create Draft**

```bash
# Store a dry-run result as draft
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "payload": {
      "total_amount": 1500,
      "plans": 2,
      "lines": 2,
      "memo": "Monthly depreciation"
    },
    "ttl_seconds": 900
  }' \
  http://localhost:3000/api/assets/drafts
```

### **2. Retrieve Draft**

```bash
# Get stored draft
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/assets/drafts?kind=depr&year=2025&month=11"
```

### **3. List All Drafts**

```bash
# List all drafts for company
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/assets/drafts
```

### **4. Delete Draft**

```bash
# Delete specific draft
curl -sS -X DELETE -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/assets/drafts?kind=depr&year=2025&month=11"
```

---

## 📊 **Enhanced Bulk Posting**

### **1. Dry-Run with Draft Storage**

```bash
# Create dry-run and store as draft
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": true
  }' \
  http://localhost:3000/api/assets/posting/bulk/dry-run
```

### **2. Commit from Draft**

```bash
# Execute posting using stored draft
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": false
  }' \
  http://localhost:3000/api/assets/posting/bulk/commit
```

---

## 🔧 **Proration Features**

### **Proration Configuration**

When `proration_enabled: true`, the system automatically prorates the first month of depreciation/amortization based on the `in_service` date.

**Proration Basis Options:**
- `days_in_month`: Prorate based on actual days active in the month
- `half_month`: Simple 50% proration for first month

**Example:**
- Asset in service: `2025-11-15`
- November has 30 days
- Days active: 16 (from 15th to 30th)
- Proration factor: 16/30 = 53.33%

---

## 💱 **FX Presentation Lock**

### **FX Policy Options**

- `post_month`: Use FX rate from the posting month
- `in_service`: Use FX rate from the in-service date (locked)

### **FX Rate Snapshotting**

The system automatically snapshots FX rates for audit compliance:

```bash
# Get FX rate history for a plan
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/assets/fx-history?plan_kind=capex&plan_id=plan-123"
```

---

## ⚠️ **Safety Features**

### **Unposting Safety Checks**

The system automatically validates:
- ✅ **Period status** (warns if period is closed)
- ✅ **Posted entries** (warns if no entries to unpost)
- ✅ **Recent activity** (warns about recent unposting)
- ✅ **Dry-run enforcement** (blocks actual unposting if safety checks fail)

### **Impairment Safety**

- ✅ **Plan validation** (ensures plan exists and is valid)
- ✅ **Amount validation** (positive amounts only)
- ✅ **Date validation** (valid date format)
- ✅ **Journal balance** (all impairment journals are balanced)

---

## 🔄 **Complete Workflow Example**

### **Step 1: Configure Assets**

```bash
# Enable proration and set FX policy
curl -sS -X PUT -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "proration_enabled": true,
    "proration_basis": "days_in_month",
    "fx_presentation_policy": "post_month"
  }' \
  http://localhost:3000/api/assets/config
```

### **Step 2: Create Impairment**

```bash
# Record asset impairment
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "plan_kind": "capex",
    "plan_id": "plan-123",
    "date": "2025-11-15",
    "amount": 25000,
    "memo": "Equipment damage"
  }' \
  http://localhost:3000/api/assets/impairments
```

### **Step 3: Dry-Run Posting**

```bash
# Create dry-run and store as draft
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": true
  }' \
  http://localhost:3000/api/assets/posting/bulk/dry-run
```

### **Step 4: Commit Posting**

```bash
# Execute posting from draft
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": false
  }' \
  http://localhost:3000/api/assets/posting/bulk/commit
```

### **Step 5: Unpost if Needed**

```bash
# Unpost if corrections needed
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": false
  }' \
  http://localhost:3000/api/assets/unpost
```

---

## 📈 **Performance SLOs**

- ✅ **Configuration**: p95 < 100ms for read/write operations
- ✅ **Impairments**: p95 < 500ms for creation and journal posting
- ✅ **Unposting**: p95 < 1s for dry-run, p95 < 2s for execution
- ✅ **Draft Operations**: p95 < 200ms for create/retrieve/delete
- ✅ **FX Resolution**: p95 < 300ms for rate lookup and snapshot

---

## 🎯 **Key Benefits**

### **Ops UI Features**
- ✅ **Configuration management** (proration, FX policy)
- ✅ **Impairment tracking** (with journal integration)
- ✅ **Unpost/Repost** (with safety checks)
- ✅ **Draft caching** (for UI state management)

### **Advanced Calculations**
- ✅ **Proration** (first-month accuracy)
- ✅ **FX presentation lock** (audit compliance)
- ✅ **Impairment posting** (balanced journals)
- ✅ **Reversal handling** (complete audit trail)

---

## 🔍 **Troubleshooting**

### **Common Configuration Issues**

```bash
# Check current configuration
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/assets/config
```

**Common Errors:**
- `Invalid proration basis` → Use only "days_in_month" or "half_month"
- `Invalid FX policy` → Use only "post_month" or "in_service"
- `Configuration not found` → System will return defaults

### **Common Impairment Issues**

```bash
# List impairments to debug
curl -sS -X GET -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/assets/impairments
```

**Common Errors:**
- `Plan not found` → Verify plan_id exists and is accessible
- `No posting map` → Ensure asset class posting maps are configured
- `Invalid amount` → Amount must be positive

### **Common Unposting Issues**

```bash
# Check unposting safety
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{"kind":"depr","year":2025,"month":11,"dry_run":true}' \
  http://localhost:3000/api/assets/unpost
```

**Common Warnings:**
- `Period is closed` → Check accounting period status
- `No posted entries` → Verify entries exist and are posted
- `Recent unposting activity` → Check for recent reversals

---

## 🎉 **Success Criteria**

✅ **Configuration** updates in <100ms  
✅ **Impairments** create balanced journals  
✅ **Unposting** reverses entries safely  
✅ **Draft caching** maintains UI state  
✅ **Proration** calculates first-month accurately  
✅ **FX locking** snapshots rates for audit  
✅ **Safety checks** prevent data corruption  
✅ **Complete audit trail** for all operations  

---

## 🚀 **Next Steps**

1. **Configure assets** (enable proration, set FX policy)
2. **Set up impairments** (create posting maps for impairment accounts)
3. **Test unposting** (verify safety checks work correctly)
4. **Implement UI** (build ops console with draft support)
5. **Monitor performance** (track SLOs and optimize)

**M16.3/M16.4** is now ready for production use! 🎊

---

## 📚 **API Reference Summary**

### **Configuration**
- `GET/PUT /api/assets/config` - Assets configuration

### **Impairments**
- `POST /api/assets/impairments` - Create impairment
- `GET /api/assets/impairments` - List impairments

### **Unposting**
- `POST /api/assets/unpost` - Unpost/repost operations

### **Drafts**
- `POST /api/assets/drafts` - Create draft
- `GET /api/assets/drafts` - Get/list drafts
- `DELETE /api/assets/drafts` - Delete draft

### **Enhanced Posting**
- `POST /api/assets/posting/bulk/dry-run` - Dry-run with draft
- `POST /api/assets/posting/bulk/commit` - Commit from draft

All endpoints require `capex:manage` capability and return consistent error formats.
