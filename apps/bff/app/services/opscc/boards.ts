import { db, pool } from '@/lib/db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { boardConfig, kpiTileConfig } from '@aibos/db-adapter/schema';
import type {
  BoardConfigUpsert,
  BoardConfigResponse,
  TileConfigUpsert,
  TileConfigResponse,
  BoardType,
} from '@aibos/contracts';
import { logLine } from '@/lib/log';

export class BoardsService {
  constructor(private dbInstance = db) {}

  /**
   * Get board configuration
   */
  async getBoardConfig(
    companyId: string,
    board: BoardType
  ): Promise<BoardConfigResponse | null> {
    try {
      const result = await this.dbInstance
        .select()
        .from(boardConfig)
        .where(
          and(
            eq(boardConfig.company_id, companyId),
            eq(boardConfig.board, board)
          )
        )
        .limit(1);

      return (result[0] as unknown as BoardConfigResponse) || null;
    } catch (error) {
      logLine({
        msg: 'BoardsService.getBoardConfig error',
        companyId,
        board,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all board configurations for a company
   */
  async getAllBoardConfigs(companyId: string): Promise<BoardConfigResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(boardConfig)
        .where(eq(boardConfig.company_id, companyId))
        .orderBy(asc(boardConfig.board));

      return results as unknown as BoardConfigResponse[];
    } catch (error) {
      logLine({
        msg: 'BoardsService.getAllBoardConfigs error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Upsert board configuration
   */
  async upsertBoardConfig(
    companyId: string,
    config: BoardConfigUpsert
  ): Promise<BoardConfigResponse> {
    try {
      const existing = await this.getBoardConfig(companyId, config.board);

      if (existing) {
        // Update existing
        const result = await this.dbInstance
          .update(boardConfig)
          .set({
            name: config.name,
            description: config.description,
            default_present_ccy: config.default_present_ccy,
            layout: config.layout,
            acl: config.acl,
            updated_at: new Date(),
          })
          .where(
            and(
              eq(boardConfig.company_id, companyId),
              eq(boardConfig.board, config.board)
            )
          )
          .returning();

        return result[0] as unknown as BoardConfigResponse;
      } else {
        // Insert new
        const result = await this.dbInstance
          .insert(boardConfig)
          .values({
            company_id: companyId,
            board: config.board,
            name: config.name,
            description: config.description,
            default_present_ccy: config.default_present_ccy,
            layout: config.layout,
            acl: config.acl,
          })
          .returning();

        return result[0] as unknown as BoardConfigResponse;
      }
    } catch (error) {
      logLine({
        msg: 'BoardsService.upsertBoardConfig error',
        companyId,
        config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get tile configurations for a board
   */
  async getTileConfigs(
    companyId: string,
    board: BoardType
  ): Promise<TileConfigResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(kpiTileConfig)
        .where(
          and(
            eq(kpiTileConfig.company_id, companyId),
            eq(kpiTileConfig.board, board)
          )
        )
        .orderBy(asc(kpiTileConfig.order_no));

      return results as unknown as TileConfigResponse[];
    } catch (error) {
      logLine({
        msg: 'BoardsService.getTileConfigs error',
        companyId,
        board,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all tile configurations for a company
   */
  async getAllTileConfigs(companyId: string): Promise<TileConfigResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(kpiTileConfig)
        .where(eq(kpiTileConfig.company_id, companyId))
        .orderBy(asc(kpiTileConfig.board), asc(kpiTileConfig.order_no));

      return results as unknown as TileConfigResponse[];
    } catch (error) {
      logLine({
        msg: 'BoardsService.getAllTileConfigs error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Upsert tile configuration
   */
  async upsertTileConfig(
    companyId: string,
    config: TileConfigUpsert
  ): Promise<TileConfigResponse> {
    try {
      const existing = await this.dbInstance
        .select()
        .from(kpiTileConfig)
        .where(
          and(
            eq(kpiTileConfig.company_id, companyId),
            eq(kpiTileConfig.board, config.board),
            eq(kpiTileConfig.tile_id, config.tile_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await this.dbInstance
          .update(kpiTileConfig)
          .set({
            kpi: config.kpi,
            viz: config.viz,
            format: config.format,
            targets: config.targets,
            order_no: config.order_no,
            updated_at: new Date(),
          })
          .where(
            and(
              eq(kpiTileConfig.company_id, companyId),
              eq(kpiTileConfig.board, config.board),
              eq(kpiTileConfig.tile_id, config.tile_id)
            )
          )
          .returning();

        return result[0] as unknown as TileConfigResponse;
      } else {
        // Insert new
        const result = await this.dbInstance
          .insert(kpiTileConfig)
          .values({
            company_id: companyId,
            board: config.board,
            tile_id: config.tile_id,
            kpi: config.kpi,
            viz: config.viz,
            format: config.format,
            targets: config.targets,
            order_no: config.order_no,
          })
          .returning();

        return result[0] as unknown as TileConfigResponse;
      }
    } catch (error) {
      logLine({
        msg: 'BoardsService.upsertTileConfig error',
        companyId,
        config,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update tile order
   */
  async updateTileOrder(
    companyId: string,
    board: BoardType,
    tileOrders: { tile_id: string; order_no: number }[]
  ): Promise<void> {
    try {
      for (const { tile_id, order_no } of tileOrders) {
        await this.dbInstance
          .update(kpiTileConfig)
          .set({
            order_no,
            updated_at: new Date(),
          })
          .where(
            and(
              eq(kpiTileConfig.company_id, companyId),
              eq(kpiTileConfig.board, board),
              eq(kpiTileConfig.tile_id, tile_id)
            )
          );
      }
    } catch (error) {
      logLine({
        msg: 'BoardsService.updateTileOrder error',
        companyId,
        board,
        tileOrders,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete tile configuration
   */
  async deleteTileConfig(
    companyId: string,
    board: BoardType,
    tileId: string
  ): Promise<void> {
    try {
      await this.dbInstance
        .delete(kpiTileConfig)
        .where(
          and(
            eq(kpiTileConfig.company_id, companyId),
            eq(kpiTileConfig.board, board),
            eq(kpiTileConfig.tile_id, tileId)
          )
        );
    } catch (error) {
      logLine({
        msg: 'BoardsService.deleteTileConfig error',
        companyId,
        board,
        tileId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete board configuration and all its tiles
   */
  async deleteBoardConfig(companyId: string, board: BoardType): Promise<void> {
    try {
      // Delete all tiles first
      await this.dbInstance
        .delete(kpiTileConfig)
        .where(
          and(
            eq(kpiTileConfig.company_id, companyId),
            eq(kpiTileConfig.board, board)
          )
        );

      // Delete board config
      await this.dbInstance
        .delete(boardConfig)
        .where(
          and(
            eq(boardConfig.company_id, companyId),
            eq(boardConfig.board, board)
          )
        );
    } catch (error) {
      logLine({
        msg: 'BoardsService.deleteBoardConfig error',
        companyId,
        board,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
