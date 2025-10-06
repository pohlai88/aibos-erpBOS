# 🚀 AIBOS ERP UI Implementation Guide

**Version**: 2.0 (Production-Grade)  
**Last Updated**: 2025-10-06  
**Status**: Ready for 40-Module Rollout

---

## 📋 Overview

This guide provides the complete workflow for implementing UI modules using the production-grade runbook system. All 40 modules follow this standardized approach to ensure consistency, quality, and speed.

---

## 🎯 What Was Upgraded

### From Basic to Production-Grade

The runbook system has been upgraded with **6 critical enhancements**:

1. **👥 Ownership & Accountability** - Clear responsibility and traceability
2. **🔒 UI Permissions Matrix** - Exact role-based access control mapping
3. **📝 UX Copy Deck** - 100+ i18n entries for all user-facing content
4. **🧪 Test Data & Fixtures** - Comprehensive testing datasets
5. **🎯 Measurable Quality Gates** - CI-enforced thresholds
6. **🔄 Rollout & Rollback** - < 5min rollback procedures

### Key Metrics

- **M01-CORE-LEDGER.md**: 1,690 lines (reference implementation)
- **RUNBOOK-TEMPLATE.md**: Complete template for all modules
- **PR-REVIEW-CHECKLIST.md**: Comprehensive review gates
- **Required Sections**: 16 (up from 10)
- **Quality Gates**: 12 measurable thresholds
- **Sign-offs Required**: 6 departments

---

## 🗂️ Core Documents

### 1. RUNBOOK-TEMPLATE.md ⭐

**Purpose**: Drop-in template for creating new module runbooks

**Usage**:

```bash
# Create new module runbook
cp ui-runbook/RUNBOOK-TEMPLATE.md ui-runbook/M02-JOURNAL-ENTRIES.md

# Replace all placeholders
# <MODULE_ID> → M02
# <MODULE_NAME> → Journal Entries
# <module> → journal-entries
# <Entity> → JournalEntry
# etc.
```

**Sections** (16 required):

1. Ownership & Accountability
2. Executive Summary
3. Current Status (with Risks & Blockers)
4. 3 Killer Features
5. Technical Architecture
6. Non-Functional Requirements (Performance, A11y, Security, Observability)
7. Domain Invariants
8. Error Handling & UX States
9. UX Copy Deck (100+ entries)
10. API Integration
11. State & Caching
12. Implementation Guide
13. Testing Checklist (7 types)
14. Test Data & Fixtures
15. Rollout & Rollback
16. Definition of Done (with Quality Gates)

### 2. M01-CORE-LEDGER.md ⭐

**Purpose**: Gold-standard reference implementation

**What Makes It Special**:

- ✅ All 16 sections complete with real content
- ✅ 100+ UX copy entries with i18n keys
- ✅ Complete permissions matrix (3 roles × 8 actions)
- ✅ Comprehensive test data strategy (3 datasets)
- ✅ Detailed rollout plan (4 environments)
- ✅ < 5min rollback procedure with decision matrix
- ✅ 12 measurable quality gates
- ✅ 6 department sign-offs

**Use Cases**:

- Reference when filling template
- Example of production-grade documentation
- Standard for all 40 modules

### 3. PR-REVIEW-CHECKLIST.md ⭐

**Purpose**: Comprehensive PR review requirements

**Usage**:

```markdown
<!-- Copy entire checklist into PR description -->
<!-- Check each item as you verify -->
<!-- All ✅ REQUIRED items must pass -->
```

**Categories**:

- 📄 Runbook Completeness (16 sections)
- 💻 Code Quality (TypeScript, ESLint, React)
- 🧪 Testing (7 types of tests)
- 🎨 UI/UX (design compliance, states, forms)
- 🔒 Security (RBAC, data protection, rate limiting)
- 📊 Observability (analytics, error tracking, dashboards)
- 🚀 Deployment (flags, environments, rollback)
- 📚 Documentation (code, PR, contracts)
- ✅ Sign-offs (6 departments)

