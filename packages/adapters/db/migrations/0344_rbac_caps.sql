-- M28.7: Lease Derecognition - RBAC Capabilities
-- Migration: 0344_rbac_caps.sql

-- Add new RBAC capabilities for lease exit operations
-- Note: These will be added to the RBAC system in the application layer

-- Comments for documentation
COMMENT ON SCHEMA public IS 'M28.7 RBAC Capabilities:
- lease:exit:prepare - Prepare exit calculations and preview journals
- lease:exit:post - Post exit journals and update schedules  
- lease:restoration - Manage restoration provisions and post movements

These capabilities will be integrated into the existing RBAC system
and assigned to appropriate roles (admin, accountant, ops) as needed.';
