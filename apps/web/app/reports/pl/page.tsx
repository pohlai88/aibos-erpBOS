"use client";
import { useEffect, useState } from "react";

type ProfitLossRow = {
    line: string;
    value: string;
};

export default function PL() {
    const [rows, setRows] = useState<ProfitLossRow[]>([]);
    const [total, setTotal] = useState<string>("0.00");
    useEffect(() => {
        (async () => {
            const r = await fetch("/api/reports/pl");
            const j = await r.json();
            setRows(j.rows); setTotal(j.total);
        })();
    }, []);
    return (
        <main style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
            <h1>P&amp;L</h1>
            <table cellPadding={6} style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
                <tbody>
                    {rows.map((r: ProfitLossRow) => (
                        <tr key={r.line}>
                            <td style={{ border: "1px solid #eee", minWidth: 240 }}>{r.line}</td>
                            <td style={{ border: "1px solid #eee", textAlign: "right" }}>{r.value}</td>
                        </tr>
                    ))}
                    <tr>
                        <td style={{ borderTop: "2px solid #000" }}><b>Total</b></td>
                        <td style={{ borderTop: "2px solid #000", textAlign: "right" }}><b>{total}</b></td>
                    </tr>
                </tbody>
            </table>
        </main>
    );
}
