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
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  IngestRunReqType,
  UserResponseType,
  EntitlementResponseType,
  ItGrantResponseType,
} from '@aibos/contracts';

export class ITGCIngestService {
  constructor(private dbInstance = db) {}

  /**
   * Run data ingestion for a specific system or all enabled connectors
   */
  async runIngestion(
    companyId: string,
    userId: string,
    data: IngestRunReqType
  ): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      // Get connectors to run
      const connectors = data.system_id
        ? await this.getConnectorsForSystem(companyId, data.system_id)
        : await this.getEnabledConnectors(companyId);

      for (const connector of connectors) {
        try {
          const result = await this.runConnector(companyId, userId, connector);
          processed += result.processed;
        } catch (error) {
          const errorMsg = `Connector ${connector.connector} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      // Emit event
      await this.emitIngestEvent(companyId, userId, {
        success: errors.length === 0,
        processed,
        errors: errors.length,
      });

      return { success: errors.length === 0, processed, errors };
    } catch (error) {
      console.error('Ingestion run failed:', error);
      return {
        success: false,
        processed,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Run a specific connector
   */
  private async runConnector(
    companyId: string,
    userId: string,
    connector: any
  ): Promise<{ processed: number }> {
    const startTime = new Date();
    let processed = 0;

    try {
      // Emit start event
      await this.emitConnectorEvent(companyId, userId, connector.id, 'started');

      switch (connector.connector) {
        case 'SCIM':
          processed = await this.runSCIMConnector(companyId, connector);
          break;
        case 'SAML':
          processed = await this.runSAMLConnector(companyId, connector);
          break;
        case 'OIDC':
          processed = await this.runOIDCConnector(companyId, connector);
          break;
        case 'SQL':
          processed = await this.runSQLConnector(companyId, connector);
          break;
        case 'CSV':
          processed = await this.runCSVConnector(companyId, connector);
          break;
        case 'API':
          processed = await this.runAPIConnector(companyId, connector);
          break;
        default:
          throw new Error(`Unsupported connector type: ${connector.connector}`);
      }

      // Emit completion event
      await this.emitConnectorEvent(
        companyId,
        userId,
        connector.id,
        'completed',
        {
          processed,
          duration_ms: Date.now() - startTime.getTime(),
        }
      );

      return { processed };
    } catch (error) {
      // Emit failure event
      await this.emitConnectorEvent(companyId, userId, connector.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * SCIM connector implementation
   */
  private async runSCIMConnector(
    companyId: string,
    connector: any
  ): Promise<number> {
    // TODO: Implement SCIM connector
    // This would typically:
    // 1. Authenticate using secret_ref
    // 2. Fetch users and groups from SCIM endpoint
    // 3. Upsert users, roles, entitlements, grants
    // 4. Mark last_seen timestamps
    // 5. Close orphaned records

    console.log(
      `SCIM connector for system ${connector.system_id} - placeholder implementation`
    );
    return 0;
  }

  /**
   * SAML connector implementation
   */
  private async runSAMLConnector(
    companyId: string,
    connector: any
  ): Promise<number> {
    // TODO: Implement SAML connector
    console.log(
      `SAML connector for system ${connector.system_id} - placeholder implementation`
    );
    return 0;
  }

  /**
   * OIDC connector implementation
   */
  private async runOIDCConnector(
    companyId: string,
    connector: any
  ): Promise<number> {
    // TODO: Implement OIDC connector
    console.log(
      `OIDC connector for system ${connector.system_id} - placeholder implementation`
    );
    return 0;
  }

  /**
   * SQL connector implementation
   */
  private async runSQLConnector(
    companyId: string,
    connector: any
  ): Promise<number> {
    // TODO: Implement SQL connector
    // This would typically:
    // 1. Connect to database using secret_ref
    // 2. Execute configured queries for users, roles, grants
    // 3. Upsert records with proper mapping
    // 4. Handle schema differences

    console.log(
      `SQL connector for system ${connector.system_id} - placeholder implementation`
    );
    return 0;
  }

  /**
   * CSV connector implementation
   */
  private async runCSVConnector(
    companyId: string,
    connector: any
  ): Promise<number> {
    // TODO: Implement CSV connector
    // This would typically:
    // 1. Download CSV from configured endpoint
    // 2. Parse CSV with configured mapping
    // 3. Upsert records
    // 4. Handle validation errors

    console.log(
      `CSV connector for system ${connector.system_id} - placeholder implementation`
    );
    return 0;
  }

  /**
   * API connector implementation
   */
  private async runAPIConnector(
    companyId: string,
    connector: any
  ): Promise<number> {
    // TODO: Implement API connector
    // This would typically:
    // 1. Authenticate using secret_ref
    // 2. Call configured API endpoints
    // 3. Transform response data
    // 4. Upsert records

    console.log(
      `API connector for system ${connector.system_id} - placeholder implementation`
    );
    return 0;
  }

  /**
   * Upsert users from connector data
   */
  private async upsertUsers(
    companyId: string,
    systemId: string,
    users: any[]
  ): Promise<number> {
    let processed = 0;

    for (const userData of users) {
      const userRecord = {
        id: ulid(),
        companyId,
        systemId,
        extId: userData.ext_id,
        email: userData.email,
        displayName: userData.display_name,
        status: userData.status || 'ACTIVE',
        firstSeen: new Date(),
        lastSeen: new Date(),
      };

      await this.dbInstance
        .insert(itUser)
        .values(userRecord)
        .onConflictDoUpdate({
          target: [itUser.companyId, itUser.systemId, itUser.extId],
          set: {
            email: userRecord.email,
            displayName: userRecord.displayName,
            status: userRecord.status,
            lastSeen: userRecord.lastSeen,
          },
        });

      processed++;
    }

    return processed;
  }

  /**
   * Upsert roles from connector data
   */
  private async upsertRoles(
    companyId: string,
    systemId: string,
    roles: any[]
  ): Promise<number> {
    let processed = 0;

    for (const roleData of roles) {
      const roleRecord = {
        id: ulid(),
        companyId,
        systemId,
        code: roleData.code,
        name: roleData.name,
        critical: roleData.critical || false,
      };

      await this.dbInstance
        .insert(itRole)
        .values(roleRecord)
        .onConflictDoUpdate({
          target: [itRole.companyId, itRole.systemId, itRole.code],
          set: {
            name: roleRecord.name,
            critical: roleRecord.critical,
          },
        });

      processed++;
    }

    return processed;
  }

  /**
   * Upsert entitlements from connector data
   */
  private async upsertEntitlements(
    companyId: string,
    systemId: string,
    entitlements: any[]
  ): Promise<number> {
    let processed = 0;

    for (const entitlementData of entitlements) {
      const entitlementRecord = {
        id: ulid(),
        companyId,
        systemId,
        kind: entitlementData.kind,
        code: entitlementData.code,
        name: entitlementData.name,
      };

      await this.dbInstance
        .insert(itEntitlement)
        .values(entitlementRecord)
        .onConflictDoUpdate({
          target: [
            itEntitlement.companyId,
            itEntitlement.systemId,
            itEntitlement.kind,
            itEntitlement.code,
          ],
          set: {
            name: entitlementRecord.name,
          },
        });

      processed++;
    }

    return processed;
  }

  /**
   * Upsert grants from connector data
   */
  private async upsertGrants(
    companyId: string,
    systemId: string,
    grants: any[]
  ): Promise<number> {
    let processed = 0;

    for (const grantData of grants) {
      const grantRecord = {
        id: ulid(),
        companyId,
        systemId,
        userId: grantData.user_id,
        entitlementId: grantData.entitlement_id,
        grantedAt: new Date(grantData.granted_at),
        expiresAt: grantData.expires_at ? new Date(grantData.expires_at) : null,
        source: grantData.source || 'MANUAL',
        reason: grantData.reason,
        createdAt: new Date(),
      };

      await this.dbInstance
        .insert(itGrant)
        .values(grantRecord)
        .onConflictDoUpdate({
          target: [
            itGrant.companyId,
            itGrant.systemId,
            itGrant.userId,
            itGrant.entitlementId,
          ],
          set: {
            grantedAt: grantRecord.grantedAt,
            expiresAt: grantRecord.expiresAt,
            source: grantRecord.source,
            reason: grantRecord.reason,
          },
        });

      processed++;
    }

    return processed;
  }

  /**
   * Get connectors for a specific system
   */
  private async getConnectorsForSystem(
    companyId: string,
    systemId: string
  ): Promise<any[]> {
    const results = await this.dbInstance
      .select()
      .from(itConnectorProfile)
      .where(
        and(
          eq(itConnectorProfile.companyId, companyId),
          eq(itConnectorProfile.systemId, systemId),
          eq(itConnectorProfile.isEnabled, true)
        )
      );

    return results;
  }

  /**
   * Get all enabled connectors for a company
   */
  private async getEnabledConnectors(companyId: string): Promise<any[]> {
    const results = await this.dbInstance
      .select()
      .from(itConnectorProfile)
      .where(
        and(
          eq(itConnectorProfile.companyId, companyId),
          eq(itConnectorProfile.isEnabled, true)
        )
      );

    return results;
  }

  /**
   * Emit ingestion event
   */
  private async emitIngestEvent(
    companyId: string,
    userId: string,
    data: any
  ): Promise<void> {
    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'itgc.ingest',
      payload: JSON.stringify({
        event_type: 'ingest_completed',
        company_id: companyId,
        user_id: userId,
        ...data,
      }),
      createdAt: new Date(),
    });
  }

  /**
   * Emit connector event
   */
  private async emitConnectorEvent(
    companyId: string,
    userId: string,
    connectorId: string,
    status: string,
    data: any = {}
  ): Promise<void> {
    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'itgc.connector',
      payload: JSON.stringify({
        event_type: `connector_run_${status}`,
        company_id: companyId,
        user_id: userId,
        connector_id: connectorId,
        ...data,
      }),
      createdAt: new Date(),
    });
  }
}
