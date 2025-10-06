// @api:nonstandard (health check)
/* eslint-disable no-restricted-syntax */

import { pool } from '../../lib/db';

export async function GET() {
  try {
    await pool.query('select 1');
    return new Response('ready', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  } catch (e) {
    return new Response('db-fail', {
      status: 503,
      headers: { 'content-type': 'text/plain' },
    });
  }
}
