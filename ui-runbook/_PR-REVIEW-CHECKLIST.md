# 📋 UI Module PR Review Checklist

**Purpose**: Ensure all UI module implementations meet production-grade standards before merge.

**Instructions**: Copy this checklist into PR description and check each item. All ✅ required items must pass before merge approval.

---

## 📄 Runbook Completeness

### Section 1: Ownership & Accountability ✅ REQUIRED

- [ ] Module Owner identified with @handle
- [ ] Code Reviewer assigned with @handle
- [ ] QA Lead assigned with @handle
- [ ] Related ADRs linked (or "N/A" if none)

### Section 2: Current Status ✅ REQUIRED

- [ ] Status table filled with accurate checkmarks (⬜/✅)
- [ ] API Coverage section lists all endpoints
- [ ] Risks & Blockers table has at least 2 identified risks
- [ ] Each risk has mitigation strategy and owner

### Section 3: 3 Killer Features ✅ REQUIRED

- [ ] All 3 killer features documented
- [ ] Each feature has "Why It's Killer" competitive analysis
- [ ] Implementation code examples provided
- [ ] Features align with ERPNext/QuickBooks/Xero best practices

### Section 4: Technical Architecture ✅ REQUIRED

- [ ] All UI pages/routes documented
- [ ] Server/Client boundaries specified
- [ ] Component list for each page
- [ ] Data fetching strategy defined

### Section 5: Non-Functional Requirements ✅ REQUIRED

#### Performance Budgets

- [ ] TTFB target specified (≤70ms)
- [ ] TTI target specified (≤200ms)
- [ ] Bundle size limit specified (≤250KB gzipped)
- [ ] Pagination strategy defined
- [ ] Virtualization threshold defined (≥200 rows)

#### Accessibility

- [ ] WCAG 2.2 AA compliance confirmed (100%)
- [ ] WCAG 2.2 AAA target specified (≥95%)
- [ ] Keyboard navigation documented
- [ ] ARIA strategy defined
- [ ] Axe target: 0 serious/critical

#### Security

- [ ] RBAC scopes defined (`<module>.read`, `.write`, `.admin`)
- [ ] UI Permissions Matrix completed (all roles × actions)
- [ ] Idempotency strategy documented
- [ ] Rate limiting approach specified
- [ ] Reference to `security-policy.json` included

#### Observability

- [ ] SLO target specified (99.9%)
- [ ] Events to emit listed
- [ ] Logging strategy defined
- [ ] Tracing approach specified

### Section 6: Domain Invariants ✅ REQUIRED

- [ ] Business rules table completed (≥3 rules)
- [ ] Archive/delete semantics defined
- [ ] Currency & rounding policy specified
- [ ] Data validation rules documented

### Section 7: UX Copy Deck ✅ REQUIRED

- [ ] Page titles with i18n keys (≥3 pages)
- [ ] All 7 state messages defined:
  - [ ] Empty state
  - [ ] Loading state
  - [ ] Error state
  - [ ] No Results state
  - [ ] Permission Denied state
  - [ ] Offline state
  - [ ] Conflict state
- [ ] Action confirmations (≥2 actions)
- [ ] Success messages (≥3 operations)
- [ ] Error messages (≥5 scenarios)
- [ ] Form labels with help text (all fields)
- [ ] Keyboard shortcuts (≥3 shortcuts)

### Section 8: API Integration ✅ REQUIRED

- [ ] Hook implementation code provided
- [ ] Query keys structure defined
- [ ] Error mapping table completed (all HTTP status codes)
- [ ] Retry & backoff strategy specified

### Section 9: State & Caching ✅ REQUIRED

- [ ] React Query keys structure documented
- [ ] Invalidation rules table (what invalidates what)
- [ ] Stale time per query type with reasoning
- [ ] Next.js cache tags defined

### Section 10: Test Data & Fixtures ✅ REQUIRED

- [ ] Storybook fixtures location specified
- [ ] E2E seed data location specified
- [ ] Demo dataset characteristics documented
- [ ] Edge cases listed (≥5 cases)
- [ ] Seed/cleanup commands provided
- [ ] Test data validation checks defined

### Section 11: Testing Checklist ✅ REQUIRED

