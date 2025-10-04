# M28 — Lease Accounting (MFRS 16)

## Overview

M28 implements comprehensive lease accounting under **MFRS 16** standards, providing end-to-end lease management from initial recognition through monthly posting to compliance disclosures. This module closes the accounting module under MFRS with full ROU asset and lease liability management.

## Architecture

### Data Model

- **`lease`** — Master lease data with MFRS 16 compliance fields
- **`lease_cashflow`** — Normalized payments with variable/in-substance fixed flags
- **`lease_opening`** — Derived opening measures: ROU asset and lease liability
- **`lease_schedule`** — Monthly amortization schedule with interest and ROU amortization
- **`lease_event`** — Remeasurements and modifications affecting lease accounting
- **`lease_post_lock`** — Period guard and idempotency for GL posting
- **`lease_disclosure`** — Period snapshots for MFRS 16 disclosure requirements
- **`lease_attachment`** — Evidence links to M26.4 vault for audit trail

### Services

- **`LeaseRegistrationService`** — Create/update leases with cashflow validation
- **`LeaseScheduleService`** — Build amortization schedules and maturity analysis
- **`LeasePostingService`** — Generate monthly journal entries with period guards
- **`LeaseRemeasureService`** — Handle remeasurements and modifications
- **`LeaseDisclosureService`** — Generate MFRS 16 compliance disclosures
- **`LeaseEvidenceService`** — Link evidence to M26.4 vault

### API Endpoints

- `POST /api/leases` — Create/update lease + attachments
- `GET /api/leases` — Filter by class/status/date
- `POST /api/leases/run` — Generate & post month pack (dry_run|commit)
- `POST /api/leases/events` — Remeasure/modification/termination
- `GET /api/leases/schedule` — Stream schedule (supports `present=XXX` view)
- `GET /api/leases/disclosures` — Period disclosures
- `POST /api/leases/evidence` — Link files (M26.4)
- `GET /api/leases/maturity` — Liability maturity table (bands)

## Key Features

### MFRS 16 Compliance

- **Initial Recognition**: ROU asset = Lease liability + initial direct costs + restoration cost – incentives received
- **Subsequent Measurement**: Monthly interest using EIR, liability reduction via payments, ROU amortization
- **Practical Expedients**: Short-term exemption, low-value assets, portfolio approach
- **Classification Tags**: By asset class (Land/Building, IT/Equipment, Vehicles, Others)

### Monthly Engine

- **Interest Calculation**: `Int_t = round(B_t × i, precision)` where i = monthly EIR
- **Liability Close**: `B_{t+1} = B_t + Int_t – P_t_principal`
- **ROU Amortization**: Straight-line default, componentized optional
- **Variable Payments**: Expense to P&L when incurred (not in-substance fixed)

### Events & Remeasurements

- **CPI Indexation**: Automatic liability adjustment with ROU asset correlation
- **Rate Changes**: Floating rate adjustments with proper accounting treatment
- **Term Modifications**: Scope increases/decreases with P&L impact
- **Early Termination**: Proper gain/loss recognition per MFRS 16

### Foreign Currency

- **Functional Currency**: Books maintained in functional currency
- **Presentation Currency**: M17 view-only conversion for reporting
- **FX Revaluation**: Monthly liability revaluation via M18 admin rates

### Controls & Disclosures

- **Maturity Analysis**: Undiscounted cash outflows by ≤1y, 1–2y, 2–3y, 3–5y, >5y
- **Rollforwards**: ROU asset and lease liability movements
- **WADR**: Weighted-average discount rate calculation
- **Expense Breakdown**: Short-term, low-value, variable lease payments
- **Cash Outflow**: Total lease payments during period

## Journal Logic

### Monthly Posting Pack

```
Dr: Lease Interest Expense        Cr: Lease Liability (interest accretion)
Dr: Lease Liability              Cr: Cash (payments)
Dr: Amortization Expense         Cr: Accumulated Amortization – ROU
Dr: FX Loss (if applicable)      Cr: Lease Liability (FX revaluation)
```

### Remeasurement Logic

- **Index/Rate Changes**: New PV of remaining payments → ΔLiability
- **Scope Decreases**: Reduce ROU proportionally; excess Δ to P&L
- **Scope Increases**: Adjust ROU by ΔLiability (no P&L impact)

## RBAC

### Capabilities

- `lease:read` — Read access to lease data and schedules
- `lease:manage` — Create, update, and modify lease contracts
- `lease:post` — Post monthly lease journal entries
- `lease:disclose` — Generate MFRS 16 disclosures and reports

