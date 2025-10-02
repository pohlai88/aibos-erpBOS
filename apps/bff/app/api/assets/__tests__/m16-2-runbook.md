# M16.2: CSV Imports + Bulk Posting Runbook

## 🚀 **Quick Start (10 minutes)**

This runbook covers the **M16.2** add-on features: CSV imports for CAPEX/Intangibles plans and bulk posting with dry-run diff.

---

## 📋 **Prerequisites**

- ✅ **M16 + M16.1** modules deployed and tested
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

## 📊 **CSV Format Reference**

### **CAPEX CSV Headers (Default)**

```csv
asset_class,description,capex_amount,currency,present_ccy,in_service,life_m,method,cost_center,project
IT,Laptop Fleet,120000,MYR,MYR,2025-11-01,36,SL,CC-OPS,PROJ-IT
PLANT,Machinery,500000,MYR,MYR,2025-11-01,60,DDB,CC-PROD,PROJ-PLANT
```

### **Intangibles CSV Headers (Default)**

```csv
class,description,amount,currency,present_ccy,in_service,life_m,cost_center,project
SOFTWARE,ERP License,240000,MYR,MYR,2025-11-01,24,,CC-OPS
PATENT,Technology Patent,180000,MYR,MYR,2025-11-01,120,,CC-R&D
```

---

## 📥 **CSV Import Operations**

### **1. CAPEX Import (Basic)**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -F "file=@capex_plans.csv" \
  -F 'json={"defaults":{"currency":"MYR","present_ccy":"MYR","method":"SL"}}' \
  http://localhost:3000/api/capex/plan/import
```

**Expected Response:**

```json
{
  "ok": true,
  "data": {
    "created": 2,
    "errors": []
  }
}
```

### **2. Intangibles Import (With Header Mapping)**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -F "file=@intangible_plans.csv" \
  -F 'json={
    "mapping": {
      "class": "Asset Class",
      "description": "Description",
      "amount": "Cost",
      "in_service": "Start Date",
      "life_m": "Months"
    },
    "defaults": {
      "currency": "MYR",
      "present_ccy": "MYR"
    }
  }' \
  http://localhost:3000/api/intangibles/plan/import
```

### **3. Handle Import Errors**

```json
{
  "ok": true,
  "data": {
    "created": 1,
    "errors": [
      {
        "line": 3,
        "error": "missing required fields"
      },
      {
        "line": 5,
        "error": "invalid capex_amount"
      }
    ]
  }
}
```

---

## 📤 **Bulk Posting Operations**

### **1. Dry-Run (Depreciation)**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": true
  }' \
  http://localhost:3000/api/assets/posting/bulk
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
    "sample": [
      {
        "plan_id": "plan-1",
        "amount": 1000.0,
        "present_ccy": "MYR"
      },
      {
        "plan_id": "plan-2",
        "amount": 500.0,
        "present_ccy": "MYR"
      }
    ],
    "warnings": []
  }
}
```

### **2. Actual Posting (Amortization)**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "amort",
    "year": 2025,
    "month": 11,
    "dry_run": false,
    "memo": "Month-end amortization"
  }' \
  http://localhost:3000/api/assets/posting/bulk
```

**Expected Response:**

```json
{
  "ok": true,
  "data": {
    "dry_run": false,
    "kind": "amort",
    "year": 2025,
    "month": 11,
    "posted_journals": 1,
    "warnings": []
  }
}
```

### **3. Selective Posting (Specific Plans)**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{
    "kind": "depr",
    "year": 2025,
    "month": 11,
    "dry_run": false,
    "plan_ids": ["plan-1", "plan-3"],
    "memo": "Selective depreciation posting"
  }' \
  http://localhost:3000/api/assets/posting/bulk