- [ ] Unit tests (≥5 cases)
- [ ] Integration tests (≥4 cases)
- [ ] E2E tests (≥5 user flows)
- [ ] Accessibility tests (≥5 checks)
- [ ] Contract tests (≥1 check)
- [ ] Visual regression tests (≥1 check)
- [ ] Performance tests (≥3 checks)

### Section 12: Rollout & Rollback ✅ REQUIRED

- [ ] Rollout plan table (dev → staging → prod)
- [ ] Feature flags configuration provided
- [ ] Monitoring dashboard metrics listed (≥5 metrics)
- [ ] Alert thresholds defined (≥3 alerts)
- [ ] Immediate rollback procedure (< 5min)
- [ ] Rollback decision matrix (≥5 scenarios)
- [ ] Rollforward plan specified

### Section 13: Analytics & Audit ✅ REQUIRED

- [ ] Event names documented (≥4 events)
- [ ] Event properties specified for each
- [ ] When events fire defined
- [ ] Analytics implementation code provided

### Section 14: Definition of Done ✅ REQUIRED

- [ ] Functional requirements checklist (≥8 items)
- [ ] Quality gates with measurable thresholds
- [ ] Code quality checks (TypeScript, ESLint)
- [ ] Test coverage targets (90% lines, 95% critical)
- [ ] Performance budgets (bundle, TTFB, TTI)
- [ ] Accessibility compliance (AA/AAA)
- [ ] Lighthouse score targets (all ≥90)
- [ ] Observability checks (dashboards, events)
- [ ] Security checks (RBAC, idempotency)
- [ ] Documentation requirements
- [ ] Deployment checklist
- [ ] Sign-offs from 6 departments

---

## 💻 Code Quality

### TypeScript ✅ REQUIRED

- [ ] No TypeScript errors
- [ ] No TypeScript warnings
- [ ] No `@ts-ignore` or `@ts-expect-error` (unless justified in comment)
- [ ] All props typed (no `any`)
- [ ] Generated types from `@aibos/api-client` used (no ad-hoc shapes)

### ESLint ✅ REQUIRED

- [ ] No ESLint errors
- [ ] No ESLint warnings
- [ ] No disabled rules (unless justified)

### Code Style ✅ REQUIRED

- [ ] Prettier formatted (all files)
- [ ] No `console.log` statements
- [ ] No `debugger` statements
- [ ] Consistent naming conventions
- [ ] No hardcoded strings (use i18n keys)
- [ ] No hardcoded styles (use tokens from `aibos-ui`)

### React Best Practices ✅ REQUIRED

- [ ] `"use client"` directive on client components
- [ ] Server components by default
- [ ] Proper hooks usage (no hooks in loops/conditions)
- [ ] useQueryClient() for cache invalidation
- [ ] Error boundaries for error handling
- [ ] Suspense boundaries for loading states

---

## 🧪 Testing

### Unit Tests ✅ REQUIRED

- [ ] Coverage ≥90% lines
- [ ] Coverage ≥95% for critical paths
- [ ] All hooks tested
- [ ] All validation logic tested
- [ ] All formatters tested
- [ ] Edge cases covered

### Integration Tests ✅ REQUIRED

- [ ] Create operation tested
- [ ] Read operation tested
- [ ] Update operation tested
- [ ] Delete/Archive operation tested
- [ ] Search/filter tested
- [ ] Pagination tested
- [ ] Optimistic updates tested (rollback on failure)

### E2E Tests ✅ REQUIRED

- [ ] Happy path: create → view → edit → delete
- [ ] Keyboard-only navigation tested
- [ ] Error handling flows tested
- [ ] Permission-based access tested
- [ ] All critical user journeys covered

### Accessibility Tests ✅ REQUIRED

- [ ] Axe DevTools: 0 serious violations
- [ ] Axe DevTools: 0 critical violations
- [ ] Axe DevTools: ≤5 minor violations
- [ ] Keyboard navigation tested (Tab, Enter, Escape, arrows)
- [ ] Screen reader tested (NVDA or JAWS)
- [ ] Focus management tested (modals, forms)
- [ ] Color contrast ≥7:1 (AAA)

