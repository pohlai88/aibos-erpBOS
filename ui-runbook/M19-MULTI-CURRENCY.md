# 🚀 M19: Multi-Currency - UI Implementation Runbook

**Module ID**: M19  
**Module Name**: Multi-Currency  
**Priority**: HIGH  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Multi-Currency handles **multi-currency transaction processing** with automated revaluation, currency translation, and gain/loss tracking.

### Business Value

- Multi-currency transaction support
- Automated FX revaluation
- Realized and unrealized gain/loss tracking
- Historical rate tracking for translation
- Integration with consolidation

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-fx-revaluation], [ADR-###-fx-rate-sourcing], [ADR-###-multi-currency-tb]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 4 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/currency/rates` - FX rate management
- ✅ `/api/currency/revaluation` - Run FX revaluation
- ✅ `/api/currency/gain-loss` - Realized/unrealized G/L
- ✅ `/api/currency/trial-balance` - Multi-currency TB

**Total Endpoints**: 4

### Risks & Blockers

| Risk                             | Impact | Mitigation                                                     | Owner    |
| -------------------------------- | ------ | -------------------------------------------------------------- | -------- |
| FX rate accuracy and timeliness  | HIGH   | Real-time rate feeds; rate validation; manual override option  | @backend |
| Revaluation calculation accuracy | HIGH   | Automated calculations; validation against manual; audit trail | @finance |
| Performance with many currencies | MED    | Rate caching (15min); batch revaluation; async processing      | @backend |
| Historical rate data integrity   | MED    | Immutable rate history; version tracking; backup/restore       | @ops     |

---

## 🎯 3 Killer Features

### 1. **Currency Revaluation Engine** 💱

**Description**: Automated monthly FX revaluation of foreign currency balances with gain/loss posting.

**Why It's Killer**:

- One-click revaluation processing
- Automatic gain/loss posting
- Account-level revaluation control
- Historical revaluation tracking
- Better than Oracle's manual revaluation

**Implementation**:

```typescript
import { Card, Button, DataTable, Chart } from "aibos-ui";

export default function CurrencyRevaluation() {
  const { revaluation, process } = useFXRevaluation();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>FX Revaluation</h3>
            <p className="text-muted">
              Revalue foreign currency balances at current rates
            </p>
          </div>
          <Button onClick={process} variant="primary" size="lg">
            Run Revaluation
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Exposure</h3>
          <div className="text-3xl">
            {formatCurrency(revaluation.total_exposure)}
          </div>
        </Card>
        <Card>
          <h3>Unrealized Gain</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(revaluation.unrealized_gain)}
          </div>
        </Card>
        <Card>
          <h3>Unrealized Loss</h3>
          <div className="text-3xl text-red-600">
            {formatCurrency(revaluation.unrealized_loss)}
          </div>
        </Card>
        <Card>
          <h3>Net Impact</h3>
          <div className="text-3xl">
            {formatCurrency(revaluation.net_impact)}
          </div>
        </Card>
      </div>

      <DataTable
        data={revaluation.accounts}
        columns={[
          { key: "account", label: "Account" },
          { key: "currency", label: "Currency" },
          { key: "foreign_amount", label: "Foreign Amount" },
          { key: "historical_rate", label: "Historical Rate" },
          { key: "current_rate", label: "Current Rate" },
          { key: "book_value", label: "Book Value", render: formatCurrency },
          { key: "fair_value", label: "Fair Value", render: formatCurrency },
          { key: "revaluation", label: "Revaluation", render: formatCurrency },
        ]}
      />
    </div>
  );
}
```

### 2. **Real-Time FX Rate Dashboard** 📈

**Description**: Live foreign exchange rates with automatic rate updates from market data feeds.

**Why It's Killer**:

- Real-time FX rate feeds
- Historical rate tracking
- Rate variance alerts
- Custom rate overrides
- Better than manual rate entry

**Implementation**:

```typescript
import { Card, DataTable, Chart, Badge } from "aibos-ui";

export default function FXRateDashboard() {
  const { rates } = useFXRates();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {rates.major_currencies.map((currency) => (
          <Card key={currency.code}>
            <div className="flex justify-between items-center">
              <div>
                <h3>{currency.code}</h3>
                <p className="text-sm text-muted">{currency.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl">{currency.rate}</div>
                <Badge
                  variant={currency.change >= 0 ? "success" : "destructive"}
                >
                  {currency.change >= 0 ? "+" : ""}
                  {currency.change_pct}%
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Chart
        type="line"
        data={rates.historical}
        series={rates.currencies.map((c) => ({
          key: c.code,
          label: c.code,
        }))}
        title="FX Rate Trends (30 Days)"
      />

      <DataTable
        data={rates.all}
        columns={[
          { key: "currency", label: "Currency" },
          { key: "rate", label: "Spot Rate" },
          { key: "bid", label: "Bid" },
          { key: "ask", label: "Ask" },
          { key: "last_updated", label: "Updated" },
          {
            key: "change",
            label: "24h Change",
            render: (val) => (
              <Badge variant={val >= 0 ? "success" : "destructive"}>
                {val >= 0 ? "+" : ""}
                {val}%
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 3. **Multi-Currency Trial Balance** 🌍

**Description**: Trial balance view showing both functional and foreign currency amounts side-by-side.

**Why It's Killer**:

- Dual-currency display
- Toggle between currencies
- Drill-down to transactions
- FX impact analysis
- Industry-first dual-currency TB

**Implementation**:

```typescript
import { DataTable, Toggle, Card } from "aibos-ui";

export default function MultiCurrencyTrialBalance() {
  const [showForeign, setShowForeign] = useState(true);
  const { trialBalance } = useMultiCurrencyTB();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Multi-Currency Trial Balance</h2>
        <Toggle
          label="Show Foreign Currency"
          checked={showForeign}
          onChange={setShowForeign}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Assets (USD)</h3>
          <div className="text-3xl">
            {formatCurrency(trialBalance.assets_usd)}
          </div>
        </Card>
        <Card>
          <h3>FX Impact</h3>
          <div className="text-3xl text-blue-600">
            {formatCurrency(trialBalance.fx_impact)}
          </div>
        </Card>
        <Card>
          <h3>Currencies</h3>
          <div className="text-3xl">{trialBalance.currency_count}</div>
        </Card>
      </div>

      <DataTable
        data={trialBalance.accounts}
        columns={[
          { key: "account", label: "Account" },
          showForeign && { key: "foreign_currency", label: "Currency" },
          showForeign && { key: "foreign_amount", label: "Foreign Amount" },
          showForeign && { key: "fx_rate", label: "FX Rate" },
          { key: "usd_amount", label: "USD Amount", render: formatCurrency },
          { key: "fx_gain_loss", label: "FX G/L", render: formatCurrency },
        ].filter(Boolean)}
      />
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/[module]/[page]`)

**Components**: DataTable, Button, Card, Form
**File**: `apps/web/app/(dashboard)/[module]/page.tsx`

#### 2. Detail Page (`/[module]/[id]`)

**Components**: Form, Button, Card, Badge
**File**: `apps/web/app/(dashboard)/currency/rates/[currency]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement          |
| -------------------------- | --------------- | -------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header |
| Client TTI for `/currency` | ≤ 200ms         | Lighthouse CI        |
| Revaluation processing     | < 15s           | Progress tracking    |
| FX rate refresh            | Real-time       | WebSocket/polling    |
| Rate history load          | < 1s            | Performance profiler |
| UI bundle size             | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to rate management, revaluation
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for rate updates; proper roles for charts
- **Screen Reader**: All rates and G/L amounts announced; revaluation status communicated
- **Axe Target**: 0 serious/critical violations
- **Chart Accessibility**: Data table alternatives for rate trend charts

### Security

| Layer          | Requirement                                                              |
| -------------- | ------------------------------------------------------------------------ |
| RBAC Scopes    | `currency.read`, `currency.manage`, `currency.revalue`, `currency.admin` |
| Enforcement    | Server-side on all endpoints                                             |
| Data Exposure  | Only show rates and G/L for authorized currencies                        |
| Sensitive Data | Mask revaluation amounts for non-finance users                           |
| Audit Trail    | All rate changes, revaluations logged                                    |

#### UI Permissions Matrix

| Role             | View | Manage Rates | Revalue | Override | Admin |
| ---------------- | ---- | ------------ | ------- | -------- | ----- |
| currency.read    | ✅   | ❌           | ❌      | ❌       | ❌    |
| currency.manage  | ✅   | ✅           | ❌      | ❌       | ❌    |
| currency.revalue | ✅   | ✅           | ✅      | ❌       | ❌    |
| currency.admin   | ✅   | ✅           | ✅      | ✅       | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful revaluations; 100% rate accuracy
- **SLA Dashboards**: Real-time metrics on rate freshness, revaluation status
- **Events Emitted**: `Currency.RateUpdated`, `Currency.RevaluationCompleted`, `Currency.GainLossPosted`
- **Logging**: Structured logs with correlation IDs for all FX operations
- **Tracing**: Distributed tracing for revaluation pipeline
- **Monitoring**: Rate freshness; revaluation accuracy; G/L posting success

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Multi-Currency Rules

| Rule                       | Enforcement                                                   |
| -------------------------- | ------------------------------------------------------------- |
| **Base Currency**          | One base currency per entity (typically USD)                  |
| **Rate Direction**         | Always base → foreign (e.g., 1 USD = 0.85 EUR)                |
| **Historical Rates**       | Immutable; new rate creates new record                        |
| **Revaluation Balance**    | Revaluation G/L = (Current Rate - Book Rate) × Foreign Amount |
| **Realized vs Unrealized** | Realized on settlement; unrealized on revaluation             |
| **Rate Effective Date**    | Must be <= transaction date                                   |
| **Gain/Loss Account**      | Auto-post to configured G/L accounts                          |
| **Multi-Currency Flag**    | Account-level flag enables/disables FX tracking               |

### Currency & Rounding

- **Display**: Show both foreign and base currency amounts
- **Rounding Policy**: HALF_UP for FX conversions (4 decimal places for rates)
- **Rate Precision**: 6 decimal places for exotic currencies
- **Amount Precision**: 2 decimal places for presentation currency
- **Conversion Formula**: Base Amount = Foreign Amount × FX Rate

### Archive Semantics

- **Historical Rates**: Never delete; retain all rate history
- **Revaluation History**: Maintain full audit trail
- **Guard Rails**:
  - ❌ Deny delete of active currency with transactions
  - ❌ Deny delete of historical FX rates
  - ✅ Allow inactivate currency (prevent new transactions)

---

## 🚨 Error Handling & UX States

### All Possible States

| State                    | UI Display                           | User Action     |
| ------------------------ | ------------------------------------ | --------------- |
| **Empty**                | "No currencies configured"           | "Add Currency"  |
| **Loading**              | Skeleton rate cards                  | N/A             |
| **Error**                | Error message + retry                | Retry / Support |
| **Updating Rates**       | Progress "Fetching latest rates..."  | Wait            |
| **Rate Updated**         | Green flash + "Rates updated"        | N/A             |
| **Revaluing**            | Progress "Processing revaluation..." | Wait            |
| **Revaluation Complete** | Green badge "Revaluation posted"     | View G/L        |
| **Stale Rate**           | Orange warning "Rate is 24h+ old"    | Refresh         |
| **Rate Source Down**     | Red alert "Rate feed unavailable"    | Use manual rate |
| **Revaluation Failed**   | Red alert "Revaluation failed"       | Review errors   |
| **Permission Denied**    | "Access restricted"                  | Back            |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Check rate > 0, effective date valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                           | Action              |
| ----------- | ---------------------------------------------------- | ------------------- |
| 400         | "Invalid rate data. Check your input."               | Inline field errors |
| 401         | "Session expired. Please log in again."              | Redirect to login   |
| 403         | "You don't have permission for currency operations." | Hide action         |
| 404         | "Currency not found."                                | Return to list      |
| 409         | "Rate already exists for this date."                 | Show status         |
| 422         | "Validation failed: Rate must be positive."          | Inline errors       |
| 500         | "Revaluation failed. Our team has been notified."    | Retry button        |
| 503         | "Rate service unavailable. Use manual rate."         | Manual input        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/currency.json`.

### Page Titles & Headers

| Context           | Copy                           | i18n Key                      |
| ----------------- | ------------------------------ | ----------------------------- |
| Main Page         | "Multi-Currency"               | `currency.main.title`         |
| FX Rate Dashboard | "Foreign Exchange Rates"       | `currency.rates.title`        |
| Revaluation       | "Currency Revaluation"         | `currency.revaluation.title`  |
| Gain/Loss Report  | "FX Gain/Loss"                 | `currency.gainLoss.title`     |
| Multi-Currency TB | "Multi-Currency Trial Balance" | `currency.trialBalance.title` |

### State Messages

| State                | Title                       | Message                                                       | Action Button       | i18n Key                      |
| -------------------- | --------------------------- | ------------------------------------------------------------- | ------------------- | ----------------------------- |
| Empty                | "No currencies"             | "Configure currencies to enable multi-currency support"       | "Add Currency"      | `currency.empty.*`            |
| Loading              | —                           | —                                                             | —                   | —                             |
| Error                | "Unable to load rates"      | "Something went wrong. Our team has been notified."           | "Retry" / "Support" | `currency.error.*`            |
| Updating Rates       | "Fetching rates..."         | "Updating from live market data"                              | —                   | `currency.updating.*`         |
| Rate Updated         | "Rates updated"             | "FX rates refreshed successfully"                             | —                   | `currency.rateUpdated.*`      |
| Revaluing            | "Processing revaluation..." | "Revaluing {count} accounts. This may take a moment."         | —                   | `currency.revaluing.*`        |
| Revaluation Complete | "Revaluation complete"      | "FX revaluation posted: Net G/L {amount}"                     | "View G/L"          | `currency.revalComplete.*`    |
| Stale Rate           | "Rate is stale"             | "FX rate is 24+ hours old. Refresh recommended."              | "Refresh"           | `currency.staleRate.*`        |
| Rate Source Down     | "Rate feed unavailable"     | "Live rate feed unavailable. Enter manual rate or try later." | "Manual Rate"       | `currency.rateSourceDown.*`   |
| Revaluation Failed   | "Revaluation failed"        | "Review error details and try again."                         | "Review"            | `currency.revalFailed.*`      |
| Permission Denied    | "Access restricted"         | "You don't have permission for currency operations"           | "Back"              | `currency.permissionDenied.*` |

### Action Confirmations

| Action              | Title                  | Message                                                             | Confirm Button | Cancel Button | i18n Key                        |
| ------------------- | ---------------------- | ------------------------------------------------------------------- | -------------- | ------------- | ------------------------------- |
| Run Revaluation     | "Run revaluation?"     | "Revalue all foreign currency balances at current rates?"           | "Run"          | "Cancel"      | `currency.revalue.confirm.*`    |
| Override Rate       | "Override rate?"       | "Override market rate with manual rate? This will be logged."       | "Override"     | "Cancel"      | `currency.override.confirm.*`   |
| Inactivate Currency | "Inactivate currency?" | "Prevent new transactions in {currency}? Historical data retained." | "Inactivate"   | "Cancel"      | `currency.inactivate.confirm.*` |

### Success Messages (Toast)

| Action               | Message                                  | i18n Key                       |
| -------------------- | ---------------------------------------- | ------------------------------ |
| Revaluation Complete | "Revaluation complete: Net G/L {amount}" | `currency.revalue.success`     |
| Rates Updated        | "FX rates updated from live feed"        | `currency.ratesUpdate.success` |
| Currency Added       | "Currency '{code}' added successfully"   | `currency.add.success`         |
| Rate Override        | "Manual rate applied for {currency}"     | `currency.override.success`    |

### Error Messages (Toast)

| Scenario                | Message                                               | i18n Key                      |
| ----------------------- | ----------------------------------------------------- | ----------------------------- |
| Revaluation Failed      | "Revaluation failed. Check account configuration."    | `currency.revalue.error`      |
| Rate Source Unavailable | "Rate feed unavailable. Using last known rate."       | `currency.errorRateSource`    |
| Invalid Rate            | "Rate must be positive number."                       | `currency.errorInvalidRate`   |
| Duplicate Rate          | "Rate already exists for {currency} on {date}."       | `currency.errorDuplicateRate` |
| Permission Denied       | "You don't have permission for currency operations."  | `currency.errorPermission`    |
| Network Error           | "Network error. Check your connection and try again." | `currency.error.network`      |

### Form Labels & Help Text

| Field          | Label            | Placeholder     | Help Text                                       | i18n Key                         |
| -------------- | ---------------- | --------------- | ----------------------------------------------- | -------------------------------- |
| Currency Code  | "Currency"       | "e.g., EUR"     | "ISO 4217 currency code"                        | `currency.field.code.*`          |
| Exchange Rate  | "Exchange Rate"  | "0.850000"      | "Base currency units per foreign currency unit" | `currency.field.rate.*`          |
| Effective Date | "Effective Date" | "YYYY-MM-DD"    | "Date rate becomes effective"                   | `currency.field.effectiveDate.*` |
| Rate Source    | "Source"         | "Select source" | "Market data feed or manual entry"              | `currency.field.source.*`        |
| Base Currency  | "Base Currency"  | "USD"           | "Entity's functional currency"                  | `currency.field.baseCurrency.*`  |

### Keyboard Shortcuts Help

| Shortcut | Description           | i18n Key                      |
| -------- | --------------------- | ----------------------------- |
| `/`      | "Focus search"        | `currency.shortcuts.search`   |
| `r`      | "Refresh rates"       | `currency.shortcuts.refresh`  |
| `v`      | "Run revaluation"     | `currency.shortcuts.revalue`  |
| `g`      | "View G/L report"     | `currency.shortcuts.gainLoss` |
| `n`      | "Add currency"        | `currency.shortcuts.new`      |
| `↑ / ↓`  | "Navigate currencies" | `currency.shortcuts.navigate` |
| `Enter`  | "Open selected"       | `currency.shortcuts.open`     |
| `Escape` | "Close modal/cancel"  | `currency.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCurrency.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useFXRates() {
  return useQuery({
    queryKey: ["currency", "rates"],
    queryFn: () => apiClient.GET("/api/currency/rates"),
    staleTime: 60_000, // 1min
    refetchInterval: 60_000, // Refresh every minute
    retry: 2,
    select: (response) => response.data,
  });
}

export function useRefreshRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.POST("/api/currency/rates/refresh"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currency", "rates"] });
      toast.success(`${data.updated_count} rates updated`);
    },
    onError: (error) => {
      if (error.status === 503) {
        toast.warning("Rate feed unavailable. Using last known rates.");
      } else {
        toast.error("Failed to refresh rates.");
      }
    },
  });
}

