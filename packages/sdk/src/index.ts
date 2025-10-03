export class AibosClient {
    constructor(private base = "http://localhost:3000/api", private apiKey: string) { }
    private h(extra?: Record<string, string>) { return { "X-API-Key": this.apiKey, ...(extra ?? {}) }; }
    async get(path: string) {
        const r = await fetch(`${this.base}${path}`, { headers: this.h() });
        if (r.status === 429) throw new Error(`Rate limited. Retry-After: ${r.headers.get("Retry-After")}`);
        if (!r.ok) throw new Error(await r.text());
        return r.json();
    }
    async post(path: string, body: unknown) {
        const r = await fetch(`${this.base}${path}`, { method: "POST", headers: this.h({ "content-type": "application/json" }), body: JSON.stringify(body) });
        if (r.status === 429) throw new Error(`Rate limited. Retry-After: ${r.headers.get("Retry-After")}`);
        if (!r.ok) throw new Error(await r.text());
        return r.json();
    }
}
