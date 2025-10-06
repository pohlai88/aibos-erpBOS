'use client';
import { useEffect, useState } from 'react';
// import { createSalesInvoice, createPurchaseInvoice } from "@aibos/api-client";

type ApiResponse = {
  ok: boolean;
  data?: unknown;
  replay?: boolean;
  message?: string;
};

type ItemSummary = {
  item_id: string;
  on_hand_qty: number;
  moving_avg_cost: number;
  total_value: number;
  updated_at?: string;
};

type Money = {
  amount: string;
  currency: string;
};

type InvoiceLine = {
  description: string;
  qty: number;
  unit_price: Money;
};

type InvoiceTotals = {
  total: Money;
  tax_total: Money;
  grand_total: Money;
};

type SalesInvoice = {
  id: string;
  company_id: string;
  customer_id: string;
  doc_date: string;
  currency: string;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
};

type ReportRow = {
  line: string;
  value: string;
};

type ReportResponse = {
  rows: ReportRow[];
  total?: string;
  equationOK?: boolean;
};

type RequestHeaders = Record<string, string>;

function Pill({
  kind,
  children,
}: {
  kind: 'created' | 'replay' | 'error';
  children: React.ReactNode;
}) {
  const bg =
    kind === 'created' ? '#DCFCE7' : kind === 'replay' ? '#E0E7FF' : '#FEE2E2';
  const color = '#111';
  return (
    <span
      style={{
        background: bg,
        padding: '2px 8px',
        borderRadius: 12,
        marginLeft: 8,
        color,
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

function ItemSummaryComponent() {
  const [sum, setSum] = useState<ItemSummary | null>(null);
  const [_apiKey, _setApiKey] = useState<string>('');

  const load = async () => {
    const headers: RequestHeaders = {};
    if (_apiKey) headers['X-API-Key'] = _apiKey;
    const r = await fetch(
      '/api/inventory/summary?company_id=COMP-1&item_id=ITEM-1',
      { headers }
    );
    setSum(await r.json());
  };
  useEffect(() => {
    load();
  }, [_apiKey]);
  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        width: 380,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>Item Summary</h2>
      {sum && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
          <li>
            <b>Item</b>: {sum.item_id}
          </li>
          <li>
            <b>On hand</b>: {sum.on_hand_qty}
          </li>
          <li>
            <b>Moving Avg Cost</b>: {sum.moving_avg_cost}
          </li>
          <li>
            <b>Total value</b>: {sum.total_value}
          </li>
          <li>
            <b>Updated</b>: {sum.updated_at ?? '-'}
          </li>
        </ul>
      )}
      <button onClick={load}>Refresh</button>
    </div>
  );
}

export default function Home() {
  const [out, setOut] = useState<ApiResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'busy'>('idle');
  const [apiKey, setApiKey] = useState<string>('');

  async function call(path: string, body: unknown) {
    setStatus('busy');
    const headers: RequestHeaders = { 'content-type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;
    const res = await fetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    const replay = res.headers.get('X-Idempotent-Replay') === 'true';
    setOut({ ...(json as ApiResponse), replay });
    setStatus('idle');
  }

  return (
    <main style={{ padding: 24, fontFamily: 'ui-sans-serif' }}>
      <h1>AIBOS — Hello Ledger</h1>

      <div style={{ marginBottom: 12 }}>
        <label>API Key: </label>
        <input
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          style={{ width: 420 }}
          placeholder='ak_xxx:secret'
        />
      </div>

      <section style={{ marginBottom: 16 }}>
        <button
          disabled={status === 'busy'}
          onClick={async () => {
            const now = new Date().toISOString();
            const body = {
              id: '01HZXV8TESTULID0000000000',
              company_id: 'COMP-1',
              customer_id: 'CUST-1',
              doc_date: now,
              currency: 'MYR',
              lines: [
                {
                  description: 'Demo',
                  qty: 1,
                  unit_price: { amount: '100.00', currency: 'MYR' },
                },
              ],
              totals: {
                total: { amount: '100.00', currency: 'MYR' },
                tax_total: { amount: '6.00', currency: 'MYR' },
                grand_total: { amount: '106.00', currency: 'MYR' },
              },
            } as SalesInvoice;
            // const res = await createSalesInvoice(body, "http://localhost:3000/api");
            setOut({ ok: true, data: body });
          }}
        >
          Post Sales Invoice
        </button>

        <button
          disabled={status === 'busy'}
          style={{ marginLeft: 8 }}
          onClick={async () => {
            setStatus('busy');
            try {
              // const r = await createPurchaseInvoice({
              //   id: "PI-01",
              //   company_id: "COMP-1",
              //   supplier_id: "SUP-1",
              //   doc_date: new Date().toISOString(),
              //   currency: "MYR",
              //   lines: [{ description: "Office Supplies", qty: 1, unit_price: { amount: "500.00", currency: "MYR" } }],
              //   totals: { total: { amount: "500.00", currency: "MYR" }, tax_total: { amount: "30.00", currency: "MYR" }, grand_total: { amount: "530.00", currency: "MYR" } }
              // }, "http://localhost:3000/api");
              setOut({ ok: true, data: { id: 'PI-01' }, replay: false });
            } catch (e) {
              setOut({ ok: false, message: String(e) });
            } finally {
              setStatus('idle');
            }
          }}
        >
          Post Purchase Invoice
        </button>
      </section>

      <section style={{ marginBottom: 16 }}>
        <button
          disabled={status === 'busy'}
          onClick={() =>
            call('/api/inventory/receipts', {
              id: 'GRN-1',
              company_id: 'COMP-1',
              item_id: 'ITEM-1',
              qty: 10,
              unit_cost: 20.0,
              currency: 'MYR',
            })
          }
        >
          Receive 10 @ 20
        </button>

        <button
          disabled={status === 'busy'}
          style={{ marginLeft: 8 }}
          onClick={() =>
            call('/api/inventory/issues', {
              id: 'ISS-1',
              company_id: 'COMP-1',
              item_id: 'ITEM-1',
              qty: 3,
              currency: 'MYR',
            })
          }
        >
          Issue 3 (WA)
        </button>
      </section>

      {out && (
        <div
          style={{
            border: '1px solid #eee',
            padding: 12,
            borderRadius: 8,
            maxWidth: 700,
            marginBottom: 16,
          }}
        >
          <b>Result</b>
          {out.ok && out.replay && <Pill kind='replay'>replay</Pill>}
          {out.ok && !out.replay && <Pill kind='created'>created</Pill>}
          {!out.ok && <Pill kind='error'>error</Pill>}
          <pre>{JSON.stringify(out, null, 2)}</pre>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <a
            href='/audit'
            style={{
              textDecoration: 'none',
              color: '#0066cc',
              marginRight: 16,
            }}
          >
            🔍 Audit Explorer
          </a>
          <button
            onClick={async () => {
              const headers: RequestHeaders = {};
              if (apiKey) headers['X-API-Key'] = apiKey;
              const res = await fetch('/api/reports/trial-balance', {
                headers,
              });
              alert('TB loaded: ' + res.status);
            }}
          >
            View Trial Balance
          </button>
          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const headers: RequestHeaders = {};
              if (apiKey) headers['X-API-Key'] = apiKey;
              const res = await fetch('/api/reports/pl', { headers });
              const json = await res.json();
              alert(
                'P&L\n' +
                  json.rows
                    .map((r: ReportRow) => `${r.line}: ${r.value}`)
                    .join('\n') +
                  `\nTotal: ${json.total}`
              );
            }}
          >
            View P&L
          </button>
          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const headers: RequestHeaders = {};
              if (apiKey) headers['X-API-Key'] = apiKey;
              const res = await fetch('/api/reports/bs', { headers });
              const json = await res.json();
              alert(
                'Balance Sheet\n' +
                  json.rows
                    .map((r: ReportRow) => `${r.line}: ${r.value}`)
                    .join('\n') +
                  `\nEquation OK: ${json.equationOK}`
              );
            }}
          >
            View Balance Sheet
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Period Management</h3>
          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const start = new Date();
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date(start);
              end.setMonth(end.getMonth() + 1);
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              const headers: any = { 'content-type': 'application/json' };
              if (apiKey) headers['X-API-Key'] = apiKey;
              const res = await fetch('http://localhost:3000/api/periods', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  company_id: 'COMP-1',
                  code: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
                  start_date: start.toISOString(),
                  end_date: end.toISOString(),
                  status: 'OPEN',
                }),
              });
              alert('Open current period: ' + res.status);
            }}
          >
            Open Current Period
          </button>

          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const now = new Date();
              const code = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              const start = new Date();
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date(start);
              end.setMonth(end.getMonth() + 1);
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              const headers: any = { 'content-type': 'application/json' };
              if (apiKey) headers['X-API-Key'] = apiKey;
              const res = await fetch('http://localhost:3000/api/periods', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  company_id: 'COMP-1',
                  code,
                  start_date: start.toISOString(),
                  end_date: end.toISOString(),
                  status: 'CLOSED',
                }),
              });
              alert('Close current period: ' + res.status);
            }}
          >
            Close Current Period
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Payments & Matching</h3>
          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const res = await fetch(
                'http://localhost:3000/api/payments/receive',
                {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    id: 'RCPT-01',
                    company_id: 'COMP-1',
                    party_id: 'CUST-1',
                    doc_date: new Date().toISOString(),
                    currency: 'MYR',
                    amount: 106.0,
                    allocations: [
                      {
                        doctype: 'SalesInvoice',
                        id: 'SI-M3-TEST',
                        amount: 106.0,
                      },
                    ],
                  }),
                }
              );
              const json = await res.json();
              alert('Receive Payment: ' + JSON.stringify(json));
            }}
          >
            Receive 106 from Customer
          </button>

          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const res = await fetch(
                'http://localhost:3000/api/payments/supplier',
                {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    id: 'PAY-01',
                    company_id: 'COMP-1',
                    party_id: 'SUP-1',
                    doc_date: new Date().toISOString(),
                    currency: 'MYR',
                    amount: 530.0,
                    allocations: [
                      {
                        doctype: 'PurchaseInvoice',
                        id: 'PI-M4-1',
                        amount: 530.0,
                      },
                    ],
                  }),
                }
              );
              const json = await res.json();
              alert('Supplier Payment: ' + JSON.stringify(json));
            }}
          >
            Pay 530 to Supplier
          </button>

          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const r = await fetch('http://localhost:3000/api/reports/aging');
              alert('Aging: ' + JSON.stringify(await r.json(), null, 2));
            }}
          >
            View Aging
          </button>
        </div>

        <ItemSummaryComponent />
      </div>
    </main>
  );
}
