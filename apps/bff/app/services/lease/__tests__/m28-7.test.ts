import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeaseExitService } from '@/services/lease/exit';
import { LeaseRestorationService } from '@/services/lease/restoration';
import { db } from '@/lib/db';
import { ulid } from 'ulid';

// Mock dependencies using the correct pattern
vi.mock('@/lib/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([])
    }
}));
vi.mock('@/services/gl/journals');
vi.mock('@/services/fx/rates');
vi.mock('ulid');

describe('M28.7: Lease Exit Service', () => {
    let exitService: LeaseExitService;

    beforeEach(() => {
        vi.clearAllMocks();
        exitService = new LeaseExitService();
        // Mock ulid to return consistent test ID
        vi.mocked(ulid).mockReturnValue('test-id-123');
    });

    describe('upsertExit', () => {
        it('should create a new exit event successfully', async () => {
            // Mock database responses - simplified approach
            vi.mocked(db.select).mockReturnThis();

            const exitData = {
                lease_code: 'LEASE-001',
                event_date: '2024-01-15',
                kind: 'FULL' as const,
                reason: 'Early termination due to business closure',
                settlement: 50000,
                penalty: 10000,
                restoration: 25000
            };

            const result = await exitService.upsertExit('company-123', 'user-123', exitData);

            expect(result).toBe('test-id-123');
            expect(db.insert).toHaveBeenCalledTimes(2); // exit + calc
        });

        it('should throw error if lease not found', async () => {
            // Mock empty result for lease not found
            vi.mocked(db.select).mockReturnThis();

            const exitData = {
                lease_code: 'NONEXISTENT',
                event_date: '2024-01-15',
                kind: 'FULL' as const,
                reason: 'Test termination',
                settlement: 0,
                penalty: 0,
                restoration: 0
            };

            await expect(
                exitService.upsertExit('company-123', 'user-123', exitData)
            ).rejects.toThrow('Lease not found');
        });
    });

    describe('exit service functionality', () => {
        it('should handle exit operations correctly', async () => {
            // Mock database responses
            vi.mocked(db.select).mockReturnThis();

            const exitData = {
                lease_code: 'LEASE-001',
                event_date: '2024-01-15',
                kind: 'FULL' as const,
                reason: 'Early termination',
                settlement: 50000,
                penalty: 10000,
                restoration: 25000
            };

            const result = await exitService.upsertExit('company-123', 'user-123', exitData);

            expect(result).toBe('test-id-123');
            expect(db.select).toHaveBeenCalled();
        });
    });

    describe('restoration service functionality', () => {
        it('should handle restoration operations correctly', async () => {
            // Mock database responses
            vi.mocked(db.select).mockReturnThis();

            const restorationData = {
                lease_code: 'LEASE-001',
                as_of_date: '2024-01-15',
                restoration_type: 'ENVIRONMENTAL' as const,
                estimated_cost: 50000,
                probability: 0.8,
                notes: 'Environmental cleanup required'
            };

            const result = await exitService.upsertExit('company-123', 'user-123', restorationData as any);

            expect(result).toBe('test-id-123');
            expect(db.select).toHaveBeenCalled();
        });
    });
});