import { pgTable, text, integer, numeric, timestamp, date, primaryKey, boolean, jsonb, bigint } from "drizzle-orm/pg-core";

// --- M26.4: Evidence Vault & eBinder Schema ---

// Evidence Manifest Table (immutable evidence bundles)
export const ctrlEvidenceManifest = pgTable("ctrl_evidence_manifest", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    controlId: text("control_id").notNull(),
    runId: text("run_id"),
    taskId: text("task_id"),
    bundleName: text("bundle_name").notNull(),
    bundleType: text("bundle_type").notNull(), // CONTROL, CLOSE_RUN, TASK, CUSTOM
    manifestHash: text("manifest_hash").notNull(), // SHA256 of manifest content
    contentHash: text("content_hash").notNull(), // SHA256 of all evidence content
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    evidenceCount: integer("evidence_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    sealedAt: timestamp("sealed_at", { withTimezone: true }).notNull().defaultNow(), // Immutable timestamp
    status: text("status").notNull().default("ACTIVE"), // ACTIVE, ARCHIVED, REDACTED
});

// Evidence Items Table (individual evidence pieces)
export const ctrlEvidenceItem = pgTable("ctrl_evidence_item", {
    id: text("id").primaryKey(),
    manifestId: text("manifest_id").notNull(),
    itemName: text("item_name").notNull(),
    itemType: text("item_type").notNull(), // DOCUMENT, SCREENSHOT, EXPORT, CALCULATION, ATTESTATION, EMAIL, SYSTEM_LOG
    filePath: text("file_path"), // Path to stored file (if applicable)
    contentHash: text("content_hash").notNull(), // SHA256 of item content
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    mimeType: text("mime_type"),
    metadata: jsonb("metadata").notNull().default({}),
    redacted: boolean("redacted").notNull().default(false),
    redactionReason: text("redaction_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

// eBinder Collections Table (monthly/quarterly binders)
export const closeEbinder = pgTable("close_ebinder", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    runId: text("run_id"),
    binderName: text("binder_name").notNull(),
    binderType: text("binder_type").notNull(), // MONTHLY, QUARTERLY, ANNUAL, CUSTOM
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    manifestIds: text("manifest_ids").array().notNull().default([]), // Array of evidence manifest IDs
    totalManifests: integer("total_manifests").notNull().default(0),
    totalEvidenceItems: integer("total_evidence_items").notNull().default(0),
    totalSizeBytes: bigint("total_size_bytes", { mode: "number" }).notNull().default(0),
    binderHash: text("binder_hash").notNull(), // SHA256 of complete binder
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    generatedBy: text("generated_by").notNull(),
    downloadCount: integer("download_count").notNull().default(0),
    lastDownloadedAt: timestamp("last_downloaded_at", { withTimezone: true }),
    status: text("status").notNull().default("GENERATED"), // GENERATING, GENERATED, ARCHIVED
});

// Evidence Attestation Table (digital signatures)
export const ctrlEvidenceAttestation = pgTable("ctrl_evidence_attestation", {
    id: text("id").primaryKey(),
    manifestId: text("manifest_id").notNull(),
    attestorName: text("attestor_name").notNull(),
    attestorRole: text("attestor_role").notNull(), // CONTROLLER, MANAGER, AUDITOR, CFO
    attestationType: text("attestation_type").notNull(), // REVIEW, APPROVAL, VERIFICATION, CERTIFICATION
    digitalSignature: text("digital_signature").notNull(), // Digital signature hash
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});
