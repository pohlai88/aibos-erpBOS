import type { paths } from './types.gen';

export async function createSalesInvoice(
  body: NonNullable<
    paths['/sales-invoices']['post']['requestBody']
  >['content']['application/json'],
  base = '/api'
) {
  const res = await fetch(`${base}/sales-invoices`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<
    paths['/sales-invoices']['post']['responses']['201']['content']['application/json']
  >;
}
