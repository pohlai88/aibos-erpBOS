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