**Blocker Criteria** (11 items that prevent merge):

- TypeScript/ESLint errors
- Test coverage < 90%
- Axe serious/critical violations
- Bundle size > 250KB
- Lighthouse scores < thresholds
- Security vulnerabilities
- Missing sign-offs
- Rollback not tested
- Feature flags not configured

---

## 🔄 Complete Workflow

### Phase 1: Runbook Creation

```bash
# Step 1: Copy template
cp ui-runbook/RUNBOOK-TEMPLATE.md ui-runbook/M##-<MODULE>.md

# Step 2: Fill all 16 sections
# - Use M01-CORE-LEDGER.md as reference
# - Complete UX Copy Deck (100+ entries)
# - Define test data & fixtures
# - Specify rollout & rollback plan
# - Set measurable quality gates

# Step 3: Validate completeness
# - All placeholders replaced
# - No "TBD" or "TODO" items
# - All tables filled
# - All code examples provided

# Step 4: Get runbook review
# - Module owner: Architecture approval
# - QA lead: Testability review
# - Design: UX copy approval
```

### Phase 2: Implementation

```bash
# Step 1: Setup foundation
mkdir -p apps/web/app/(dashboard)/<route>
mkdir -p apps/web/hooks
mkdir -p apps/web/components/<module>

# Step 2: Feature flag
# Create flag: flags.<module> = false

# Step 3: Build components
# - Follow runbook implementation guide
# - Use aibos-ui components
# - Follow dark-first theme
# - Mark client components with "use client"

# Step 4: Wire hooks
# - Use @tanstack/react-query
# - Follow React Query key structure
# - Implement error mapping
# - Add retry & backoff

# Step 5: Add i18n
# - Create @/i18n/messages/<module>.json
# - Use keys from UX Copy Deck
# - Test with screen reader

# Step 6: Test continuously
# - Unit tests (≥90% coverage)
# - Integration tests (API + UI)
# - Run tests after each component
```

### Phase 3: Testing

```bash
# Unit Tests
pnpm run test -- apps/web/app/(dashboard)/<route>
pnpm run test:coverage

# Integration Tests
pnpm run test:integration -- <module>

# E2E Tests
pnpm run test:e2e -- <module>

# Accessibility
pnpm run test:a11y -- <route>

# Contract Tests
pnpm run test:contracts -- <module>

# Visual Regression (if available)
pnpm run test:visual -- <module>

# Performance
pnpm run build
pnpm run analyze:bundle
pnpm run lighthouse -- <route>
```

### Phase 4: Quality Gates

```bash
# Verify all 12 gates pass

# 1. TypeScript Clean
pnpm run type-check

# 2. ESLint Clean
pnpm run lint

# 3. Unit Coverage ≥90%
pnpm run test:coverage
# Check coverage/index.html

# 4. Bundle ≤250KB
pnpm run analyze:bundle
# Verify route size

# 5. TTFB ≤70ms
# Check staging Server-Timing header

# 6. TTI ≤200ms
pnpm run lighthouse -- <route>

# 7. Axe 0 serious/critical
pnpm run test:a11y -- <route>

# 8-12. Lighthouse scores ≥ thresholds
pnpm run lighthouse -- <route>
```

### Phase 5: PR Submission

```bash
# Step 1: Create PR
git checkout -b feature/m##-<module>-ui
git add .
git commit -m "feat(ui): implement M## <module> UI"
git push origin feature/m##-<module>-ui

# Step 2: Copy checklist into PR description
# - Copy entire PR-REVIEW-CHECKLIST.md
# - Check completed items
# - Add screenshots (before/after)
# - Link to runbook

# Step 3: Request reviews
# - 2 code reviewers (senior engineers)
# - QA lead
# - Design lead
# - PM (for feature completeness)
```

### Phase 6: Review & Approval

