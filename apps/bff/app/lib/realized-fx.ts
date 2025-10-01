import { pool } from "./db";
import { getFxQuotesForDateOrBefore } from "./fx";
import { DefaultFxPolicy } from "@aibos/policies";

export async function computeRealizedFX(
  paymentId: string,
  paymentDate: string,
  paymentCurrency: string,
  paymentAmount: number,
  companyId: string
): Promise<Array<{ account_code: string; dc: "D" | "C"; amount: number; currency: string; description: string }>> {
  // Get company base currency
  const company = await pool.query(`select base_currency from company where id=$1`, [companyId]);
  if (!company.rows.length) throw new Error("Company not found");
  const baseCurrency = company.rows[0].base_currency;

  // Get payment allocations to invoices (both AR and AP)
  const allocations = await pool.query(`
    select pa.apply_id, pa.amount as allocated_amount, pa.apply_doctype
    from payment_allocation pa
    where pa.payment_id = $1 and pa.apply_doctype in ('SalesInvoice', 'PurchaseInvoice')
  `, [paymentId]);

  if (allocations.rows.length === 0) {
    return []; // No invoice allocations, no realized FX
  }

  const fxLines: Array<{ account_code: string; dc: "D" | "C"; amount: number; currency: string; description: string }> = [];

  for (const allocation of allocations.rows) {
    // Get the original invoice journal to find the posting rate
    const invoiceJournal = await pool.query(`
      select j.id, j.posting_date, j.currency, j.base_currency, j.rate_used,
             jl.account_code, jl.amount as original_amount, jl.base_amount as original_base_amount
      from journal j
      join journal_line jl on jl.journal_id = j.id
      where j.source_id = $1 and j.source_doctype = $2 and jl.account_code in ('ACC-AR', 'ACC-AP')
      limit 1
    `, [allocation.apply_id, allocation.apply_doctype]);

    if (!invoiceJournal.rows.length) continue;

    const invoice = invoiceJournal.rows[0];
    const allocatedAmount = parseFloat(allocation.allocated_amount);
    
    // Calculate the original base amount for this allocated portion
    const originalBaseAmount = invoice.original_base_amount 
      ? (parseFloat(invoice.original_base_amount) * allocatedAmount / parseFloat(invoice.original_amount))
      : allocatedAmount; // fallback if no base amount

    // Get current FX rate for payment date
    const quotes = await getFxQuotesForDateOrBefore(paymentCurrency, baseCurrency, paymentDate);
    const currentRate = DefaultFxPolicy.selectRate(quotes, paymentCurrency, baseCurrency, paymentDate);
    
    if (!currentRate) continue; // Skip if no rate available

    // Calculate current base amount for the payment
    const currentBaseAmount = allocatedAmount * currentRate;

    // Calculate FX difference
    const fxDifference = currentBaseAmount - originalBaseAmount;

    if (Math.abs(fxDifference) < 0.01) continue; // Skip tiny differences

    // Add FX gain/loss lines
    if (fxDifference > 0) {
      // FX Gain (credit-positive)
      fxLines.push({
        account_code: "FX Gain",
        dc: "C",
        amount: fxDifference,
        currency: baseCurrency,
        description: `Realized FX Gain - Payment ${paymentId}`
      });
    } else {
      // FX Loss (debit-positive)
      fxLines.push({
        account_code: "FX Loss", 
        dc: "D",
        amount: Math.abs(fxDifference),
        currency: baseCurrency,
        description: `Realized FX Loss - Payment ${paymentId}`
      });
    }
  }

  return fxLines;
}
