import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'aibos-erp' });

// --- AR Collections KPI Daily Refresh (M24.1) ------------------------------------

export const arCollectionsKpiDaily = inngest.createFunction(
  { id: 'ar-collections-kpi-daily' },
  { cron: '30 8 * * *' }, // Daily at 08:30 UTC
  async ({ event, step }: { event: any; step: any }) => {
    console.log(
      `🚀 Starting AR collections KPI daily refresh at ${new Date().toISOString()}`
    );

    try {
      // Get all companies
      const companies = await step.run('get-companies', async () => {
        // This would typically query your companies table
        return [{ company_id: 'default-company' }];
      });

      let totalSnapshots = 0;
      let totalErrors = 0;

      for (const company of companies) {
        try {
          const result = await step.run(
            `kpi-snapshot-${company.company_id}`,
            async () => {
              // Generate KPI snapshot
              const response = await fetch(
                `${process.env.API_BASE_URL}/api/ar/collect/kpi`,
                {
                  method: 'GET',
                  headers: {
                    'X-API-Key': `${process.env.INTERNAL_API_KEY}`,
                    'X-Company-ID': company.company_id,
                  },
                }
              );

              if (!response.ok) {
                throw new Error(
                  `KPI snapshot failed for company ${company.company_id}: ${response.statusText}`
                );
              }

              return await response.json();
            }
          );

          totalSnapshots++;
          console.log(
            `✅ Company ${company.company_id}: KPI snapshot generated with ${result.snapshot.customers.length} customers`
          );
        } catch (error) {
          console.error(
            `❌ Error generating KPI snapshot for company ${company.company_id}:`,
            error
          );
          totalErrors++;
        }
      }

      const summary = {
        companies_processed: companies.length,
        snapshots_generated: totalSnapshots,
        errors: totalErrors,
        completed_at: new Date().toISOString(),
      };

      console.log(`🎯 AR Collections KPI Daily Refresh Summary:`, summary);

      return summary;
    } catch (error) {
      console.error('❌ AR Collections KPI Daily Refresh Failed:', error);
      throw error;
    }
  }
);
