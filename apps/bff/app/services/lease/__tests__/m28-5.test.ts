import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SubleaseBuilder } from '../sublease-builder';
import { SubleaseScheduler } from '../sublease-scheduler';
import { SubleasePostingService } from '../sublease-posting';
import { SlbAssessor } from '../slb-assessor';
import { SlbMeasurer } from '../slb-measurer';
import { SlbPostingService } from '../slb-posting';
import { EvidencePackService } from '../evidence-pack-service';
import { JournalTemplateService } from '../journal-template-service';
import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and } from 'drizzle-orm';
import {
    lease,
    leaseOpening,
    leaseComponent,
    sublease,
    subleaseCf,
    subleaseSchedule,
    slbTxn,
    slbAllocation,
    slbMeasure
} from '@aibos/db-adapter/schema';
import type {
    SubleaseCreateReqType,
    SlbCreateReqType
} from '@aibos/contracts';

describe('M28.5: Sublease & SLB Services', () => {
    let testCompanyId: string;
    let testUserId: string;
    let testLeaseId: string;
    let testComponentId: string;

    beforeEach(async () => {
        testCompanyId = ulid();
        testUserId = ulid();
        testLeaseId = ulid();
        testComponentId = ulid();

        // Create test lease
        await db.insert(lease).values({
            id: testLeaseId,
            companyId: testCompanyId,
            leaseCode: 'TEST-LEASE-001',
            lessor: 'Test Lessor',
            assetClass: 'Building',
            ccy: 'USD',
            commenceOn: '2024-01-01',
            endOn: '2026-12-31',
            paymentFrequency: 'MONTHLY',
            discountRate: '0.05',
            rateKind: 'fixed',
            status: 'ACTIVE',
            createdAt: new Date(),
            createdBy: testUserId,
            updatedAt: new Date(),
            updatedBy: testUserId
        });

        // Create opening measures
        await db.insert(leaseOpening).values({
            id: ulid(),
            leaseId: testLeaseId,
            initialLiability: '100000',
            initialRou: '100000',
            incentivesReceived: '5000',
            initialDirectCosts: '2000',
            restorationCost: '3000',
            computedAt: new Date(),
            computedBy: testUserId
        });

        // Create test component
        await db.insert(leaseComponent).values({
            id: testComponentId,
            companyId: testCompanyId,
            leaseId: testLeaseId,
            code: 'LAND',
            name: 'Land Component',
            class: 'Land',
            pctOfRou: '0.3',
            usefulLifeMonths: 36,
            method: 'SL',
            incentiveAlloc: '1500',
            restorationAlloc: '900',
            startOn: '2024-01-01',
            endOn: '2026-12-31',
            status: 'ACTIVE',
            createdAt: new Date(),
            createdBy: testUserId,
            updatedAt: new Date(),
            updatedBy: testUserId
        });
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(slbMeasure).where(eq(slbMeasure.slbId, 'test-slb-id'));
        await db.delete(slbAllocation).where(eq(slbAllocation.slbId, 'test-slb-id'));
        await db.delete(slbTxn).where(eq(slbTxn.companyId, testCompanyId));
        await db.delete(subleaseSchedule).where(eq(subleaseSchedule.subleaseId, 'test-sublease-id'));
        await db.delete(subleaseCf).where(eq(subleaseCf.subleaseId, 'test-sublease-id'));
        await db.delete(sublease).where(eq(sublease.companyId, testCompanyId));
        await db.delete(leaseComponent).where(eq(leaseComponent.companyId, testCompanyId));
        await db.delete(leaseOpening).where(eq(leaseOpening.leaseId, testLeaseId));
        await db.delete(lease).where(eq(lease.id, testLeaseId));
    });

    describe('SubleaseBuilder', () => {
        let service: SubleaseBuilder;

        beforeEach(() => {
            service = new SubleaseBuilder();
        });

        it('should create finance sublease with proper classification', async () => {
            const subleaseData: SubleaseCreateReqType = {
                headLeaseId: testLeaseId,
                subleaseCode: 'SUB-001',
                startOn: '2024-01-01',
                endOn: '2026-12-31',
                ccy: 'USD',
                discountRate: 0.05,
                cashflows: [
                    { dueOn: '2024-01-01', amount: 1000 },
                    { dueOn: '2024-02-01', amount: 1000 },
                    { dueOn: '2024-03-01', amount: 1000 }
                ],
                componentLinks: [
                    {
                        leaseComponentId: testComponentId,
                        proportion: 0.5,
                        method: 'PROPORTIONATE',
                        notes: '50% of land component'
                    }
                ]
            };

            const result = await service.createSublease(
                testCompanyId,
                testUserId,
                subleaseData
            );

            expect(result.subleaseId).toBeDefined();
            expect(result.classification).toBe('FINANCE');
            expect(result.status).toBe('DRAFT');
        });

        it('should create operating sublease with proper classification', async () => {
            const subleaseData: SubleaseCreateReqType = {
                headLeaseId: testLeaseId,
                subleaseCode: 'SUB-002',
                startOn: '2024-01-01',
                endOn: '2024-06-30', // Short term = operating
                ccy: 'USD',
                discountRate: 0.05,
                cashflows: [
                    { dueOn: '2024-01-01', amount: 500 },
                    { dueOn: '2024-02-01', amount: 500 }
                ]
            };

            const result = await service.createSublease(
                testCompanyId,
                testUserId,
                subleaseData
            );

            expect(result.subleaseId).toBeDefined();
            expect(result.classification).toBe('OPERATING');
            expect(result.status).toBe('DRAFT');
        });
    });

    describe('SubleaseScheduler', () => {
        let service: SubleaseScheduler;
        let subleaseId: string;

        beforeEach(async () => {
            service = new SubleaseScheduler();

            // Create a test sublease first
            subleaseId = ulid();
            await db.insert(sublease).values({
                id: subleaseId,
                companyId: testCompanyId,
                headLeaseId: testLeaseId,
                subleaseCode: 'SUB-SCHEDULE-001',
                startOn: '2024-01-01',
                endOn: '2024-12-31',
                classification: 'FINANCE',
                ccy: 'USD',
                rate: '0.05',
                status: 'DRAFT',
                createdAt: new Date(),
                createdBy: testUserId,
                updatedAt: new Date(),
                updatedBy: testUserId
            });

            // Create cashflows
            await db.insert(subleaseCf).values([
                {
                    id: ulid(),
                    subleaseId,
                    dueOn: '2024-01-01',
                    amount: '1000'
                },
                {
                    id: ulid(),
                    subleaseId,
                    dueOn: '2024-02-01',
                    amount: '1000'
                }
            ]);
        });

        it('should build finance sublease schedule', async () => {
            const result = await service.buildSchedule(
                testCompanyId,
                testUserId,
                { subleaseId }
            );

            expect(result.subleaseId).toBe(subleaseId);
            expect(result.scheduleRows).toBeGreaterThan(0);
            expect(result.totalReceipts).toBeGreaterThan(0);
        });
    });

    describe('SlbAssessor', () => {
        let service: SlbAssessor;

        beforeEach(() => {
            service = new SlbAssessor();
        });

        it('should create SLB transaction with control transfer assessment', async () => {
            const slbData: SlbCreateReqType = {
                assetDesc: 'Test Building',
                saleDate: '2024-01-01',
                salePrice: 100000,
                fmv: 100000,
                ccy: 'USD',
                abilityToDirectUse: true,
                abilityToPreventOthers: true,
                presentRightToPayment: true,
                risksRewardsTransferred: true
            };

            const result = await service.createSlbTransaction(
                testCompanyId,
                testUserId,
                slbData
            );

            expect(result.slbId).toBeDefined();
            expect(result.controlTransferred).toBe(true);
            expect(result.status).toBe('DRAFT');
        });

        it('should create SLB transaction without control transfer', async () => {
            const slbData: SlbCreateReqType = {
                assetDesc: 'Test Building',
                saleDate: '2024-01-01',
                salePrice: 100000,
                fmv: 100000,
                ccy: 'USD',
                abilityToDirectUse: false,
                abilityToPreventOthers: false,
                presentRightToPayment: false,
                risksRewardsTransferred: false
            };

            const result = await service.createSlbTransaction(
                testCompanyId,
                testUserId,
                slbData
            );

            expect(result.slbId).toBeDefined();
            expect(result.controlTransferred).toBe(false);
            expect(result.status).toBe('DRAFT');
        });
    });

    describe('EvidencePackService', () => {
        let service: EvidencePackService;

        beforeEach(() => {
            service = new EvidencePackService();
        });

        it('should create evidence pack for sublease', async () => {
            const subleaseId = ulid();

            // Create test sublease
            await db.insert(sublease).values({
                id: subleaseId,
                companyId: testCompanyId,
                headLeaseId: testLeaseId,
                subleaseCode: 'SUB-EVIDENCE-001',
                startOn: '2024-01-01',
                endOn: '2024-12-31',
                classification: 'FINANCE',
                ccy: 'USD',
                status: 'DRAFT',
                createdAt: new Date(),
                createdBy: testUserId,
                updatedAt: new Date(),
                updatedBy: testUserId
            });

            const evidencePackId = await service.createSubleaseEvidencePack(
                testCompanyId,
                testUserId,
                subleaseId,
                {
                    subleaseContract: 'Test contract',
                    headLeaseReference: 'Head lease reference',
                    classificationMemo: 'Classification memo',
                    cashflowSchedule: 'Cashflow schedule',
                    componentLinks: 'Component links'
                }
            );

            expect(evidencePackId).toBeDefined();

            // Verify evidence pack was linked
            const retrievedPackId = await service.getSubleaseEvidencePack(testCompanyId, subleaseId);
            expect(retrievedPackId).toBe(evidencePackId);
        });

        it('should create evidence pack for SLB transaction', async () => {
            const slbId = ulid();

            // Create test SLB transaction
            await db.insert(slbTxn).values({
                id: slbId,
                companyId: testCompanyId,
                assetDesc: 'Test Asset',
                saleDate: '2024-01-01',
                salePrice: '100000',
                fmv: '100000',
                ccy: 'USD',
                controlTransferred: true,
                status: 'DRAFT',
                createdAt: new Date(),
                createdBy: testUserId,
                updatedAt: new Date(),
                updatedBy: testUserId
            });

            const evidencePackId = await service.createSlbEvidencePack(
                testCompanyId,
                testUserId,
                slbId,
                {
                    saleContract: 'Sale contract',
                    leasebackAgreement: 'Leaseback agreement',
                    fairValueAssessment: 'Fair value assessment',
                    controlTransferMemo: 'Control transfer memo',
                    gainCalculation: 'Gain calculation'
                }
            );

            expect(evidencePackId).toBeDefined();

            // Verify evidence pack was linked
            const retrievedPackId = await service.getSlbEvidencePack(testCompanyId, slbId);
            expect(retrievedPackId).toBe(evidencePackId);
        });
    });

    describe('JournalTemplateService', () => {
        let service: JournalTemplateService;

        beforeEach(() => {
            service = new JournalTemplateService();
        });

        it('should get finance sublease monthly template', () => {
            const template = service.getFinanceSubleaseMonthlyTemplate();

            expect(template.id).toBe('sublease_finance_monthly');
            expect(template.name).toBe('Finance Sublease Monthly Posting');
            expect(template.lines).toHaveLength(3);
            expect(template.lines[0]?.accountCode).toBe('NIS');
            expect(template.lines[0]?.drCr).toBe('DR');
        });

        it('should get operating sublease monthly template', () => {
            const template = service.getOperatingSubleaseMonthlyTemplate();

            expect(template.id).toBe('sublease_operating_monthly');
            expect(template.name).toBe('Operating Sublease Monthly Posting');
            expect(template.lines).toHaveLength(2);
            expect(template.lines[0]?.accountCode).toBe('CASH');
            expect(template.lines[0]?.drCr).toBe('DR');
        });

        it('should get SLB initial template', () => {
            const template = service.getSlbInitialTemplate();

            expect(template.id).toBe('slb_initial');
            expect(template.name).toBe('SLB Initial Posting');
            expect(template.lines).toHaveLength(6);
        });

        it('should apply template with variables', async () => {
            const template = service.getFinanceSubleaseMonthlyTemplate();
            const variables = {
                cash_receipt: 1000,
                interest: 50,
                principal: 950
            };

            const journalId = await service.applyTemplate(
                testCompanyId,
                testUserId,
                template,
                variables,
                'Test journal entry',
                true // dry run
            );

            expect(journalId).toBeDefined();
        });
    });
});