### Contract Tests ✅ REQUIRED

- [ ] All API calls match OpenAPI spec
- [ ] Request types validated
- [ ] Response types validated
- [ ] Error responses handled

### Visual Regression Tests ⚠️ NICE TO HAVE

- [ ] Storybook stories created (all components)
- [ ] Chromatic/Percy snapshots (if available)
- [ ] Dark/light theme tested

### Performance Tests ✅ REQUIRED

- [ ] Bundle size verified (≤250KB gzipped)
- [ ] Lighthouse Performance ≥90
- [ ] Load test passed (≥1000 concurrent users)
- [ ] Table virtualization tested (≥200 rows)

---

## 🎨 UI/UX

### Design Compliance ✅ REQUIRED

- [ ] Matches Figma/design specs
- [ ] Dark-first theme followed
- [ ] Uses design tokens from `aibos-ui` (no hardcoded colors)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Touch-friendly on mobile (≥44px touch targets)

### Error States ✅ REQUIRED

- [ ] Empty state designed and implemented
- [ ] Loading state (skeleton or spinner)
- [ ] Error state with retry option
- [ ] No results state with clear action
- [ ] Permission denied state
- [ ] Offline state
- [ ] Conflict resolution UI

### Form UX ✅ REQUIRED

- [ ] Inline validation (field-level errors)
- [ ] Submit button disabled until valid
- [ ] Clear error messages (from UX Copy Deck)
- [ ] Help text for complex fields
- [ ] Autofocus on first field
- [ ] Enter key submits form

### Loading States ✅ REQUIRED

- [ ] Skeleton UI for initial load
- [ ] Loading spinners for actions
- [ ] Optimistic updates (create/update/delete)
- [ ] Progress indicators for long operations

---

## 🔒 Security

### RBAC ✅ REQUIRED

- [ ] Permissions checked on server (API endpoints)
- [ ] Permissions checked on client (UI visibility)
- [ ] Buttons hidden for unauthorized actions
- [ ] Routes protected (permission-denied redirect)
- [ ] Read-only views for read-only roles

### Data Protection ✅ REQUIRED

- [ ] No sensitive data in console.log
- [ ] No sensitive data in error messages
- [ ] No sensitive data in analytics events
- [ ] Idempotency keys on all mutations
- [ ] CSRF protection (handled by framework)

### Rate Limiting ✅ REQUIRED

- [ ] Rate limits tested (BFF layer)
- [ ] Appropriate toast shown on rate limit
- [ ] Exponential backoff on retries

---

## 📊 Observability

### Analytics ✅ REQUIRED

- [ ] All events firing correctly (tested in dev tools)
- [ ] Event properties match spec
- [ ] No PII in event properties
- [ ] Events emitted at correct times

### Error Tracking ✅ REQUIRED

- [ ] Sentry/Datadog integrated
- [ ] Source maps uploaded
- [ ] User context attached to errors
- [ ] Breadcrumbs enabled

### Performance Monitoring ✅ REQUIRED

- [ ] APM traces visible
- [ ] Custom spans for key operations
- [ ] Performance marks/measures added
- [ ] Web Vitals tracked (CLS, FID, LCP)

### Dashboards ✅ REQUIRED

- [ ] SLO dashboard created
- [ ] Key metrics visible (error rate, latency)
- [ ] Alerts configured (error rate, latency thresholds)
- [ ] On-call runbook linked

---

## 🚀 Deployment

### Feature Flags ✅ REQUIRED

- [ ] Feature flag created
- [ ] Default value set (usually `false`)
- [ ] Flag tested (enable/disable works)
- [ ] Kill-switch documented

### Environments ✅ REQUIRED

- [ ] Deployed to dev environment
- [ ] Smoke tests passed on dev
- [ ] Deployed to staging environment
- [ ] Full regression passed on staging
- [ ] Lighthouse tests passed on staging
- [ ] Load tests passed on staging

### Rollback ✅ REQUIRED

- [ ] Rollback procedure tested
- [ ] Rollback time < 5 minutes verified
- [ ] Monitoring dashboards ready
- [ ] Alerts configured

---

## 📚 Documentation

### Code Documentation ✅ REQUIRED

