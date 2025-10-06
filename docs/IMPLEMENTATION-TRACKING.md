# AIBOS ERP - Implementation Tracking

## 🎯 Hybrid Approach: Professional Tools + Custom Mapping

We use a combination of industry-standard tools and custom dependency mapping to ensure complete visibility into the system's implementation status.

---

## 📊 Quick Commands

```bash
# ============= Architecture Validation (NEW!) =============
pnpm arch:validate         # Validate architecture boundaries
pnpm arch:ci               # CI validation (exits with error)
pnpm arch:report           # Generate all architecture reports
pnpm arch:graph            # Visual dependency graph

# ============= Dependency & Lineage Tracking =============
pnpm deps:report           # Generate all dependency & lineage reports
pnpm deps:view             # View unified dashboard in browser

# Individual reports
pnpm deps:map              # JSON dependency map
pnpm deps:html             # HTML dependency visualization
pnpm deps:lineage          # SQL lineage analysis
pnpm deps:dashboard        # Unified dashboard

# ============= API Documentation =============
pnpm docs:api              # Generate API documentation
pnpm docs:lint             # Lint OpenAPI spec
pnpm docs:preview          # Preview API docs (live server)

# ============= Diagrams =============
pnpm docs:diagrams         # Generate architecture diagrams
```

---

## 🔧 Professional Tools

### 1. **Redocly** - API Documentation

- **Purpose**: Beautiful, interactive API documentation
- **Input**: `packages/contracts/openapi/openapi.json`
- **Output**: `api-docs.html`
- **Command**: `pnpm docs:api`

### 2. **Vitest** - Testing & Coverage

- **Purpose**: Unit tests and code coverage
- **Command**: `pnpm test`
- **Coverage**: `pnpm test:coverage`

### 3. **TypeScript** - Type Safety

- **Purpose**: Compile-time type checking
- **Command**: `pnpm typecheck`

### 4. **ESLint** - Code Quality

- **Purpose**: Code linting and style enforcement
- **Command**: `pnpm lint`

---

## 🗺️ Custom Dependency Mapper

### What It Does

The dependency mapper (`scripts/dependency-mapper.mjs`) provides a **complete view** of your system by mapping the full architecture flow:

```
Database (migrations + schema)
    ↓
Adapters (repositories, external systems)
    ↓
Ports (dependency inversion interfaces)
    ↓
Services (business logic)
    ↓
Policies / Posting Rules (business rules)
    ↓
Contracts (types/schemas)
    ↓
API Routes (BFF endpoints)
    ↓
UI (frontend pages) / Worker (background jobs)
```

### What It Identifies

1. **🚨 Broken Links**
   - API without database → crashes
   - UI without API → broken frontend
   - Services without API → orphaned code

2. **🔄 Partial Implementations**
   - Backend complete but no UI → users can't access
   - API without contracts → no type safety
   - Schema without migrations → deployment fails

3. **🔶 Orphaned Code**
   - Database + Services but no API → unused code
   - Half-finished features → technical debt

4. **✅ Complete Modules**
   - All layers present → ready to ship

### Output Files

All generated reports are stored in the `reports/` directory:

#### Dependency & Lineage Reports

1. **`reports/dependency-map.json`**
   - Machine-readable format for CI/CD
   - Complete dependency graph
   - Use in automated checks

2. **`reports/dependency-map.html`**
   - Human-readable visual report
   - Color-coded status (violations/orphans)
   - Actionable recommendations

3. **`reports/sql-lineage.json`**
   - Database table relationships
   - Foreign keys, JOINs, views
   - Data flow analysis

4. **`reports/dashboard.html`**
   - **Unified dashboard** consolidating all reports
   - Health score (0-100)
   - Quick action links
   - **Open this first** for system overview

5. **`reports/architecture.svg`**
   - Visual architecture diagram
   - Generated from `docs/architecture.mmd`

#### 🆕 Architecture Validation Reports

6. **`reports/arch-violations.json`**
   - Machine-readable boundary violations
   - Error/warning level classification
   - Use in CI/CD for strict enforcement

7. **`reports/arch-violations.html`**
   - Interactive HTML report
   - Visual violation browser
   - Filterable by severity

8. **`reports/arch-dependency-graph.svg`**
   - Complete dependency graph
   - Dark theme optimized
   - Layer-colored nodes

9. **`reports/arch-layers.svg`**
   - Focused layer visualization
   - Contracts/Services/Adapters only
   - Clean architecture view

---

## 📈 Module Status Definitions

| Status             | Meaning                                            | Action Required              |
| ------------------ | -------------------------------------------------- | ---------------------------- |
| **✅ Complete**    | All layers present (DB + Services + API + UI)      | Ready to ship                |
| **🔄 Partial**     | Some layers missing (e.g., backend done, no UI)    | Complete missing layers      |
| **🚨 Broken**      | Critical dependency missing (e.g., API without DB) | Fix immediately - will crash |
| **🔶 Started**     | Very early stage (< 40% complete)                  | Continue development         |
| **❌ Not Started** | No implementation yet                              | Plan and start               |

---

## 🎯 Priority Framework

### Fix in This Order:

