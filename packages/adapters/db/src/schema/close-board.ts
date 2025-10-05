import { pgTable, text, timestamp, integer, jsonb, pgEnum, uuid, smallint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const closeItemKindEnum = pgEnum("close_item_kind", [
    "TASK",
    "AUTO_CTRL",
    "SOX_TEST",
    "DEFICIENCY",
    "FLUX",
    "CERT"
]);

// Close SLA Policy Table
export const closeSlaPolicy = pgTable("close_sla_policy", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    code: text("code").notNull(),
    tz: text("tz").notNull().default("UTC"),
    cutoffDay: smallint("cutoff_day").notNull().default(5),
    graceHours: smallint("grace_hours").notNull().default(24),
    escal1Hours: smallint("escal1_hours").notNull().default(24),
    escal2Hours: smallint("escal2_hours").notNull().default(48),
    escalToLvl1: uuid("escal_to_lvl1"),
    escalToLvl2: uuid("escal_to_lvl2"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Close Item Table
export const closeItem = pgTable("close_item", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    period: text("period").notNull(), // YYYY-MM
    kind: closeItemKindEnum("kind").notNull(),
    refId: text("ref_id").notNull(), // foreign id string
    title: text("title").notNull(),
    process: text("process").notNull(), // R2R|P2P|O2C|Treasury|Tax
    ownerId: uuid("owner_id"), // nullable for pool
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("OPEN"), // OPEN|IN_PROGRESS|BLOCKED|DONE|DEFERRED
    severity: text("severity").notNull().default("NORMAL"), // LOW|NORMAL|HIGH|CRITICAL
    agingDays: integer("aging_days").notNull().default(0),
    slaState: text("sla_state").notNull().default("OK"), // OK|DUE_SOON|LATE|ESCALATED
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Close Item Comment Table
export const closeItemComment = pgTable("close_item_comment", {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id").notNull().references(() => closeItem.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").notNull(),
    body: text("body").notNull(),
    mentions: uuid("mentions").array().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Close Item Action Table
export const closeItemAction = pgTable("close_item_action", {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id").notNull().references(() => closeItem.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // ACK|REASSIGN|DEFER|COMPLETE|REOPEN
    payload: jsonb("payload"),
    actorId: uuid("actor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Close Item Evidence Link Table
export const closeItemEvdLink = pgTable("close_item_evd_link", {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id").notNull().references(() => closeItem.id, { onDelete: "cascade" }),
    evdRecordId: uuid("evd_record_id").notNull(),
});

// Relations
export const closeSlaPolicyRelations = relations(closeSlaPolicy, ({ one }) => ({
    company: one(company, {
        fields: [closeSlaPolicy.companyId],
        references: [company.id],
    }),
    escalToLvl1User: one(appUser, {
        fields: [closeSlaPolicy.escalToLvl1],
        references: [appUser.id],
    }),
    escalToLvl2User: one(appUser, {
        fields: [closeSlaPolicy.escalToLvl2],
        references: [appUser.id],
    }),
}));

export const closeItemRelations = relations(closeItem, ({ one, many }) => ({
    company: one(company, {
        fields: [closeItem.companyId],
        references: [company.id],
    }),
    owner: one(appUser, {
        fields: [closeItem.ownerId],
        references: [appUser.id],
    }),
    comments: many(closeItemComment),
    actions: many(closeItemAction),
    evidenceLinks: many(closeItemEvdLink),
}));

export const closeItemCommentRelations = relations(closeItemComment, ({ one }) => ({
    item: one(closeItem, {
        fields: [closeItemComment.itemId],
        references: [closeItem.id],
    }),
    author: one(appUser, {
        fields: [closeItemComment.authorId],
        references: [appUser.id],
    }),
}));

export const closeItemActionRelations = relations(closeItemAction, ({ one }) => ({
    item: one(closeItem, {
        fields: [closeItemAction.itemId],
        references: [closeItem.id],
    }),
    actor: one(appUser, {
        fields: [closeItemAction.actorId],
        references: [appUser.id],
    }),
}));

export const closeItemEvdLinkRelations = relations(closeItemEvdLink, ({ one }) => ({
    item: one(closeItem, {
        fields: [closeItemEvdLink.itemId],
        references: [closeItem.id],
    }),
}));

// Import required tables for relations
import { company, appUser } from "../schema.js";
