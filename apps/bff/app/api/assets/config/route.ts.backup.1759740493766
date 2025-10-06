// M16.3/M16.4: Assets Configuration API Route
// Handles assets configuration and preferences

import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { AssetsConfigUpsert, AssetsConfigResponse } from '@aibos/contracts';
import { pool } from '../../../lib/db';
import { withRouteErrors } from '@/api/_kit';

export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  try {
    const result = await pool.query(
      `SELECT * FROM assets_config WHERE company_id = $1`,
      [auth.company_id]
    );

    if (result.rows.length === 0) {
      // Return default configuration
      const defaultConfig: AssetsConfigResponse = {
        company_id: auth.company_id,
        proration_enabled: false,
        proration_basis: 'days_in_month',
        fx_presentation_policy: 'post_month',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return ok(defaultConfig);
    }

    const config = result.rows[0];
    const response: AssetsConfigResponse = {
      company_id: config.company_id,
      proration_enabled: config.proration_enabled,
      proration_basis: config.proration_basis,
      fx_presentation_policy: config.fx_presentation_policy,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };

    return ok(response);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to get configuration: ${error.message}`);
    }
    return badRequest('Failed to get configuration');
  }
});
export const PUT = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = AssetsConfigUpsert.parse(await req.json());

    await pool.query(
      `INSERT INTO assets_config (company_id, proration_enabled, proration_basis, fx_presentation_policy, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (company_id)
       DO UPDATE SET
         proration_enabled = EXCLUDED.proration_enabled,
         proration_basis = EXCLUDED.proration_basis,
         fx_presentation_policy = EXCLUDED.fx_presentation_policy,
         updated_at = NOW()`,
      [
        auth.company_id,
        input.proration_enabled,
        input.proration_basis,
        input.fx_presentation_policy,
      ]
    );

    // Return updated configuration
    const result = await pool.query(
      `SELECT * FROM assets_config WHERE company_id = $1`,
      [auth.company_id]
    );

    const config = result.rows[0];
    const response: AssetsConfigResponse = {
      company_id: config.company_id,
      proration_enabled: config.proration_enabled,
      proration_basis: config.proration_basis,
      fx_presentation_policy: config.fx_presentation_policy,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };

    return ok(response);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to update configuration: ${error.message}`);
    }
    return badRequest('Failed to update configuration');
  }
});
