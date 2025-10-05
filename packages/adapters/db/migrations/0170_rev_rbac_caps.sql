BEGIN;

-- Revenue Recognition RBAC Capabilities (M25.1)
-- Document the required capabilities for revenue recognition

-- Required capabilities:
-- rev:policy    - Manage recognition policies and account mappings
-- rev:allocate  - Create POBs and allocate transaction price
-- rev:schedule  - Build and manage recognition schedules
-- rev:recognize - Run recognition and post to GL
-- rev:export    - Export recognition artifacts and reports

-- These capabilities should be added to appropriate roles:
-- Admin: All capabilities
-- Accountant: All capabilities  
-- Revenue Manager: rev:policy, rev:allocate, rev:schedule, rev:recognize, rev:export
-- Analyst: rev:schedule (read-only), rev:recognize (read-only), rev:export

-- Note: Capability assignments are managed in the application layer (apps/bff/app/lib/rbac.ts)
-- This migration serves as documentation of the required capabilities

COMMIT;
