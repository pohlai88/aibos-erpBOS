import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  jsonb,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// --- M26.9: ITGC & UAR Bridge Schema ---

// Enums
export const itSystemKindEnum = pgEnum('it_system_kind', [
  'ERP',
  'DB',
  'CLOUD',
  'BI',
  'APP',
]);

export const itConnectorEnum = pgEnum('it_connector', [
  'SCIM',
  'SAML',
  'OIDC',
  'SQL',
  'CSV',
  'API',
]);

export const itUserStatusEnum = pgEnum('it_user_status', [
  'ACTIVE',
  'DISABLED',
  'LOCKED',
  'TERMINATED',
]);

export const itEntitlementKindEnum = pgEnum('it_entitlement_kind', [
  'ROLE',
  'GROUP',
  'PRIV',
  'SCHEMA',
  'TABLE',
  'ACTION',
]);

export const itGrantSourceEnum = pgEnum('it_grant_source', [
  'HR',
  'JOINER',
  'TICKET',
  'EMERGENCY',
  'MANUAL',
]);

export const itSodSeverityEnum = pgEnum('it_sod_severity', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const itSodViolationStatusEnum = pgEnum('it_sod_violation_status', [
  'OPEN',
  'WAIVED',
  'RESOLVED',
]);

export const uarCampaignStatusEnum = pgEnum('uar_campaign_status', [
  'DRAFT',
  'OPEN',
  'ESCALATED',
  'CLOSED',
]);

export const uarItemStateEnum = pgEnum('uar_item_state', [
  'PENDING',
  'CERTIFIED',
  'REVOKE',
  'EXCEPTION',
]);

export const itSnapshotScopeEnum = pgEnum('it_snapshot_scope', [
  'USERS',
  'ROLES',
  'GRANTS',
  'SOD',
  'BREAKGLASS',
]);

// IT Systems registry
export const itSystem = pgTable(
  'it_system',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    kind: itSystemKindEnum('kind').notNull(),
    ownerUserId: text('owner_user_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyCodeIdx: index('idx_it_system_company_code').on(
      table.companyId,
      table.code
    ),
    companyActiveIdx: index('idx_it_system_company_active').on(
      table.companyId,
      table.isActive
    ),
  })
);

// Connector profiles for data ingestion
export const itConnectorProfile = pgTable(
  'it_connector_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    connector: itConnectorEnum('connector').notNull(),
    settings: jsonb('settings').notNull(),
    secretRef: uuid('secret_ref'),
    scheduleCron: text('schedule_cron'),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    systemIdx: index('idx_it_connector_profile_system').on(table.systemId),
    scheduleIdx: index('idx_it_connector_profile_schedule')
      .on(table.scheduleCron)
      .where(sql`${table.isEnabled} = true`),
  })
);

// IT Users from connected systems
export const itUser = pgTable(
  'it_user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    extId: text('ext_id').notNull(),
    email: text('email'),
    displayName: text('display_name'),
    status: itUserStatusEnum('status').notNull(),
    firstSeen: timestamp('first_seen', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeen: timestamp('last_seen', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companySystemExtIdx: index('idx_it_user_company_system_ext').on(
      table.companyId,
      table.systemId,
      table.extId
    ),
    companySystemIdx: index('idx_it_user_company_system').on(
      table.companyId,
      table.systemId
    ),
    statusIdx: index('idx_it_user_status')
      .on(table.status)
      .where(sql`${table.status} != 'ACTIVE'`),
    lastSeenIdx: index('idx_it_user_last_seen').on(table.lastSeen),
  })
);

// IT Roles/Groups from connected systems
export const itRole = pgTable(
  'it_role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    critical: boolean('critical').notNull().default(false),
  },
  table => ({
    companySystemCodeIdx: index('idx_it_role_company_system_code').on(
      table.companyId,
      table.systemId,
      table.code
    ),
    companySystemIdx: index('idx_it_role_company_system').on(
      table.companyId,
      table.systemId
    ),
    criticalIdx: index('idx_it_role_critical')
      .on(table.critical)
      .where(sql`${table.critical} = true`),
  })
);

// Entitlements (roles, groups, privileges, schemas, tables, actions)
export const itEntitlement = pgTable(
  'it_entitlement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    kind: itEntitlementKindEnum('kind').notNull(),
    code: text('code').notNull(),
    name: text('name'),
  },
  table => ({
    companySystemKindCodeIdx: index(
      'idx_it_entitlement_company_system_kind_code'
    ).on(table.companyId, table.systemId, table.kind, table.code),
    companySystemIdx: index('idx_it_entitlement_company_system').on(
      table.companyId,
      table.systemId
    ),
    kindIdx: index('idx_it_entitlement_kind').on(table.kind),
  })
);

