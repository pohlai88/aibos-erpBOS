# M28.1 — Remeasurements, Indexation & Month-End Posting

## Overview

M28.1 extends the M28 Lease Accounting (MFRS 16) implementation with advanced remeasurement capabilities, CPI indexation, and automated month-end posting. This module transforms your lease master into a living engine that handles CPI/index changes, rebuilds schedules, posts month-end journals, and generates compliance disclosures.

## Key Features

### 🔄 **Remeasurements**
- **Events**: CPI/index updates, rate changes (floating → new EIR), term changes, scope changes, early termination
- **Computation**: Calculate ΔLiability; adjust ROU vs P&L per MFRS 16 (scope decrease → partial derecognition)
- **Proof Artifacts**: Store reproducible remeasurement proofs (inputs → math → outputs) with SHA-256 checksums

### 📊 **Indexation**
- **CPI Management**: CPI table with per-lease index linkage and lag policy support (e.g., T-3 months)
- **Apply CPI Tool**: Regenerate remaining cashflows and schedules based on index changes
- **Lag Policy**: Support for delayed index application (e.g., 3-month lag)

### 📅 **Month-End Engine**
- **Interest Accretion**: Calculate monthly interest on lease liability
- **Principal Reduction**: Apply payments to reduce liability
- **ROU Amortization**: Straight-line amortization (default) with configurable methods
- **Variable Payments**: Expense as incurred (flagged on cashflow)
- **FX Revaluation**: Liability revaluation via M18 admin rates
- **GL Posting**: Automated journal entry creation via `postJournal()`
- **Period Guards**: Block posting when period is closed (423 error)
- **Idempotency**: Prevent duplicate postings via `lease_post_lock`

### 📋 **Disclosures v1**
- **Maturity Analysis**: Time-band analysis (≤1y, 1-2y, 2-3y, 3-5y, >5y)
- **Liability Rollforward**: Opening → Interest → Payments → Remeasurements → FX → Closing
- **ROU Rollforward**: Opening → Amortization → Closing
- **WADR Snapshot**: Weighted Average Discount Rate calculation

## Database Schema

### New Tables

#### `lease_cpi_index`
```sql
CREATE TABLE lease_cpi_index (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    index_code TEXT NOT NULL,
    index_date DATE NOT NULL,
    index_value NUMERIC(10,6) NOT NULL,
    lag_months INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, index_code, index_date)
);
```

#### `lease_remeasure_artifact`
```sql
CREATE TABLE lease_remeasure_artifact (
    id TEXT PRIMARY KEY,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES lease_event(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL,
    inputs_jsonb JSONB NOT NULL,
    calculations_jsonb JSONB NOT NULL,
    outputs_jsonb JSONB NOT NULL,
    checksum TEXT NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    computed_by TEXT NOT NULL
);
```

### Enhanced Indexes
- `idx_lease_event_effective_on` - Performance for event queries
- `idx_lease_schedule_year_month` - Fast schedule lookups
- GIN indexes on JSONB columns for artifact queries

## API Endpoints

### CPI Management
```bash
# Upsert CPI index values
POST /api/leases/cpi
{
  "index_code": "MY-CPI",
  "rows": [
    {"date": "2025-01-01", "value": 121.3},
    {"date": "2025-02-01", "value": 121.7}
  ],
  "lag_months": 3
}

# Query CPI values
GET /api/leases/cpi?index_code=MY-CPI&date_from=2025-01-01&date_to=2025-02-01
```

### Event Application
```bash
# Apply remeasurement event
POST /api/leases/events/apply
{
  "lease_code": "OFFICE-HCMC-01",
  "event_id": "evt_123"
}
```

### Schedule Management
```bash
# Rebuild lease schedule
POST /api/leases/schedule/rebuild
{
  "lease_code": "OFFICE-HCMC-01",
  "as_of": "2025-04-01"
}
```

### Month-End Posting
```bash
# Run month-end posting (dry run)
POST /api/leases/run
{
  "year": 2025,
  "month": 11,
  "dry_run": true,
  "force": false
}

# Commit posting
POST /api/leases/run
{
  "year": 2025,
  "month": 11,
  "dry_run": false,
  "force": false
}
```

### Disclosures
```bash
# Generate disclosure snapshot
POST /api/leases/disclosures/snapshot
{
  "year": 2025,
  "month": 12,
  "include_rollforward": true,
  "include_maturity": true,
  "include_wadr": true
}

# Get existing disclosures
GET /api/leases/disclosures/snapshot?year=2025&month=12
```

## Services Architecture

### `LeaseCpiService`
- **`upsertCpiIndex()`** - Manage CPI index values with lag policy
- **`queryCpiIndex()`** - Query CPI values by date range
- **`getCpiValue()`** - Get CPI value for specific date with lag

### `LeaseRemeasureService`
- **`applyEvent()`** - Apply remeasurement and create proof artifact
- **`calculateRemeasurement()`** - Core remeasurement logic by event type
- **`storeRemeasurementArtifact()`** - Store reproducible proof

### `LeasePostingService`
- **`runMonthlyPostingEnhanced()`** - Enhanced posting with period guards
- **`isPeriodLocked()`** - Check if period is locked for posting
- **`getPostingStatus()`** - Get posting status and statistics

### `LeaseDisclosureService`
- **`generateDisclosureSnapshot()`** - Generate comprehensive disclosures
- **`calculateMaturityAnalysis()`** - Time-band maturity analysis
- **`calculateRollforward()`** - Liability and ROU rollforwards
- **`calculateWADR()`** - Weighted average discount rate

### `LeaseScheduleService`
- **`rebuild()`** - Rebuild schedule from specific date
- **`buildSchedule()`** - Build full amortization schedule
- **`querySchedule()`** - Query schedule data

