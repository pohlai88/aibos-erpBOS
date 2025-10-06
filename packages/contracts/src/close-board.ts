import { z } from 'zod';

// Enums
export const CloseItemKindSchema = z.enum([
  'TASK',
  'AUTO_CTRL',
  'SOX_TEST',
  'DEFICIENCY',
  'FLUX',
  'CERT',
]);
export const CloseItemStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
  'DEFERRED',
]);
export const CloseItemSeveritySchema = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'CRITICAL',
]);
export const CloseItemSlaStateSchema = z.enum([
  'OK',
  'DUE_SOON',
  'LATE',
  'ESCALATED',
]);
export const CloseItemActionSchema = z.enum([
  'ACK',
  'REASSIGN',
  'DEFER',
  'COMPLETE',
  'REOPEN',
]);
export const CloseProcessSchema = z.enum([
  'R2R',
  'P2P',
  'O2C',
  'Treasury',
  'Tax',
]);

// SLA Policy Schemas
export const SlaPolicyUpsertSchema = z.object({
  code: z.string().min(1),
  tz: z.string().default('UTC'),
  cutoffDay: z.number().int().min(1).max(10).default(5),
  graceHours: z.number().int().min(0).max(168).default(24),
  escal1Hours: z.number().int().min(0).max(168).default(24),
  escal2Hours: z.number().int().min(0).max(168).default(48),
  escalToLvl1: z.string().uuid().optional(),
  escalToLvl2: z.string().uuid().optional(),
});

export const SlaPolicyResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  code: z.string(),
  tz: z.string(),
  cutoffDay: z.number().int(),
  graceHours: z.number().int(),
  escal1Hours: z.number().int(),
  escal2Hours: z.number().int(),
  escalToLvl1: z.string().uuid().nullable(),
  escalToLvl2: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Close Item Schemas
export const CloseItemUpsertSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  kind: CloseItemKindSchema,
  refId: z.string().min(1),
  title: z.string().min(1),
  process: CloseProcessSchema,
  ownerId: z.string().uuid().optional(),
  dueAt: z.string().datetime(),
  status: CloseItemStatusSchema.default('OPEN'),
  severity: CloseItemSeveritySchema.default('NORMAL'),
});

export const CloseItemResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  period: z.string(),
  kind: CloseItemKindSchema,
  refId: z.string(),
  title: z.string(),
  process: CloseProcessSchema,
  ownerId: z.string().uuid().nullable(),
  dueAt: z.string().datetime(),
  status: CloseItemStatusSchema,
  severity: CloseItemSeveritySchema,
  agingDays: z.number().int(),
  slaState: CloseItemSlaStateSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Query Schemas
export const CloseItemQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  process: z.array(CloseProcessSchema).optional(),
  status: z.array(CloseItemStatusSchema).optional(),
  ownerId: z.string().uuid().optional(),
  slaState: z.array(CloseItemSlaStateSchema).optional(),
  kind: z.array(CloseItemKindSchema).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

// Comment Schemas
export const CloseCommentCreateSchema = z.object({
  itemId: z.string().uuid(),
  body: z.string().min(1),
  mentions: z.array(z.string().uuid()).default([]),
});

export const CloseCommentResponseSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  authorId: z.string().uuid(),
  body: z.string(),
  mentions: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
});

// Action Schemas
export const CloseBulkActionSchema = z.object({
  action: CloseItemActionSchema,
  itemIds: z.array(z.string().uuid()).min(1),
  payload: z.record(z.any()).optional(),
});

export const CloseActionResponseSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  action: CloseItemActionSchema,
  payload: z.record(z.any()).nullable(),
  actorId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

// Evidence Link Schema
export const CloseEvdLinkCreateSchema = z.object({
  itemId: z.string().uuid(),
  evdRecordId: z.string().uuid(),
});

export const CloseEvdLinkResponseSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  evdRecordId: z.string().uuid(),
});

