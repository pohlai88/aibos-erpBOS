import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'aibos-erp' });

// --- AR Credit Evaluation Daily Cron (M24.1) -------------------------------------

export const arCreditEvaluationDaily = inngest.createFunction(
  { id: 'ar-credit-evaluation-daily' },
  { cron: '0 1 * * *' }, // Daily at 01:00 UTC
  async ({ event, step }: { event: any; step: any }) => {
    console.log(
      `🚀 Starting AR credit evaluation daily job at ${new Date().toISOString()}`
    );

    try {
      // Get all companies (in production, you'd query from a companies table)
      const companies = await step.run('get-companies', async () => {
        // This would typically query your companies table
        // For now, return a placeholder
        return [{ company_id: 'default-company' }];
      });

      let totalEvaluated = 0;
      let totalHolds = 0;
      let totalReleases = 0;
      let totalErrors = 0;

      for (const company of companies) {
        try {
          const result = await step.run(
            `evaluate-company-${company.company_id}`,
            async () => {
              // Call the credit evaluation API
              const response = await fetch(
                `${process.env.API_BASE_URL}/api/ar/credit/evaluate`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': `${process.env.INTERNAL_API_KEY}`,
                    'X-Company-ID': company.company_id,
                  },
                  body: JSON.stringify({
                    dry_run: false, // Live run for cron
                  }),
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Credit evaluation failed for company ${company.company_id}: ${response.statusText}`
                );
              }

              return await response.json();
            }
          );

          totalEvaluated += result.result.customers_evaluated;
          totalHolds += result.result.holds_triggered;
          totalReleases += result.result.releases_triggered;
          totalErrors += result.result.errors;

          console.log(
            `✅ Company ${company.company_id}: ${result.result.customers_evaluated} customers evaluated, ${result.result.holds_triggered} holds, ${result.result.releases_triggered} releases`
          );
        } catch (error) {
          console.error(
            `❌ Error evaluating company ${company.company_id}:`,
            error
          );
          totalErrors++;
        }
      }

      const summary = {
        companies_processed: companies.length,
        customers_evaluated: totalEvaluated,
        holds_triggered: totalHolds,
        releases_triggered: totalReleases,
        errors: totalErrors,
        completed_at: new Date().toISOString(),
      };

      console.log(`🎯 AR Credit Evaluation Daily Job Summary:`, summary);

      return summary;
    } catch (error) {
      console.error('❌ AR Credit Evaluation Daily Job Failed:', error);
      throw error;
    }
  }
);
