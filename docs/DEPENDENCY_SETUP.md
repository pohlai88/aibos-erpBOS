# Dependency & Lineage Tracking - Quick Start

## 🚀 Installation

### 1. Install Dependencies

```powershell
pnpm install
```

This will install `@mermaid-js/mermaid-cli` and other required tools.

### 2. Verify Installation

```powershell
# Check if all tools are available
pnpm deps:check
```

---

## 📊 Generate Reports

### One Command to Rule Them All

```powershell
pnpm deps:report
```

This generates:

- `reports/dependency-map.json` - Machine-readable dependency graph
- `reports/dependency-map.html` - Interactive dependency visualization
- `reports/sql-lineage.json` - Database table relationships
- `reports/dashboard.html` - **Unified dashboard** (start here!)

### View Dashboard

```powershell
pnpm deps:view
```

Opens `reports/dashboard.html` in your default browser.

---

## 🎯 Daily Workflow

### Before Starting Work

```powershell
# Check system health
pnpm deps:view
```

### Before Creating PR

```powershell
# Validate architecture boundaries first
pnpm arch:validate

# Generate fresh reports
pnpm deps:report
pnpm arch:report

# Check for violations
pnpm lint

# Type check
pnpm typecheck

# If all green, you're good to commit!
```

### After PR Merge

```powershell
# Verify no new violations
pnpm arch:ci
pnpm deps:report
pnpm deps:view
```

---

## 🔍 Individual Reports

### 🏛️ Architecture Validation (NEW!)

```powershell
# Validate architecture boundaries
pnpm arch:validate              # Error output (quick check)
pnpm arch:validate:text         # Human-readable text
pnpm arch:validate:json         # Machine-readable JSON

# Visual dependency graphs
pnpm arch:graph                 # Full dependency graph (SVG)
pnpm arch:graph:png             # Full dependency graph (PNG)
pnpm arch:archi                 # High-level architecture view
pnpm arch:layers                # Focus on contracts/services/adapters

# Reports
pnpm arch:html                  # Interactive HTML violations report
pnpm arch:report                # Generate all architecture reports

# CI/CD
pnpm arch:ci                    # CI validation (exits with error)
```

### 📊 Dependency Analysis

```powershell
# Full analysis
pnpm deps:analyze

# Find circular dependencies
pnpm deps:circular

# Generate visual graph
pnpm deps:graph
```

### 🔗 Lineage Tracking

```powershell
# JSON map (fails on violations - use in CI)
pnpm deps:map

# HTML visualization (shows 8 samples per edge)
pnpm deps:html

# Mermaid diagram
pnpm deps:mermaid

# SQL lineage
pnpm deps:lineage

# CI-grade report (strict mode)
pnpm deps:report:ci
```

### 📐 Architecture Diagrams

```powershell
# Generate from docs/architecture.mmd
pnpm docs:diagrams
```

---

## 🚨 Troubleshooting

### "mmdc: command not found"

```powershell
# Reinstall mermaid-cli
pnpm install -D @mermaid-js/mermaid-cli

# Verify
npx mmdc --version
```

### "Cannot find module 'fast-glob'"

```powershell
# fast-glob should be installed, but verify
pnpm add -D fast-glob
```

### Reports Not Generating

```powershell
# Ensure reports directory exists
New-Item -Path "reports" -ItemType Directory -Force

# Run individual steps
pnpm deps:map
pnpm deps:html
pnpm deps:lineage
pnpm deps:dashboard
```

### Dependency-Cruiser Errors

```powershell
# Check configuration
pnpm deps:analyze

# If errors persist, check .dependency-cruiser.js
```

---

## 📖 Documentation

- **Full Guardrails**: `docs/DEPENDENCY_LINEAGE_GUARDRAILS.md`
- **Implementation Tracking**: `docs/IMPLEMENTATION-TRACKING.md`
- **Architecture Diagram**: `docs/architecture.mmd`

---

## 🎨 Report Outputs

All reports are in `reports/` directory (gitignored):

```
reports/
├── dashboard.html                  ← START HERE (unified view)
├── dependency-map.json             (machine-readable dependency graph)
├── dependency-map.html             (interactive dependency visualization)
├── dependency-map.mmd              (mermaid source)
├── dependency-map.svg              (rendered mermaid diagram)
├── sql-lineage.json                (database relationships)
├── architecture.svg                (architecture diagram from .mmd)
├── deps-graph.svg                  (madge graph)
│
├── 🆕 Architecture Validation Reports:
├── arch-violations.json            (machine-readable violations)
├── arch-violations.html            (interactive violation report)
├── arch-dependency-graph.svg       (visual dependency graph)
├── arch-dependency-graph.png       (PNG version)
├── arch-high-level.dot             (architecture overview)
└── arch-layers.svg                 (layer-focused visualization)
```

---

## ✅ Success Criteria

Your system is healthy when:

- ✅ Health Score > 95 (in dashboard)
- ✅ 0 Architecture Violations (dependency-mapper)
- ✅ 0 Boundary Violations (dependency-cruiser)
- ✅ < 10 Orphan Files
- ✅ 0 Circular Dependencies
- ✅ All lint checks pass
- ✅ `pnpm arch:ci` exits with code 0

---

## 🔄 CI/CD Integration

See `docs/DEPENDENCY_LINEAGE_GUARDRAILS.md` for:

- GitHub Actions workflow
- Pre-commit hooks
- Automated compliance checks

---

## 💡 Pro Tips

1. **Bookmark the dashboard**: `file:///D:/aibos-erpBOS/reports/dashboard.html`
2. **Check before lunch**: Run `pnpm deps:view` to catch issues early
3. **Use in PRs**: Link to reports in PR descriptions
4. **Track metrics**: Monitor health score trend over time
5. **Fix violations fast**: Don't let them accumulate
6. **CI mode**: Use `pnpm deps:report:ci` for strict validation
7. **Early scaffolding**: Use `--fail-on none` when building new features

---

## 🆘 Need Help?

1. Check the dashboard for recommendations
2. Read the guardrails doc
3. Run `pnpm deps:circular` to find specific issues
4. Open an issue with reports attached

---

**Generated**: 2025-10-06
