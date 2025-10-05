BEGIN;
CREATE TABLE IF NOT EXISTS ar_statement_line (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES ar_statement_run(id) ON DELETE CASCADE,
  company_id    TEXT NOT NULL,
  customer_id   TEXT NOT NULL,
  doc_type      TEXT NOT NULL CHECK (doc_type IN ('INVOICE','CREDIT_MEMO','PAYMENT','ADJ','FINANCE_CHARGE','DISPUTE_HOLD')),
  doc_id        TEXT,                  -- invoice id, cash_app id, etc.
  doc_date      DATE NOT NULL,
  due_date      DATE,
  ref           TEXT,
  memo          TEXT,
  debit         NUMERIC NOT NULL DEFAULT 0,  -- + increases balance
  credit        NUMERIC NOT NULL DEFAULT 0,  -- - reduces balance
  balance       NUMERIC NOT NULL,            -- running customer balance in present ccy
  bucket        TEXT NOT NULL,               -- CURRENT/1-30/31-60/61-90/90+
  currency      TEXT NOT NULL,
  sort_key      TEXT                         -- for stable rendering
);
CREATE INDEX IF NOT EXISTS ar_stmt_line_cust_idx ON ar_statement_line(company_id, customer_id, run_id);
COMMIT;
