import { Inngest } from 'inngest';
import { ArDunningService } from '@/services/ar/dunning';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { company } from '@aibos/db-adapter/schema';

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

export const arDunningDaily = inngest.createFunction(
  { id: 'ar.dunning.daily' },
  { cron: '0 9 * * *' }, // Daily at 09:00 UTC
  async ({ step }) => {
    return await step.run('run-dunning-for-all-companies', async () => {
      try {
        // Get all companies
        const companies = await db.select({ id: company.id }).from(company);

        const results = [];
        const service = new ArDunningService();

        for (const comp of companies) {
          try {
            // Run dunning for each company
            const result = await service.runDunning(comp.id, false); // false = not dry run
            results.push({
              company_id: comp.id,
              success: true,
              result,
            });
          } catch (error) {
            console.error(
              `Error running dunning for company ${comp.id}:`,
              error
            );
            results.push({
              company_id: comp.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return {
          ok: true,
          message: `Dunning completed for ${companies.length} companies`,
          results,
        };
      } catch (error) {
        console.error('Error in AR dunning daily job:', error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }
);
