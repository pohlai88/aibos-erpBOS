-- A helper view that composes invoices, cash_app links, credit memos, write-offs
-- into a normalized ledger line (debit/credit). Refresh during statement runs.

BEGIN;
CREATE OR REPLACE VIEW ar_customer_ledger AS
WITH invoice_lines AS (
  SELECT 
    ai.id as doc_id,
    ai.company_id,
    ai.customer_id,
    ai.invoice_date as doc_date,
    ai.due_date,
    ai.invoice_no as ref,
    'Invoice' as memo,
    ai.gross_amount as debit,
    0 as credit,
    ai.ccy as currency,
    'INVOICE' as doc_type,
    ai.invoice_date::text || '_' || ai.id as sort_key
  FROM ar_invoice ai
  WHERE ai.status = 'OPEN'
),
payment_lines AS (
  SELECT 
    cal.id as doc_id,
    ca.company_id,
    ca.customer_id,
    ca.receipt_date as doc_date,
    NULL::date as due_date,
    ca.reference as ref,
    'Payment' as memo,
    0 as debit,
    cal.link_amount as credit,
    ca.ccy as currency,
    'PAYMENT' as doc_type,
    ca.receipt_date::text || '_' || cal.id as sort_key
  FROM ar_cash_app ca
  JOIN ar_cash_app_link cal ON ca.id = cal.cash_app_id
  WHERE ca.status = 'matched'
)
SELECT * FROM invoice_lines
UNION ALL
SELECT * FROM payment_lines
ORDER BY company_id, customer_id, doc_date, sort_key;

COMMIT;
