-- M26.7: Attestations Portal - Default Seed Data
-- Seed one sample program (302-Quarterly) and a template v1

INSERT INTO attest_program (id, company_id, code, name, freq, scope, created_by, updated_by)
SELECT 
  gen_random_uuid(),
  c.id,
  '302-QUARTERLY',
  'SOX 302 Sub-Certification',
  'QUARTERLY',
  ARRAY['PROCESS:R2R', 'PROCESS:P2P', 'PROCESS:O2C'],
  u.id,
  u.id
FROM company c
CROSS JOIN app_user u
WHERE c.code = 'DEMO' AND u.email = 'admin@demo.com'
LIMIT 1;

INSERT INTO attest_template (id, company_id, code, title, version, schema, requires_evidence, created_by, updated_by)
SELECT 
  gen_random_uuid(),
  c.id,
  '302-v1',
  'SOX 302 Questionnaire',
  1,
  '{"version": 1, "questions": [{"id": "q1", "label": "Any material control changes?", "type": "YN", "requireEvidence": false}, {"id": "q2", "label": "Exceptions to policy?", "type": "TEXT"}, {"id": "q3", "label": "Attach JE continuity evidence", "type": "EVIDENCE", "requireEvidence": true}]}',
  true,
  u.id,
  u.id
FROM company c
CROSS JOIN app_user u
WHERE c.code = 'DEMO' AND u.email = 'admin@demo.com'
LIMIT 1;
