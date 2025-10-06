import crypto from 'node:crypto';

export function hmacSign(secret: string, ts: string, body: string) {
  const msg = `${ts}.${body}`;
  const mac = crypto
    .createHmac('sha256', secret)
    .update(msg, 'utf8')
    .digest('hex');
  return mac;
}

export function deliveryHeaders(
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
    'Content-Type': 'application/json',
    'X-Webhook-Id': webhookId,
    'X-Webhook-Delivery-Id': deliveryId,
    'X-Webhook-Timestamp': ts,
    'X-Webhook-Signature': sig,
    'X-Webhook-Topic': topic,
  } as Record<string, string>;
}
