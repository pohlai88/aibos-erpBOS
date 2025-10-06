import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'aibos-erp' });

// --- AR Statement Generation Monthly Cron (M24.3) -------------------------------------

export const arStatementGenerationMonthly = inngest.createFunction(
  { id: 'ar-statement-generation-monthly' },
  { cron: '0 2 1 * *' }, // Monthly on the 1st at 02:00 UTC
  async ({ event, step }: { event: any; step: any }) => {
    console.log(
      `🚀 Starting AR statement generation monthly job at ${new Date().toISOString()}`
    );

    try {
      // Get all companies (in production, you'd query from a companies table)
      const companies = await step.run('get-companies', async () => {
        // This would typically query your companies table
        // For now, return a placeholder
        return [{ company_id: 'default-company' }];
      });

      let totalRuns = 0;
      let totalCustomers = 0;
      let totalArtifacts = 0;
      let totalErrors = 0;

      for (const company of companies) {
        try {
          // Calculate previous month's as-of date
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const asOfDate = new Date(
            lastMonth.getFullYear(),
            lastMonth.getMonth() + 1,
            0
          ); // Last day of previous month

          const result = await step.run(
            `generate-statements-${company.company_id}`,
            async () => {
              // Import the service dynamically to avoid circular dependencies
              const { ArStatementService } = await import(
                '../../app/services/ar/statements'
              );
              const statementService = new ArStatementService();

              return await statementService.runStatementGeneration(
                company.company_id,
                {
                  as_of_date: asOfDate.toISOString().split('T')[0]!,
                  present: 'USD', // Default currency, could be configurable per company
                  finalize: true,
                  include_pdf: true,
                  include_csv: true,
                },
                'system-cron'
              );
            }
          );

          totalRuns++;
          totalCustomers += result.customers_processed;
          totalArtifacts += result.artifacts_generated;

          console.log(
            `✅ Generated statements for company ${company.company_id}: ${result.customers_processed} customers, ${result.artifacts_generated} artifacts`
          );
        } catch (error) {
          totalErrors++;
          console.error(
            `❌ Failed to generate statements for company ${company.company_id}:`,
            error
          );
        }
      }

      console.log(`🎉 AR statement generation monthly job completed:`, {
        totalRuns,
        totalCustomers,
        totalArtifacts,
        totalErrors,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        totalRuns,
        totalCustomers,
        totalArtifacts,
        totalErrors,
      };
    } catch (error) {
      console.error('❌ AR statement generation monthly job failed:', error);
      throw error;
    }
  }
);

// --- AR Statement Email Retry Hourly Cron (M24.3) -------------------------------------

export const arStatementEmailRetryHourly = inngest.createFunction(
  { id: 'ar-statement-email-retry-hourly' },
  { cron: '0 * * * *' }, // Every hour
  async ({ event, step }: { event: any; step: any }) => {
    console.log(
      `🚀 Starting AR statement email retry hourly job at ${new Date().toISOString()}`
    );

    try {
      // Get all companies
      const companies = await step.run('get-companies', async () => {
        return [{ company_id: 'default-company' }];
      });

      let totalRetries = 0;
      let totalSent = 0;
      let totalFailed = 0;

      for (const company of companies) {
        try {
          const result = await step.run(
            `retry-emails-${company.company_id}`,
            async () => {
              // Import the service dynamically
              const { ArStatementService } = await import(
                '../../app/services/ar/statements'
              );
              const statementService = new ArStatementService();

              // Get failed email runs from the last 7 days
              const failedRuns = await statementService.getFailedEmailRuns(
                company.company_id,
                7 // days
              );

              let companyRetries = 0;
              let companySent = 0;
              let companyFailed = 0;

              for (const run of failedRuns) {
                try {
                  const emailResult =
                    await statementService.sendStatementEmails(
                      company.company_id,
                      {
                        run_id: run.id,
                        resend_failed: true,
                      },
                      'system-retry'
                    );

                  companyRetries++;
                  companySent += emailResult.emails_sent;
                  companyFailed += emailResult.emails_failed;
                } catch (error) {
                  companyFailed++;
                  console.error(
                    `Failed to retry emails for run ${run.id}:`,
                    error
                  );
                }
              }

              return {
                retries: companyRetries,
                sent: companySent,
                failed: companyFailed,
              };
            }
          );

          totalRetries += result.retries;
          totalSent += result.sent;
          totalFailed += result.failed;
        } catch (error) {
          console.error(
            `❌ Failed to retry emails for company ${company.company_id}:`,
            error
          );
        }
      }

      console.log(`📧 AR statement email retry hourly job completed:`, {
        totalRetries,
        totalSent,
        totalFailed,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        totalRetries,
        totalSent,
        totalFailed,
      };
    } catch (error) {
      console.error('❌ AR statement email retry hourly job failed:', error);
      throw error;
    }
  }
);
