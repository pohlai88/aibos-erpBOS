# 📋 UI Module PR Review Checklist

**Purpose**: Ensure all UI module implementations meet production-grade standards before merge.

**Instructions**: Copy this checklist into PR description and check each item. All ✅ required items must pass before merge approval.

---

## 📄 UI Runbook Completeness

### Section 1: Module Overview ✅ REQUIRED

- [ ] Module ID, name, priority, phase, effort specified
- [ ] Business value and key benefits documented
- [ ] Ownership assigned (Module Owner, UI Reviewer, QA Lead, Design Lead)

### Section 2: Current Status ✅ REQUIRED

- [ ] Backend readiness table completed
- [ ] API endpoints listed with status
- [ ] All endpoints have corresponding UI implementation

### Section 3: UI Architecture ✅ REQUIRED

- [ ] Pages and routes documented
- [ ] Component structure defined
- [ ] Server/client boundaries specified
- [ ] Feature flag configuration provided

### Section 4: Design System ✅ REQUIRED

- [ ] Components used listed with variants
- [ ] Design tokens specified (colors, spacing, typography)
- [ ] Theme support documented (dark/light/high contrast)

### Section 5: State Management ✅ REQUIRED

- [ ] React Query keys structure defined
- [ ] Cache configuration specified (stale time, cache time)
- [ ] Invalidation rules documented

### Section 6: User Experience ✅ REQUIRED

- [ ] User flows documented (list, create, edit, delete)
- [ ] UI states defined (empty, loading, error, no results)
- [ ] Interactions specified (hover, focus, click, validation)

### Section 7: Accessibility ✅ REQUIRED

- [ ] WCAG 2.2 AA compliance confirmed
- [ ] Keyboard shortcuts documented
- [ ] ARIA implementation examples provided

### Section 8: Testing Strategy ✅ REQUIRED

- [ ] Unit tests specified (component and hook tests)
- [ ] Integration tests defined (API integration)
- [ ] E2E tests outlined (user journeys)
- [ ] Accessibility tests specified

### Section 9: Performance ✅ REQUIRED

- [ ] Bundle size target specified (≤250KB)
- [ ] Loading performance targets defined (TTFB ≤70ms, TTI ≤200ms)
- [ ] Optimization strategies documented

### Section 10: Implementation Guide ✅ REQUIRED

- [ ] Step-by-step implementation instructions
- [ ] Code examples provided for components, hooks, pages
- [ ] Test examples included

### Section 11: Quality Gates ✅ REQUIRED

- [ ] Code quality gates defined (TypeScript, ESLint, coverage, bundle)
- [ ] Performance gates specified (TTFB, TTI, Lighthouse)
- [ ] Accessibility gates defined (WCAG, Axe, keyboard, screen reader)

### Section 12: Deployment ✅ REQUIRED

- [ ] Feature flag configuration provided
- [ ] Rollout plan documented (dev → staging → prod)
- [ ] Rollback procedure specified (< 5 minutes)

---

## 💻 Code Quality

### TypeScript ✅ REQUIRED

- [ ] No TypeScript errors
- [ ] No TypeScript warnings
- [ ] All props typed (no `any`)
- [ ] Generated types from `@aibos/api-client` used

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
- [ ] Error boundaries for error handling
- [ ] Suspense boundaries for loading states

---

## 🧪 Testing

### Unit Tests ✅ REQUIRED

- [ ] Coverage ≥90% lines
- [ ] Coverage ≥95% for critical paths
- [ ] All components tested
- [ ] All hooks tested
- [ ] All validation logic tested
- [ ] Edge cases covered

### Integration Tests ✅ REQUIRED

- [ ] Create operation tested
- [ ] Read operation tested
- [ ] Update operation tested
- [ ] Delete operation tested
- [ ] Search/filter tested
- [ ] Pagination tested
- [ ] Error handling tested

### E2E Tests ✅ REQUIRED

- [ ] Happy path: create → view → edit → delete
- [ ] Keyboard-only navigation tested
- [ ] Error handling flows tested
- [ ] All critical user journeys covered

### Accessibility Tests ✅ REQUIRED

- [ ] Axe DevTools: 0 serious violations
- [ ] Axe DevTools: 0 critical violations
- [ ] Axe DevTools: ≤5 minor violations
- [ ] Keyboard navigation tested (Tab, Enter, Escape, arrows)
- [ ] Screen reader tested (NVDA or JAWS)
- [ ] Focus management tested (modals, forms)
- [ ] Color contrast ≥4.5:1 (AA)

---

## 🎨 UI/UX

### Design Compliance ✅ REQUIRED

