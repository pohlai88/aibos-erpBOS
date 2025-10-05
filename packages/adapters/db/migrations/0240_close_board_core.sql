-- M26.6: Close Cockpit & SLA Board - Core Tables
-- Unified close management with SLA tracking, heat-maps, and bulk actions

CREATE TABLE close_sla_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  code TEXT NOT NULL,                          -- e.g. MONTH_END
  tz TEXT NOT NULL DEFAULT 'UTC',
  cutoff_day SMALLINT NOT NULL DEFAULT 5,      -- business-day cutoff
  grace_hours SMALLINT NOT NULL DEFAULT 24,
  escal1_hours SMALLINT NOT NULL DEFAULT 24,
  escal2_hours SMALLINT NOT NULL DEFAULT 48,
  escal_to_lvl1 UUID,                          -- manager user_id
  escal_to_lvl2 UUID,
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TYPE close_item_kind AS ENUM ('TASK','AUTO_CTRL','SOX_TEST','DEFICIENCY','FLUX','CERT');

CREATE TABLE close_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  period TEXT NOT NULL,                        -- YYYY-MM
  kind close_item_kind NOT NULL,
  ref_id TEXT NOT NULL,                        -- foreign id string
  title TEXT NOT NULL,
  process TEXT NOT NULL,                       -- R2R|P2P|O2C|Treasury|Tax
  owner_id UUID,                               -- nullable for pool
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',         -- OPEN|IN_PROGRESS|BLOCKED|DONE|DEFERRED
  severity TEXT NOT NULL DEFAULT 'NORMAL',     -- LOW|NORMAL|HIGH|CRITICAL
  aging_days INT NOT NULL DEFAULT 0,
  sla_state TEXT NOT NULL DEFAULT 'OK',        -- OK|DUE_SOON|LATE|ESCALATED
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, period, kind, ref_id)
);

CREATE TABLE close_item_comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES close_item(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE close_item_evd_link (         -- bridge to M26.4 evidence
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES close_item(id) ON DELETE CASCADE,
  evd_record_id UUID NOT NULL
);
