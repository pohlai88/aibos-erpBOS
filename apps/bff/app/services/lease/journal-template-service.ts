import { db } from "@/lib/db";
import { ulid } from "ulid";

/**
 * M28.5: Journal Template Service for Sublease & SLB
 * 
 * Manages journal templates for sublease and SLB postings
 * Uses seeded template data from migration 0325_seed_templates.sql
 */
export class JournalTemplateService {
    constructor(private dbInstance = db) { }

    /**
     * Get finance sublease initial recognition template
     */
    getFinanceSubleaseInitTemplate(): JournalTemplate {
        return {
            id: 'sublease_finance_init',
            name: 'Finance Sublease Initial Recognition',
            description: 'Initial recognition of finance sublease (Dr NIS / Cr ROU)',
            lines: [
                {
                    accountCode: 'NIS',
                    drCr: 'DR',
                    amountFormula: 'PV(receipts)',
                    description: 'Net investment in sublease'
                },
                {
                    accountCode: 'ROU',
                    drCr: 'CR',
                    amountFormula: 'PV(receipts)',
                    description: 'Right-of-use asset (portion transferred)'
                }
            ]
        };
    }

    /**
     * Get finance sublease monthly posting template
     */
    getFinanceSubleaseMonthlyTemplate(): JournalTemplate {
        return {
            id: 'sublease_finance_monthly',
            name: 'Finance Sublease Monthly Posting',
            description: 'Monthly finance sublease posting (Dr NIS / Cr Interest Income)',
            lines: [
                {
                    accountCode: 'NIS',
                    drCr: 'DR',
                    amountFormula: 'cash_receipt',
                    description: 'Net investment in sublease (receipt)'
                },
                {
                    accountCode: 'INTEREST_INCOME',
                    drCr: 'CR',
                    amountFormula: 'interest',
                    description: 'Interest income'
                },
                {
                    accountCode: 'NIS',
                    drCr: 'CR',
                    amountFormula: 'principal',
                    description: 'Net investment in sublease (principal)'
                }
            ]
        };
    }

    /**
     * Get operating sublease monthly posting template
     */
    getOperatingSubleaseMonthlyTemplate(): JournalTemplate {
        return {
            id: 'sublease_operating_monthly',
            name: 'Operating Sublease Monthly Posting',
            description: 'Monthly operating sublease posting (Dr Cash/A/R / Cr Lease Income)',
            lines: [
                {
                    accountCode: 'CASH',
                    drCr: 'DR',
                    amountFormula: 'receipt',
                    description: 'Cash received'
                },
                {
                    accountCode: 'LEASE_INCOME',
                    drCr: 'CR',
                    amountFormula: 'income',
                    description: 'Lease income'
                }
            ]
        };
    }

    /**
     * Get SLB initial posting template
     */
    getSlbInitialTemplate(): JournalTemplate {
        return {
            id: 'slb_initial',
            name: 'SLB Initial Posting',
            description: 'Initial SLB posting (Dr Cash, ROU / Cr Asset, Liability, Gains)',
            lines: [
                {
                    accountCode: 'CASH',
                    drCr: 'DR',
                    amountFormula: 'sale_price',
                    description: 'Cash received'
                },
                {
                    accountCode: 'ROU',
                    drCr: 'DR',
                    amountFormula: 'rou_retained',
                    description: 'Right-of-use asset (retained)'
                },
                {
                    accountCode: 'PPE',
                    drCr: 'CR',
                    amountFormula: 'CA',
                    description: 'Property, plant and equipment'
                },
                {
                    accountCode: 'LEASE_LIABILITY',
                    drCr: 'CR',
                    amountFormula: 'LB_PV',
                    description: 'Lease liability (leaseback PV)'
                },
                {
                    accountCode: 'GAIN_DISPOSAL',
                    drCr: 'CR',
                    amountFormula: 'gain_rec',
                    description: 'Gain on disposal (recognized)'
                },
                {
                    accountCode: 'DEFERRED_GAIN',
                    drCr: 'CR',
                    amountFormula: 'gain_def',
                    description: 'Deferred gain (liability)'
                }
            ]
        };
    }

    /**
     * Get SLB monthly posting template
     */
    getSlbMonthlyTemplate(): JournalTemplate {
        return {
            id: 'slb_monthly',
            name: 'SLB Monthly Posting',
            description: 'Monthly SLB posting (interest, ROU amortization, deferred gain unwind)',
            lines: [
                {
                    accountCode: 'INTEREST_EXPENSE',
                    drCr: 'DR',
                    amountFormula: 'interest',
                    description: 'Interest expense on leaseback'
                },
                {
                    accountCode: 'LEASE_LIABILITY',
                    drCr: 'DR',
                    amountFormula: 'principal',
                    description: 'Lease liability (principal)'
                },
                {
                    accountCode: 'CASH',
                    drCr: 'CR',
                    amountFormula: 'payment',
                    description: 'Cash paid'
                },
                {
                    accountCode: 'ROU_AMORTIZATION',
                    drCr: 'DR',
                    amountFormula: 'amort',
                    description: 'ROU amortization expense'
                },
                {
                    accountCode: 'ROU',
                    drCr: 'CR',
                    amountFormula: 'amort',
                    description: 'Right-of-use asset'
                },
                {
                    accountCode: 'DEFERRED_GAIN',
                    drCr: 'DR',
                    amountFormula: 'unwind',
                    description: 'Deferred gain unwind'
                },
                {
                    accountCode: 'GAIN_DISPOSAL',
                    drCr: 'CR',
                    amountFormula: 'unwind',
                    description: 'Gain on disposal (unwind)'
                }
            ]
        };
    }

    /**
     * Apply template to create journal entry
     */
    async applyTemplate(
        companyId: string,
        userId: string,
        template: JournalTemplate,
        variables: Record<string, number>,
        memo: string,
        dryRun: boolean = false
    ): Promise<string> {
        const journalId = ulid();

        // Calculate amounts for each line
        const journalLines = template.lines.map(line => {
            const amount = this.calculateAmount(line.amountFormula, variables);
            return {
                accountCode: line.accountCode,
                drCr: line.drCr,
                amount,
                description: line.description
            };
        });

        // Validate that debits equal credits
        const totalDebits = journalLines
            .filter(line => line.drCr === 'DR')
            .reduce((sum, line) => sum + line.amount, 0);

        const totalCredits = journalLines
            .filter(line => line.drCr === 'CR')
            .reduce((sum, line) => sum + line.amount, 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new Error(`Journal entry not balanced: Debits ${totalDebits} != Credits ${totalCredits}`);
        }

        if (!dryRun) {
            // TODO: Create actual journal entry using the journal service
            // For now, we'll just log the journal entry
            console.log('Journal Entry:', {
                id: journalId,
                memo,
                lines: journalLines
            });
        }

        return journalId;
    }

    /**
     * Calculate amount based on formula and variables
     */
    private calculateAmount(formula: string, variables: Record<string, number>): number {
        // Simple formula evaluation - in production this would be more sophisticated
        let result = formula;

        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(key, 'g'), value.toString());
        }

        // Handle basic arithmetic
        try {
            return eval(result) || 0;
        } catch {
            return 0;
        }
    }
}

// Types
interface JournalTemplate {
    id: string;
    name: string;
    description: string;
    lines: JournalTemplateLine[];
}

interface JournalTemplateLine {
    accountCode: string;
    drCr: 'DR' | 'CR';
    amountFormula: string;
    description: string;
}
