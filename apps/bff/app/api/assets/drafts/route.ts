// M16.3: UI Drafts API Route
// Handles UI draft caching for dry-run operations

import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import {
  UiDraftCreate,
  UiDraftCommitRequest,
  UiDraftCommitResponse,
} from '@aibos/contracts';
import {
  putDraft,
  getDraft,
  deleteDraft,
  listDrafts,
} from '../../../services/assets/uiDraft';
import { bulkPostAssets } from '../../../services/assets/bulkPost';
import { withRouteErrors } from '@/api/_kit';

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = UiDraftCreate.parse(await req.json());

    const draftId = await putDraft(
      auth.company_id,
      input.kind,
      input.year,
      input.month,
      input.payload,
      input.ttl_seconds
    );

    return ok({ draft_id: draftId });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to create draft: ${error.message}`);
    }
    return badRequest('Failed to create draft');
  }
});
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get('kind') as 'depr' | 'amort' | null;
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (kind && year && month) {
      // Get specific draft
      const draft = await getDraft(
        auth.company_id,
        kind,
        Number(year),
        Number(month)
      );
      if (!draft) {
        return ok(null);
      }
      return ok(draft);
    } else {
      // List all drafts
      const drafts = await listDrafts(auth.company_id);
      return ok({ drafts });
    }
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to get drafts: ${error.message}`);
    }
    return badRequest('Failed to get drafts');
  }
});
export const DELETE = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get('kind') as 'depr' | 'amort';
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!kind || !year || !month) {
      return badRequest('Missing required parameters: kind, year, month');
    }

    const deleted = await deleteDraft(
      auth.company_id,
      kind,
      Number(year),
      Number(month)
    );
    return ok({ deleted });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to delete draft: ${error.message}`);
    }
    return badRequest('Failed to delete draft');
  }
});