1. **🚨 BROKEN** - Critical blockers (API without DB, UI without API)
2. **🔄 PARTIAL (High Value)** - Backend complete, just needs UI
3. **🔶 ORPHANED** - Remove unused code or complete implementation
4. **🔄 PARTIAL (Low Value)** - Early stage, needs more work

---

## 🔍 Understanding the Report

### Example Module Report:

```
M5: Accounts Payable [60%]
--------------------------------------------------------------------------------
Layers:
  ✅ 🗄️  Database: 1 migrations
  ✅ ⚙️  Services: 141 lines
  ✅ 🔌 API: 1 endpoints
  ❌ 📋 Contracts: MISSING
  ❌ 🎨 UI: MISSING

💡 Recommendations:
  📝 TODO: Backend complete - add frontend UI
  📝 TODO: Add type contracts for API
```

**Interpretation:**

- Database, services, and API are complete
- Missing contracts means no type safety
- Missing UI means users can't access this feature
- **Action**: Add UI first (highest user impact), then contracts

---

## 🚀 CI/CD Integration

### GitHub Actions Example:

```yaml
name: Architecture Compliance
on: [pull_request]

jobs:
  architecture-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - run: pnpm install

      # Step 1: Validate architecture boundaries (fails fast)
      - name: Validate Architecture
        run: pnpm arch:ci

      # Step 2: Generate comprehensive reports
      - name: Generate Reports
        run: |
          pnpm deps:report
          pnpm arch:report

      # Step 3: Code quality checks
      - name: Quality Checks
        run: |
          pnpm lint
          pnpm typecheck

      # Upload reports as artifacts
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: architecture-reports
          path: |
            reports/
            reports/arch-violations.json
            reports/arch-violations.html
            reports/arch-dependency-graph.svg

      # Fail if violations detected
      - name: Check Violations
        run: |
          # Check dependency mapper
          VIOLATIONS=$(jq '.graph.summary.violationCount' reports/dependency-map.json)
          if [ "$VIOLATIONS" -gt 0 ]; then
            echo "❌ $VIOLATIONS architecture violations found"
            exit 1
          fi

          # Check architecture boundaries
          if [ -f reports/arch-violations.json ]; then
            ARCH_ERRORS=$(jq '[.violations[] | select(.rule.severity == "error")] | length' reports/arch-violations.json)
            if [ "$ARCH_ERRORS" -gt 0 ]; then
              echo "❌ $ARCH_ERRORS boundary violations found"
              exit 1
            fi
          fi

          echo "✅ No violations detected"
```

---

## 📚 Module Mapping

The mapper automatically detects modules based on:

1. **Migration prefixes** (e.g., `0084_ap_*` → M5 Accounts Payable)
2. **Schema files** (e.g., `schema/payments.ts`)
3. **API paths** (e.g., `apps/bff/app/api/purchase-invoices`)
4. **Service paths** (e.g., `packages/services/src/posting-pi.ts`)

### Current Modules:

- **M1-M10**: Core ERP (Ledger, Journals, AR, AP, Assets, etc.)
- **M11-M20**: Advanced Features (Revenue, Tax, Budgets, Consolidation)
- **M21-M30**: Compliance & Controls (Evidence, SOX, ITGC, Insights)
- **M31-M33**: Lease Accounting (Leases, Subleases, Sale-Leaseback)

---

## 🛠️ Maintenance

### Adding a New Module

1. Follow the canonical architecture flow: DB → Adapters → Ports → Services → Policies → Contracts → API → UI

2. Ensure proper layer boundaries (enforced by `eslint-plugin-boundaries`)

3. Run reports to verify:

   ```bash
   pnpm deps:report
   pnpm deps:view
   ```

4. Check for violations:
   ```bash
   pnpm lint
   ```

### Updating Module Paths

If you reorganize code, update the paths in `MODULE_DEFINITIONS` to match your new structure.

---

## 💡 Best Practices

1. **Validate architecture first**: `pnpm arch:validate` before every commit
2. **Run before every PR**: `pnpm deps:report && pnpm arch:report` for comprehensive analysis
3. **Check the dashboard**: `pnpm deps:view` for quick health overview
4. **Fix violations immediately**: Both dependency and boundary violations fail CI
5. **Keep health score > 95**: Monitor violations and orphans
6. **Follow the guardrails**: See `docs/DEPENDENCY_LINEAGE_GUARDRAILS.md`
7. **Remove orphaned code**: If it's not used, delete it
8. **Document as you go**: Update module docs when completing features
9. **Use CI command in automation**: `pnpm arch:ci` for fast-fail validation

---

## 🤝 Getting Help

- **Quick overview**: Open `reports/dashboard.html` (run `pnpm deps:view`)
- **Dependency violations**: Check `reports/dependency-map.html`
- **Boundary violations**: Check `reports/arch-violations.html`
- **Visual dependencies**: See `reports/arch-dependency-graph.svg`
- **SQL lineage**: Review `reports/sql-lineage.json`
- **Compliance rules**: Read `docs/DEPENDENCY_LINEAGE_GUARDRAILS.md`
- **Architecture diagram**: See `reports/architecture.svg`

---

## 📝 Notes

- The mapper scans **actual files**, not configuration
- It identifies **real dependencies**, not assumptions
- Reports are **actionable**, not just informational
- Use **professional tools** for standard metrics (coverage, quality)
- Use **custom mapper** for system-specific dependencies
