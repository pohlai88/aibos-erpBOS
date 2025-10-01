import fetch from "node-fetch";
import crypto from "node:crypto";
import { pool } from "./db";

// backoff schedule (minutes)
const BACKOFF = [1, 5, 15, 60, 180]; // then dead

function extractCompanyId(payloadText: string): string | null {
    try {
        const p = JSON.parse(payloadText);
        // common shapes to try
        return (
            p.company_id ||
            p.companyId ||
            p.journal?.company_id ||
            p.journal?.companyId ||
            p.event?.company_id ||
            p.event?.companyId ||
            null
        );
    } catch { return null; }
}

function hmacSign(secret: string, ts: string, body: string) {
    const msg = `${ts}.${body}`;
    const mac = crypto.createHmac("sha256", secret).update(msg, "utf8").digest("hex");
    return mac;
}

function deliveryHeaders(
    webhookId: string,
    deliveryId: string,
    secret: string,
    topic: string,
    payload: unknown
) {
    const ts = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(payload);
    const sig = hmacSign(secret, ts, body);
    return {
        "Content-Type": "application/json",
        "X-Webhook-Id": webhookId,
        "X-Webhook-Delivery-Id": deliveryId,
        "X-Webhook-Timestamp": ts,
        "X-Webhook-Signature": sig,
        "X-Webhook-Topic": topic,
    } as Record<string, string>;
}

async function fanoutNewOutboxRows() {
    // Pull recent outbox to enqueue attempts for enabled hooks
    // We only enqueue for events not yet enqueued to any hook for the same company/topic pair.
    // For simplicity, do last N items.
    const out = await pool.query(
        `select id, topic, payload::text as payload
       from outbox
      where created_at >= now() - interval '10 minutes'
      order by created_at desc limit 50`
    );

    for (const ev of out.rows) {
        const companyId = extractCompanyId(ev.payload);
        if (!companyId) continue; // skip if we cannot scope

        const hooks = await pool.query(
            `select id, url, secret, topics
         from webhook
        where company_id=$1 and enabled=true`,
            [companyId]
        );

        const targets = hooks.rows.filter((h: any) => Array.isArray(h.topics) && h.topics.includes(ev.topic));
        for (const h of targets) {
            const exist = await pool.query(
                `select 1 from webhook_attempt where webhook_id=$1 and event_id=$2 limit 1`,
                [h.id, ev.id]
            );
            if (exist.rows.length) continue;

            await pool.query(
                `insert into webhook_attempt(id, webhook_id, event_id, topic, payload, status)
         values ($1, $2, $3, $4, $5::jsonb, 'pending')`,
                [crypto.randomUUID(), h.id, ev.id, ev.topic, ev.payload]
            );
        }
    }
}

async function deliverPending() {
    const due = await pool.query(
        `select a.id, a.webhook_id, a.event_id, a.topic, a.payload::text as payload
          , a.try_count, h.url, h.secret
       from webhook_attempt a
       join webhook h on h.id = a.webhook_id
      where a.status in ('pending','failed') and a.next_try_at <= now() and h.enabled=true
      order by a.created_at asc
      limit 10`
    );
    for (const row of due.rows) {
        const body = row.payload;
        const headers = deliveryHeaders(row.webhook_id, row.id, row.secret, row.topic, JSON.parse(body));
        const t0 = Date.now();
        let status = 0, ok = false, errText = "";
        try {
            const res = await fetch(row.url, { method: "POST", headers, body });
            status = res.status;
            ok = res.ok;
            if (!ok) errText = await res.text().catch(() => "");
        } catch (e: any) {
            status = 0; ok = false; errText = String(e?.message || e);
        }
        const ms = Date.now() - t0;

        if (ok) {
            await pool.query(
                `update webhook_attempt set status='success', response_status=$1, response_ms=$2, updated_at=now() where id=$3`,
                [status, ms, row.id]
            );
        } else {
            const nextTry = row.try_count < BACKOFF.length
                ? `now() + interval '${BACKOFF[row.try_count]} minutes'`
                : null;

            if (nextTry) {
                await pool.query(
                    `update webhook_attempt set status='failed', try_count=try_count+1, next_try_at=${nextTry}, last_error=$1, response_status=$2, response_ms=$3, updated_at=now() where id=$4`,
                    [errText, status, ms, row.id]
                );
            } else {
                await pool.query(
                    `update webhook_attempt set status='dead', try_count=try_count+1, last_error=$1, response_status=$2, response_ms=$3, updated_at=now() where id=$4`,
                    [errText, status, ms, row.id]
                );
            }
        }
    }
}

export async function processWebhooksOnce() {
    try {
        await fanoutNewOutboxRows();
    } catch (e) {
        console.error("[WEBHOOK] fanout error:", e);
    }

    try {
        await deliverPending();
    } catch (e) {
        console.error("[WEBHOOK] delivery error:", e);
    }
}
