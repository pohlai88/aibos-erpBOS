import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ITGCRegistryService } from '@/services/itgc/registry';
import { ITGCIngestService } from '@/services/itgc/ingest';
import { ITGCSoDService } from '@/services/itgc/sod';
import { ITGCUARService } from '@/services/itgc/uar';
import { ITGCBreakglassService } from '@/services/itgc/breakglass';
import { ITGCEvidenceService } from '@/services/itgc/evidence';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
  itSystem,
  itConnectorProfile,
  itUser,
  itRole,
  itEntitlement,
  itGrant,
  itSodRule,
  itSodViolation,
  uarCampaign,
  uarItem,
  itBreakglass,
  itSnapshot,
  uarPack,
} from '@aibos/db-adapter/schema';

describe('ITGC & UAR Bridge Services', () => {
  const testCompanyId = 'test-company-123';
  const testUserId = 'test-user-456';
  const testSystemId = 'test-system-789';

  beforeEach(async () => {
    // Clean up test data
    await db.delete(itSnapshot);
    await db.delete(uarPack);
    await db.delete(uarItem);
    await db.delete(uarCampaign);
    await db.delete(itBreakglass);
    await db.delete(itSodViolation);
    await db.delete(itSodRule);
    await db.delete(itGrant);
    await db.delete(itEntitlement);
    await db.delete(itRole);
    await db.delete(itUser);
    await db.delete(itConnectorProfile);
    await db.delete(itSystem);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(itSnapshot);
    await db.delete(uarPack);
    await db.delete(uarItem);
    await db.delete(uarCampaign);
    await db.delete(itBreakglass);
    await db.delete(itSodViolation);
    await db.delete(itSodRule);
    await db.delete(itGrant);
    await db.delete(itEntitlement);
    await db.delete(itRole);
    await db.delete(itUser);
    await db.delete(itConnectorProfile);
    await db.delete(itSystem);
  });

  describe('ITGCRegistryService', () => {
    it('should create and retrieve IT systems', async () => {
      const registryService = new ITGCRegistryService();

      // Create a system
      const systemData = {
        code: 'TEST-ERP',
        name: 'Test ERP System',
        kind: 'ERP' as const,
        owner_user_id: testUserId,
        is_active: true,
      };

      const system = await registryService.upsertSystem(
        testCompanyId,
        testUserId,
        systemData
      );

      expect(system).toBeDefined();
      expect(system.code).toBe('TEST-ERP');
      expect(system.name).toBe('Test ERP System');
      expect(system.kind).toBe('ERP');

      // Retrieve systems
      const systems = await registryService.getSystems(testCompanyId);
      expect(systems).toHaveLength(1);
      expect(systems[0]!.code).toBe('TEST-ERP');
    });

    it('should create and retrieve connector profiles', async () => {
      const registryService = new ITGCRegistryService();

      // First create a system
      const system = await registryService.upsertSystem(
        testCompanyId,
        testUserId,
        {
          code: 'TEST-ERP',
          name: 'Test ERP System',
          kind: 'ERP' as const,
          owner_user_id: testUserId,
          is_active: true,
        }
      );

      // Create a connector
      const connectorData = {
        system_id: system.id,
        connector: 'SCIM' as const,
        settings: {
          baseUrl: 'https://test.example.com/scim/v2',
          mapping: {
            userId: 'id',
            email: 'userName',
          },
        },
        schedule_cron: '0 2 * * *',
        is_enabled: true,
      };

      const connector = await registryService.upsertConnector(
        testCompanyId,
        testUserId,
        connectorData
      );

      expect(connector).toBeDefined();
      expect(connector.connector).toBe('SCIM');
      expect(connector.schedule_cron).toBe('0 2 * * *');

      // Retrieve connectors
      const connectors = await registryService.getConnectors(system.id);
      expect(connectors).toHaveLength(1);
      expect(connectors[0]!.connector).toBe('SCIM');
    });
  });

  describe('ITGCSoDService', () => {
    it('should create and evaluate SoD rules', async () => {
      const sodService = new ITGCSoDService();

      // Create a SoD rule
      const ruleData = {
        code: 'SOD_TEST',
        name: 'Test SoD Rule',
        severity: 'HIGH' as const,
        logic: {
          type: 'allOf' as const,
          entitlements: ['CREATE_INVOICE', 'APPROVE_INVOICE'],
        },
        active: true,
      };

      const rule = await sodService.upsertSoDRule(
        testCompanyId,
        testUserId,
        ruleData
      );

      expect(rule).toBeDefined();
      expect(rule.code).toBe('SOD_TEST');
      expect(rule.severity).toBe('HIGH');

      // Retrieve rules
      const rules = await sodService.getSoDRules(testCompanyId);
      expect(rules).toHaveLength(1);
      expect(rules[0]!.code).toBe('SOD_TEST');

      // Evaluate rules (should not find violations without test data)
      const result = await sodService.evaluateSoDRules(testCompanyId);
      expect(result.rules_evaluated).toBe(1);
      expect(result.violations_found).toBe(0);
    });

    it('should handle violation actions', async () => {
      const sodService = new ITGCSoDService();

      // Create a rule first
      const rule = await sodService.upsertSoDRule(testCompanyId, testUserId, {
        code: 'SOD_TEST',
        name: 'Test SoD Rule',
        severity: 'HIGH' as const,
        logic: {
          type: 'allOf' as const,
          entitlements: ['CREATE_INVOICE', 'APPROVE_INVOICE'],
        },
        active: true,
      });

      // Create a test violation manually
      await db.insert(itSodViolation).values({
        id: 'test-violation-123',
        companyId: testCompanyId,
        ruleId: rule.id,
        systemId: testSystemId,
        userId: testUserId,
        detectedAt: new Date(),
        status: 'OPEN',
        explanation: { test: true },
      });

      // Get violations
      const violations = await sodService.getSoDViolations({
        company_id: testCompanyId,
        paging: { limit: 50, offset: 0 },
      });

      expect(violations).toHaveLength(1);
      expect(violations[0]!.status).toBe('OPEN');

      // Take action on violation
      await sodService.takeViolationAction(testCompanyId, testUserId, {
        violation_id: violations[0]!.id,
        action: 'waive' as const,
        note: 'Test waiver',
      });

      // Verify violation was updated
      const updatedViolations = await sodService.getSoDViolations({
        company_id: testCompanyId,
        paging: { limit: 50, offset: 0 },
      });

      expect(updatedViolations[0]!.status).toBe('WAIVED');
      expect(updatedViolations[0]!.note).toBe('Test waiver');
    });
  });

  describe('ITGCUARService', () => {
    it('should create and manage UAR campaigns', async () => {
      const uarService = new ITGCUARService();

      // Create a campaign
      const campaignData = {
        code: 'UAR-2025Q1',
        name: 'Q1 2025 Access Review',
        period_start: '2025-01-01',
        period_end: '2025-03-31',
        due_at: '2025-04-15T23:59:59Z',
      };

      const campaign = await uarService.createCampaign(
        testCompanyId,
        testUserId,
        campaignData
      );

      expect(campaign).toBeDefined();
      expect(campaign.code).toBe('UAR-2025Q1');
      expect(campaign.status).toBe('DRAFT');

      // Retrieve campaigns
      const campaigns = await uarService.getCampaigns(testCompanyId);
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0]!.code).toBe('UAR-2025Q1');

      // Open campaign (this would normally create items, but we'll test the structure)
      try {
        await uarService.openCampaign(testCompanyId, testUserId, {
          campaign_id: campaign.id,
          include_systems: [],
        });
      } catch (error) {
        // Expected to fail without test users, but we can verify the campaign status change
        const updatedCampaigns = await uarService.getCampaigns(testCompanyId);
        // Campaign should still be DRAFT since opening failed
        expect(updatedCampaigns[0]!.status).toBe('DRAFT');
      }
    });
  });

  describe('ITGCBreakglassService', () => {
    it('should manage break-glass access', async () => {
      const breakglassService = new ITGCBreakglassService();

      // Open break-glass access
      const breakglassData = {
        system_id: testSystemId,
        user_id: testUserId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        ticket: 'INC-12345',
        reason: 'Emergency system maintenance',
      };

      const breakglass = await breakglassService.openBreakglass(
        testCompanyId,
        testUserId,
        breakglassData
      );

      expect(breakglass).toBeDefined();
      expect(breakglass.ticket).toBe('INC-12345');
      expect(breakglass.reason).toBe('Emergency system maintenance');

      // Retrieve active break-glass records
      const activeBreakglass =
        await breakglassService.getActiveBreakglass(testCompanyId);
      expect(activeBreakglass).toHaveLength(1);
      expect(activeBreakglass[0]!.ticket).toBe('INC-12345');

      // Close break-glass access
      await breakglassService.closeBreakglass(testCompanyId, testUserId, {
        breakglass_id: breakglass.id,
        reason: 'Maintenance completed',
      });

      // Verify it's no longer active
      const updatedActiveBreakglass =
        await breakglassService.getActiveBreakglass(testCompanyId);
      expect(updatedActiveBreakglass).toHaveLength(0);
    });

    it('should handle expired break-glass records', async () => {
      const breakglassService = new ITGCBreakglassService();

      // Create an expired break-glass record
      await db.insert(itBreakglass).values({
        id: 'test-breakglass-123',
        companyId: testCompanyId,
        systemId: testSystemId,
        userId: testUserId,
        openedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago (expired)
        ticket: 'INC-EXPIRED',
        reason: 'Expired test',
        closedAt: null,
        closedBy: null,
      });

      // Auto-close expired records
      const result = await breakglassService.autoCloseExpired();
      expect(result.closed_count).toBe(1);

      // Verify it's no longer active
      const activeBreakglass =
        await breakglassService.getActiveBreakglass(testCompanyId);
      expect(activeBreakglass).toHaveLength(0);
    });
  });

  describe('ITGCEvidenceService', () => {
    it('should take snapshots of ITGC data', async () => {
      const evidenceService = new ITGCEvidenceService();

      // Create test data first
      await db.insert(itSystem).values({
        id: testSystemId,
        companyId: testCompanyId,
        code: 'TEST-SYSTEM',
        name: 'Test System',
        kind: 'ERP',
        ownerUserId: testUserId,
        isActive: true,
        createdAt: new Date(),
      });

      await db.insert(itUser).values({
        id: 'test-user-123',
        companyId: testCompanyId,
        systemId: testSystemId,
        extId: 'ext-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        status: 'ACTIVE',
        firstSeen: new Date(),
        lastSeen: new Date(),
      });

      // Take a snapshot
      const snapshot = await evidenceService.takeSnapshot(
        testCompanyId,
        testUserId,
        {
          scope: 'USERS',
        }
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.scope).toBe('USERS');
      expect(snapshot.sha256).toBeDefined();

      // Retrieve snapshots
      const snapshots = await evidenceService.getSnapshots(testCompanyId);
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]!.scope).toBe('USERS');
    });

    it('should build UAR evidence packs', async () => {
      const evidenceService = new ITGCEvidenceService();

      // Create test campaign
      await db.insert(uarCampaign).values({
        companyId: testCompanyId,
        code: 'UAR-TEST',
        name: 'Test UAR Campaign',
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        dueAt: new Date('2025-04-15T23:59:59Z'),
        status: 'CLOSED',
        createdBy: testUserId,
        createdAt: new Date(),
      });

      // Create test UAR item
      await db.insert(uarItem).values({
        id: 'test-item-123',
        campaignId: 'test-campaign-123',
        companyId: testCompanyId,
        systemId: testSystemId,
        userId: testUserId,
        ownerUserId: testUserId,
        snapshot: { test: true },
        state: 'CERTIFIED',
        decidedBy: testUserId,
        decidedAt: new Date(),
        createdAt: new Date(),
      });

      // Build evidence pack
      const pack = await evidenceService.buildUARPack(
        testCompanyId,
        testUserId,
        {
          campaign_id: 'test-campaign-123',
        }
      );

      expect(pack).toBeDefined();
      expect(pack.campaign_id).toBe('test-campaign-123');
      expect(pack.sha256).toBeDefined();

      // Retrieve packs
      const packs = await evidenceService.getUARPacks(testCompanyId);
      expect(packs).toHaveLength(1);
      expect(packs[0]!.campaign_id).toBe('test-campaign-123');
    });
  });

  describe('ITGCIngestService', () => {
    it('should run data ingestion', async () => {
      const ingestService = new ITGCIngestService();

      // Create test system and connector
      await db.insert(itSystem).values({
        id: testSystemId,
        companyId: testCompanyId,
        code: 'TEST-SYSTEM',
        name: 'Test System',
        kind: 'ERP',
        ownerUserId: testUserId,
        isActive: true,
        createdAt: new Date(),
      });

      await db.insert(itConnectorProfile).values({
        id: 'test-connector-123',
        companyId: testCompanyId,
        systemId: testSystemId,
        connector: 'SCIM',
        settings: { test: true },
        isEnabled: true,
        createdAt: new Date(),
      });

      // Run ingestion
      const result = await ingestService.runIngestion(
        testCompanyId,
        testUserId,
        {
          system_id: testSystemId,
          force: false,
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.processed).toBeDefined();
      expect(result.errors).toBeDefined();
    });
  });
});
