# M14.5 Promotion Smoke Tests

# Quick verification commands for M14.5 Driver-Based Rolling Forecast

## 1. What-If Simulation Test (±5% price, flat seasonality)

```bash
# Test simulation with price increase and flat seasonality
curl -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" \
  -d '{
    "sourceBudgetVersionId": "bv_fy25_working",
    "driverProfileId": "dp_sample_revenue_growth",
    "simulationParams": {
      "priceDelta": 5,
      "volumeDelta": 0,
      "fxRate": 1.0,
      "seasonalityOverride": {
        "1": 100, "2": 100, "3": 100, "4": 100,
        "5": 100, "6": 100, "7": 100, "8": 100,
        "9": 100, "10": 100, "11": 100, "12": 100
      }
    }
  }' \
  http://localhost:3000/api/forecast/simulate

# Expected: Returns matrix with 5% price increase applied
# Log: {"event":"forecast_simulated","lines_processed":N,"duration_ms":<1000}
```

## 2. Forecast Generation Test (<5s for 50k lines)

```bash
# Generate forecast from working budget version
curl -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" \
  -d '{
    "sourceBudgetVersionId": "bv_fy25_working",
    "driverProfileId": "dp_sample_revenue_growth"
  }' \
  http://localhost:3000/api/forecast/versions/fv_sample_fy26_fc1/generate

# Expected: <5s response time for 50k lines
# Log: {"event":"forecast_generated","lines_processed":N,"duration_ms":<5000}
```

## 3. Report Integration Test (scenario=forecast:FY26-FC1)

```bash
# Test BvA report with forecast scenario and cost center pivot
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:3000/api/reports/budget-vs-actual?year=2026&scenario=forecast:FY26-FC1&pivot=cost_center&grand_total=true&pivot_null_label=Unassigned"

# Expected: Returns forecast data with cost center pivot matrix
# Should show forecast amounts instead of budget amounts
```

## 4. Driver Profile Management Test

```bash
# List available driver profiles
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:3000/api/drivers

# Expected: Returns sample "Revenue Growth Model" profile
```

## 5. Performance Verification

```bash
# Check logs for performance metrics
tail -f logs/app.log | grep -E "(forecast_generated|forecast_simulated)"

# Expected logs:
# {"event":"forecast_simulated","lines_processed":1200,"duration_ms":45}
# {"event":"forecast_generated","lines_processed":50000,"duration_ms":3200}
```

## 6. RBAC Verification

```bash
# Test with different role capabilities
# Admin: Should have forecasts:manage + forecasts:approve
# Accountant: Should have forecasts:manage + forecasts:approve
# Ops: Should have forecasts:manage only

# Test forecast generation with ops role
curl -X POST -H "X-API-Key: <ops-api-key>" -H "Content-Type: application/json" \
  -d '{"sourceBudgetVersionId": "bv_fy25_working", "driverProfileId": "dp_sample_revenue_growth"}' \
  http://localhost:3000/api/forecast/versions/fv_sample_fy26_fc1/generate

# Expected: Success (ops has forecasts:manage)
```

## Success Criteria

✅ **Simulation Test**: Returns matrix with price adjustments applied  
✅ **Generation Test**: <5s for 50k lines  
✅ **Report Test**: scenario=forecast:FY26-FC1 works with pivot  
✅ **RBAC Test**: Proper capability enforcement  
✅ **Observability**: Structured logs with duration_ms and lines_processed  
✅ **Performance**: All operations complete within SLA targets

## M14.5 Ready for Production! 🚀
