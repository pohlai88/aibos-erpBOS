import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { BoardsService } from '../boards';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';

describe('Boards Service', () => {
  let ids: ReturnType<typeof testIds>;
  let service: BoardsService;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
    service = new BoardsService();
  });

  describe('Board Configuration Management', () => {
    it('should create a new board configuration', async () => {
      const config = {
        board: 'EXEC' as const,
        name: 'Executive Dashboard',
        description: 'High-level KPIs for executives',
        default_present_ccy: 'USD',
        layout: { columns: 3, rows: 2 },
        acl: ['admin', 'accountant'],
      };

      const result = await service.upsertBoardConfig(ids.companyId, config);

      expect(result).toBeDefined();
      expect(result.company_id).toBe(ids.companyId);
      expect(result.board).toBe('EXEC');
      expect(result.name).toBe('Executive Dashboard');
      expect(result.description).toBe('High-level KPIs for executives');
      expect(result.default_present_ccy).toBe('USD');
    });

    it('should update an existing board configuration', async () => {
      // Create initial config
      const initialConfig = {
        board: 'EXEC' as const,
        name: 'Executive Dashboard',
        description: 'High-level KPIs for executives',
        default_present_ccy: 'USD',
        layout: { columns: 3, rows: 2 },
        acl: ['admin', 'accountant'],
      };

      await service.upsertBoardConfig(ids.companyId, initialConfig);

      // Update config
      const updatedConfig = {
        board: 'EXEC' as const,
        name: 'Executive Command Center',
        description: 'Updated description',
        default_present_ccy: 'EUR',
        layout: { columns: 4, rows: 3 },
        acl: ['admin', 'accountant', 'ops'],
      };

      const result = await service.upsertBoardConfig(
        ids.companyId,
        updatedConfig
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Executive Command Center');
      expect(result.description).toBe('Updated description');
      expect(result.default_present_ccy).toBe('EUR');
    });

    it('should get board configuration', async () => {
      // Create config first
      const config = {
        board: 'TREASURY' as const,
        name: 'Treasury Operations',
        description: 'Cash management KPIs',
        default_present_ccy: 'USD',
        layout: { columns: 2, rows: 2 },
        acl: ['admin', 'accountant'],
      };

      await service.upsertBoardConfig(ids.companyId, config);

      const result = await service.getBoardConfig(ids.companyId, 'TREASURY');

      expect(result).toBeDefined();
      expect(result?.board).toBe('TREASURY');
      expect(result?.name).toBe('Treasury Operations');
    });

    it('should get all board configurations', async () => {
      // Create multiple configs
      const configs = [
        {
          board: 'EXEC' as const,
          name: 'Executive Dashboard',
          description: 'Executive KPIs',
          default_present_ccy: 'USD',
          layout: { columns: 3, rows: 2 },
          acl: ['admin'],
        },
        {
          board: 'AR' as const,
          name: 'AR Operations',
          description: 'AR KPIs',
          default_present_ccy: 'USD',
          layout: { columns: 2, rows: 3 },
          acl: ['admin', 'accountant'],
        },
      ];

      for (const config of configs) {
        await service.upsertBoardConfig(ids.companyId, config);
      }

      const results = await service.getAllBoardConfigs(ids.companyId);

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results.map(r => r.board)).toContain('EXEC');
      expect(results.map(r => r.board)).toContain('AR');
    });

    it('should delete board configuration', async () => {
      // Create config first
      const config = {
        board: 'CLOSE' as const,
        name: 'Close Operations',
        description: 'Close KPIs',
        default_present_ccy: 'USD',
        layout: { columns: 2, rows: 3 },
        acl: ['admin'],
      };

      await service.upsertBoardConfig(ids.companyId, config);

      // Verify it exists
      const beforeDelete = await service.getBoardConfig(ids.companyId, 'CLOSE');
      expect(beforeDelete).toBeDefined();

      // Delete it
      await service.deleteBoardConfig(ids.companyId, 'CLOSE');

      // Verify it's gone
      const afterDelete = await service.getBoardConfig(ids.companyId, 'CLOSE');
      expect(afterDelete).toBeNull();
    });
  });

  describe('Tile Configuration Management', () => {
    it('should create a new tile configuration', async () => {
      const tileConfig = {
        board: 'EXEC' as const,
        tile_id: 'exec-liquidity',
        kpi: 'LIQUIDITY_RUNWAY_W',
        viz: 'NUMBER' as const,
        format: 'WEEKS',
        targets: { warning: 8, critical: 4 },
        order_no: 1,
      };

      const result = await service.upsertTileConfig(ids.companyId, tileConfig);

      expect(result).toBeDefined();
      expect(result.company_id).toBe(ids.companyId);
      expect(result.board).toBe('EXEC');
      expect(result.tile_id).toBe('exec-liquidity');
      expect(result.kpi).toBe('LIQUIDITY_RUNWAY_W');
      expect(result.viz).toBe('NUMBER');
      expect(result.format).toBe('WEEKS');
      expect(result.order_no).toBe(1);
    });

    it('should update an existing tile configuration', async () => {
      // Create initial tile
      const initialTile = {
        board: 'TREASURY' as const,
        tile_id: 'treasury-payments',
        kpi: 'PAY_RUN_COMMIT_14D',
        viz: 'NUMBER' as const,
        format: 'CURRENCY',
        targets: { warning: 200000, critical: 300000 },
        order_no: 1,
      };

      await service.upsertTileConfig(ids.companyId, initialTile);

      // Update tile
      const updatedTile = {
        board: 'TREASURY' as const,
        tile_id: 'treasury-payments',
        kpi: 'PAY_RUN_COMMIT_14D',
        viz: 'DELTA' as const,
        format: 'CURRENCY',
        targets: { warning: 150000, critical: 250000 },
        order_no: 2,
      };

      const result = await service.upsertTileConfig(ids.companyId, updatedTile);

      expect(result).toBeDefined();
      expect(result.viz).toBe('DELTA');
      expect(result.order_no).toBe(2);
      expect(result.targets).toEqual({ warning: 150000, critical: 250000 });
    });

    it('should get tile configurations for a board', async () => {
      // Create multiple tiles
      const tiles = [
        {
          board: 'AR' as const,
          tile_id: 'ar-ptp-risk',
          kpi: 'PTP_AT_RISK',
          viz: 'NUMBER' as const,
          format: 'CURRENCY',
          targets: { warning: 100000, critical: 200000 },
          order_no: 1,
        },
        {
          board: 'AR' as const,
          tile_id: 'ar-ptp-rate',
          kpi: 'PTP_KEPT_RATE',
          viz: 'NUMBER' as const,
          format: 'PERCENTAGE',
          targets: { warning: 85, critical: 75 },
          order_no: 2,
        },
      ];

      for (const tile of tiles) {
        await service.upsertTileConfig(ids.companyId, tile);
      }

      const results = await service.getTileConfigs(ids.companyId, 'AR');

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results.map(r => r.tile_id)).toContain('ar-ptp-risk');
      expect(results.map(r => r.tile_id)).toContain('ar-ptp-rate');
    });

    it('should get all tile configurations', async () => {
      // Create tiles for different boards
      const tiles = [
        {
          board: 'EXEC' as const,
          tile_id: 'exec-kpi-1',
          kpi: 'LIQUIDITY_RUNWAY_W',
          viz: 'NUMBER' as const,
          format: 'WEEKS',
          targets: {},
          order_no: 1,
        },
        {
          board: 'CLOSE' as const,
          tile_id: 'close-kpi-1',
          kpi: 'CONTROL_PASS_RATE',
          viz: 'NUMBER' as const,
          format: 'PERCENTAGE',
          targets: {},
          order_no: 1,
        },
      ];

      for (const tile of tiles) {
        await service.upsertTileConfig(ids.companyId, tile);
      }

      const results = await service.getAllTileConfigs(ids.companyId);

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results.map(r => r.board)).toContain('EXEC');
      expect(results.map(r => r.board)).toContain('CLOSE');
    });

    it('should update tile order', async () => {
      // Create tiles
      const tiles = [
        {
          board: 'TREASURY' as const,
          tile_id: 'treasury-1',
          kpi: 'PAY_RUN_COMMIT_14D',
          viz: 'NUMBER' as const,
          format: 'CURRENCY',
          targets: {},
          order_no: 1,
        },
        {
          board: 'TREASURY' as const,
          tile_id: 'treasury-2',
          kpi: 'DISCOUNT_CAPTURE_RATE',
          viz: 'NUMBER' as const,
          format: 'PERCENTAGE',
          targets: {},
          order_no: 2,
        },
      ];

      for (const tile of tiles) {
        await service.upsertTileConfig(ids.companyId, tile);
      }

      // Update order
      const tileOrders = [
        { tile_id: 'treasury-1', order_no: 2 },
        { tile_id: 'treasury-2', order_no: 1 },
      ];

      await service.updateTileOrder(ids.companyId, 'TREASURY', tileOrders);

      // Verify order was updated
      const results = await service.getTileConfigs(ids.companyId, 'TREASURY');
      expect(results.find(r => r.tile_id === 'treasury-1')?.order_no).toBe(2);
      expect(results.find(r => r.tile_id === 'treasury-2')?.order_no).toBe(1);
    });

    it('should delete tile configuration', async () => {
      // Create tile first
      const tileConfig = {
        board: 'CLOSE' as const,
        tile_id: 'close-exceptions',
        kpi: 'EXCEPTIONS_OPEN',
        viz: 'NUMBER' as const,
        format: 'COUNT',
        targets: { warning: 5, critical: 10 },
        order_no: 1,
      };

      await service.upsertTileConfig(ids.companyId, tileConfig);

      // Verify it exists
      const beforeDelete = await service.getTileConfigs(ids.companyId, 'CLOSE');
      expect(beforeDelete.length).toBe(1);

      // Delete it
      await service.deleteTileConfig(
        ids.companyId,
        'CLOSE',
        'close-exceptions'
      );

      // Verify it's gone
      const afterDelete = await service.getTileConfigs(ids.companyId, 'CLOSE');
      expect(afterDelete.length).toBe(0);
    });
  });
});