### Role Mappings

- **admin/accountant/controller/auditor** → All capabilities
- **ops** → Read access only

## Performance Targets

- **Schedule Generation**: p95 < 2s for 2k leases
- **Monthly Posting**: p95 < 1s for 2k month rows
- **Remeasurement Batch**: p95 < 3s for 1k affected leases
- **All Operations**: Idempotent with `lease_post_lock` guards

## Edge Cases & Policies

### MFRS 16 Exemptions

- **Short-term**: ≤12 months → expense straight-line, no ROU/liability
- **Low-value**: Policy threshold (e.g., USD 5k) → expense as incurred
- **Variable Payments**: Not in-substance fixed → expense when incurred

### Special Considerations

- **IDC & Incentives**: Opening ROU adjustments supported
- **Restoration (ARO)**: Included in ROU; hooks to planned M37
- **Sale-and-leaseback**: Optional phase 2 implementation

## Integration Points

### M17 Period Guard

- All posting operations blocked when period closed
- Idempotent runs via `lease_post_lock` table
- Integration with `postJournal()` function

### M18 FX Rates

- Monthly liability revaluation using admin rates
- Unrealized FX to P&L per policy
- Presentation currency conversion (view-only)

### M26.4 Evidence Vault

- Agreement PDFs, CPI notices, IDC support
- Hash-addressed evidence linking
- Audit trail compliance

## Example Flows

### 1. Create Lease

```bash
curl -X POST /api/leases -H "Authorization: Bearer $TOKEN" -d '{
  "lease_data": {
    "lease_code": "OFFICE-HCMC-01",
    "asset_class": "Building",
    "ccy": "VND",
    "commence_on": "2025-01-01",
    "end_on": "2027-12-31",
    "payment_frequency": "MONTHLY",
    "discount_rate": 0.085,
    "index_code": "VN-CPI",
    "short_term_exempt": false,
    "low_value_exempt": false
  },
  "cashflows": [
    {
      "due_on": "2025-01-31",
      "amount": 12000000,
      "in_substance_fixed": true
    }
  ]
}'
```

### 2. Run Month-End (Dry Run)

```bash
curl -X POST /api/leases/run -H "Authorization: Bearer $TOKEN" -d '{
  "year": 2025,
  "month": 11,
  "dry_run": true
}'
```

### 3. Record CPI Remeasurement

```bash
curl -X POST /api/leases/events -H "Authorization: Bearer $TOKEN" -d '{
  "lease_code": "OFFICE-HCMC-01",
  "kind": "INDEX",
  "effective_on": "2026-01-01",
  "index_rate": 1.045
}'
```

### 4. Generate Disclosures

```bash
curl "/api/leases/disclosures?year=2025&month=12" -H "Authorization: Bearer $TOKEN"
```

## Migration Sequence

1. **0295_lease_core_m28.sql** — Core lease tables and indexes
2. **0296_lease_rbac_caps_m28.sql** — RBAC capabilities and role mappings

## Definition of Done

### Accounting Correctness

- ✅ Initial recognition ties: ROU & liability computed per MFRS 16
- ✅ Monthly postings balanced; blocked when period closed (M17)
- ✅ Remeasurement proofs stored; ROU vs P&L logic correct for scope changes

### Disclosures Complete

- ✅ Maturity analysis by time bands
- ✅ ROU asset and lease liability rollforwards
- ✅ WADR calculation
- ✅ Expense breakdown (short-term, low-value, variable)
- ✅ Total cash outflow for leases
- ✅ Export + eBinder integration (M26.4)

### Performance & Operations

- ✅ Perf targets met (2s schedule, 1s posting, 3s remeasure)
- ✅ Idempotent runs with comprehensive logs
- ✅ Evidence attached for agreements/index notices

### API & Tests

- ✅ CRUD, import, schedule, run, remeasure, disclose endpoints
- ✅ Happy + edge path coverage
- ✅ RBAC enforcement on all endpoints

## Future Enhancements

### Phase 2 (Optional)

- **Componentized Amortization**: Multi-component ROU patterns
- **Sale-and-leaseback**: Recognition split & disclosures
- **Portfolio Expedient**: Batch calc for homogeneous assets
- **ARO Integration**: Link to M37 for restoration obligations

---

**Status**: ✅ **COMPLETE** — M28 Lease Accounting (MFRS 16) fully implemented with comprehensive compliance, performance targets met, and integration with M17/M18/M26.4 systems.
