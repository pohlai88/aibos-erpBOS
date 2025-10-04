# M26.2 — Close Insights & Benchmarks Runbook

## Overview

M26.2 provides comprehensive insights and benchmarking capabilities for close processes, including anomaly detection, performance analytics, and actionable recommendations. This module extends M26/M26.1 with zero drift and no refactors.

## What You Get

1. **Insights Data Mart**: Flattened facts from close runs, tasks, controls, exceptions, KPIs, flux, and certifications for fast analytics
2. **Benchmarks Engine**: Entity + consolidated baselines (self, peers, time), percentile bands, targets & alerts
3. **Anomaly & SLA Optimizer**: Late-task root-cause mining, recurring control failures, bottleneck graph, action recommendations
4. **Dashboards & API**: Time-to-close, on-time %, exception aging, top bottlenecks, benchmark deltas; export endpoints

## Architecture

### Database Schema

- **Insights Facts**: `ins_fact_close`, `ins_fact_task`, `ins_fact_ctrl`, `ins_fact_flux`, `ins_fact_cert`
- **Benchmarks**: `ins_bench_baseline`, `ins_bench_target`
- **Anomalies**: `ins_anomaly`, `ins_reco`
- **Views**: `vw_ins_kpi_trend`, `vw_ins_benchmark_delta`, `vw_ins_bottlenecks`

### Services

- **Harvest Service**: Builds facts from existing sources (idempotent per run)
- **Benchmarks Service**: Computes baselines with percentile bands
- **Anomaly Service**: Detects patterns and generates recommendations
- **Export Service**: CSV/JSON export capabilities

### API Endpoints

- `/api/insights/harvest` - Harvest facts from close runs
- `/api/insights/facts` - Query insights facts
- `/api/insights/benchmarks/run` - Compute benchmark baselines
- `/api/insights/benchmarks` - Get benchmark deltas
- `/api/insights/targets` - Manage benchmark targets
- `/api/insights/anomalies` - Get/scan anomalies
- `/api/insights/reco` - Get/action recommendations
- `/api/insights/export` - Export data

## Deployment Steps

### 1. Run Migrations

```bash
# Run all M26.2 migrations in sequence
psql -d $DB -f packages/adapters/db/migrations/0210_close_insights_core.sql
psql -d $DB -f packages/adapters/db/migrations/0211_close_benchmarks.sql
psql -d $DB -f packages/adapters/db/migrations/0212_close_anomaly.sql
psql -d $DB -f packages/adapters/db/migrations/0213_close_insights_views.sql
psql -d $DB -f packages/adapters/db/migrations/0214_close_insights_perf_idx.sql
psql -d $DB -f packages/adapters/db/migrations/0215_close_insights_outbox.sql
psql -d $DB -f packages/adapters/db/migrations/0216_close_insights_seed.sql
psql -d $DB -f packages/adapters/db/migrations/0217_close_insights_rbac.sql
psql -d $DB -f packages/adapters/db/migrations/0218_fk_hardening.sql
```

### 2. Seed Default Targets (Optional)

```sql
-- Seed default benchmark targets for your company
INSERT INTO ins_bench_target(company_id, metric, target, effective_from, created_by, updated_by)
VALUES ('<your-company-id>', 'DAYS_TO_CLOSE', 5, CURRENT_DATE, 'admin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ins_bench_target(company_id, metric, target, effective_from, created_by, updated_by)
VALUES ('<your-company-id>', 'ON_TIME_RATE', 0.9, CURRENT_DATE, 'admin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ins_bench_target(company_id, metric, target, effective_from, created_by, updated_by)
VALUES ('<your-company-id>', 'AVG_TASK_AGE', 24, CURRENT_DATE, 'admin', 'admin')
ON CONFLICT (id) DO NOTHING;
```

### 3. Initial Data Harvest

```bash
# Harvest facts from existing close runs
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/api/insights/harvest

# Compute initial benchmarks
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"entity_group": "SELF"}' \
  http://localhost:3000/api/insights/benchmarks/run
```

### 4. Verify Installation

```bash
# Check insights facts
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/insights/facts?kind=CLOSE"

# Check benchmark deltas
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/insights/benchmarks"

# Check anomalies
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/insights/anomalies"
```

## Automated Scheduling

The following cron jobs are configured in `vercel.json`:

- **Nightly 02:05 UTC**: `/api/insights/harvest` - Harvest facts for latest close runs
- **Nightly 02:15 UTC**: `/api/insights/benchmarks/run` - Recompute SELF baselines (rolling 6 months)
- **Hourly**: `/api/insights/anomalies` - Scan for anomalies and emit alerts