export function useRunRevaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { as_of_date: string; currencies?: string[] }) =>
      apiClient.POST("/api/currency/revaluation", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currency"] });
      toast.success(`Revaluation complete: Net G/L ${data.net_gain_loss}`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Revaluation failed. Check account configuration.");
      } else {
        toast.error("Revaluation processing failed.");
      }
    },
  });
}

export function useGainLoss(period: string) {
  return useQuery({
    queryKey: ["currency", "gain-loss", period],
    queryFn: () =>
      apiClient.GET("/api/currency/gain-loss", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useMultiCurrencyTrialBalance(period: string) {
  return useQuery({
    queryKey: ["currency", "trial-balance", period],
    queryFn: () =>
      apiClient.GET("/api/currency/trial-balance", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useAddCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      code: string;
      name: string;
      rate: number;
      effective_date: string;
    }) => apiClient.POST("/api/currency/add", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currency"] });
      toast.success(`Currency '${data.code}' added successfully`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Currency already exists.");
      } else {
        toast.error("Failed to add currency.");
      }
    },
  });
}

export function useOverrideRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      currency: string;
      rate: number;
      effective_date: string;
      reason: string;
    }) => apiClient.POST("/api/currency/rates/override", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currency", "rates"] });
      toast.success(`Manual rate applied for ${data.currency}`);
    },
    onError: () => {
      toast.error("Failed to override rate.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                         | UI Action            |
| ----------------- | ---------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid rate data. Check your input."               | Inline field errors  |
| 409 (Conflict)    | "Rate already exists for {currency} on {date}."      | Show status          |
| 422 (Validation)  | "Validation failed: Rate must be positive."          | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for currency operations." | Hide action          |
| 503 (Unavailable) | "Rate service unavailable. Use manual rate."         | Manual input option  |
| 500 (Server)      | "Revaluation failed. Our team has been notified."    | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Rate Refresh**: 60s interval; fallback to cached rates on 503

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["currency", "rates"][("currency", "gain-loss", period)][
  ("currency", "trial-balance", period)
][("currency", "revaluation", date)];
```

### Invalidation Rules

| Action          | Invalidates             |
| --------------- | ----------------------- |
| Refresh Rates   | `["currency", "rates"]` |
| Run Revaluation | `["currency"]` (all)    |
| Override Rate   | `["currency", "rates"]` |
| Add Currency    | `["currency"]`          |

### Stale Time

| Query Type          | Stale Time | Reasoning                             |
| ------------------- | ---------- | ------------------------------------- |
| FX Rates            | 1min       | Real-time rates need frequent refresh |
| Gain/Loss           | 1min       | Changes with revaluation              |
| Trial Balance       | 1min       | Changes with transactions             |
| Revaluation History | 5min       | Historical data changes infrequently  |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("currency-rates");
revalidateTag("currency-revaluation");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/currency.fixtures.ts`

**Datasets**:

- `minimalCurrencies`: 2 currencies (USD base + EUR)
- `standardCurrencies`: 5 major currencies (USD, EUR, GBP, JPY, CNY)
- `exoticCurrencies`: 10 currencies including exotic pairs
- `edgeCases`: Edge cases (stale rates, rate spikes, negative G/L)

**Edge Cases Covered**:

- Stale rate (24h+ old)
- Rate spike (>10% change)
- Zero/negative rate (error case)
- Multiple rates same day
- Unrealized gain/loss scenarios
- Realized vs unrealized G/L

```typescript
// Example fixture
export const standardFXRates: FXRateFixture[] = [
  {
    currency: "EUR",
    rate: 0.85,
    bid: 0.8495,
    ask: 0.8505,
    source: "ECB",
    last_updated: "2025-10-06T14:30:00Z",
    change_24h: -0.5,
  },
  {
    currency: "GBP",
    rate: 0.72,
    bid: 0.7195,
    ask: 0.7205,
    source: "BOE",
    last_updated: "2025-10-06T14:30:00Z",
    change_24h: 0.3,
  },
  // ... more rates
];
```

### E2E Seed Data

**Location**: `tests/seeds/currency.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:currency
```

**Dataset**:

- 8 active currencies
- Historical rates (90 days)
- Complete revaluation run (prior month)
- Realized and unrealized G/L examples
- Multi-currency transactions

**Cleanup Command**:

```powershell
pnpm run seed:currency:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Global Corp" with 10 currencies
- Daily rate updates (last 30 days)
- Complete revaluation cycle
- Realized G/L from settlements
- Unrealized G/L from open balances

**Regeneration**:

```powershell
pnpm run demo:reset:currency
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Rates are positive numbers
- [ ] Effective dates are valid
- [ ] No duplicate rates for same currency + date
- [ ] Revaluation G/L calculations correct

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

```yaml
# .github/workflows/ci.yml
- name: Check API types sync
  run: |
    pnpm run generate:api-types
    git diff --exit-code packages/api-client/src/types.gen.ts
```

### Hook Layer Contract

- **Rule**: Hooks **only** use generated types from `@aibos/api-client`
- **No ad-hoc shapes**: All API calls must match OpenAPI spec
- **Validation**: TypeScript enforces at compile time

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (rate dashboard, revaluation, charts)

### Data Fetching Strategy

| Scenario      | Strategy                             | Benefit             |
| ------------- | ------------------------------------ | ------------------- |
| Initial Rates | Server-side fetch + stream           | Faster TTFB         |
| Rate Refresh  | Client-side polling (60s)            | Real-time updates   |
| Revaluation   | Client-side with progress tracking   | User feedback       |
| Trial Balance | Server component with client filters | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function refreshRates() {
  // ... mutation logic
  revalidateTag("currency-rates");
}
```

---

## 📊 Analytics & Audit Events

| Event                         | When             | Properties                                           |
| ----------------------------- | ---------------- | ---------------------------------------------------- |
| Currency.RateUpdated          | Rate refresh     | `currency`, `rate`, `source`, `change_pct`           |
| Currency.RevaluationCompleted | Revaluation done | `date`, `account_count`, `net_gain_loss`             |
| Currency.GainLossPosted       | G/L entry posted | `account_id`, `amount`, `type` (realized/unrealized) |
| Currency.RateOverridden       | Manual rate      | `currency`, `rate`, `reason`, `user_id`              |
| Currency.StaleRateDetected    | Rate 24h+ old    | `currency`, `last_updated`, `hours_stale`            |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Currency.RevaluationCompleted", {
  date: "2025-10-06",
  account_count: 45,
  net_gain_loss: -12500.5,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/currency.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Locale-specific symbols and formatting
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Currency Names**: Support international names (e.g., "Euro" vs "欧元")

### Keyboard Shortcuts

| Key      | Action              | Scope          |
| -------- | ------------------- | -------------- |
| `/`      | Focus search        | Any page       |
| `r`      | Refresh rates       | Rate dashboard |
| `v`      | Run revaluation     | Revaluation    |
| `g`      | View G/L report     | Any page       |
| `n`      | Add currency        | Currency list  |
| `↑ / ↓`  | Navigate currencies | Table          |
| `Enter`  | Open selected       | Table          |
| `Escape` | Close modal/cancel  | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["r", () => refreshRates()],
  ["v", () => runRevaluation()],
  ["g", () => router.push("/currency/gain-loss")],
  ["n", () => openAddCurrencyModal()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                            | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                            | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, revaluation accuracy 100%               | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, rates refresh successfully, G/L accurate | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                    | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m19_currency: false,              // Master toggle
  m19_currency_auto_rates: false,   // Auto rate refresh
  m19_currency_revaluation: false,  // Revaluation engine
  m19_currency_realtime: false,     // Real-time rate updates
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/currency/*`)
- P50/P95/P99 latency
- Rate refresh success rate
- Revaluation accuracy (100% required)
- Rate freshness (stale rate count)
- G/L posting success rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Rate source down > 5min → alert finance team
- Revaluation G/L imbalance → immediate escalation (critical)
- Stale rates > 10 currencies → investigate feed

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m19_currency = false`

   ```powershell
   pnpm run flags:set m19_currency=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("currency-rates");
   revalidateTag("currency-revaluation");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/currency/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test

**Rollback Decision Matrix**:

| Scenario                        | Action             | Approval Required |
| ------------------------------- | ------------------ | ----------------- |
| Error rate > 5%                 | Immediate rollback | No (auto-trigger) |
| Revaluation accuracy < 100%     | Immediate rollback | No (auto-trigger) |
| Rate feed down > 15min          | Investigate first  | Finance team      |
| Error rate 1-5%                 | Partial rollback   | On-call engineer  |
| Stale rates > 50% of currencies | Investigate first  | On-call engineer  |
| Data corruption/loss            | Immediate rollback | No (auto-trigger) |

---

## 📚 References

### API Documentation

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Type definitions: `packages/api-client/src/types.gen.ts`

### Design System

- Component library: `aibos-ui` package
- Design tokens: Import from `aibos-ui/tokens`
- Style guide: Follow dark-first theme

### Best Practices

- SAP: Multi-currency management
- Oracle: FX revaluation
- NetSuite: Currency conversion
- Xero: Multi-currency reporting

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: FX Rate Accuracy and Timeliness

**Mitigation**: Real-time rate feeds from reliable sources; rate validation; manual override option; rate staleness alerts; fallback to last known rate

### Risk #2: Revaluation Calculation Accuracy

**Mitigation**: Automated calculations per accounting standards (IAS 21); validation against manual calc; dual calculation verification; comprehensive audit trail

### Risk #3: Performance with Many Currencies

**Mitigation**: Rate caching (15min); batch revaluation processing; async operations; progress tracking; timeout limits (15s)

### Risk #4: Historical Rate Data Integrity

**Mitigation**: Immutable rate history (append-only); version tracking; automated backups; point-in-time recovery; validation checks in CI

---

## 📝 Implementation Guide

### Day 1: Rates & Revaluation (8 hours)

1. Build FX rate dashboard with real-time updates (4 hours)
2. Implement currency revaluation engine (3 hours)
3. Add gain/loss tracking (1 hour)

### Day 2: Multi-Currency TB (4 hours)

1. Implement multi-currency trial balance (3 hours)
2. Add currency management CRUD (1 hour)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] FX rate validation (positive, precision)
- [ ] Revaluation G/L calculation accuracy
- [ ] Realized vs unrealized G/L classification
- [ ] Rate effective date validation
- [ ] Currency conversion formula
- [ ] useFXRates hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Refresh rates → UI updates
- [ ] Run revaluation → G/L posted
- [ ] Add currency → appears in list
- [ ] Override rate → manual rate applied
- [ ] Update rate → revaluation recalculated
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to currency page
- [ ] User can view FX rate dashboard
- [ ] User can refresh rates
- [ ] User can run revaluation
- [ ] User can view gain/loss report
- [ ] User can view multi-currency trial balance
- [ ] Keyboard-only flow: navigate → refresh → revalue
- [ ] Multi-currency transaction cycle executes correctly

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Rate charts keyboard accessible
- [ ] Charts have data table alternatives
- [ ] Screen reader announces rates and G/L
- [ ] Focus management correct (modals, forms, dashboards)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Progress indicators are accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for dashboard, charts, revaluation
- [ ] Dark/light theme variations
- [ ] Progress states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/currency/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Revaluation processing < 15s (100 accounts)
- [ ] Rate refresh < 3s
- [ ] Rate history load < 1s

---

## 📅 Timeline

| Day | Deliverable                    |
| --- | ------------------------------ |
| 1   | Rates + Revaluation + G/L      |
| 2   | Multi-Currency TB + Management |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (for accounts)
- ✅ M2: Journal Entries (for G/L posting)

### Enables These Modules

- M17: Consolidation (uses currency translation)
- M18: Intercompany (uses FX rates for IC settlements)
- All modules with multi-currency transactions

---

## 🎯 Success Criteria

### Must Have

- [ ] FX rate management (CRUD)
- [ ] Real-time rate refresh
- [ ] Currency revaluation engine
- [ ] Realized and unrealized G/L tracking
- [ ] Multi-currency trial balance
- [ ] Historical rate tracking
- [ ] Revaluation accuracy 100%, Rate refresh success ≥99%

### Should Have

- [ ] AI-powered rate prediction
- [ ] FX exposure analysis
- [ ] Rate variance alerts
- [ ] Custom rate overrides
- [ ] Multi-currency reporting

### Nice to Have

- [ ] Predictive FX impact modeling
- [ ] What-if rate scenarios
- [ ] FX hedge tracking
- [ ] Visual currency trends

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/currency`, `/currency/rates`, `/currency/revaluation`, `/currency/gain-loss`, `/currency/trial-balance`)
- [ ] FX rate management CRUD working
- [ ] Real-time rate refresh working
- [ ] Currency revaluation working
- [ ] G/L tracking working (realized + unrealized)
- [ ] Multi-currency trial balance working
- [ ] Search and filtering working
- [ ] Permissions enforced (UI hides/shows based on role)
- [ ] All error states handled gracefully
- [ ] Copy deck implemented (all i18n keys present)

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for critical paths
- [ ] Integration tests: All currency operations covered
- [ ] E2E tests: All user flows covered (rates → revalue → G/L)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Rate refresh flow
- Revaluation flow
- G/L calculation flow
- Multi-currency TB flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/currency/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/currency` (Lighthouse CI)
- [ ] Revaluation processing: < 15s (100 accounts)
- [ ] Rate refresh: < 3s
- [ ] Rate history load: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Charts: Keyboard accessible with alternatives

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Currency.RateUpdated`
  - `Currency.RevaluationCompleted`
  - `Currency.GainLossPosted`
  - `Currency.RateOverridden`
  - `Currency.StaleRateDetected`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, rate freshness, revaluation accuracy)
- [ ] Revaluation accuracy monitoring (100% required)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Revaluation amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All rate changes and revaluations logged for audit
- [ ] Rate history immutable (append-only)

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Currency methodology documented (IAS 21)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m19_currency = false` (ready to enable)
  - `flags.m19_currency_auto_rates = false` (phase 2)
  - `flags.m19_currency_revaluation = false` (phase 2)
  - `flags.m19_currency_realtime = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 100 currencies)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Finance/Controller**: Currency methodology validated (IAS 21), 100% revaluation accuracy confirmed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M18 - Intercompany  
**Next**: M20 - Close Management
