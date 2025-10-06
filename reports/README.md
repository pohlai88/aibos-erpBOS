# Reports Directory

This directory contains generated analysis reports and visualizations.

## Generated Files

- `dependency-map.json` - Machine-readable dependency graph
- `dependency-map.html` - Interactive dependency visualization
- `dependency-map.mmd` - Mermaid diagram source
- `dependency-map.svg` - Rendered dependency diagram
- `deps-cruiser.svg` - Detailed dependency-cruiser graph
- `sql-lineage.json` - Database table lineage
- `dashboard.html` - Unified dashboard for all reports

## Commands

```bash
# Generate all reports
pnpm deps:report

# View dashboard
pnpm deps:dashboard

# Individual reports
pnpm deps:map          # JSON output
pnpm deps:html         # HTML report
pnpm deps:mermaid      # Mermaid diagram
pnpm deps:lineage      # SQL lineage
```

## CI/CD Integration

These reports are generated in CI and uploaded as artifacts.
See `.github/workflows/` for configuration.
