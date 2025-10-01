"use client";
import { useEffect, useState } from "react";
import { createSalesInvoice } from "@aibos/api-client/src/client";
import { createPurchaseInvoice } from "@aibos/api-client/src/pi-client";

type Res = { ok: boolean; data?: any; replay?: boolean; message?: string };

function Pill({ kind, children }: { kind: "created" | "replay" | "error"; children: React.ReactNode }) {
  const bg = kind === "created" ? "#DCFCE7" : kind === "replay" ? "#E0E7FF" : "#FEE2E2";
  const color = "#111";
  return <span style={{ background: bg, padding: "2px 8px", borderRadius: 12, marginLeft: 8, color, fontSize: 12 }}>{children}</span>;
}

function ItemSummary() {
  const [sum, setSum] = useState<any>(null);
  const load = async () => {
    const r = await fetch("/api/inventory/summary?company_id=COMP-1&item_id=ITEM-1");
    setSum(await r.json());
  };
  useEffect(() => { load(); }, []);
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginTop: 16, width: 380 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Item Summary</h2>
      {sum && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          <li><b>Item</b>: {sum.item_id}</li>
          <li><b>On hand</b>: {sum.on_hand_qty}</li>
          <li><b>Moving Avg Cost</b>: {sum.moving_avg_cost}</li>
          <li><b>Total value</b>: {sum.total_value}</li>
          <li><b>Updated</b>: {sum.updated_at ?? "-"}</li>
        </ul>
      )}
      <button onClick={load}>Refresh</button>
    </div>
  );
}

export default function Home() {
  const [out, setOut] = useState<Res | null>(null);
  const [status, setStatus] = useState<"idle" | "busy">("idle");

  async function call(path: string, body: any) {
    setStatus("busy");
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    const replay = res.headers.get("X-Idempotent-Replay") === "true";
    setOut({ ...(json as Res), replay });
    setStatus("idle");
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
      <h1>AIBOS — Hello Ledger</h1>

      <section style={{ marginBottom: 16 }}>
        <button disabled={status === "busy"} onClick={async () => {
          const now = new Date().toISOString();
          const body = {
            id: "01HZXV8TESTULID0000000000",
            company_id: "COMP-1",
            customer_id: "CUST-1",
            doc_date: now,
            currency: "MYR",
            lines: [{ description: "Demo", qty: 1, unit_price: { amount: "100.00", currency: "MYR" } }],
            totals: { total: { amount: "100.00", currency: "MYR" }, tax_total: { amount: "6.00", currency: "MYR" }, grand_total: { amount: "106.00", currency: "MYR" } }
          } as any;
          const res = await createSalesInvoice(body, "http://localhost:3000/api");
          setOut({ ok: true, data: res });
        }}>Post Sales Invoice</button>

        <button disabled={status === "busy"} style={{ marginLeft: 8 }} onClick={async () => {
          setStatus("busy");
          try {
            const r = await createPurchaseInvoice({
              id: "PI-01",
              company_id: "COMP-1",
              supplier_id: "SUP-1",
              doc_date: new Date().toISOString(),
              currency: "MYR",
              lines: [{ description: "Office Supplies", qty: 1, unit_price: { amount: "500.00", currency: "MYR" } }],
              totals: { total: { amount: "500.00", currency: "MYR" }, tax_total: { amount: "30.00", currency: "MYR" }, grand_total: { amount: "530.00", currency: "MYR" } }
            }, "http://localhost:3000/api");
            setOut({ ok: true, data: r, replay: r.replay });
          } catch (e) {
            setOut({ ok: false, message: String(e) });
          } finally {
            setStatus("idle");
          }
        }}>Post Purchase Invoice</button>
      </section>

      <section style={{ marginBottom: 16 }}>
        <button disabled={status === "busy"} onClick={() => call("/api/inventory/receipts", {
          id: "GRN-1", company_id: "COMP-1", item_id: "ITEM-1", qty: 10, unit_cost: 20.00, currency: "MYR"
        })}>Receive 10 @ 20</button>

        <button disabled={status === "busy"} style={{ marginLeft: 8 }} onClick={() => call("/api/inventory/issues", {
          id: "ISS-1", company_id: "COMP-1", item_id: "ITEM-1", qty: 3, currency: "MYR"
        })}>Issue 3 (WA)</button>
      </section>

      {out && (
        <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, maxWidth: 700, marginBottom: 16 }}>
          <b>Result</b>
          {out.ok && out.replay && <Pill kind="replay">replay</Pill>}
          {out.ok && !out.replay && <Pill kind="created">created</Pill>}
          {!out.ok && <Pill kind="error">error</Pill>}
          <pre>{JSON.stringify(out, null, 2)}</pre>
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        <div>
          <button onClick={async () => {
            const res = await fetch("/api/reports/trial-balance");
            alert("TB loaded: " + res.status);
          }}>View Trial Balance</button>
          <button style={{ marginLeft: 8 }} onClick={async () => {
            const res = await fetch("/api/reports/pl"); const json = await res.json();
            alert("P&L\n" + json.rows.map((r: any) => `${r.line}: ${r.value}`).join("\n") + `\nTotal: ${json.total}`);
          }}>View P&L</button>
          <button style={{ marginLeft: 8 }} onClick={async () => {
            const res = await fetch("/api/reports/bs"); const json = await res.json();
            alert("Balance Sheet\n" + json.rows.map((r: any) => `${r.line}: ${r.value}`).join("\n") + `\nEquation OK: ${json.equationOK}`);
          }}>View Balance Sheet</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Payments & Matching</h3>
          <button style={{ marginLeft: 8 }} onClick={async () => {
            const res = await fetch("http://localhost:3000/api/payments/receive", {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({
                id: "RCPT-01", company_id: "COMP-1", party_id: "CUST-1",
                doc_date: new Date().toISOString(), currency: "MYR", amount: 106.00,
                allocations: [{ doctype: "SalesInvoice", id: "SI-M3-TEST", amount: 106.00 }]
              })
            });
            const json = await res.json();
            alert("Receive Payment: " + JSON.stringify(json));
          }}>Receive 106 from Customer</button>

          <button style={{ marginLeft: 8 }} onClick={async () => {
            const res = await fetch("http://localhost:3000/api/payments/supplier", {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({
                id: "PAY-01", company_id: "COMP-1", party_id: "SUP-1",
                doc_date: new Date().toISOString(), currency: "MYR", amount: 530.00,
                allocations: [{ doctype: "PurchaseInvoice", id: "PI-M4-1", amount: 530.00 }]
              })
            });
            const json = await res.json();
            alert("Supplier Payment: " + JSON.stringify(json));
          }}>Pay 530 to Supplier</button>

          <button style={{ marginLeft: 8 }} onClick={async () => {
            const r = await fetch("http://localhost:3000/api/reports/aging");
            alert("Aging: " + JSON.stringify(await r.json(), null, 2));
          }}>View Aging</button>
        </div>

        <ItemSummary />
      </div>
    </main>
  );
}