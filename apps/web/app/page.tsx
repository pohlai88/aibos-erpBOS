"use client";
import { useState } from "react";
import { createSalesInvoice } from "@aibos/api-client/src/client";

export default function Home() {
  const [out, setOut] = useState("(no response)");
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [journal, setJournal] = useState<any>(null);

  const postInvoice = async () => {
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
    setOut(JSON.stringify(res));
    
    // Fetch trial balance after posting
    const tbRes = await fetch("http://localhost:3000/api/reports/trial-balance?company_id=COMP-1&currency=MYR");
    const tb = await tbRes.json();
    setTrialBalance(tb);
    
    // Fetch journal details
    const journalRes = await fetch(`http://localhost:3000/api/journals/${res.journal_id}`);
    const journalData = await journalRes.json();
    setJournal(journalData);
  };

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
      <h1>AIBOS — Hello Ledger</h1>
      
      <button onClick={postInvoice} style={{ marginBottom: 20, padding: "8px 16px" }}>
        Post Sales Invoice
      </button>
      
      <div style={{ marginBottom: 20 }}>
        <h3>Response:</h3>
        <pre style={{ background: "#f5f5f5", padding: 10, borderRadius: 4 }}>{out}</pre>
      </div>
      
      {journal && (
        <div style={{ marginBottom: 20 }}>
          <h3>Journal Details:</h3>
          <pre style={{ background: "#f0f8ff", padding: 10, borderRadius: 4 }}>
            {JSON.stringify(journal, null, 2)}
          </pre>
        </div>
      )}
      
      {trialBalance && (
        <div>
          <h3>Trial Balance:</h3>
          <pre style={{ background: "#f0fff0", padding: 10, borderRadius: 4 }}>
            {JSON.stringify(trialBalance, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}