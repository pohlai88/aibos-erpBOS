"use client";
import { useState } from "react";
import { createSalesInvoice } from "@aibos/api-client/src/client";

export default function Home() {
  const [out, setOut] = useState("(no response)");
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
      <h1>AIBOS — Hello Ledger</h1>
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
            totals: { total: { amount: "100.00", currency: "MYR" }, tax_total: { amount: "6.00", currency: "MYR" }, grand_total: { amount: "106.00", currency: "MYR" } }
          } as any; // types come from generated client; this is demo
          const res = await createSalesInvoice(body, "http://localhost:3000/api");
          setOut(JSON.stringify(res));
        }}
      >
        Post Sales Invoice
      </button>
      <pre>{out}</pre>
    </main>
  );
}