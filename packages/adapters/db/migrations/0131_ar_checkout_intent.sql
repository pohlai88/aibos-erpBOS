BEGIN;

CREATE TABLE IF NOT EXISTS ar_checkout_intent (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  customer_id  TEXT NOT NULL,
  present_ccy  TEXT NOT NULL,
  amount       NUMERIC NOT NULL,           -- intended total
  invoices     JSONB NOT NULL,             -- [{invoice_id, amount}]
  surcharge    NUMERIC NOT NULL DEFAULT 0, -- if applied
  gateway      TEXT NOT NULL,              -- 'STRIPE','ADYEN','PAYPAL','BANK'
  status       TEXT NOT NULL CHECK (status IN ('created','authorized','captured','failed','expired','voided','refunded')),
  client_secret TEXT,                      -- gateway client secret if any
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

COMMIT;
