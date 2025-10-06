// M15.2: Real Cash Alerts Dispatcher
// Email + webhook implementation with env-driven configuration, rate limiting, and backoff

import { createTransport } from 'nodemailer';

type Delivery = { email?: string[]; webhook?: string };
type Breach = {
  rule_id: string;
  name: string;
  type: string;
  cc?: string | null;
  project?: string | null;
  balance?: number;
  burn_rate?: number;
  runway_months?: number;
  threshold: number;
};

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT
  ? Number(process.env.SMTP_PORT)
  : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.ALERTS_FROM_EMAIL || 'alerts@erp.local';

// Rate limiting and backoff configuration
const MAX_COMPANIES_PER_BATCH = parseInt(
  process.env.MAX_COMPANIES_PER_BATCH || '50'
);
const MAX_RETRIES = parseInt(process.env.MAX_DISPATCH_RETRIES || '3');
const BASE_DELAY_MS = parseInt(process.env.DISPATCH_BASE_DELAY_MS || '1000');

const transport =
  SMTP_HOST && SMTP_PORT
    ? createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth:
          SMTP_USER && SMTP_PASS
            ? { user: SMTP_USER, pass: SMTP_PASS }
            : undefined,
      })
    : null;

function formatSubject(companyId: string, scenario: string, count: number) {
  return `[Cash Alerts] ${companyId} ${scenario} — ${count} breach${count === 1 ? '' : 'es'}`;
}

function formatBody(scenario: string, breaches: Breach[]) {
  const lines = breaches.map(
    b =>
      `• ${b.name} (${b.type})` +
      (b.cc ? ` [CC:${b.cc}]` : '') +
      (b.project ? ` [PRJ:${b.project}]` : '') +
      (b.balance != null ? ` | Balance=${b.balance}` : '') +
      (b.burn_rate != null ? ` | Burn=${b.burn_rate}/mo` : '') +
      (b.runway_months != null ? ` | Runway=${b.runway_months} mo` : '') +
      ` | Threshold=${b.threshold}`
  );
  return `Scenario: ${scenario}\n\n${lines.join('\n')}\n`;
}

// Exponential backoff utility
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = BASE_DELAY_MS
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(
        `⚠️ Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`,
        error
      );
      await delay(delayMs);
    }
  }

  throw lastError!;
}

export async function dispatchCashNotifications(
  companyId: string,
  breaches: Breach[],
  scenario = 'cash:current',
  delivery?: Delivery
) {
  if (!breaches.length) return { dispatched: 0, mode: 'noop' };

  const recips = delivery?.email ?? [];
  const webhook = delivery?.webhook;

  let count = 0;

  // Email with retry
  if (transport && recips.length) {
    try {
      await withRetry(async () => {
        await transport!.sendMail({
          from: FROM_EMAIL,
          to: recips.join(','),
          subject: formatSubject(companyId, scenario, breaches.length),
          text: formatBody(scenario, breaches),
        });
      });
      count += recips.length; // count recipients
      console.log(
        `📧 Email sent to ${recips.length} recipients for company ${companyId}`
      );
    } catch (error) {
      console.error(
        `❌ Email dispatch failed for company ${companyId} after ${MAX_RETRIES} retries:`,
        error
      );
    }
  }

  // Webhook with retry
  if (webhook) {
    try {
      await withRetry(async () => {
        const response = await fetch(webhook!, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ company_id: companyId, scenario, breaches }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      });
      count += 1;
      console.log(`🔗 Webhook dispatched for company ${companyId}`);
    } catch (error) {
      console.error(
        `❌ Webhook dispatch failed for company ${companyId} after ${MAX_RETRIES} retries:`,
        error
      );
      // Don't increment count on failure
    }
  }

  // Fallback (no env): do nothing, but return a clear status
  const mode = transport ? 'email/webhook' : webhook ? 'webhook' : 'noop';

  if (mode === 'noop') {
    console.log(
      `⚠️ No dispatch configured for company ${companyId} - ${breaches.length} breaches ignored`
    );
  }

  return { dispatched: count, mode };
}

// Rate-limited batch processing for multiple companies
export async function dispatchBatchCashNotifications(
  companies: Array<{
    id: string;
    breaches: Breach[];
    scenario?: string;
    delivery?: Delivery;
  }>
): Promise<{
  totalDispatched: number;
  results: Array<{ companyId: string; dispatched: number; mode: string }>;
}> {
  if (companies.length > MAX_COMPANIES_PER_BATCH) {
    console.warn(
      `⚠️ Batch size ${companies.length} exceeds limit ${MAX_COMPANIES_PER_BATCH}, processing in chunks`
    );
  }

  const results: Array<{
    companyId: string;
    dispatched: number;
    mode: string;
  }> = [];
  let totalDispatched = 0;

  // Process in chunks to respect rate limits
  for (let i = 0; i < companies.length; i += MAX_COMPANIES_PER_BATCH) {
    const chunk = companies.slice(i, i + MAX_COMPANIES_PER_BATCH);

    const chunkPromises = chunk.map(async company => {
      const result = await dispatchCashNotifications(
        company.id,
        company.breaches,
        company.scenario || 'cash:current',
        company.delivery
      );

      results.push({
        companyId: company.id,
        dispatched: result.dispatched,
        mode: result.mode,
      });

      return result.dispatched;
    });

    const chunkResults = await Promise.all(chunkPromises);
    totalDispatched += chunkResults.reduce((sum, count) => sum + count, 0);

    // Small delay between chunks to prevent overwhelming external services
    if (i + MAX_COMPANIES_PER_BATCH < companies.length) {
      await delay(100); // 100ms between chunks
    }
  }

  console.log(
    `📊 Batch dispatch complete: ${totalDispatched} notifications sent to ${companies.length} companies`
  );

  return { totalDispatched, results };
}
