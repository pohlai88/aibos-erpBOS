import { NextRequest } from 'next/server';
import { CustomerCreditUpsert } from '@aibos/contracts';
import { requireAuth, requireCapability } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { arCustomerCredit } from '@aibos/db-adapter/schema';
import { withRouteErrors, ok } from '@/api/_kit';

// --- AR Customer Credit Management Route (M24.1) ----------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:credit:customer');
    if (cap instanceof Response) return cap;

    const customers = await db
      .select()
      .from(arCustomerCredit)
      .where(eq(arCustomerCredit.companyId, auth.company_id));

    return ok(
      {
        customers: customers.map(customer => ({
          customer_id: customer.customerId,
          policy_code: customer.policyCode,
          credit_limit: Number(customer.creditLimit),
          risk_score: customer.riskScore ? Number(customer.riskScore) : null,
          on_hold: customer.onHold,
          hold_reason: customer.holdReason,
          updated_at: customer.updatedAt,
          updated_by: customer.updatedBy,
        })),
      },
      200
    );
  } catch (error) {
    console.error('Error fetching customer credits:', error);
    return ok({ error: 'Failed to fetch customer credits' }, 500);
  }
});
export const POST = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:credit:customer');
    if (cap instanceof Response) return cap;

    const json = await req.json();
    const data = CustomerCreditUpsert.parse(json);

    await db
      .insert(arCustomerCredit)
      .values({
        companyId: auth.company_id,
        customerId: data.customer_id,
        policyCode: data.policy_code,
        creditLimit: data.credit_limit.toString(),
        riskScore: data.risk_score ? data.risk_score.toString() : null,
        onHold: data.on_hold || false,
        holdReason: data.hold_reason,
        updatedBy: auth.user_id,
      })
      .onConflictDoUpdate({
        target: [arCustomerCredit.companyId, arCustomerCredit.customerId],
        set: {
          policyCode: data.policy_code,
          creditLimit: data.credit_limit.toString(),
          riskScore: data.risk_score ? data.risk_score.toString() : null,
          onHold: data.on_hold || false,
          holdReason: data.hold_reason,
          updatedAt: new Date(),
          updatedBy: auth.user_id,
        },
      });

    return ok(
      {
        message: 'Customer credit created/updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error creating/updating customer credit:', error);
    return ok({ error: 'Failed to create/update customer credit' }, 500);
  }
});
