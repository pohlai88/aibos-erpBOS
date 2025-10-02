// M16.1: Amortization Posting Service
// Posts amortization schedules to GL via journal entries

import { pool } from "../../lib/db";
import { ulid } from "ulid";

export interface AmortPostResult {
    posted: number;
    journals: string[];
}

export interface JournalLine {
    account_code: string;
    debit: number;
    credit: number;
    currency: string;
    cost_center?: string | null;
    project?: string | null;
}

export interface JournalEntry {
    id: string;
    date: Date;
    memo: string;
    lines: JournalLine[];
    tags?: Record<string, string>;
}

// Mock journal service - replace with your actual journal posting service
async function postJournal(companyId: string, entry: JournalEntry): Promise<{ journal_id: string }> {
    // This is a placeholder - replace with your actual journal posting logic
    console.log(`📝 Posting journal for ${companyId}:`, entry);

    // Mock implementation - in real system, this would:
    // 1. Create journal entry
    // 2. Create journal lines
    // 3. Post to GL
    // 4. Return journal ID

    return { journal_id: ulid() };
}

export async function postAmortization(
    companyId: string,
    year: number,
    month: number,
    memo?: string,
    planId?: string,
    dryRun: boolean = false
): Promise<AmortPostResult> {
    // Get unbooked schedules for the period
    const schedulesQuery = planId
        ? `SELECT * FROM amort_schedule WHERE company_id = $1 AND year = $2 AND month = $3 AND plan_id = $4 AND booked_flag = false`
        : `SELECT * FROM amort_schedule WHERE company_id = $1 AND year = $2 AND month = $3 AND booked_flag = false`;

    const schedulesResult = await pool.query(
        schedulesQuery,
        planId ? [companyId, year, month, planId] : [companyId, year, month]
    );
    const schedules = schedulesResult.rows;

    if (schedules.length === 0) {
        return { posted: 0, journals: [] };
    }

    // Get intangible plans for class mapping
    const planIds = [...new Set(schedules.map(s => s.plan_id))];
    const plansResult = await pool.query(
        `SELECT * FROM intangible_plan WHERE company_id = $1`,
        [companyId]
    );
    const plans = plansResult.rows;

    const planById = new Map(plans.map(p => [p.id, p]));

    // Get intangible posting maps
    const classes = [...new Set(plans.map(p => p.class))];
    const postingMapsResult = await pool.query(
        `SELECT * FROM intangible_posting_map WHERE company_id = $1`,
        [companyId]
    );
    const postingMaps = postingMapsResult.rows;

    const mapByClass = new Map(postingMaps.map(m => [m.class, m]));

    const journals: string[] = [];

    // Group schedules by plan for efficient posting
    const schedulesByPlan = new Map<string, typeof schedules>();
    for (const schedule of schedules) {
        if (!schedulesByPlan.has(schedule.plan_id)) {
            schedulesByPlan.set(schedule.plan_id, []);
        }
        schedulesByPlan.get(schedule.plan_id)!.push(schedule);
    }

    for (const [currentPlanId, planSchedules] of schedulesByPlan) {
        const plan = planById.get(currentPlanId);
        if (!plan) {
            console.warn(`Plan ${currentPlanId} not found, skipping`);
            continue;
        }

        const postingMap = mapByClass.get(plan.class);
        if (!postingMap) {
            console.warn(`No posting map found for intangible class ${plan.class}, skipping`);
            continue;
        }

        // Calculate total amortization for this plan
        const totalAmount = planSchedules.reduce((sum, s) => sum + Number(s.amount), 0);

        if (totalAmount === 0) {
            continue; // Skip zero-amount schedules
        }

        const journalLines: JournalLine[] = [
            // DR Amortization Expense
            {
                account_code: postingMap.amort_expense_account,
                debit: totalAmount,
                credit: 0,
                currency: planSchedules[0].present_ccy,
                cost_center: plan.cost_center,
                project: plan.project,
            },
            // CR Accumulated Amortization
            {
                account_code: postingMap.accum_amort_account,
                debit: 0,
                credit: totalAmount,
                currency: planSchedules[0].present_ccy,
                cost_center: plan.cost_center,
                project: plan.project,
            },
        ];

        const journalEntry: JournalEntry = {
            id: ulid(),
            date: new Date(Date.UTC(year, month - 1, 28)), // End-of-month safe default
            memo: memo ?? `Amortization ${year}-${String(month).padStart(2, "0")} ${plan.description}`,
            lines: journalLines,
            tags: {
                module: "intangibles",
                plan_id: currentPlanId,
                period: `${year}-${String(month).padStart(2, "0")}`,
            },
        };

        if (!dryRun) {
            try {
                const result = await postJournal(companyId, journalEntry);
                journals.push(result.journal_id);

                // Mark schedules as booked
                for (const schedule of planSchedules) {
                    await pool.query(
                        `UPDATE amort_schedule SET booked_flag = true, booked_journal_id = $1 
             WHERE company_id = $2 AND plan_id = $3 AND year = $4 AND month = $5`,
                        [result.journal_id, companyId, schedule.plan_id, schedule.year, schedule.month]
                    );
                }
            } catch (error) {
                console.error(`Failed to post journal for plan ${currentPlanId}:`, error);
                throw error;
            }
        } else {
            journals.push("DRY_RUN");
        }
    }

    return {
        posted: journals.length,
        journals
    };
}