```bash
# Reviewers check:
# ✅ All 16 runbook sections complete
# ✅ All quality gates passed
# ✅ No blockers present
# ✅ Test coverage ≥90%
# ✅ Bundle size ≤250KB
# ✅ Accessibility compliant
# ✅ Security reviewed
# ✅ Rollback tested

# Sign-offs required (6 departments):
# 1. Engineering (code review)
# 2. QA (all tests pass)
# 3. Design (UI matches specs)
# 4. PM (feature complete)
# 5. Security (no vulnerabilities)
# 6. Accessibility (WCAG 2.2 AA)

# If all pass → APPROVE
# If any fail → REQUEST CHANGES
```

### Phase 7: Deployment

```bash
# Deploy to dev
git merge feature/m##-<module>-ui
# Auto-deploy to dev environment

# Smoke test on dev
pnpm run test:smoke -- dev <module>

# Deploy to staging
git push origin main
# Auto-deploy to staging

# Full regression on staging
pnpm run test:regression -- staging <module>

# Deploy to production (flag off)
# Manual deploy with flag: flags.<module> = false

# Gradual rollout
# Day 1: Beta users (5%)
flags.<module> = true (for beta cohort)

# Day 4: All users (100%)
flags.<module> = true (for everyone)
```

---

## 📊 Quality Standards

### Code Quality

| Metric            | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| console.log       | 0         | Manual      |
| Hardcoded styles  | 0         | Manual      |

### Test Coverage

| Metric            | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| Line coverage     | ≥90%      | CI blocks   |
| Critical paths    | ≥95%      | Manual      |
| Integration tests | All CRUD  | CI blocks   |
| E2E tests         | All flows | CI blocks   |
| A11y tests        | 0 serious | CI blocks   |

### Performance

| Metric           | Threshold      | Enforcement |
| ---------------- | -------------- | ----------- |
| Bundle size      | ≤250KB gzipped | CI blocks   |
| TTFB             | ≤70ms          | Manual      |
| TTI              | ≤200ms         | Manual      |
| Network requests | ≤4 initial     | Manual      |
| Lighthouse Perf  | ≥90            | CI warns    |

### Accessibility

| Metric               | Threshold | Enforcement |
| -------------------- | --------- | ----------- |
| WCAG 2.2 AA          | 100%      | CI blocks   |
| WCAG 2.2 AAA         | ≥95%      | Manual      |
| Axe serious/critical | 0         | CI blocks   |
| Keyboard navigation  | 100%      | Manual      |
| Screen reader        | 100%      | Manual      |
| Lighthouse A11y      | ≥95       | CI warns    |

---

## 🎯 Success Metrics

### Per Module

- [ ] Runbook complete (16 sections)
- [ ] All quality gates passed (12 gates)
- [ ] All tests passing (7 types)
- [ ] All sign-offs obtained (6 departments)
- [ ] Deployed to production
- [ ] Feature flag rolled out 100%
- [ ] No P1/P2 bugs in first 7 days

### Across 40 Modules

- **Consistency**: All follow same template structure
- **Quality**: All meet same quality gates
- **Testability**: All have 90%+ coverage
- **Accessibility**: All WCAG 2.2 AA compliant
- **Performance**: All meet bundle/latency targets
- **Rollback**: All have tested < 5min rollback
- **Documentation**: All have complete runbooks

---

## 🚨 Common Pitfalls

### Runbook Creation

❌ **DON'T**: Leave placeholders or "TBD" items  
✅ **DO**: Complete all sections before implementation

❌ **DON'T**: Skip UX Copy Deck (time-consuming)  
✅ **DO**: Copy from M01 and adapt (faster)

❌ **DON'T**: Ignore test data section  
✅ **DO**: Define fixtures upfront (saves time later)

❌ **DON'T**: Copy quality gates without understanding  
✅ **DO**: Verify gates are achievable for your module

### Implementation

❌ **DON'T**: Mix server/client code  
✅ **DO**: Mark client components with "use client"

