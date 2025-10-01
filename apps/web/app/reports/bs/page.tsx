"use client";
import { useEffect, useState } from "react";

export default function BS() {
    const [rows, setRows] = useState<any[]>([]);
    const [ok, setOk] = useState<boolean>(true);
    useEffect(() => {
        (async () => {
            const r = await fetch("/api/reports/bs");
            const j = await r.json();
            setRows(j.rows); setOk(j.equationOK);
        })();
    }, []);
    return (
        <main style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
            <h1>Balance Sheet {ok ? "✅" : "⚠️"}</h1>
            <table cellPadding={6} style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
                <tbody>
                    {rows.map((r: any) => (
                        <tr key={r.line}>
                            <td style={{ border: "1px solid #eee", minWidth: 240 }}>{r.line}</td>
                            <td style={{ border: "1px solid #eee", textAlign: "right" }}>{r.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}
