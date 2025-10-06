import { NextRequest, NextResponse } from 'next/server';
import { PlaybookStudioService } from '../../../services';
import { withRouteErrors, ok } from '@/api/_kit';

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const userId = request.headers.get('x-user-id');

    if (!companyId || !userId) {
      return ok({ error: 'Missing company or user context' }, 400);
    }

    const body = await request.json();
    const { playbook_id, version_no, payload = {} } = body;

    if (!playbook_id) {
      return ok({ error: 'playbook_id is required' }, 400);
    }

    const result = await playbookStudio.executeDryRun(
      companyId,
      userId,
      playbook_id,
      version_no,
      payload
    );

    return ok(result);
  } catch (error) {
    console.error('Error executing dry run:', error);
    return ok({ error: 'Failed to execute dry run' }, 500);
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const { searchParams } = new URL(request.url);

    if (!companyId) {
      return ok({ error: 'Missing company context' }, 400);
    }

    const playbookId = searchParams.get('playbook_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!playbookId) {
      return ok({ error: 'playbook_id is required' }, 400);
    }

    const result = await playbookStudio.getDryRunHistory(
      companyId,
      playbookId,
      {
        limit,
        offset,
      }
    );

    return ok(result);
  } catch (error) {
    console.error('Error getting dry run history:', error);
    return ok({ error: 'Failed to get dry run history' }, 500);
  }
});