```

---

## ⚠️ **Safety Features**

### **Posting Safety Checks**

The system automatically validates:

- ✅ **Future periods** (warns if posting for future months)
- ✅ **Old periods** (warns if posting for periods >2 years ago)
- ✅ **Duplicate posting** (warns if entries already posted)
- ✅ **Dry-run enforcement** (blocks actual posting if safety checks fail)

### **Error Handling**

- ✅ **CSV validation** (required fields, data types, formats)
- ✅ **Idempotent imports** (duplicate plans are skipped)
- ✅ **Graceful failures** (partial imports continue on errors)
- ✅ **Detailed error reporting** (line numbers and specific errors)

---

## 🔄 **Complete Workflow Example**

### **Step 1: Import CAPEX Plans**

```bash
# Create sample CSV
cat > capex_sample.csv << EOF
asset_class,description,capex_amount,currency,present_ccy,in_service,life_m,method,cost_center
IT,Laptop Fleet,120000,MYR,MYR,2025-11-01,36,SL,CC-OPS
PLANT,Machinery,500000,MYR,MYR,2025-11-01,60,DDB,CC-PROD
EOF

# Import
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -F "file=@capex_sample.csv" \
  -F 'json={"defaults":{"currency":"MYR","present_ccy":"MYR"}}' \
  http://localhost:3000/api/capex/plan/import
```

### **Step 2: Generate Schedules**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{"precision":2}' \
  http://localhost:3000/api/capex/schedule/generate
```

### **Step 3: Dry-Run Posting**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{"kind":"depr","year":2025,"month":11,"dry_run":true}' \
  http://localhost:3000/api/assets/posting/bulk
```

### **Step 4: Actual Posting**

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{"kind":"depr","year":2025,"month":11,"dry_run":false,"memo":"Monthly depreciation"}' \
  http://localhost:3000/api/assets/posting/bulk
```

---

## 📈 **Performance SLOs**

- ✅ **CSV Import**: p95 < 2s for 5k rows
- ✅ **Bulk Dry-Run**: p95 < 300ms for 2k schedule rows
- ✅ **Bulk Posting**: p95 < 2s for 2k rows
- ✅ **Journal Balance**: All posted journals are balanced by construction

---

## 🎯 **Key Benefits**

### **CSV Import**

- ✅ **Flexible mapping** (handle different CSV header formats)
- ✅ **Default values** (apply company-wide defaults)
- ✅ **Idempotent** (safe to re-run imports)
- ✅ **Error reporting** (detailed line-by-line feedback)

### **Bulk Posting**

- ✅ **Dry-run diff** (see exactly what will be posted)
- ✅ **Safety checks** (prevent accidental duplicate posting)
- ✅ **Selective posting** (post specific plans only)
- ✅ **Audit trail** (all operations logged)

---

## 🔍 **Troubleshooting**

### **Common CSV Import Issues**

```bash
# Check CSV structure
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -F "file=@problematic.csv" \
  http://localhost:3000/api/capex/plan/import
```

**Common Errors:**

- `missing required fields` → Check CSV headers match expected format
- `invalid capex_amount` → Ensure numeric values, no currency symbols
- `invalid in_service date format` → Use YYYY-MM-DD format
- `invalid method` → Use only "SL" or "DDB"

### **Common Posting Issues**

```bash
# Check what's available for posting
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "content-type: application/json" \
  -d '{"kind":"depr","year":2025,"month":11,"dry_run":true}' \
  http://localhost:3000/api/assets/posting/bulk
```

**Common Warnings:**

- `Posting for future period` → Normal for advance planning
- `Some entries already posted` → Check for duplicate posting
- `Posting for old period` → Verify period is correct

---

## 🎉 **Success Criteria**

✅ **CSV imports** process 1000+ rows in <2 seconds  
✅ **Bulk dry-runs** complete in <300ms  
✅ **Bulk posting** creates balanced journals  
✅ **Error handling** provides actionable feedback  
✅ **Safety checks** prevent data corruption  
✅ **Idempotent operations** safe to re-run

---

## 🚀 **Next Steps**

1. **Test with sample data** (use provided CSV examples)
2. **Configure posting maps** (ensure account mappings are correct)
3. **Set up monitoring** (track import/posting performance)
4. **Train users** (CSV format requirements, dry-run workflow)
5. **Schedule operations** (month-end posting automation)

**M16.2** is now ready for production use! 🎊