// User grants (assignments of entitlements to users)
export const itGrant = pgTable(
  'it_grant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => itUser.id, { onDelete: 'cascade' }),
    entitlementId: uuid('entitlement_id')
      .notNull()
      .references(() => itEntitlement.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    source: itGrantSourceEnum('source').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companySystemUserEntitlementIdx: index(
      'idx_it_grant_company_system_user_entitlement'
    ).on(table.companyId, table.systemId, table.userId, table.entitlementId),
    companySystemIdx: index('idx_it_grant_company_system').on(
      table.companyId,
      table.systemId
    ),
    userIdx: index('idx_it_grant_user').on(table.userId),
    entitlementIdx: index('idx_it_grant_entitlement').on(table.entitlementId),
    expiresIdx: index('idx_it_grant_expires')
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
    sourceIdx: index('idx_it_grant_source').on(table.source),
  })
);

// Separation of Duties rules
export const itSodRule = pgTable(
  'it_sod_rule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    severity: itSodSeverityEnum('severity').notNull(),
    logic: jsonb('logic').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyCodeIdx: index('idx_it_sod_rule_company_code').on(
      table.companyId,
      table.code
    ),
    companyActiveIdx: index('idx_it_sod_rule_company_active').on(
      table.companyId,
      table.active
    ),
    severityIdx: index('idx_it_sod_rule_severity').on(table.severity),
  })
);

// SoD violations detected by the engine
export const itSodViolation = pgTable(
  'it_sod_violation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => itSodRule.id, { onDelete: 'cascade' }),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => itUser.id, { onDelete: 'cascade' }),
    detectedAt: timestamp('detected_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: itSodViolationStatusEnum('status').notNull().default('OPEN'),
    note: text('note'),
    explanation: jsonb('explanation'),
  },
  table => ({
    ruleUserDetectedIdx: index('idx_it_sod_violation_rule_user_detected').on(
      table.ruleId,
      table.userId,
      table.detectedAt
    ),
    companyStatusIdx: index('idx_it_sod_violation_company_status').on(
      table.companyId,
      table.status
    ),
    ruleIdx: index('idx_it_sod_violation_rule').on(table.ruleId),
    userIdx: index('idx_it_sod_violation_user').on(table.userId),
    detectedIdx: index('idx_it_sod_violation_detected').on(table.detectedAt),
  })
);

// User Access Review campaigns
export const uarCampaign = pgTable(
  'uar_campaign',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    status: uarCampaignStatusEnum('status').notNull().default('DRAFT'),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyCodeIdx: index('idx_uar_campaign_company_code').on(
      table.companyId,
      table.code
    ),
    companyStatusIdx: index('idx_uar_campaign_company_status').on(
      table.companyId,
      table.status
    ),
    dueAtIdx: index('idx_uar_campaign_due_at').on(table.dueAt),
    periodIdx: index('idx_uar_campaign_period').on(
      table.periodStart,
      table.periodEnd
    ),
  })
);

// Individual UAR items (users to be reviewed)
export const uarItem = pgTable(
  'uar_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => uarCampaign.id, { onDelete: 'cascade' }),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => itUser.id, { onDelete: 'cascade' }),
    ownerUserId: text('owner_user_id').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    state: uarItemStateEnum('state').notNull().default('PENDING'),
    decidedBy: text('decided_by'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    exceptionNote: text('exception_note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    campaignUserSystemIdx: index('idx_uar_item_campaign_user_system').on(
      table.campaignId,
      table.userId,
      table.systemId
    ),
    campaignStateIdx: index('idx_uar_item_campaign_state').on(
      table.campaignId,
      table.state
    ),
    ownerIdx: index('idx_uar_item_owner').on(table.ownerUserId),
    userSystemIdx: index('idx_uar_item_user_system').on(
      table.userId,
      table.systemId
    ),
    decidedAtIdx: index('idx_uar_item_decided_at')
      .on(table.decidedAt)
      .where(sql`${table.decidedAt} IS NOT NULL`),
  })
);

// Break-glass emergency access records
export const itBreakglass = pgTable(
  'it_breakglass',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => itSystem.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => itUser.id, { onDelete: 'cascade' }),
    openedAt: timestamp('opened_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ticket: text('ticket').notNull(),
    reason: text('reason').notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedBy: text('closed_by'),
  },
  table => ({
    companyOpenedIdx: index('idx_it_breakglass_company_opened').on(
      table.companyId,
      table.openedAt
    ),
    companyStatusIdx: index('idx_it_breakglass_company_status')
      .on(table.companyId, table.closedAt)
      .where(sql`${table.closedAt} IS NULL`),
    expiresIdx: index('idx_it_breakglass_expires')
      .on(table.expiresAt)
      .where(sql`${table.closedAt} IS NULL`),
    userIdx: index('idx_it_breakglass_user').on(table.userId),
    systemIdx: index('idx_it_breakglass_system').on(table.systemId),
  })
);