❌ **DON'T**: Use ad-hoc types  
✅ **DO**: Use generated types from @aibos/api-client

❌ **DON'T**: Hardcode strings  
✅ **DO**: Use i18n keys from copy deck

❌ **DON'T**: Hardcode colors/spacing  
✅ **DO**: Use tokens from aibos-ui

### Testing

❌ **DON'T**: Skip tests "to save time"  
✅ **DO**: Write tests alongside code (TDD)

❌ **DON'T**: Test implementation details  
✅ **DO**: Test user-facing behavior

❌ **DON'T**: Mock everything  
✅ **DO**: Integration test with real API calls

❌ **DON'T**: Ignore accessibility tests  
✅ **DO**: Run Axe on every page

### PR Review

❌ **DON'T**: Submit without running quality gates  
✅ **DO**: Verify all gates locally first

❌ **DON'T**: Leave failing tests "for later"  
✅ **DO**: Fix all test failures before PR

❌ **DON'T**: Skip rollback testing  
✅ **DO**: Test feature flag toggle works

---

## 📚 Resources

### Templates & Guides

- [RUNBOOK-TEMPLATE.md](./RUNBOOK-TEMPLATE.md) - Start here for new modules
- [M01-CORE-LEDGER.md](./M01-CORE-LEDGER.md) - Gold-standard reference
- [PR-REVIEW-CHECKLIST.md](./PR-REVIEW-CHECKLIST.md) - PR review requirements
- [\_RUNBOOK-INDEX.md](./_RUNBOOK-INDEX.md) - All 40 modules overview

### SSOT References

- `security-policy.json` - Security threat model
- `COMPLIANCE.md` - PII, data residency, retention
- `DATABASE_WORKFLOW.md` - Migration procedures
- `ARCHITECTURE.md` - API dependency map
- `PERFORMANCE-BUDGETS.md` - Infrastructure scaling

### External References

- ERPNext patterns (ledger, journal entries)
- QuickBooks UX (chart of accounts, reporting)
- Xero visualization (account hierarchy, drilldowns)
- Zoho search & filtering (power search, saved filters)

---

## 🎉 Ready to Build!

### Your Journey

1. **Week 1**: Create runbook for your assigned module(s)
2. **Week 2-3**: Implement UI following runbook guide
3. **Week 3**: Write tests and verify quality gates
4. **Week 4**: PR review, deployment, rollout

### Next Steps

```bash
# 1. Choose your module from _RUNBOOK-INDEX.md
# - Check priority (CRITICAL → HIGH → MEDIUM → LOW)
# - Verify dependencies complete
# - Assign yourself in runbook

# 2. Create runbook
cp ui-runbook/RUNBOOK-TEMPLATE.md ui-runbook/M##-<MODULE>.md
# Fill all 16 sections
# Get runbook reviewed

# 3. Implement
# Follow implementation guide step-by-step
# Test continuously
# Commit frequently

# 4. Submit PR
# Copy PR-REVIEW-CHECKLIST.md
# Verify all quality gates
# Request reviews

# 5. Deploy
# Gradual rollout: 5% → 100%
# Monitor dashboards
# Be ready to rollback
```

---

## 🏆 Excellence Standards

**This is not just code—it's production-grade enterprise software.**

Every module should be:

- **Tested**: 90%+ coverage, 7 types of tests
- **Accessible**: WCAG 2.2 AA compliant, keyboard-friendly
- **Performant**: ≤250KB bundle, ≤70ms TTFB
- **Observable**: Events tracked, errors caught, metrics flowing
- **Secure**: RBAC enforced, idempotent, rate-limited
- **Documented**: Complete runbook, i18n keys, fixtures
- **Recoverable**: < 5min rollback, feature flags, monitoring

**No shortcuts. No technical debt. Build it right the first time.**

---

**Let's build something amazing! 🚀**

**Questions?** Check [\_RUNBOOK-INDEX.md](./_RUNBOOK-INDEX.md) or ask in #ui-implementation Slack channel.
