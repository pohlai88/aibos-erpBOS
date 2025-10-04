import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { PlaybookStudioService } from "../playbook-studio";
import { db } from "@/lib/db";
import type {
    PlaybookVersionUpsert,
    RuleVersionUpsert,
    VisualEditorSave,
    VisualEditorLoad,
    CanaryExecutionRequest,
    ApprovalRequestCreate,
    ApprovalDecision,
    ActionVerificationRequest,
    ExecutionMetricsQuery,
    BlastRadiusQuery,
    VersionHistoryQuery
} from "@aibos/contracts";

// Mock the database
vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
}));

describe("PlaybookStudioService", () => {
    let service: PlaybookStudioService;
    let mockDb: any;

    beforeEach(() => {
        service = new PlaybookStudioService();
        mockDb = db as any;
        vi.clearAllMocks();
    });

    describe("Playbook Versioning", () => {
        it("should create playbook version with correct version number", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: PlaybookVersionUpsert = {
                playbook_id: "pb-789",
                name: "Test Playbook v2",
                description: "Updated playbook",
                steps: [
                    {
                        action_code: "ar_send_dunning",
                        payload: { template_id: "template-v2" },
                        on_error: "CONTINUE"
                    }
                ],
                max_blast_radius: 50,
                dry_run_default: true,
                require_dual_control: false,
                timeout_sec: 300,
                change_summary: "Added new template"
            };

            // Mock latest version query
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue([{ version_no: 1 }])
                        })
                    })
                })
            });

            // Mock insert
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: "version-123",
                        company_id: companyId,
                        playbook_id: data.playbook_id,
                        version_no: 2,
                        name: data.name,
                        description: data.description,
                        steps: data.steps,
                        max_blast_radius: data.max_blast_radius,
                        dry_run_default: data.dry_run_default,
                        require_dual_control: data.require_dual_control,
                        timeout_sec: data.timeout_sec,
                        change_summary: data.change_summary,
                        is_active: true,
                        created_by: userId,
                        created_at: new Date("2024-01-01T00:00:00Z"),
                        updated_at: new Date("2024-01-01T00:00:00Z")
                    }])
                })
            });

            const result = await service.createPlaybookVersion(companyId, userId, data);

            expect(result).toEqual({
                id: "version-123",
                company_id: companyId,
                playbook_id: data.playbook_id,
                version_no: 2,
                name: data.name,
                description: data.description,
                steps: data.steps,
                max_blast_radius: data.max_blast_radius,
                dry_run_default: data.dry_run_default,
                require_dual_control: data.require_dual_control,
                timeout_sec: data.timeout_sec,
                change_summary: data.change_summary,
                is_active: true,
                created_by: userId,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z"
            });
        });

        it("should get playbook version history", async () => {
            const companyId = "company-123";
            const playbookId = "pb-789";
            const query: VersionHistoryQuery = {
                playbook_id: playbookId,
                limit: 10,
                offset: 0
            };

            const mockVersions = [
                {
                    id: "version-1",
                    version_no: 2,
                    name: "Test Playbook v2",
                    change_summary: "Added new template",
                    is_active: true,
                    created_by: "user-456",
                    created_at: new Date("2024-01-01T00:00:00Z"),
                    updated_at: new Date("2024-01-01T00:00:00Z")
                },
                {
                    id: "version-2",
                    version_no: 1,
                    name: "Test Playbook v1",
                    change_summary: "Initial version",
                    is_active: false,
                    created_by: "user-456",
                    created_at: new Date("2023-12-01T00:00:00Z"),
                    updated_at: new Date("2023-12-01T00:00:00Z")
                }
            ];

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                offset: vi.fn().mockResolvedValue(mockVersions)
                            })
                        })
                    })
                })
            });

            const result = await service.getPlaybookVersionHistory(companyId, playbookId, query);

            expect(result).toHaveLength(2);
            expect(result[0]!.version_no).toBe(2);
            expect(result[0]!.is_active).toBe(true);
            expect(result[1]!.version_no).toBe(1);
            expect(result[1]!.is_active).toBe(false);
        });
    });

    describe("Rule Versioning", () => {
        it("should create rule version with correct version number", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: RuleVersionUpsert = {
                rule_id: "rule-789",
                name: "Test Rule v2",
                enabled: true,
                severity: "HIGH",
                when_expr: { condition: "dso > 30" },
                window_sec: 3600,
                threshold: { min_value: 1000 },
                throttle_sec: 1800,
                approvals: 1,
                action_playbook_id: "pb-123",
                change_summary: "Updated threshold"
            };

            // Mock latest version query
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue([{ version_no: 1 }])
                        })
                    })
                })
            });

            // Mock insert
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: "version-123",
                        company_id: companyId,
                        rule_id: data.rule_id,
                        version_no: 2,
                        name: data.name,
                        enabled: data.enabled,
                        severity: data.severity,
                        when_expr: data.when_expr,
                        window_sec: data.window_sec,
                        threshold: data.threshold,
                        throttle_sec: data.throttle_sec,
                        approvals: data.approvals,
                        action_playbook_id: data.action_playbook_id,
                        change_summary: data.change_summary,
                        is_active: true,
                        created_by: userId,
                        created_at: new Date("2024-01-01T00:00:00Z"),
                        updated_at: new Date("2024-01-01T00:00:00Z")
                    }])
                })
            });

            const result = await service.createRuleVersion(companyId, userId, data);

            expect(result.version_no).toBe(2);
            expect(result.name).toBe(data.name);
            expect(result.enabled).toBe(data.enabled);
            expect(result.severity).toBe(data.severity);
        });
    });

    describe("Visual Editor", () => {
        it("should save playbook from visual editor", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: VisualEditorSave = {
                playbook_id: "pb-789",
                name: "Visual Playbook",
                description: "Created from visual editor",
                definition: {
                    steps: [
                        {
                            action_code: "ar_send_dunning",
                            payload: { template_id: "template-v2" }
                        }
                    ],
                    max_blast_radius: 50,
                    dry_run_default: true,
                    require_dual_control: false,
                    timeout_sec: 300
                },
                auto_version: true,
                change_summary: "Created from visual editor"
            };

            // Mock the createPlaybookVersion method
            const createPlaybookVersionSpy = vi.spyOn(service, 'createPlaybookVersion')
                .mockResolvedValue({
                    id: "version-123",
                    company_id: companyId,
                    playbook_id: data.playbook_id!,
                    version_no: 1,
                    name: data.name,
                    description: data.description,
                    steps: data.definition.steps,
                    max_blast_radius: data.definition.max_blast_radius,
                    dry_run_default: data.definition.dry_run_default,
                    require_dual_control: data.definition.require_dual_control,
                    timeout_sec: data.definition.timeout_sec,
                    change_summary: data.change_summary,
                    is_active: true,
                    created_by: userId,
                    created_at: "2024-01-01T00:00:00.000Z",
                    updated_at: "2024-01-01T00:00:00.000Z"
                });

            const result = await service.saveFromVisualEditor(companyId, userId, data);

            expect(createPlaybookVersionSpy).toHaveBeenCalledWith(companyId, userId, {
                playbook_id: data.playbook_id,
                name: data.name,
                description: data.description,
                steps: data.definition.steps,
                max_blast_radius: data.definition.max_blast_radius,
                dry_run_default: data.definition.dry_run_default,
                require_dual_control: data.definition.require_dual_control,
                timeout_sec: data.definition.timeout_sec,
                change_summary: data.change_summary
            });

            expect(result).toEqual({
                playbook_id: data.playbook_id,
                version_no: 1
            });
        });

        it("should load playbook for visual editor", async () => {
            const companyId = "company-123";
            const query: VisualEditorLoad = {
                playbook_id: "pb-789",
                version_no: 1
            };

            const mockPlaybookVersion = {
                id: "version-123",
                playbook_id: query.playbook_id,
                version_no: query.version_no,
                name: "Test Playbook",
                description: "Test description",
                steps: [{ action_code: "ar_send_dunning", payload: {} }],
                max_blast_radius: 50,
                dry_run_default: true,
                require_dual_control: false,
                timeout_sec: 300
            };

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockPlaybookVersion])
                    })
                })
            });

            const result = await service.loadForVisualEditor(companyId, query);

            expect(result).toEqual({
                type: "playbook",
                id: query.playbook_id,
                version_no: query.version_no,
                name: mockPlaybookVersion.name,
                description: mockPlaybookVersion.description,
                steps: mockPlaybookVersion.steps,
                max_blast_radius: mockPlaybookVersion.max_blast_radius,
                dry_run_default: mockPlaybookVersion.dry_run_default,
                require_dual_control: mockPlaybookVersion.require_dual_control,
                timeout_sec: mockPlaybookVersion.timeout_sec
            });
        });
    });

    describe("Dry-Run Execution", () => {
        it("should execute dry-run sandbox test", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const playbookId = "pb-789";
            const versionNo = 1;
            const payload = { customer_segment: "enterprise" };

            const mockPlaybookVersion = {
                id: "version-123",
                playbook_id: playbookId,
                version_no: versionNo,
                steps: [
                    {
                        action_code: "ar_send_dunning",
                        payload: { template_id: "template-v2" }
                    }
                ]
            };

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockPlaybookVersion])
                    })
                })
            });

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: "execution-123",
                        company_id: companyId,
                        playbook_id: playbookId,
                        version_no: versionNo,
                        execution_id: "exec-123",
                        steps: [],
                        total_duration_ms: 1000,
                        created_by: userId,
                        status: "COMPLETED"
                    }])
                })
            });

            const result = await service.executeDryRun(companyId, userId, playbookId, versionNo, payload);

            expect(result.execution_id).toBeDefined();
            expect(result.steps).toBeDefined();
            expect(result.total_duration_ms).toBeGreaterThan(0);
        });
    });

    describe("Canary Mode", () => {
        it("should execute canary mode deployment", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: CanaryExecutionRequest = {
                fire_id: "fire-123",
                playbook_id: "pb-789",
                canary_scope: {
                    entity_type: "customer",
                    filter_criteria: { segment: "enterprise" },
                    percentage: 5,
                    max_entities: 10
                },
                dry_run: false
            };

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: "canary-123",
                        company_id: companyId,
                        fire_id: data.fire_id,
                        playbook_id: data.playbook_id,
                        canary_scope: data.canary_scope,
                        execution_id: "exec-123",
                        status: "PENDING",
                        created_by: userId,
                        created_at: new Date("2024-01-01T00:00:00Z"),
                        updated_at: new Date("2024-01-01T00:00:00Z")
                    }])
                })
            });

            const result = await service.executeCanary(companyId, userId, data);

            expect(result.canary_id).toBeDefined();
            expect(result.execution_id).toBeDefined();
            expect(result.status).toBe("PENDING");
            expect(result.canary_scope).toEqual(data.canary_scope);
        });
    });

    describe("Approval Workflow", () => {
        it("should create approval request", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: ApprovalRequestCreate = {
                fire_id: "fire-123",
                playbook_id: "pb-789",
                approval_type: "BLAST_RADIUS",
                impact_estimate: {
                    customers_affected: 25,
                    estimated_impact: "Medium risk"
                },
                diff_summary: {
                    changes: ["Updated dunning template"],
                    risk_factors: ["New template not tested"]
                },
                blast_radius_count: 25,
                risk_score: 0.3,
                expires_in_hours: 24
            };

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: "approval-123",
                        company_id: companyId,
                        fire_id: data.fire_id,
                        playbook_id: data.playbook_id,
                        requested_by: userId,
                        approval_type: data.approval_type,
                        impact_estimate: data.impact_estimate,
                        diff_summary: data.diff_summary,
                        blast_radius_count: data.blast_radius_count,
                        risk_score: data.risk_score,
                        status: "PENDING",
                        expires_at: new Date("2024-01-02T00:00:00Z"),
                        created_at: new Date("2024-01-01T00:00:00Z"),
                        updated_at: new Date("2024-01-01T00:00:00Z")
                    }])
                })
            });

            const result = await service.createApprovalRequest(companyId, userId, data);

            expect(result.id).toBeDefined();
            expect(result.status).toBe("PENDING");
            expect(result.approval_type).toBe(data.approval_type);
            expect(result.risk_score).toBe(data.risk_score);
        });

        it("should process approval decision", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: ApprovalDecision = {
                approval_id: "approval-123",
                decision: "APPROVE",
                reason: "Low risk, approved for execution"
            };

            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{
                            id: data.approval_id,
                            company_id: companyId,
                            fire_id: "fire-123",
                            playbook_id: "pb-789",
                            requested_by: "user-123",
                            approval_type: "BLAST_RADIUS",
                            impact_estimate: {},
                            diff_summary: {},
                            blast_radius_count: 25,
                            risk_score: 0.3,
                            status: "APPROVED",
                            approved_by: userId,
                            approved_at: new Date("2024-01-01T00:00:00Z"),
                            expires_at: new Date("2024-01-02T00:00:00Z"),
                            created_at: new Date("2024-01-01T00:00:00Z"),
                            updated_at: new Date("2024-01-01T00:00:00Z")
                        }])
                    })
                })
            });

            const result = await service.processApprovalDecision(companyId, userId, data);

            expect(result.status).toBe("APPROVED");
            expect(result.approved_by).toBe(userId);
            expect(result.approved_at).toBeDefined();
        });
    });

    describe("Action Verification", () => {
        it("should verify action outcome", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: ActionVerificationRequest = {
                fire_id: "fire-123",
                step_id: "step-789",
                action_code: "ar_send_dunning",
                verification_type: "OUTCOME_CHECK",
                expected_outcome: {
                    emails_sent: 25,
                    success_rate: 95
                },
                verification_rules: [
                    {
                        rule_type: "success_rate",
                        threshold: { min: 90 },
                        action: "PASS"
                    }
                ]
            };

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: "verification-123",
                        company_id: companyId,
                        fire_id: data.fire_id,
                        step_id: data.step_id,
                        action_code: data.action_code,
                        verification_type: data.verification_type,
                        expected_outcome: data.expected_outcome,
                        actual_outcome: { emails_sent: 25, success_rate: 95 },
                        verification_result: "PASS",
                        guardrail_violations: [],
                        rollback_triggered: false,
                        rollback_reason: null,
                        verified_by: userId,
                        verified_at: new Date("2024-01-01T00:00:00Z")
                    }])
                })
            });

            const result = await service.verifyActionOutcome(companyId, userId, data);

            expect(result.id).toBeDefined();
            expect(result.verification_result).toBe("PASS");
            expect(result.rollback_triggered).toBe(false);
        });
    });

    describe("Observability", () => {
        it("should get execution metrics", async () => {
            const companyId = "company-123";
            const query: ExecutionMetricsQuery = {
                playbook_id: "pb-789",
                from_date: "2024-01-01T00:00:00Z",
                to_date: "2024-01-31T23:59:59Z",
                group_by: "day",
                limit: 30
            };

            const mockMetrics = [
                {
                    playbook_id: query.playbook_id,
                    execution_date: new Date("2024-01-01T00:00:00Z"),
                    total_executions: 10,
                    successful_executions: 9,
                    failed_executions: 1,
                    suppressed_executions: 0,
                    p50_duration_ms: 1000,
                    p95_duration_ms: 2000,
                    p99_duration_ms: 3000,
                    avg_duration_ms: 1200,
                    success_rate: 90.0
                }
            ];

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(mockMetrics)
                        })
                    })
                })
            });

            const result = await service.getExecutionMetrics(companyId, query);

            expect(result).toHaveLength(1);
            expect(result[0]!.playbook_id).toBe(query.playbook_id);
            expect(result[0]!.total_executions).toBe(10);
            expect(result[0]!.success_rate).toBe(90.0);
        });

        it("should get blast radius data", async () => {
            const companyId = "company-123";
            const query: BlastRadiusQuery = {
                fire_id: "fire-123",
                playbook_id: "pb-789",
                entity_type: "customer",
                from_date: "2024-01-01T00:00:00Z",
                to_date: "2024-01-31T23:59:59Z",
                limit: 100
            };

            const mockBlastRadius = [
                {
                    id: "blast-123",
                    fire_id: query.fire_id,
                    playbook_id: query.playbook_id,
                    entity_type: query.entity_type,
                    entity_count: 25,
                    entity_ids: ["customer-1", "customer-2"],
                    blast_radius_percentage: 5.0,
                    created_at: new Date("2024-01-01T00:00:00Z")
                }
            ];

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(mockBlastRadius)
                        })
                    })
                })
            });

            const result = await service.getBlastRadius(companyId, query);

            expect(result).toHaveLength(1);
            expect(result[0]!.fire_id).toBe(query.fire_id);
            expect(result[0]!.entity_count).toBe(25);
            expect(result[0]!.blast_radius_percentage).toBe(5.0);
        });
    });

    describe("Error Handling", () => {
        it("should handle database errors gracefully", async () => {
            const companyId = "company-123";
            const userId = "user-456";
            const data: PlaybookVersionUpsert = {
                playbook_id: "pb-789",
                name: "Test Playbook",
                steps: [],
                max_blast_radius: 100,
                dry_run_default: true,
                require_dual_control: false,
                timeout_sec: 300
            };

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockRejectedValue(new Error("Database connection failed"))
                        })
                    })
                })
            });

            await expect(service.createPlaybookVersion(companyId, userId, data))
                .rejects.toThrow("Database connection failed");
        });

        it("should handle missing playbook version", async () => {
            const companyId = "company-123";
            const query: VisualEditorLoad = {
                playbook_id: "pb-nonexistent"
            };

            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([])
                    })
                })
            });

            await expect(service.loadForVisualEditor(companyId, query))
                .rejects.toThrow("Playbook version not found");
        });
    });
});