// Immutable snapshots for audit evidence
export const itSnapshot = pgTable(
  'it_snapshot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    takenAt: timestamp('taken_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    scope: itSnapshotScopeEnum('scope').notNull(),
    sha256: text('sha256').notNull(),
    evdRecordId: uuid('evd_record_id'),
  },
  table => ({
    companyScopeTakenIdx: index('idx_it_snapshot_company_scope_taken').on(
      table.companyId,
      table.scope,
      table.takenAt
    ),
    companyScopeIdx: index('idx_it_snapshot_company_scope').on(
      table.companyId,
      table.scope
    ),
    takenAtIdx: index('idx_it_snapshot_taken_at').on(table.takenAt),
    sha256Idx: index('idx_it_snapshot_sha256').on(table.sha256),
  })
);

// UAR evidence packs (eBinders)
export const uarPack = pgTable(
  'uar_pack',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => uarCampaign.id, { onDelete: 'cascade' }),
    sha256: text('sha256').notNull(),
    evdRecordId: uuid('evd_record_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    campaignIdx: index('idx_uar_pack_campaign').on(table.campaignId),
    sha256Idx: index('idx_uar_pack_sha256').on(table.sha256),
  })
);

// Relations
export const itSystemRelations = relations(itSystem, ({ many }) => ({
  connectorProfiles: many(itConnectorProfile),
  users: many(itUser),
  roles: many(itRole),
  entitlements: many(itEntitlement),
  grants: many(itGrant),
  sodViolations: many(itSodViolation),
  uarItems: many(uarItem),
  breakglass: many(itBreakglass),
}));

export const itConnectorProfileRelations = relations(
  itConnectorProfile,
  ({ one }) => ({
    system: one(itSystem, {
      fields: [itConnectorProfile.systemId],
      references: [itSystem.id],
    }),
  })
);

export const itUserRelations = relations(itUser, ({ one, many }) => ({
  system: one(itSystem, {
    fields: [itUser.systemId],
    references: [itSystem.id],
  }),
  grants: many(itGrant),
  sodViolations: many(itSodViolation),
  uarItems: many(uarItem),
  breakglass: many(itBreakglass),
}));

export const itRoleRelations = relations(itRole, ({ one }) => ({
  system: one(itSystem, {
    fields: [itRole.systemId],
    references: [itSystem.id],
  }),
}));

export const itEntitlementRelations = relations(
  itEntitlement,
  ({ one, many }) => ({
    system: one(itSystem, {
      fields: [itEntitlement.systemId],
      references: [itSystem.id],
    }),
    grants: many(itGrant),
  })
);

export const itGrantRelations = relations(itGrant, ({ one }) => ({
  system: one(itSystem, {
    fields: [itGrant.systemId],
    references: [itSystem.id],
  }),
  user: one(itUser, {
    fields: [itGrant.userId],
    references: [itUser.id],
  }),
  entitlement: one(itEntitlement, {
    fields: [itGrant.entitlementId],
    references: [itEntitlement.id],
  }),
}));

export const itSodRuleRelations = relations(itSodRule, ({ many }) => ({
  violations: many(itSodViolation),
}));

export const itSodViolationRelations = relations(itSodViolation, ({ one }) => ({
  rule: one(itSodRule, {
    fields: [itSodViolation.ruleId],
    references: [itSodRule.id],
  }),
  system: one(itSystem, {
    fields: [itSodViolation.systemId],
    references: [itSystem.id],
  }),
  user: one(itUser, {
    fields: [itSodViolation.userId],
    references: [itUser.id],
  }),
}));

export const uarCampaignRelations = relations(uarCampaign, ({ many }) => ({
  items: many(uarItem),
  packs: many(uarPack),
}));

export const uarItemRelations = relations(uarItem, ({ one }) => ({
  campaign: one(uarCampaign, {
    fields: [uarItem.campaignId],
    references: [uarCampaign.id],
  }),
  system: one(itSystem, {
    fields: [uarItem.systemId],
    references: [itSystem.id],
  }),
  user: one(itUser, {
    fields: [uarItem.userId],
    references: [itUser.id],
  }),
}));

export const itBreakglassRelations = relations(itBreakglass, ({ one }) => ({
  system: one(itSystem, {
    fields: [itBreakglass.systemId],
    references: [itSystem.id],
  }),
  user: one(itUser, {
    fields: [itBreakglass.userId],
    references: [itUser.id],
  }),
}));

export const uarPackRelations = relations(uarPack, ({ one }) => ({
  campaign: one(uarCampaign, {
    fields: [uarPack.campaignId],
    references: [uarCampaign.id],
  }),
}));
