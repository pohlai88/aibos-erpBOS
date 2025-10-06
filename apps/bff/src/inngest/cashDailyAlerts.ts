import { Inngest } from 'inngest';
// import { evaluateCashAlerts, dispatchCashNotifications } from "@/app/services/cash/alerts";
// import { db } from "@db/client";
// import { eq, desc } from "drizzle-orm";
// import { cashForecastVersion } from "@db/client";

export const inngest = new Inngest({ id: 'aibos-erpBOS' });

function localNow(tz: string) {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map(p => [p.type, p.value])
  );
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    year: Number(parts.year),
    month: Number(parts.month),
  };
}

export const cashDailyAlerts = inngest.createFunction(
  { id: 'cash.daily.alerts' },
  { cron: '0 * * * *' }, // hourly tick; fire at 08:00 local per company
  async ({ step }) => {
    // TODO: Implement cash alerts functionality
    // This is a placeholder implementation
    return { ok: true, message: 'Cash alerts not yet implemented' };
  }
);
