import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, isNull, isNotNull, lt, gte } from "drizzle-orm";
import {
    itSodRule,
    itSodViolation,
    itGrant,
    itUser,
    itEntitlement,
    itSystem,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    SoDRuleUpsertType,
    SoDQueryType,
    ViolationActionType,
    SoDRuleResponseType,
    SoDViolationResponseType
} from "@aibos/contracts";

export class ITGCSoDService {
    constructor(private dbInstance = db) { }

    /**
     * Create or update a SoD rule
     */
    async upsertSoDRule(
        companyId: string,
        userId: string,
        data: SoDRuleUpsertType
    ): Promise<SoDRuleResponseType> {
        const ruleId = ulid();

        const ruleData = {
            id: ruleId,
            companyId,
            code: data.code,
            name: data.name,
            severity: data.severity,
            logic: data.logic,
            active: data.active,
            createdAt: new Date()
        };

        await this.dbInstance
            .insert(itSodRule)
            .values(ruleData)
            .onConflictDoUpdate({
                target: [itSodRule.companyId, itSodRule.code],
                set: {
                    name: ruleData.name,
                    severity: ruleData.severity,
                    logic: ruleData.logic,
                    active: ruleData.active
                }
            });

        return {
            id: ruleId,
            company_id: companyId,
            code: data.code,
            name: data.name,
            severity: data.severity,
            logic: data.logic,
            active: data.active,
            created_at: ruleData.createdAt.toISOString()
        };
    }

