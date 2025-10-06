// M16.3: UI Drafts Contracts
// Zod schemas for UI draft caching operations

import { z } from 'zod';

export const UiDraftCreate = z.object({
  kind: z.enum(['depr', 'amort']),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  payload: z.record(z.any()), // JSONB payload
  ttl_seconds: z.number().int().min(60).max(3600).default(900), // 15 minutes default
});

export const UiDraftResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  kind: z.enum(['depr', 'amort']),
  year: z.number().int(),
  month: z.number().int(),
  payload: z.record(z.any()),
  expires_at: z.string(),
});

export const UiDraftCommitRequest = z.object({
  kind: z.enum(['depr', 'amort']),
  year: z.number().int(),
  month: z.number().int(),
  dry_run: z.boolean().default(false),
});

export const UiDraftCommitResponse = z.object({
  committed: z.boolean(),
  draft_id: z.string().optional(),
  posted_journals: z.number().int().optional(),
  warnings: z.array(z.string()),
});

export type UiDraftCreate = z.infer<typeof UiDraftCreate>;
export type UiDraftResponse = z.infer<typeof UiDraftResponse>;
export type UiDraftCommitRequest = z.infer<typeof UiDraftCommitRequest>;
export type UiDraftCommitResponse = z.infer<typeof UiDraftCommitResponse>;