// Heat Map Schema
export const HeatMapRowSchema = z.object({
  process: CloseProcessSchema,
  late: z.number().int(),
  escal: z.number().int(),
  openCnt: z.number().int(),
  total: z.number().int(),
});

export const HeatMapResponseSchema = z.array(HeatMapRowSchema);

// Board Item Schema (normalized response)
export const BoardItemSchema = z.object({
  id: z.string().uuid(),
  period: z.string(),
  kind: CloseItemKindSchema,
  title: z.string(),
  process: CloseProcessSchema,
  ownerId: z.string().uuid().nullable(),
  dueAt: z.string().datetime(),
  status: CloseItemStatusSchema,
  slaState: CloseItemSlaStateSchema,
  agingDays: z.number().int(),
  severity: CloseItemSeveritySchema,
});

export const BoardResponseSchema = z.object({
  items: z.array(BoardItemSchema),
  total: z.number().int(),
  hasMore: z.boolean(),
});

// Summary Pack Schema
export const CloseSummaryRequestSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  includePdf: z.boolean().default(false),
});

export const CloseSummaryPackSchema = z.object({
  period: z.string(),
  generatedAt: z.string().datetime(),
  heatMap: HeatMapResponseSchema,
  topRisks: z.array(BoardItemSchema),
  slaBreaches: z.number().int(),
  totalItems: z.number().int(),
  completionRate: z.number().min(0).max(100),
});

// Ingest Schema
export const CloseIngestRequestSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  sources: z
    .array(
      z.enum(['controls', 'sox', 'deficiencies', 'flux', 'certs', 'tasks'])
    )
    .optional(),
});

export const CloseIngestResponseSchema = z.object({
  period: z.string(),
  ingested: z.number().int(),
  skipped: z.number().int(),
  errors: z.array(z.string()),
});

// Type exports
export type CloseItemKindType = z.infer<typeof CloseItemKindSchema>;
export type CloseItemStatusType = z.infer<typeof CloseItemStatusSchema>;
export type CloseItemSeverityType = z.infer<typeof CloseItemSeveritySchema>;
export type CloseItemSlaStateType = z.infer<typeof CloseItemSlaStateSchema>;
export type CloseItemActionType = z.infer<typeof CloseItemActionSchema>;
export type CloseProcessType = z.infer<typeof CloseProcessSchema>;

export type SlaPolicyUpsertType = z.infer<typeof SlaPolicyUpsertSchema>;
export type SlaPolicyResponseType = z.infer<typeof SlaPolicyResponseSchema>;

export type CloseItemUpsertType = z.infer<typeof CloseItemUpsertSchema>;
export type CloseItemResponseType = z.infer<typeof CloseItemResponseSchema>;
export type CloseItemQueryType = z.infer<typeof CloseItemQuerySchema>;

export type CloseCommentCreateType = z.infer<typeof CloseCommentCreateSchema>;
export type CloseCommentResponseType = z.infer<
  typeof CloseCommentResponseSchema
>;

export type CloseBulkActionType = z.infer<typeof CloseBulkActionSchema>;
export type CloseActionResponseType = z.infer<typeof CloseActionResponseSchema>;

export type CloseEvdLinkCreateType = z.infer<typeof CloseEvdLinkCreateSchema>;
export type CloseEvdLinkResponseType = z.infer<
  typeof CloseEvdLinkResponseSchema
>;

export type HeatMapRowType = z.infer<typeof HeatMapRowSchema>;
export type HeatMapResponseType = z.infer<typeof HeatMapResponseSchema>;

export type BoardItemType = z.infer<typeof BoardItemSchema>;
export type BoardResponseType = z.infer<typeof BoardResponseSchema>;

export type CloseSummaryRequestType = z.infer<typeof CloseSummaryRequestSchema>;
export type CloseSummaryPackType = z.infer<typeof CloseSummaryPackSchema>;

export type CloseIngestRequestType = z.infer<typeof CloseIngestRequestSchema>;
export type CloseIngestResponseType = z.infer<typeof CloseIngestResponseSchema>;