- [ ] JSDoc comments on complex functions
- [ ] README updated (if new patterns introduced)
- [ ] Storybook stories created
- [ ] Inline comments for non-obvious logic

### PR Description ✅ REQUIRED

- [ ] Summary of changes
- [ ] Link to runbook
- [ ] Screenshots (before/after if UI change)
- [ ] Testing instructions
- [ ] Rollout plan
- [ ] Rollback plan

### API Contracts ✅ REQUIRED

- [ ] OpenAPI spec synchronized
- [ ] `types.gen.ts` regenerated
- [ ] Contract tests pass
- [ ] No breaking changes (or migration plan provided)

---

## ✅ Sign-offs

### Engineering ✅ REQUIRED

- [ ] Code review approved by senior engineer
- [ ] Architecture review approved (for significant changes)
- [ ] No outstanding comments unresolved

### QA ✅ REQUIRED

- [ ] All test plans executed
- [ ] All tests passed
- [ ] Regression testing completed
- [ ] UAT sign-off

### Design ✅ REQUIRED

- [ ] UI matches Figma specs
- [ ] Brand compliance verified
- [ ] Accessibility review completed

### Product ✅ REQUIRED

- [ ] Feature complete (all acceptance criteria met)
- [ ] User flows validated
- [ ] Copy deck approved

### Security ✅ REQUIRED

- [ ] Security review completed (for sensitive modules)
- [ ] Threat model updated (if needed)
- [ ] No security vulnerabilities introduced

### Accessibility ✅ REQUIRED

- [ ] A11y audit completed
- [ ] WCAG 2.2 AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader tested

---

## 📏 Quality Gates Summary

**All gates must pass before merge:**

| Gate                   | Status | Evidence                       |
| ---------------------- | ------ | ------------------------------ |
| TypeScript Clean       | ⬜     | CI build log                   |
| ESLint Clean           | ⬜     | CI build log                   |
| Unit Coverage ≥90%     | ⬜     | Coverage report                |
| Bundle ≤250KB          | ⬜     | Bundle analyzer report         |
| TTFB ≤70ms             | ⬜     | Staging Server-Timing header   |
| TTI ≤200ms             | ⬜     | Lighthouse CI report           |
| Axe 0 serious/critical | ⬜     | Axe DevTools report            |
| Lighthouse Perf ≥90    | ⬜     | Lighthouse CI report           |
| Lighthouse A11y ≥95    | ⬜     | Lighthouse CI report           |
| E2E Tests Pass         | ⬜     | CI test log                    |
| Load Test Pass         | ⬜     | Load test report (≥1000 users) |
| Security Review        | ⬜     | Security team sign-off         |

---

## 🎯 Final Checklist

- [ ] All ✅ REQUIRED sections completed
- [ ] All quality gates passed
- [ ] All sign-offs obtained
- [ ] PR description complete
- [ ] Runbook updated
- [ ] Feature flag configured
- [ ] Rollback tested
- [ ] Monitoring dashboards ready
- [ ] Team demo completed (optional but recommended)

---

## 📝 Reviewer Notes

**Reviewer Name**: **\*\***\_\_\_**\*\***  
**Review Date**: **\*\***\_\_\_**\*\***  
**Approval Status**: ⬜ APPROVED / ⬜ CHANGES REQUESTED / ⬜ REJECTED

**Comments**:

```
[Add any additional notes, concerns, or recommendations here]
```

---

## 🚨 Blockers to Merge

If any of the following are true, **DO NOT MERGE**:

- [ ] TypeScript errors exist
- [ ] ESLint errors exist
- [ ] Test coverage < 90%
- [ ] Axe serious/critical violations exist
- [ ] Bundle size > 250KB gzipped
- [ ] Lighthouse Performance < 90
- [ ] Lighthouse Accessibility < 95
- [ ] Security vulnerabilities found
- [ ] Missing sign-offs (Eng, QA, Design, PM)
- [ ] Rollback procedure not tested
- [ ] Feature flag not configured

---

**Template Version**: 1.0  
**Last Updated**: 2025-10-06

**Note**: This checklist is based on the gold-standard runbook template. Adapt as needed for specific module requirements, but maintain all ✅ REQUIRED items.
