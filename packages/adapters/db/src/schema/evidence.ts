import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  date,
  primaryKey,
  boolean,
  jsonb,
  bigint,
  uuid,
} from 'drizzle-orm/pg-core';

// --- M26.4: Evidence Vault & eBinder Schema ---

// Evidence Manifest Table (immutable evidence bundles)
export const ctrlEvidenceManifest = pgTable('ctrl_evidence_manifest', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  controlId: text('control_id').notNull(),
  runId: text('run_id'),
  taskId: text('task_id'),
  bundleName: text('bundle_name').notNull(),
  bundleType: text('bundle_type').notNull(), // CONTROL, CLOSE_RUN, TASK, CUSTOM
  manifestHash: text('manifest_hash').notNull(), // SHA256 of manifest content
  contentHash: text('content_hash').notNull(), // SHA256 of all evidence content
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull().default(0),
  evidenceCount: integer('evidence_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  sealedAt: timestamp('sealed_at', { withTimezone: true })
    .notNull()
    .defaultNow(), // Immutable timestamp
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, ARCHIVED, REDACTED
});

// Evidence Items Table (individual evidence pieces)
export const ctrlEvidenceItem = pgTable('ctrl_evidence_item', {
  id: text('id').primaryKey(),
  manifestId: text('manifest_id').notNull(),
  itemName: text('item_name').notNull(),
  itemType: text('item_type').notNull(), // DOCUMENT, SCREENSHOT, EXPORT, CALCULATION, ATTESTATION, EMAIL, SYSTEM_LOG
  filePath: text('file_path'), // Path to stored file (if applicable)
  contentHash: text('content_hash').notNull(), // SHA256 of item content
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull().default(0),
  mimeType: text('mime_type'),
  metadata: jsonb('metadata').notNull().default({}),
  redacted: boolean('redacted').notNull().default(false),
  redactionReason: text('redaction_reason'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// eBinder Collections Table (monthly/quarterly binders)
export const closeEbinder = pgTable('close_ebinder', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  runId: text('run_id'),
  binderName: text('binder_name').notNull(),
  binderType: text('binder_type').notNull(), // MONTHLY, QUARTERLY, ANNUAL, CUSTOM
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  manifestIds: text('manifest_ids').array().notNull().default([]), // Array of evidence manifest IDs
  totalManifests: integer('total_manifests').notNull().default(0),
  totalEvidenceItems: integer('total_evidence_items').notNull().default(0),
  totalSizeBytes: bigint('total_size_bytes', { mode: 'number' })
    .notNull()
    .default(0),
  binderHash: text('binder_hash').notNull(), // SHA256 of complete binder
  generatedAt: timestamp('generated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  generatedBy: text('generated_by').notNull(),
  downloadCount: integer('download_count').notNull().default(0),
  lastDownloadedAt: timestamp('last_downloaded_at', { withTimezone: true }),
  status: text('status').notNull().default('GENERATED'), // GENERATING, GENERATED, ARCHIVED
});

// Evidence Attestation Table (digital signatures)
export const ctrlEvidenceAttestation = pgTable('ctrl_evidence_attestation', {
  id: text('id').primaryKey(),
  manifestId: text('manifest_id').notNull(),
  attestorName: text('attestor_name').notNull(),
  attestorRole: text('attestor_role').notNull(), // CONTROLLER, MANAGER, AUDITOR, CFO
  attestationType: text('attestation_type').notNull(), // REVIEW, APPROVAL, VERIFICATION, CERTIFICATION
  digitalSignature: text('digital_signature').notNull(), // Digital signature hash
  signedAt: timestamp('signed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// --- Enhanced Evidence Vault Tables (M26.4 Enhanced) ---

// Evidence object store (content-addressed)
export const evdObject = pgTable('evd_object', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  sha256Hex: text('sha256_hex').notNull(), // content hash
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  mime: text('mime').notNull(),
  storageUri: text('storage_uri').notNull(), // e.g. s3://... or file://...
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Logical evidence records referencing the object
export const evdRecord = pgTable('evd_record', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  objectId: uuid('object_id')
    .notNull()
    .references(() => evdObject.id, { onDelete: 'restrict' }),
  source: text('source').notNull(), // CTRL|CLOSE|FLUX|JOURNAL|BANK|OTHER
  sourceId: text('source_id').notNull(), // foreign id for cross-linking
  title: text('title').notNull(),
  note: text('note'),
  tags: text('tags').array().default([]),
  piiLevel: text('pii_level').notNull().default('NONE'), // NONE|LOW|MEDIUM|HIGH
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Redaction rule catalog
export const evdRedactionRule = pgTable('evd_redaction_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  rule: jsonb('rule').notNull(), // jsonb of field patterns / regex / mime scopes
  enabled: boolean('enabled').notNull().default(true),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Link evidence to control runs / close runs (many-to-many)
export const evdLink = pgTable('evd_link', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  recordId: uuid('record_id')
    .notNull()
    .references(() => evdRecord.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // CTRL_RUN|CLOSE_RUN|EXCEPTION|TASK
  refId: text('ref_id').notNull(),
  addedBy: text('added_by').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});

// Frozen manifest for a control or close run
export const evdManifest = pgTable('evd_manifest', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  scopeKind: text('scope_kind').notNull(), // CTRL_RUN|CLOSE_RUN
  scopeId: text('scope_id').notNull(),
  filters: jsonb('filters').notNull(), // selection + redaction rules resolved
  objectCount: integer('object_count').notNull(),
  totalBytes: bigint('total_bytes', { mode: 'number' }).notNull(),
  sha256Hex: text('sha256_hex').notNull(), // checksum of manifest JSON payload
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const evdManifestLine = pgTable('evd_manifest_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  manifestId: uuid('manifest_id')
    .notNull()
    .references(() => evdManifest.id, { onDelete: 'cascade' }),
  recordId: uuid('record_id')
    .notNull()
    .references(() => evdRecord.id, { onDelete: 'restrict' }),
  objectSha256: text('object_sha256').notNull(),
  objectBytes: bigint('object_bytes', { mode: 'number' }).notNull(),
  title: text('title').notNull(),
  tags: text('tags').array().notNull().default([]),
});

// Built binder artifact (ZIP or PDF + ZIP)
export const evdBinder = pgTable('evd_binder', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  scopeKind: text('scope_kind').notNull(), // CTRL_RUN|CLOSE_RUN
  scopeId: text('scope_id').notNull(),
  manifestId: uuid('manifest_id')
    .notNull()
    .references(() => evdManifest.id, { onDelete: 'restrict' }),
  format: text('format').notNull(), // ZIP
  storageUri: text('storage_uri').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  sha256Hex: text('sha256_hex').notNull(),
  builtBy: text('built_by').notNull(),
  builtAt: timestamp('built_at', { withTimezone: true }).notNull().defaultNow(),
});

export const evdAttestation = pgTable('evd_attestation', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  binderId: uuid('binder_id')
    .notNull()
    .references(() => evdBinder.id, { onDelete: 'cascade' }),
  signerId: text('signer_id').notNull(),
  signerRole: text('signer_role').notNull(), // MANAGER|CONTROLLER|CFO|AUDITOR
  payload: jsonb('payload').notNull(), // statement + meta
  sha256Hex: text('sha256_hex').notNull(), // checksum of payload
  signedAt: timestamp('signed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
