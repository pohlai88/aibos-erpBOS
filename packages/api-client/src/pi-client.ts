import type { paths } from "./types.gen";

export async function createPurchaseInvoice(
    body: NonNullable<paths["/purchase-invoices"]["post"]["requestBody"]>["content"]["application/json"],
    base = "/api"
) {
    const res = await fetch(`${base}/purchase-invoices`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
    });
    const replay = res.headers.get("X-Idempotent-Replay") === "true";
    const data = await res.json() as paths["/purchase-invoices"]["post"]["responses"]["201"]["content"]["application/json"];
    return { ...data, replay, status: res.status as 200 | 201 };
}
