"use client";
import { useState } from "react";
import { createSalesInvoice } from "@aibos/api-client/src/client";

async function fetchTB() {
  const res = await fetch("http://localhost:3000/api/reports/trial-balance");
  if (!res.ok) throw new Error("TB fetch failed");
  return res.json();
}

export default function Home() {
  const [out, setOut] = useState("(no response)");
  const [tb, setTb] = useState<any>(null);

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
      <h1>AIBOS — Hello Ledger</h1>

      <section style={{ marginBottom: 24 }}>
        <button
          onClick={async () => {
            const now = new Date().toISOString();
            const body = {
              id: "01HZXV8TESTULID0000000000",
              company_id: "COMP-1",
              customer_id: "CUST-1",
              doc_date: now,
              currency: "MYR",
              lines: [{ description: "Demo", qty: 1, unit_price: { amount: "100.00", currency: "MYR" } }],
              totals: {
                total: { amount: "100.00", currency: "MYR" },
                tax_total: { amount: "6.00", currency: "MYR" },
                grand_total: { amount: "106.00", currency: "MYR" }
              }
            } as any;
            const res = await createSalesInvoice(body, "http://localhost:3000/api");
            setOut(JSON.stringify(res));
          }}
        >
          Post Sales Invoice
        </button>

        <button
          onClick={async () => {
            const now = new Date().toISOString();
            const body = {
              id: "PI-01",
              company_id: "COMP-1",
              supplier_id: "SUP-1",
              doc_date: now,
              currency: "MYR",
              lines: [{ description: "Office Supplies", qty: 1, unit_price: { amount: "500.00", currency: "MYR" } }],
              totals: {
                total: { amount: "500.00", currency: "MYR" },
                tax_total: { amount: "30.00", currency: "MYR" },
                grand_total: { amount: "530.00", currency: "MYR" }
              }
            };
            const res = await fetch("http://localhost:3000/api/purchase-invoices", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body)
            });
            setOut(JSON.stringify(await res.json()));
          }}
        >
          Post Purchase Invoice
        </button>
        <pre>{out}</pre>
      </section>

      <section>
        <button
          onClick={async () => {
            const data = await fetchTB();
            setTb(data);
          }}
        >
          View Trial Balance
        </button>

        <button onClick={async () => {
          try {
            const res = await fetch("http://127.0.0.1:3000/api/reports/pl");
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const json = await res.json();
            alert("P&L\n" + json.rows.map((r: any) => `${r.line}: ${r.value}`).join("\n") + `\nTotal: ${json.total}`);
          } catch (error) {
            alert(`P&L Error: ${error.message}`);
            console.error("P&L fetch error:", error);
          }
        }}>View P&L</button>

        <button style={{ marginLeft: 8 }} onClick={async () => {
          try {
            const res = await fetch("http://127.0.0.1:3000/api/reports/bs");
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const json = await res.json();
            alert("Balance Sheet\n" + json.rows.map((r: any) => `${r.line}: ${r.value}`).join("\n") + `\nEquation OK: ${json.equationOK}`);
          } catch (error) {
            alert(`Balance Sheet Error: ${error.message}`);
            console.error("Balance Sheet fetch error:", error);
          }
        }}>View Balance Sheet</button>

        {tb && (
          <div style={{ marginTop: 12 }}>
            <h2>Trial Balance — {tb.company_id} ({tb.currency})</h2>
            <table cellPadding={6} style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #eee" }}>Account</th>
                  <th style={{ border: "1px solid #eee" }}>Debit</th>
                  <th style={{ border: "1px solid #eee" }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {tb.rows.map((r: any) => (
                  <tr key={r.account_code}>
                    <td style={{ border: "1px solid #eee" }}>{r.account_code}</td>
                    <td style={{ border: "1px solid #eee" }}>{r.debit}</td>
                    <td style={{ border: "1px solid #eee" }}>{r.credit}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ borderTop: "2px solid #000" }}><b>Total</b></td>
                  <td style={{ borderTop: "2px solid #000" }}><b>{tb.control.debit}</b></td>
                  <td style={{ borderTop: "2px solid #000" }}><b>{tb.control.credit}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}