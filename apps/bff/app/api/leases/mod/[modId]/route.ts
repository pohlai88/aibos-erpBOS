import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { leaseMod, leaseModLine, leaseComponent, lease } from "@aibos/db-adapter/schema";
import { withRouteErrors, ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { modId: string } }) => { try {
        const modId = params.modId;
        
        // Extract company ID from headers/auth
        const companyId = request.headers.get("x-company-id") || "default";

        // Get modification details
        const modData = await db
            .select({
                id: leaseMod.id,
                leaseId: leaseMod.leaseId,
                effectiveOn: leaseMod.effectiveOn,
                kind: leaseMod.kind,
                reason: leaseMod.reason,
                status: leaseMod.status,
                createdAt: leaseMod.createdAt,
                createdBy: leaseMod.createdBy
            })
            .from(leaseMod)
            .where(and(
                eq(leaseMod.id, modId),
                eq(leaseMod.companyId, companyId)
            ))
            .limit(1);

        if (modData.length === 0) {
            return ok({
                            success: false,
                            error: "Modification not found"
                        }, 404);
        }

        const modification = modData[0]!;

        // Get lease details
        const leaseData = await db
            .select({
                leaseCode: lease.leaseCode
            })
            .from(lease)
            .where(eq(lease.id, modification.leaseId))
            .limit(1);

        // Get modification lines
        const modLines = await db
            .select({
                id: leaseModLine.id,
                leaseComponentId: leaseModLine.leaseComponentId,
                action: leaseModLine.action,
                qtyDelta: leaseModLine.qtyDelta,
                amountDelta: leaseModLine.amountDelta,
                notes: leaseModLine.notes
            })
            .from(leaseModLine)
            .where(eq(leaseModLine.modId, modId));

        // Get component details for lines
        const allocationLines = [];
        for (const line of modLines) {
            let componentCode = 'Unknown';
            let componentName = 'Unknown';

            if (line.leaseComponentId) {
                const component = await db
                    .select({
                        code: leaseComponent.code,
                        name: leaseComponent.name
                    })
                    .from(leaseComponent)
                    .where(eq(leaseComponent.id, line.leaseComponentId))
                    .limit(1);

                if (component.length > 0) {
                    componentCode = component[0]!.code;
                    componentName = component[0]!.name;
                }
            }

            allocationLines.push({
                component_id: line.leaseComponentId,
                component_code: componentCode,
                component_name: componentName,
                action: line.action,
                qty_delta: line.qtyDelta ? Number(line.qtyDelta) : undefined,
                amount_delta: line.amountDelta ? Number(line.amountDelta) : undefined,
                notes: line.notes ? JSON.parse(line.notes as string) : undefined
            });
        }

        const result = {
            mod_id: modification.id,
            lease_id: modification.leaseId,
            lease_code: leaseData[0]?.leaseCode || 'Unknown',
            effective_on: modification.effectiveOn,
            kind: modification.kind,
            reason: modification.reason,
            status: modification.status,
            pre_carrying: {
                total_liability: 0, // Would need to calculate from schedules
                total_rou: 0
            },
            post_carrying: {
                total_liability: 0, // Would need to calculate from schedules
                total_rou: 0
            },
            allocation_lines: allocationLines,
            evidence_links: [], // Would link to evidence vault
            created_at: modification.createdAt.toISOString(),
            created_by: modification.createdBy
        };

        return ok({
                    success: true,
                    data: result
                });

    } catch (error) {
        console.error("Error getting modification detail:", error);

        return ok({
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error"
                }, 500);
    } });
