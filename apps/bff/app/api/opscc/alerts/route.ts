import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AlertsService } from '@/services/opscc';
import {
  AlertRuleUpsert,
  AlertStatusSchema,
  BoardTypeSchema,
} from '@aibos/contracts';
import { z } from 'zod';
import { ok } from '@/api/_kit';

// GET /api/opscc/alerts - Get alert rules and events
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:view');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'rules';
  const board = searchParams.get('board');
  const status = searchParams.get('status');

  const service = new AlertsService();

  if (type === 'rules') {
    if (board) {
      const boardType = BoardTypeSchema.parse(board);
      const rules = await service.getAlertRulesByBoard(
        authCtx.company_id,
        boardType
      );
      return ok({ rules });
    } else {
      const rules = await service.getAlertRules(authCtx.company_id);
      return ok({ rules });
    }
  } else if (type === 'events') {
    if (status) {
      const statusType = AlertStatusSchema.parse(status);
      const events = await service.getAlertEventsByStatus(
        authCtx.company_id,
        statusType
      );
      return ok({ events });
    } else {
      const events = await service.getActiveAlerts(authCtx.company_id);
      return ok({ events });
    }
  }

  return ok({ error: 'Invalid type parameter' }, 400);
});

// POST /api/opscc/alerts - Create or update alert rule
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = AlertRuleUpsert.parse(body);

  const service = new AlertsService();
  const rule = await service.upsertAlertRule(authCtx.company_id, validatedData);

  return ok({ rule });
});

// PATCH /api/opscc/alerts - Update alert event status
export const PATCH = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:view');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const eventId = z.string().uuid().parse(searchParams.get('event_id'));
  const action = z
    .enum(['acknowledge', 'resolve'])
    .parse(searchParams.get('action'));

  const service = new AlertsService();

  if (action === 'acknowledge') {
    await service.acknowledgeAlert(authCtx.company_id, eventId);
  } else if (action === 'resolve') {
    await service.resolveAlert(authCtx.company_id, eventId);
  }

  return ok({ success: true });
});

// DELETE /api/opscc/alerts - Delete alert rule
export const DELETE = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:admin');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const ruleId = z.string().parse(searchParams.get('rule_id'));

  const service = new AlertsService();
  await service.deleteAlertRule(authCtx.company_id, ruleId);

  return ok({ success: true });
});
