"use client";
import { useEffect, useMemo, useState } from "react";

function useApiKey() {
    const [k, setK] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("apiKey") || "";
        }
        return "";
    });
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("apiKey", k);
        }
    }, [k]);
    return { apiKey: k, setApiKey: setK };
}

type Journal = {
    id: string; posting_date: string; source_doctype: string; source_id: string;
    currency: string; debit: string; credit: string;
};

export default function Audit() {
    const { apiKey, setApiKey } = useApiKey();
    const [tab, setTab] = useState<"journals" | "events">("journals");

    // Filters
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [account, setAccount] = useState<string>("");
    const [party, setParty] = useState<string>("");
    const [source, setSource] = useState<string>("");
    const [min, setMin] = useState<string>("");
    const [max, setMax] = useState<string>("");

    // Data
    const [rows, setRows] = useState<any[]>([]);
    const [next, setNext] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [lines, setLines] = useState<any[] | null>(null);
    const [sel, setSel] = useState<Journal | null>(null);

    const q = useMemo(() => {
        const u = new URLSearchParams();
        if (from) u.set("from", from);
        if (to) u.set("to", to);
        if (account) u.set("account", account);
        if (party) u.set("party_id", party);
        if (source) u.set("source", source);
        if (min) u.set("min", min);
        if (max) u.set("max", max);
        return u.toString();
    }, [from, to, account, party, source, min, max]);

    async function load(reset = false) {
        if (!apiKey) { alert("Set API Key first"); return; }
        setBusy(true);
        const base = tab === "journals" ? "journals" : "events";
        const qs = new URLSearchParams(q);
        if (!reset && next && tab === "journals") qs.set("cursor", next);
        if (!reset && next && tab === "events") qs.set("cursor", next);
        const res = await fetch(`http://localhost:3000/api/audit/${base}?` + qs.toString(), {
            headers: { "X-API-Key": apiKey }
        });
        const json = await res.json();
        setBusy(false);
        if (reset) setRows(json.items);
        else setRows(r => [...r, ...json.items]);
        setNext(json.next ?? null);
    }

    async function openLines(j: Journal) {
        setSel(j);
        setLines(null);
        const res = await fetch(`http://localhost:3000/api/audit/journals/${j.id}/lines`, {
            headers: { "X-API-Key": apiKey }
        });
        const json = await res.json();
        setLines(json.items);
    }

    useEffect(() => { setRows([]); setNext(null); if (apiKey) load(true); }, [tab, q]);

    return (
        <main style={{ padding: 20, fontFamily: "ui-sans-serif" }}>
            <h1>Audit Explorer</h1>

            <div style={{ marginBottom: 8 }}>
                <label style={{ marginRight: 6 }}>API Key:</label>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: 420 }} placeholder="ak_xxx:secret" />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => setTab("journals")} disabled={tab === "journals"}>Journals</button>
                <button onClick={() => setTab("events")} disabled={tab === "events"}>Events</button>
            </div>

            {tab === "journals" && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 10 }}>
                        <input placeholder="from ISO" value={from} onChange={e => setFrom(e.target.value)} />
                        <input placeholder="to ISO" value={to} onChange={e => setTo(e.target.value)} />
                        <input placeholder="account (e.g. Sales)" value={account} onChange={e => setAccount(e.target.value)} />
                        <input placeholder="party_id" value={party} onChange={e => setParty(e.target.value)} />
                        <input placeholder="source (doctype)" value={source} onChange={e => setSource(e.target.value)} />
                        <input placeholder="min total" value={min} onChange={e => setMin(e.target.value)} />
                        <input placeholder="max total" value={max} onChange={e => setMax(e.target.value)} />
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button onClick={() => { setRows([]); setNext(null); load(true); }} disabled={busy}>Search</button>
                        <button onClick={() => load(false)} disabled={busy || !next}>Load more</button>
                    </div>

                    <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%", border: "1px solid #eee" }}>
                        <thead>
                            <tr>
                                <th align="left">Date</th>
                                <th align="left">Journal ID</th>
                                <th align="left">Source</th>
                                <th align="right">Debit</th>
                                <th align="right">Credit</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r: any) => (
                                <tr key={r.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                                    <td>{new Date(r.posting_date).toLocaleString()}</td>
                                    <td>{r.id}</td>
                                    <td>{r.source_doctype} / {r.source_id}</td>
                                    <td align="right">{Number(r.debit).toFixed(2)}</td>
                                    <td align="right">{Number(r.credit).toFixed(2)}</td>
                                    <td><button onClick={() => openLines(r)}>Lines</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {sel && (
                        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
                            <b>Journal {sel.id} Lines</b>
                            {!lines && <div>Loading…</div>}
                            {lines && (
                                <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%", border: "1px solid #eee", marginTop: 8 }}>
                                    <thead>
                                        <tr>
                                            <th align="left">Account</th>
                                            <th align="left">DC</th>
                                            <th align="right">Amount</th>
                                            <th align="left">Party</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((l: any, i: number) => (
                                            <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                                                <td>{l.account_code}</td>
                                                <td>{l.dc}</td>
                                                <td align="right">{Number(l.amount).toFixed(2)} {l.currency}</td>
                                                <td>{l.party_type ?? "-"} {l.party_id ?? ""}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {tab === "events" && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                        <input placeholder="topic (e.g. JournalPosted)" id="topic" />
                        <input placeholder="from ISO" id="efrom" />
                        <input placeholder="to ISO" id="eto" />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button onClick={() => {
                            const topic = (document.getElementById("topic") as HTMLInputElement).value;
                            const from = (document.getElementById("efrom") as HTMLInputElement).value;
                            const to = (document.getElementById("eto") as HTMLInputElement).value;
                            setRows([]); setNext(null); setBusy(true);
                            const qs = new URLSearchParams();
                            if (topic) qs.set("topic", topic);
                            if (from) qs.set("from", from);
                            if (to) qs.set("to", to);
                            fetch(`http://localhost:3000/api/audit/events?` + qs.toString(), { headers: { "X-API-Key": apiKey } }).then(r => r.json()).then(j => { setRows(j.items); setNext(j.next ?? null); setBusy(false); });
                        }} disabled={busy}>Search</button>
                        <button onClick={() => load(false)} disabled={busy || !next}>Load more</button>
                    </div>
                    <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%", border: "1px solid #eee" }}>
                        <thead>
                            <tr>
                                <th align="left">Time</th>
                                <th align="left">Topic</th>
                                <th align="left">Payload</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r: any) => (
                                <tr key={r.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                                    <td>{new Date(r.created_at).toLocaleString()}</td>
                                    <td>{r.topic}</td>
                                    <td><pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{typeof r.payload === "string" ? r.payload : JSON.stringify(r.payload, null, 2)}</pre></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    );
}