    /**
     * Get SoD rules for a company
     */
    async getSoDRules(companyId: string, activeOnly = true): Promise<SoDRuleResponseType[]> {
        const query = this.dbInstance
            .select({
                id: itSodRule.id,
                companyId: itSodRule.companyId,
                code: itSodRule.code,
                name: itSodRule.name,
                severity: itSodRule.severity,
                logic: itSodRule.logic,
                active: itSodRule.active,
                createdAt: itSodRule.createdAt,
                violationCount: sql<number>`COUNT(${itSodViolation.id})`
            })
            .from(itSodRule)
            .leftJoin(itSodViolation, eq(itSodRule.id, itSodViolation.ruleId))
            .where(
                activeOnly
                    ? and(eq(itSodRule.companyId, companyId), eq(itSodRule.active, true))
                    : eq(itSodRule.companyId, companyId)
            )
            .groupBy(itSodRule.id)
            .orderBy(asc(itSodRule.code));

        const results = await query;

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            code: row.code,
            name: row.name,
            severity: row.severity,
            logic: row.logic as Record<string, any>,
            active: row.active,
            created_at: row.createdAt.toISOString(),
            violation_count: Number(row.violationCount)
        }));
    }

    /**
     * Evaluate all active SoD rules for violations
     */
    async evaluateSoDRules(companyId: string): Promise<{ violations_found: number; rules_evaluated: number }> {
        const activeRules = await this.getSoDRules(companyId, true);
        let violationsFound = 0;

        for (const rule of activeRules) {
            try {
                const violations = await this.evaluateRule(companyId, rule);
                violationsFound += violations.length;
            } catch (error) {
                console.error(`Failed to evaluate rule ${rule.code}:`, error);
            }
        }

        return {
            violations_found: violationsFound,
            rules_evaluated: activeRules.length
        };
    }

    /**
     * Evaluate a specific SoD rule
     */
    private async evaluateRule(companyId: string, rule: SoDRuleResponseType): Promise<any[]> {
        const violations: any[] = [];

        // Parse rule logic
        const { type, entitlements = [], roles = [] } = rule.logic as any;

        if (type === 'allOf') {
            // User must have ALL specified entitlements/roles
            violations.push(...await this.findAllOfViolations(companyId, rule, entitlements, roles));
        } else if (type === 'anyOf') {
            // User must have ANY of the specified entitlements/roles
            violations.push(...await this.findAnyOfViolations(companyId, rule, entitlements, roles));
        }

        return violations;
    }

    /**
     * Find violations where users have ALL specified entitlements/roles
     */
    private async findAllOfViolations(
        companyId: string,
        rule: SoDRuleResponseType,
        entitlements: string[],
        roles: string[]
    ): Promise<any[]> {
        const violations: any[] = [];

        // Get users who have grants for ALL specified entitlements
        if (entitlements.length > 0) {
            const entitlementViolations = await this.dbInstance.execute(sql`
                SELECT DISTINCT g.user_id, g.system_id
                FROM it_grant g
                JOIN it_entitlement e ON g.entitlement_id = e.id
                WHERE g.company_id = ${companyId}
                AND e.code = ANY(${entitlements})
                GROUP BY g.user_id, g.system_id
                HAVING COUNT(DISTINCT e.code) = ${entitlements.length}
            `);

            for (const violation of entitlementViolations.rows) {
                const explanation = await this.buildViolationExplanation(
                    companyId,
                    violation.user_id as string,
                    violation.system_id as string,
                    entitlements,
                    roles
                );

                const violationId = await this.createViolation(companyId, rule.id, violation, explanation);
                violations.push(violationId);
            }
        }

        return violations;
    }

    /**
     * Find violations where users have ANY of the specified entitlements/roles
     */
    private async findAnyOfViolations(
        companyId: string,
        rule: SoDRuleResponseType,
        entitlements: string[],
        roles: string[]
    ): Promise<any[]> {
        const violations: any[] = [];

        // Get users who have grants for ANY specified entitlements
        if (entitlements.length > 0) {
            const entitlementViolations = await this.dbInstance.execute(sql`
                SELECT DISTINCT g.user_id, g.system_id
                FROM it_grant g
                JOIN it_entitlement e ON g.entitlement_id = e.id
                WHERE g.company_id = ${companyId}
                AND e.code = ANY(${entitlements})
            `);

            for (const violation of entitlementViolations.rows) {
                const explanation = await this.buildViolationExplanation(
                    companyId,
                    violation.user_id as string,
                    violation.system_id as string,
                    entitlements,
                    roles
                );

                const violationId = await this.createViolation(companyId, rule.id, violation, explanation);
                violations.push(violationId);
            }
        }

        return violations;
    }

    /**
     * Build explanation for a violation
     */
    private async buildViolationExplanation(
        companyId: string,
        userId: string,
        systemId: string,
        entitlements: string[],
        roles: string[]
    ): Promise<any> {
        const explanation: any = {
            user_id: userId,
            system_id: systemId,
            matched_entitlements: [],
            matched_roles: [],
            grants: []
        };

        // Get matching grants
        const grants = await this.dbInstance.execute(sql`
            SELECT g.*, e.code as entitlement_code, e.name as entitlement_name, e.kind as entitlement_kind
            FROM it_grant g
            JOIN it_entitlement e ON g.entitlement_id = e.id
            WHERE g.company_id = ${companyId}
            AND g.user_id = ${userId}
            AND g.system_id = ${systemId}
            AND e.code = ANY(${entitlements})
        `);

        for (const grant of grants.rows) {
            explanation.matched_entitlements.push({
                code: grant.entitlement_code,
                name: grant.entitlement_name,
                kind: grant.entitlement_kind
            });

            explanation.grants.push({
                id: grant.id,
                entitlement_code: grant.entitlement_code,
                granted_at: grant.granted_at,
                expires_at: grant.expires_at,
                source: grant.source
            });
        }

        return explanation;
    }

    /**
     * Create a SoD violation record
     */
    private async createViolation(
        companyId: string,
        ruleId: string,
        violation: any,
        explanation: any
    ): Promise<string> {
        const violationId = ulid();

        await this.dbInstance.insert(itSodViolation).values({
            id: violationId,
            companyId,
            ruleId,
            systemId: violation.system_id,
            userId: violation.user_id,
            detectedAt: new Date(),
            status: 'OPEN',
            explanation
        });

        // Emit violation event
        await this.emitViolationEvent(companyId, violationId, 'found');

        return violationId;
    }

    /**
     * Get SoD violations with filtering
     */
    async getSoDViolations(query: SoDQueryType): Promise<SoDViolationResponseType[]> {
        let whereConditions = [eq(itSodViolation.companyId, query.company_id!)];

        if (query.system_id) {
            whereConditions.push(eq(itSodViolation.systemId, query.system_id));
        }

        if (query.user_id) {
            whereConditions.push(eq(itSodViolation.userId, query.user_id));
        }

        if (query.status) {
            whereConditions.push(eq(itSodViolation.status, query.status));
        }

        if (query.severity) {
            whereConditions.push(eq(itSodRule.severity, query.severity));
        }

        const results = await this.dbInstance
            .select({
                id: itSodViolation.id,
                companyId: itSodViolation.companyId,
                ruleId: itSodViolation.ruleId,
                systemId: itSodViolation.systemId,
                userId: itSodViolation.userId,
                detectedAt: itSodViolation.detectedAt,
                status: itSodViolation.status,
                note: itSodViolation.note,
                explanation: itSodViolation.explanation,
                rule: {
                    id: itSodRule.id,
                    companyId: itSodRule.companyId,
                    code: itSodRule.code,
                    name: itSodRule.name,
                    severity: itSodRule.severity,
                    logic: itSodRule.logic,
                    active: itSodRule.active,
                    createdAt: itSodRule.createdAt
                },
                user: {
                    id: itUser.id,
                    companyId: itUser.companyId,
                    systemId: itUser.systemId,
                    extId: itUser.extId,
                    email: itUser.email,
                    displayName: itUser.displayName,
                    status: itUser.status,
                    firstSeen: itUser.firstSeen,
                    lastSeen: itUser.lastSeen
                },
                system: {
                    id: itSystem.id,
                    companyId: itSystem.companyId,
                    code: itSystem.code,
                    name: itSystem.name,
                    kind: itSystem.kind,
                    ownerUserId: itSystem.ownerUserId,
                    isActive: itSystem.isActive,
                    createdAt: itSystem.createdAt
                }
            })
            .from(itSodViolation)
            .leftJoin(itSodRule, eq(itSodViolation.ruleId, itSodRule.id))
            .leftJoin(itUser, eq(itSodViolation.userId, itUser.id))
            .leftJoin(itSystem, eq(itSodViolation.systemId, itSystem.id))
            .where(and(...whereConditions))
            .orderBy(desc(itSodViolation.detectedAt))
            .limit(query.paging.limit)
            .offset(query.paging.offset);

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            rule_id: row.ruleId,
            system_id: row.systemId,
            user_id: row.userId,
            detected_at: row.detectedAt.toISOString(),
            status: row.status,
            note: row.note ?? undefined,
            explanation: row.explanation as Record<string, any> | undefined,
            rule: row.rule ? {
                id: row.rule.id,
                company_id: row.rule.companyId,
                code: row.rule.code,
                name: row.rule.name,
                severity: row.rule.severity,
                logic: row.rule.logic as Record<string, any>,
                active: row.rule.active,
                created_at: row.rule.createdAt.toISOString()
            } : undefined,
            user: row.user ? {
                id: row.user.id,
                company_id: row.user.companyId,
                system_id: row.user.systemId,
                ext_id: row.user.extId,
                email: row.user.email ?? undefined,
                display_name: row.user.displayName ?? undefined,
                status: row.user.status,
                first_seen: row.user.firstSeen.toISOString(),
                last_seen: row.user.lastSeen.toISOString()
            } : undefined,
            system: row.system ? {
                id: row.system.id,
                company_id: row.system.companyId,
                code: row.system.code,
                name: row.system.name,
                kind: row.system.kind,
                owner_user_id: row.system.ownerUserId,
                is_active: row.system.isActive,
                created_at: row.system.createdAt.toISOString()
            } : undefined
        }));
    }

    /**
     * Take action on a SoD violation (waive or resolve)
     */
    async takeViolationAction(
        companyId: string,
        userId: string,
        data: ViolationActionType
    ): Promise<void> {
        const newStatus = data.action === 'waive' ? 'WAIVED' : 'RESOLVED';

        await this.dbInstance
            .update(itSodViolation)
            .set({
                status: newStatus,
                note: data.note
            })
            .where(
                and(
                    eq(itSodViolation.id, data.violation_id),
                    eq(itSodViolation.companyId, companyId)
                )
            );

        // Emit violation event
        await this.emitViolationEvent(companyId, data.violation_id, data.action);
    }

    /**
     * Delete a SoD rule
     */
    async deleteSoDRule(companyId: string, ruleId: string): Promise<void> {
        await this.dbInstance
            .delete(itSodRule)
            .where(
                and(
                    eq(itSodRule.id, ruleId),
                    eq(itSodRule.companyId, companyId)
                )
            );
    }

    /**
     * Emit SoD violation event
     */
    private async emitViolationEvent(
        companyId: string,
        violationId: string,
        action: string
    ): Promise<void> {
        await this.dbInstance.insert(outbox).values({
            id: ulid(),
            topic: 'itgc.sod',
            payload: JSON.stringify({
                event_type: `sod_violation_${action}`,
                company_id: companyId,
                violation_id: violationId
            }),
            createdAt: new Date()
        });
    }
}
