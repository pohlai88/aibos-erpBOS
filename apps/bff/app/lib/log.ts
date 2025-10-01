export function logLine(fields: Record<string, unknown>) {
    try {
        const base = {
            ts: new Date().toISOString(),
            app: "bff",
            ...fields,
        };
        // Avoid throwing if circular
        console.log(JSON.stringify(base));
    } catch {
        console.log(JSON.stringify({ ts: new Date().toISOString(), app: "bff", msg: "log-failed" }));
    }
}
