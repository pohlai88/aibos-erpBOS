import { db } from '@/lib/db';
import { ulid } from 'ulid';
import {
  eq,
  and,
  desc,
  asc,
  sql,
  inArray,
  isNull,
  isNotNull,
  lt,
  gte,
} from 'drizzle-orm';
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
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  SystemUpsertType,
  ConnectorUpsertType,
  IngestRunReqType,
  SystemResponseType,
  ConnectorResponseType,
} from '@aibos/contracts';

export class ITGCRegistryService {
  constructor(private dbInstance = db) {}

  /**
   * Create or update an IT system
   */
  async upsertSystem(
    companyId: string,
    userId: string,
    data: SystemUpsertType
  ): Promise<SystemResponseType> {
    const systemId = ulid();

    const systemData = {
      id: systemId,
      companyId,
      code: data.code,
      name: data.name,
      kind: data.kind,
      ownerUserId: data.owner_user_id,
      isActive: data.is_active,
      createdAt: new Date(),
    };

    await this.dbInstance
      .insert(itSystem)
      .values(systemData)
      .onConflictDoUpdate({
        target: [itSystem.companyId, itSystem.code],
        set: {
          name: systemData.name,
          kind: systemData.kind,
          ownerUserId: systemData.ownerUserId,
          isActive: systemData.isActive,
        },
      });

    return {
      id: systemId,
      company_id: companyId,
      code: data.code,
      name: data.name,
      kind: data.kind,
      owner_user_id: data.owner_user_id,
      is_active: data.is_active,
      created_at: systemData.createdAt.toISOString(),
    };
  }

  /**
   * Get systems for a company
   */
  async getSystems(
    companyId: string,
    activeOnly = true
  ): Promise<SystemResponseType[]> {
    const query = this.dbInstance
      .select({
        id: itSystem.id,
        companyId: itSystem.companyId,
        code: itSystem.code,
        name: itSystem.name,
        kind: itSystem.kind,
        ownerUserId: itSystem.ownerUserId,
        isActive: itSystem.isActive,
        createdAt: itSystem.createdAt,
        connectorCount: sql<number>`COUNT(${itConnectorProfile.id})`,
      })
      .from(itSystem)
      .leftJoin(
        itConnectorProfile,
        eq(itSystem.id, itConnectorProfile.systemId)
      )
      .where(
        activeOnly
          ? and(eq(itSystem.companyId, companyId), eq(itSystem.isActive, true))
          : eq(itSystem.companyId, companyId)
      )
      .groupBy(itSystem.id)
      .orderBy(asc(itSystem.code));

    const results = await query;

    return results.map(row => ({
      id: row.id,
      company_id: row.companyId,
      code: row.code,
      name: row.name,
      kind: row.kind,
      owner_user_id: row.ownerUserId,
      is_active: row.isActive,
      created_at: row.createdAt.toISOString(),
      connector_count: Number(row.connectorCount),
    }));
  }

  /**
   * Create or update a connector profile
   */
  async upsertConnector(
    companyId: string,
    userId: string,
    data: ConnectorUpsertType
  ): Promise<ConnectorResponseType> {
    const connectorId = ulid();

    const connectorData = {
      id: connectorId,
      companyId,
      systemId: data.system_id,
      connector: data.connector,
      settings: data.settings,
      secretRef: data.secret_ref,
      scheduleCron: data.schedule_cron,
      isEnabled: data.is_enabled,
      createdAt: new Date(),
    };

    await this.dbInstance
      .insert(itConnectorProfile)
      .values(connectorData)
      .onConflictDoUpdate({
        target: [itConnectorProfile.systemId, itConnectorProfile.connector],
        set: {
          settings: connectorData.settings,
          secretRef: connectorData.secretRef,
          scheduleCron: connectorData.scheduleCron,
          isEnabled: connectorData.isEnabled,
        },
      });

    return {
      id: connectorId,
      company_id: companyId,
      system_id: data.system_id,
      connector: data.connector,
      settings: data.settings,
      secret_ref: data.secret_ref,
      schedule_cron: data.schedule_cron,
      is_enabled: data.is_enabled,
      created_at: connectorData.createdAt.toISOString(),
    };
  }

  /**
   * Get connector profiles for a system
   */
  async getConnectors(systemId: string): Promise<ConnectorResponseType[]> {
    const results = await this.dbInstance
      .select()
      .from(itConnectorProfile)
      .where(eq(itConnectorProfile.systemId, systemId))
      .orderBy(asc(itConnectorProfile.connector));

    return results.map(row => ({
      id: row.id,
      company_id: row.companyId,
      system_id: row.systemId,
      connector: row.connector,
      settings: row.settings as Record<string, any>,
      secret_ref: row.secretRef ?? undefined,
      schedule_cron: row.scheduleCron ?? undefined,
      is_enabled: row.isEnabled,
      created_at: row.createdAt.toISOString(),
    }));
  }

  /**
   * Get enabled connectors for scheduled runs
   */
  async getEnabledConnectors(): Promise<ConnectorResponseType[]> {
    const results = await this.dbInstance
      .select()
      .from(itConnectorProfile)
      .where(
        and(
          eq(itConnectorProfile.isEnabled, true),
          isNotNull(itConnectorProfile.scheduleCron)
        )
      )
      .orderBy(asc(itConnectorProfile.scheduleCron));

    return results.map(row => ({
      id: row.id,
      company_id: row.companyId,
      system_id: row.systemId,
      connector: row.connector,
      settings: row.settings as Record<string, any>,
      secret_ref: row.secretRef ?? undefined,
      schedule_cron: row.scheduleCron ?? undefined,
      is_enabled: row.isEnabled,
      created_at: row.createdAt.toISOString(),
    }));
  }

  /**
   * Delete a system (cascade deletes connectors)
   */
  async deleteSystem(companyId: string, systemId: string): Promise<void> {
    await this.dbInstance
      .delete(itSystem)
      .where(and(eq(itSystem.id, systemId), eq(itSystem.companyId, companyId)));
  }

  /**
   * Delete a connector profile
   */
  async deleteConnector(companyId: string, connectorId: string): Promise<void> {
    await this.dbInstance
      .delete(itConnectorProfile)
      .where(
        and(
          eq(itConnectorProfile.id, connectorId),
          eq(itConnectorProfile.companyId, companyId)
        )
      );
  }
}
