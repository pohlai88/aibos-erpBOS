import { db, pool } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import {
    auditAuditor,
    auditSession,
    auditAccessLog
} from "@aibos/db-adapter/schema";
import type {
    AuditorLogin,
    AuditorSessionVerify
} from "@aibos/contracts";
import { logLine } from "@/lib/log";
import { createHash } from "crypto";

export class AuditSessionService {
    constructor(private dbInstance = db) { }

    /**
     * Create auditor session (magic link or OTP)
     */
    async createSession(
        companyId: string,
        email: string,
        ip?: string,
        userAgent?: string
    ): Promise<{ magic_code: string; expires_at: string }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Verify auditor exists and is active
            const auditorResult = await client.query(
                `SELECT id, display_name FROM audit_auditor 
                 WHERE company_id = $1 AND email = $2 AND status = 'ACTIVE'`,
                [companyId, email]
            );

            if (auditorResult.rows.length === 0) {
                throw new Error(`Active auditor with email ${email} not found`);
            }

            const auditorId = auditorResult.rows[0].id;
            const displayName = auditorResult.rows[0].display_name;

            // Generate magic code (6-digit)
            const magicCode = Math.floor(100000 + Math.random() * 900000).toString();
            const magicCodeHash = createHash('sha256').update(magicCode).digest('hex');

            // Create session
            const sessionId = ulid();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            await client.query(
                `INSERT INTO audit_session (id, company_id, auditor_id, token_hash, ip, ua, signed_at, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
                [sessionId, companyId, auditorId, magicCodeHash, ip, userAgent, expiresAt]
            );

            // Update last login
            await client.query(
                `UPDATE audit_auditor SET last_login_at = now() WHERE id = $1`,
                [auditorId]
            );

            // Emit outbox event
            await client.query(
                `INSERT INTO outbox (id, topic, payload, created_at)
                 VALUES ($1, 'AUDIT_SESSION_CREATED', $2, now())`,
                [ulid(), JSON.stringify({
                    company_id: companyId,
                    auditor_id: auditorId,
                    session_id: sessionId,
                    email: email,
                    display_name: displayName,
                    ip: ip,
                    user_agent: userAgent
                })]
            );

            await client.query("COMMIT");

            return {
                magic_code: magicCode,
                expires_at: expiresAt.toISOString()
            };

        } catch (error) {
            await client.query("ROLLBACK");
            logLine({
                msg: `Failed to create auditor session: ${error}`,
                companyId,
                email,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Verify session token and return session info
     */
    async verifySession(
        companyId: string,
        magicCode: string,
        ip?: string,
        userAgent?: string
    ): Promise<{ session_token: string; auditor: any; expires_at: string }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const magicCodeHash = createHash('sha256').update(magicCode).digest('hex');

            // Find valid session
            const sessionResult = await client.query(
                `SELECT s.id, s.auditor_id, s.expires_at, a.email, a.display_name, a.status
                 FROM audit_session s
                 JOIN audit_auditor a ON a.id = s.auditor_id
                 WHERE s.company_id = $1 AND s.token_hash = $2 AND s.expires_at > now()`,
                [companyId, magicCodeHash]
            );

            if (sessionResult.rows.length === 0) {
                throw new Error("Invalid or expired magic code");
            }

            const session = sessionResult.rows[0];

            // Check if auditor is still active
            if (session.status !== 'ACTIVE') {
                throw new Error("Auditor account is not active");
            }

            // Update session with current IP/UA
            await client.query(
                `UPDATE audit_session SET ip = $1, ua = $2 WHERE id = $3`,
                [ip, userAgent, session.id]
            );

            // Generate session token
            const sessionToken = ulid();

            await client.query("COMMIT");

            return {
                session_token: sessionToken,
                auditor: {
                    id: session.auditor_id,
                    email: session.email,
                    display_name: session.display_name
                },
                expires_at: session.expires_at.toISOString()
            };

        } catch (error) {
            await client.query("ROLLBACK");
            logLine({
                msg: `Failed to verify auditor session: ${error}`,
                companyId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Validate session token
     */
    async validateSession(
        sessionToken: string,
        companyId: string
    ): Promise<{ auditor_id: string; session_id: string }> {
        const client = await pool.connect();
        try {
            // For now, we'll use a simple validation
            // In production, you'd want to store session tokens in Redis or similar
            const sessionResult = await client.query(
                `SELECT s.id, s.auditor_id, s.expires_at
                 FROM audit_session s
                 WHERE s.company_id = $1 AND s.expires_at > now()
                 ORDER BY s.signed_at DESC
                 LIMIT 1`,
                [companyId]
            );

            if (sessionResult.rows.length === 0) {
                throw new Error("No valid session found");
            }

            const session = sessionResult.rows[0];

            return {
                auditor_id: session.auditor_id,
                session_id: session.id
            };

        } catch (error) {
            logLine({
                msg: `Failed to validate auditor session: ${error}`,
                sessionToken,
                companyId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Log auditor access
     */
    async logAccess(
        companyId: string,
        auditorId: string,
        sessionId: string,
        scope: string,
        objectId: string,
        action: string,
        meta: any = {}
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO audit_access_log (company_id, auditor_id, session_id, scope, object_id, action, ts, meta)
                 VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
                [companyId, auditorId, sessionId, scope, objectId, action, JSON.stringify(meta)]
            );

        } catch (error) {
            logLine({
                msg: `Failed to log auditor access: ${error}`,
                companyId,
                auditorId,
                sessionId,
                scope,
                objectId,
                action,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions(): Promise<number> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM audit_session WHERE expires_at < now()`
            );

            const deletedCount = result.rowCount || 0;

            if (deletedCount > 0) {
                logLine({
                    msg: `Cleaned up ${deletedCount} expired auditor sessions`
                });
            }

            return deletedCount;

        } catch (error) {
            logLine({
                msg: `Failed to cleanup expired sessions: ${error}`,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }
}