- [ ] Matches design system specifications
- [ ] Dark-first theme followed
- [ ] Uses design tokens from `aibos-ui` (no hardcoded colors)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Touch-friendly on mobile (≥44px touch targets)

### Error States ✅ REQUIRED

- [ ] Empty state designed and implemented
- [ ] Loading state (skeleton or spinner)
- [ ] Error state with retry option
- [ ] No results state with clear action
- [ ] Form validation errors displayed inline

### Form UX ✅ REQUIRED

- [ ] Inline validation (field-level errors)
- [ ] Submit button disabled until valid
- [ ] Clear error messages
- [ ] Help text for complex fields
- [ ] Autofocus on first field
- [ ] Enter key submits form

### Loading States ✅ REQUIRED

- [ ] Skeleton UI for initial load
- [ ] Loading spinners for actions
- [ ] Optimistic updates (create/update/delete)
- [ ] Progress indicators for long operations

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance ✅ REQUIRED

- [ ] Color contrast ≥4.5:1 for normal text
- [ ] Color contrast ≥3:1 for large text
- [ ] All interactive elements accessible via keyboard
- [ ] Proper ARIA labels and descriptions
- [ ] Clear focus indicators
- [ ] Logical tab order

### Keyboard Navigation ✅ REQUIRED

- [ ] All interactive elements reachable via Tab
- [ ] Enter key activates buttons and links
- [ ] Escape key closes modals/dialogs
- [ ] Arrow keys work for navigation where appropriate
- [ ] Focus trapped in modals

### Screen Reader Support ✅ REQUIRED

- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Alt text for images
- [ ] ARIA labels for complex widgets
- [ ] Live regions for dynamic content
- [ ] Form labels associated with inputs

---

## ⚡ Performance

### Bundle Size ✅ REQUIRED

- [ ] Bundle size ≤250KB gzipped per route
- [ ] Code splitting implemented where appropriate
- [ ] Lazy loading for non-critical components
- [ ] Tree shaking enabled

### Loading Performance ✅ REQUIRED

- [ ] TTFB ≤70ms (Time to First Byte)
- [ ] TTI ≤200ms (Time to Interactive)
- [ ] LCP ≤2.5s (Largest Contentful Paint)
- [ ] CLS ≤0.1 (Cumulative Layout Shift)

### Runtime Performance ✅ REQUIRED

- [ ] No memory leaks
- [ ] Efficient re-renders
- [ ] Virtual scrolling for large lists (≥200 items)
- [ ] Debounced search/filter inputs

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
- [ ] Inline comments for non-obvious logic

### PR Description ✅ REQUIRED

- [ ] Summary of changes
- [ ] Link to UI runbook
- [ ] Screenshots (before/after if UI change)
- [ ] Testing instructions
- [ ] Rollout plan
- [ ] Rollback plan

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

- [ ] UI matches design system specs
- [ ] Brand compliance verified
- [ ] Accessibility review completed

### Product ✅ REQUIRED

- [ ] Feature complete (all acceptance criteria met)
- [ ] User flows validated
- [ ] Business requirements met

---

## 📏 Quality Gates Summary

**All gates must pass before merge:**

| Gate                   | Status | Evidence                     |
| ---------------------- | ------ | ---------------------------- |
| TypeScript Clean       | ⬜     | CI build log                 |
| ESLint Clean           | ⬜     | CI build log                 |
| Unit Coverage ≥90%     | ⬜     | Coverage report              |
| Bundle ≤250KB          | ⬜     | Bundle analyzer report       |
| TTFB ≤70ms             | ⬜     | Staging Server-Timing header |
| TTI ≤200ms             | ⬜     | Lighthouse CI report         |
| Axe 0 serious/critical | ⬜     | Axe DevTools report          |
| Lighthouse Perf ≥90    | ⬜     | Lighthouse CI report         |
| Lighthouse A11y ≥95    | ⬜     | Lighthouse CI report         |
| E2E Tests Pass         | ⬜     | CI test log                  |

---

## 🎯 Final Checklist

- [ ] All ✅ REQUIRED sections completed
- [ ] All quality gates passed
- [ ] All sign-offs obtained
- [ ] PR description complete
- [ ] UI runbook updated
- [ ] Feature flag configured
- [ ] Rollback tested
- [ ] Monitoring dashboards ready

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
- [ ] Missing sign-offs (Eng, QA, Design, Product)
- [ ] Rollback procedure not tested
- [ ] Feature flag not configured

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

**This checklist ensures production-grade UI implementations that meet enterprise standards for quality, accessibility, and performance.**