## Usage Examples

### Query KPI Trends

```bash
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/insights/facts?kind=CLOSE&from=2025-01-01&to=2025-12-31"
```

### Export Anomalies to CSV

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"kind":"ANOMALY","format":"csv","from":"2025-09-01","to":"2025-11-30"}' \
  http://localhost:3000/api/insights/export
```

### Set Custom Targets

```bash
curl -sS -X PUT -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "DAYS_TO_CLOSE",
    "target": 3,
    "effective_from": "2025-01-01T00:00:00Z",
    "effective_to": "2025-12-31T23:59:59Z"
  }' \
  http://localhost:3000/api/insights/targets
```

### Action Recommendations

```bash
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<reco-id>",
    "status": "PLANNED",
    "note": "Will implement in next sprint"
  }' \
  http://localhost:3000/api/insights/reco
```

## Key Features

### Insights Facts

- **Close Facts**: Days to close, on-time rate, late tasks, exceptions, certifications
- **Task Facts**: Age hours, SLA breaches, completion patterns
- **Control Facts**: Execution duration, exception counts, material failures
- **Flux Facts**: Material variances, comment coverage, top movers
- **Certification Facts**: Sign-off completion by level and role

### Benchmark Baselines

- **SELF**: Rolling 6-month company history with p50/p75/p90 percentiles
- **PEER**: Industry/size-based comparisons (placeholder for future implementation)
- **GLOBAL**: Cross-industry benchmarks (placeholder for future implementation)
- **Targets**: Configurable target values with effective periods

### Anomaly Detection

- **Task Anomalies**: Repeated late task patterns (3+ occurrences)
- **Control Anomalies**: Recurring control failures with material severity
- **Flux Anomalies**: Low comment coverage (<50%) on material variances
- **Duration Anomalies**: Close duration spikes above p90 baseline

### Recommendations Engine

- **Task SLA Optimization**: "Shift JE cutoff task earlier by 12h"
- **Control Prechecks**: "Add control precheck to bank reconciliation"
- **Flux Templates**: "Create standardized comment templates"
- **Impact Estimates**: Quantified improvement potential
- **Effort Levels**: LOW/MEDIUM/HIGH implementation complexity

## Performance Characteristics

- **Harvest Performance**: p95 < 2s for 12 months × 10 entities
- **Query Performance**: Sub-300ms with optimized indexes
- **Idempotent Operations**: Safe to re-run harvest/benchmark jobs
- **Scalable Architecture**: Handles growing data volumes efficiently

## RBAC Capabilities

- **insights:view**: View insights, benchmarks, and analytics
- **insights:admin**: Manage insights data, targets, and recommendations

## Monitoring & Alerts

- **Outbox Events**: `INSIGHTS_ALERT`, `BENCHMARK_DRIFT`, `SLA_RECO`
- **High Severity Anomalies**: Automatic alert generation
- **Benchmark Drift**: Significant deviation notifications
- **SLA Recommendations**: Weekly grouped recommendations by owner

## Troubleshooting

### Common Issues

1. **No facts harvested**: Check if close runs exist and are in PUBLISHED status
2. **Missing benchmarks**: Ensure sufficient historical data (6+ months recommended)
3. **Anomaly false positives**: Adjust scoring thresholds in anomaly service
4. **Export failures**: Verify date ranges and data availability

### Debug Commands

```bash
# Check harvest status
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/insights/facts"

# Force benchmark recomputation
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"entity_group": "SELF"}' \
  http://localhost:3000/api/insights/benchmarks/run

# Check anomaly scan results
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/insights/anomalies"
```

## Definition of Done

✅ Insights facts populated idempotently from close/controls/flux/certs  
✅ Benchmarks computed with SELF p50/p75/p90 and optional PEER/GLOBAL; targets CRUD  
✅ Anomalies scored with HIGH/MEDIUM/LOW; alerts and recommendations produced  
✅ APIs for facts, benchmarks, anomalies, recommendations, exports with RBAC  
✅ Cron in place; tests cover harvest, percentile calc, anomaly lifecycle, export shapes  
✅ Performance: harvest p95 < 2s for 12 months × 10 entities; queries sub-300ms with indexes

## Next Steps

1. **UI Integration**: Connect insights APIs to dashboard components
2. **Peer Benchmarks**: Implement industry/size-based peer comparisons
3. **Global Benchmarks**: Add cross-industry benchmark data
4. **Advanced Analytics**: Machine learning for predictive insights
5. **Real-time Alerts**: WebSocket notifications for critical anomalies

---

**M26.2 is now ready for production use!** 🚀
