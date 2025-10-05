import { db, pool } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import {
    auditGrant,
    auditSession,
    auditDlKey,
    auditAccessLog,
    outbox
} from "@aibos/db-adapter/schema";
import { logLine } from "@/lib/log";

export class AuditHousekeepingService {
    constructor(private dbInstance = db) { }

    /**
     * Clean up expired auditor data
     */
    async cleanupExpiredData(): Promise<{
        expired_sessions: number;
        expired_keys: number;
        expired_grants: number;
    }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Clean up expired sessions
            const sessionsResult = await client.query(
                `DELETE FROM audit_session WHERE expires_at < now()`
            );
            const expiredSessions = sessionsResult.rowCount || 0;

            // Clean up expired download keys
            const keysResult = await client.query(
                `DELETE FROM audit_dl_key WHERE expires_at < now()`
            );
            const expiredKeys = keysResult.rowCount || 0;

            // Soft delete expired grants (update expires_at to now)
            const grantsResult = await client.query(
                `UPDATE audit_grant SET expires_at = now() 
                 WHERE expires_at < now() AND expires_at > now() - interval '1 day'`
            );
            const expiredGrants = grantsResult.rowCount || 0;

            // Emit events for expired grants
            if (expiredGrants > 0) {
                const expiredGrantsResult = await client.query(
                    `SELECT company_id, auditor_id, id, scope, object_id 
                     FROM audit_grant 
                     WHERE expires_at = now() AND expires_at > now() - interval '1 day'`
                );

                for (const grant of expiredGrantsResult.rows) {
                    await client.query(
                        `INSERT INTO outbox (id, topic, payload, created_at)
                         VALUES ($1, 'AUDIT_GRANT_EXPIRED', $2, now())`,
                        [ulid(), JSON.stringify({
                            company_id: grant.company_id,
                            auditor_id: grant.auditor_id,
                            grant_id: grant.id,
                            scope: grant.scope,
                            object_id: grant.object_id
                        })]
                    );
                }
            }

            // Log cleanup activity
            await client.query(
                `INSERT INTO audit_access_log (company_id, auditor_id, scope, object_id, action, ts, meta)
                 VALUES ('SYSTEM', '00000000-0000-0000-0000-000000000000', 'REPORT', 'housekeeping', 'SYSTEM', now(), $1)`,
                [JSON.stringify({
                    cleaned_sessions: expiredSessions,
                    cleaned_keys: expiredKeys,
                    cleaned_grants: expiredGrants
                })]
            );

            await client.query("COMMIT");

            const result = {
                expired_sessions: expiredSessions,
                expired_keys: expiredKeys,
                expired_grants: expiredGrants
            };

            logLine({
                msg: `Audit housekeeping completed`,
                ...result
            });

            return result;

        } catch (error) {
            await client.query("ROLLBACK");
            logLine({
                msg: `Failed to cleanup expired audit data: ${error}`,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Send reminder notifications
     */
    async sendReminders(): Promise<{
        grant_reminders: number;
        request_reminders: number;
    }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Send reminders for grants expiring in 24 hours
            const grantRemindersResult = await client.query(
                `SELECT ag.company_id, ag.auditor_id, ag.id, ag.scope, ag.object_id, ag.expires_at,
                        aa.email as auditor_email, aa.display_name as auditor_name
                 FROM audit_grant ag
                 JOIN audit_auditor aa ON aa.id = ag.auditor_id
                 WHERE ag.expires_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
                   AND ag.expires_at > now()`
            );

            let grantReminders = 0;
            for (const grant of grantRemindersResult.rows) {
                await client.query(
                    `INSERT INTO outbox (id, topic, payload, created_at)
                     VALUES ($1, 'AUDIT_GRANT_EXPIRING', $2, now())`,
                    [ulid(), JSON.stringify({
                        company_id: grant.company_id,
                        auditor_id: grant.auditor_id,
                        grant_id: grant.id,
                        scope: grant.scope,
                        object_id: grant.object_id,
                        expires_at: grant.expires_at.toISOString(),
                        auditor_email: grant.auditor_email,
                        auditor_name: grant.auditor_name,
                        hours_remaining: Math.round((new Date(grant.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
                    })]
                );
                grantReminders++;
            }

            // Send reminders for overdue PBC requests
            const requestRemindersResult = await client.query(
                `SELECT ar.company_id, ar.auditor_id, ar.id, ar.title, ar.due_at,
                        aa.email as auditor_email, aa.display_name as auditor_name
                 FROM audit_request ar
                 JOIN audit_auditor aa ON aa.id = ar.auditor_id
                 WHERE ar.state = 'OPEN' 
                   AND ar.due_at < now() - interval '1 hour'
                   AND ar.due_at > now() - interval '25 hours'`
            );

            let requestReminders = 0;
            for (const request of requestRemindersResult.rows) {
                await client.query(
                    `INSERT INTO outbox (id, topic, payload, created_at)
                     VALUES ($1, 'AUDIT_PBC_OVERDUE', $2, now())`,
                    [ulid(), JSON.stringify({
                        company_id: request.company_id,
                        auditor_id: request.auditor_id,
                        request_id: request.id,
                        title: request.title,
                        due_at: request.due_at.toISOString(),
                        auditor_email: request.auditor_email,
                        auditor_name: request.auditor_name,
                        overdue_hours: Math.round((Date.now() - new Date(request.due_at).getTime()) / (1000 * 60 * 60))
                    })]
                );
                requestReminders++;
            }

            await client.query("COMMIT");

            const result = {
                grant_reminders: grantReminders,
                request_reminders: requestReminders
            };

            logLine({
                msg: `Audit reminders sent`,
                ...result
            });

            return result;

        } catch (error) {
            await client.query("ROLLBACK");
            logLine({
                msg: `Failed to send audit reminders: ${error}`,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get audit workspace statistics
     */
    async getWorkspaceStats(companyId: string): Promise<{
        active_auditors: number;
        active_grants: number;
        open_requests: number;
        total_access_logs: number;
    }> {
        const client = await pool.connect();
        try {
            const statsResult = await client.query(
                `SELECT 
                    (SELECT COUNT(*) FROM audit_auditor WHERE company_id = $1 AND status = 'ACTIVE') as active_auditors,
                    (SELECT COUNT(*) FROM audit_grant WHERE company_id = $1 AND expires_at > now()) as active_grants,
                    (SELECT COUNT(*) FROM audit_request WHERE company_id = $1 AND state = 'OPEN') as open_requests,
                    (SELECT COUNT(*) FROM audit_access_log WHERE company_id = $1) as total_access_logs`,
                [companyId]
            );

            const stats = statsResult.rows[0];
            return {
                active_auditors: parseInt(stats.active_auditors),
                active_grants: parseInt(stats.active_grants),
                open_requests: parseInt(stats.open_requests),
                total_access_logs: parseInt(stats.total_access_logs)
            };

        } catch (error) {
            logLine({
                msg: `Failed to get audit workspace stats: ${error}`,
                companyId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Clean up old access logs (keep last 90 days)
     */
    async cleanupOldAccessLogs(): Promise<number> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM audit_access_log WHERE ts < now() - interval '90 days'`
            );

            const deletedCount = result.rowCount || 0;

            if (deletedCount > 0) {
                logLine({
                    msg: `Cleaned up ${deletedCount} old audit access logs`
                });
            }

            return deletedCount;

        } catch (error) {
            logLine({
                msg: `Failed to cleanup old access logs: ${error}`,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }
}
