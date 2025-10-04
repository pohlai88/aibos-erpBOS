-- M26.6: Close Cockpit & SLA Board - Seed Data
-- Default SLA policy for month-end close

INSERT INTO close_sla_policy (
  id, company_id, code, tz, cutoff_day, grace_hours, 
  escal1_hours, escal2_hours, escal_to_lvl1, escal_to_lvl2,
  created_by, updated_by
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- placeholder company_id
  'MONTH_END',
  'Asia/Ho_Chi_Minh',
  5,  -- 5 business days cutoff
  24, -- 24 hours grace period
  24, -- 24 hours to level 1 escalation
  48, -- 48 hours to level 2 escalation
  NULL, -- level 1 escalation user (to be configured)
  NULL, -- level 2 escalation user (to be configured)
  '00000000-0000-0000-0000-000000000000', -- placeholder user_id
  '00000000-0000-0000-0000-000000000000'  -- placeholder user_id
);