## Usage Examples

### Complete CPI Remeasurement Workflow

```typescript
// 1. Load CPI data
const cpiData = {
  index_code: "MY-CPI",
  rows: [
    { date: "2025-01-01", value: 121.3 },
    { date: "2025-02-01", value: 121.7 }
  ],
  lag_months: 3
};

await cpiService.upsertCpiIndex(companyId, userId, cpiData);

// 2. Record CPI remeasurement event
const eventData = {
  lease_code: "OFFICE-HCMC-01",
  kind: "INDEX",
  effective_on: "2025-04-01",
  index_rate: 1.05,
  notes: "CPI indexation: 1.05 (5% change)"
};

const eventId = await remeasureService.recordEvent(companyId, userId, eventData);

// 3. Apply event → rebuild schedule + post proof
const applyData = {
  lease_code: "OFFICE-HCMC-01",
  event_id: eventId
};

const result = await remeasureService.applyEvent(companyId, userId, applyData);
console.log(`Delta Liability: ${result.delta_liability}`);
console.log(`Delta ROU: ${result.delta_rou}`);
console.log(`Schedule Rebuilt: ${result.schedule_rebuilt}`);

// 4. Month-end posting (dry run)
const postingData = {
  year: 2025,
  month: 11,
  dry_run: true
};

const postingResult = await postingService.runMonthlyPostingEnhanced(companyId, userId, postingData);
console.log(`Status: ${postingResult.status}`);
console.log(`Total Leases: ${postingResult.stats.total_leases}`);
console.log(`Journal Entries: ${postingResult.stats.journal_entries_created}`);

// 5. Generate disclosures
const disclosureData = {
  year: 2025,
  month: 12,
  include_rollforward: true,
  include_maturity: true,
  include_wadr: true
};

const disclosures = await disclosureService.generateDisclosureSnapshot(companyId, disclosureData);
console.log(`Maturity Analysis:`, disclosures.maturity_analysis);
console.log(`Rollforward:`, disclosures.rollforward);
console.log(`WADR: ${disclosures.wadr}`);
```

### Event Types and Calculations

#### INDEX Remeasurement
```typescript
// CPI-based remeasurement
const indexEvent = {
  lease_code: "OFFICE-HCMC-01",
  kind: "INDEX",
  effective_on: "2025-04-01",
  index_rate: 1.05, // 5% increase
  notes: "CPI indexation"
};
```

#### SCOPE Remeasurement
```typescript
// Scope change (partial derecognition)
const scopeEvent = {
  lease_code: "OFFICE-HCMC-01",
  kind: "SCOPE",
  effective_on: "2025-04-01",
  scope_change_pct: -20, // 20% reduction
  notes: "Office space reduction"
};
```

#### TERMINATION Remeasurement
```typescript
// Early termination
const terminationEvent = {
  lease_code: "OFFICE-HCMC-01",
  kind: "TERMINATION",
  effective_on: "2025-04-01",
  termination_flag: true,
  notes: "Early termination agreement"
};
```

## Performance Targets

- **Posting**: p95 < 2s for 2k leases
- **Remeasurements**: p95 < 3s for 1k remeasures
- **Disclosures**: p95 < 1s for 1k leases

## RBAC Permissions

- **`lease:manage`** - Create/modify leases and events
- **`lease:post`** - Run month-end posting
- **`lease:disclose`** - Generate disclosures
- **`lease:read`** - View lease data and schedules

## Error Handling

### Period Locked (423)
```json
{
  "error": "Period 2025-11 is already posted",
  "code": "PERIOD_LOCKED",
  "details": {
    "year": 2025,
    "month": 11,
    "posted_at": "2025-11-30T23:59:59Z",
    "posted_by": "user123"
  }
}
```

### Lease Not Found (404)
```json
{
  "error": "Lease not found",
  "code": "LEASE_NOT_FOUND",
  "details": {
    "lease_code": "OFFICE-HCMC-01"
  }
}
```

### Invalid Event (400)
```json
{
  "error": "Index rate is required for INDEX remeasurement",
  "code": "INVALID_EVENT_DATA",
  "details": {
    "event_type": "INDEX",
    "missing_fields": ["index_rate"]
  }
}
```

## Testing

Comprehensive test suite covers:
- CPI index management
- Event application and artifact creation
- Schedule rebuilding
- Month-end posting (dry run and commit)
- Disclosure generation
- Error handling and edge cases
- Integration workflows

Run tests:
```bash
pnpm test apps/bff/app/services/lease/__tests__/m28-1.test.ts
```

## Migration

Apply the M28.1 migration:
```bash
pnpm run db:migrate
```

This will create:
- `lease_cpi_index` table
- `lease_remeasure_artifact` table
- Additional indexes for performance
- GIN indexes for JSONB columns

## Evidence Integration (M26.4)

Link CPI notices and modification letters to the M26.4 Evidence Vault:

```typescript
const evidenceData = {
  lease_code: "OFFICE-HCMC-01",
  evidence_id: "evt_26_4_123",
  attachment_type: "CPI_NOTICE",
  description: "CPI indexation notice for April 2025"
};

await evidenceService.linkEvidence(companyId, userId, evidenceData);
```

## Compliance Notes

- **MFRS 16 Compliance**: All remeasurements follow MFRS 16 requirements
- **Audit Trail**: Complete audit trail with proof artifacts
- **Reproducibility**: All calculations are reproducible with stored inputs/outputs
- **Period Controls**: Integration with M17 period management
- **FX Compliance**: Integration with M18 FX revaluation

---

**M28.1 transforms your lease accounting from static records to a dynamic, compliant, and automated system that handles the complexities of MFRS 16 with precision and auditability.**
