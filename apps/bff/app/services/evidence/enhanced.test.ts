import { describe, it, expect, beforeEach, vi } from "vitest";
import { EnhancedEvidenceService } from "@/services/evidence/enhanced";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
    evdObject,
    evdRecord,
    evdLink,
    evdManifest,
    evdManifestLine,
    evdBinder,
    evdAttestation
} from "@aibos/db-adapter/schema";

// Mock the database
const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
    innerJoin: vi.fn().mockReturnThis()
};

vi.mock("@/lib/db", () => ({
    db: mockDb
}));

describe("EnhancedEvidenceService", () => {
    let service: EnhancedEvidenceService;
    const mockCompanyId = "test-company";
    const mockUserId = "test-user";

    beforeEach(() => {
        service = new EnhancedEvidenceService();
        vi.clearAllMocks();

        // Set up default mocks
        mockDb.limit.mockResolvedValue([]);
        mockDb.returning.mockResolvedValue([{ id: "test-id" }]);
    });

    describe("uploadEvidence", () => {
        it("should upload evidence with content-addressed storage", async () => {
            const mockData = {
                source: "CTRL" as const,
                source_id: "ctrl-123",
                title: "Test Evidence",
                mime: "application/pdf",
                size_bytes: 1024,
                sha256_hex: "abc123def456",
                pii_level: "NONE" as const
            };

            // Mock existing object check (no existing object) - this will be handled by the chain mock

            const result = await service.uploadEvidence(mockCompanyId, mockUserId, mockData);

            expect(result).toEqual({
                record_id: expect.any(String),
                object_id: expect.any(String),
                sha256_hex: "abc123def456"
            });

            expect(db.insert).toHaveBeenCalledTimes(2); // Object and record
        });

        it("should dedupe existing objects", async () => {
            const mockData = {
                source: "CTRL" as const,
                source_id: "ctrl-123",
                title: "Test Evidence",
                mime: "application/pdf",
                size_bytes: 1024,
                sha256_hex: "abc123def456",
                pii_level: "NONE" as const
            };

            // Mock existing object found - handled by chain mock
            mockDb.limit.mockResolvedValueOnce([{ id: "existing-object-id" }]);

            const result = await service.uploadEvidence(mockCompanyId, mockUserId, mockData);

            expect(result.object_id).toBe("existing-object-id");
            expect(db.insert).toHaveBeenCalledTimes(1); // Only record, not object
        });

        it("should verify SHA256 hash when file stream provided", async () => {
            const mockData = {
                source: "CTRL" as const,
                source_id: "ctrl-123",
                title: "Test Evidence",
                mime: "application/pdf",
                size_bytes: 1024,
                sha256_hex: "abc123def456",
                pii_level: "NONE" as const
            };

            const mockStream = {
                on: vi.fn((event, callback) => {
                    if (event === "data") callback(Buffer.from("test content"));
                    if (event === "end") callback();
                })
            } as any;

            // Mock hash computation to return different hash
            vi.spyOn(service as any, "computeStreamSHA256").mockResolvedValue("different-hash");

            await expect(
                service.uploadEvidence(mockCompanyId, mockUserId, mockData, mockStream)
            ).rejects.toThrow("SHA256 mismatch");
        });
    });

    describe("linkEvidence", () => {
        it("should link evidence to business objects", async () => {
            const mockData = {
                record_id: "record-123",
                kind: "CTRL_RUN" as const,
                ref_id: "ctrl-run-456"
            };

            // Mock record exists
            // Mock record check - handled by chain mock

            const result = await service.linkEvidence(mockCompanyId, mockUserId, mockData);

            expect(result).toEqual({
                link_id: expect.any(String)
            });

            expect(db.insert).toHaveBeenCalledTimes(1);
        });

        it("should throw error if record not found", async () => {
            const mockData = {
                record_id: "nonexistent-record",
                kind: "CTRL_RUN" as const,
                ref_id: "ctrl-run-456"
            };

            // Mock no record found
            // Mock empty result - handled by chain mock

            await expect(
                service.linkEvidence(mockCompanyId, mockUserId, mockData)
            ).rejects.toThrow("Evidence record not found");
        });
    });

    describe("buildManifest", () => {
        it("should build evidence manifest with filters", async () => {
            const mockData = {
                scope_kind: "CTRL_RUN" as const,
                scope_id: "ctrl-run-123",
                filters: {
                    pii_level_max: "LOW" as const,
                    exclude_tags: ["sensitive"]
                }
            };

            // Mock links and records
            const mockLinks = [
                {
                    recordId: "record-1",
                    record: {
                        id: "record-1",
                        title: "Evidence 1",
                        piiLevel: "NONE",
                        tags: ["audit"]
                    },
                    object: {
                        sha256Hex: "hash1",
                        sizeBytes: 1024
                    }
                },
                {
                    recordId: "record-2",
                    record: {
                        id: "record-2",
                        title: "Evidence 2",
                        piiLevel: "HIGH",
                        tags: ["sensitive"]
                    },
                    object: {
                        sha256Hex: "hash2",
                        sizeBytes: 2048
                    }
                }
            ];

            // Mock links result - handled by chain mock
            mockDb.limit.mockResolvedValueOnce(mockLinks);

            const result = await service.buildManifest(mockCompanyId, mockUserId, mockData);

            expect(result.scope_kind).toBe("CTRL_RUN");
            expect(result.scope_id).toBe("ctrl-run-123");
            expect(result.object_count).toBe(1); // Only record-1 should pass filters
            expect(result.total_bytes).toBe(1024);
            expect(result.sha256_hex).toBeDefined();

            expect(db.insert).toHaveBeenCalledTimes(2); // Manifest and lines
        });
    });

    describe("buildBinder", () => {
        it("should build eBinder ZIP from manifest", async () => {
            const mockData = {
                manifest_id: "manifest-123",
                format: "ZIP" as const
            };

            const mockManifest = {
                id: "manifest-123",
                scopeKind: "CTRL_RUN",
                scopeId: "ctrl-run-123",
                objectCount: 2,
                totalBytes: 3072
            };

            const mockLines = [
                {
                    line: { title: "Evidence 1", tags: ["audit"] },
                    record: { id: "record-1" },
                    object: { sha256Hex: "hash1", sizeBytes: 1024, mime: "application/pdf" }
                },
                {
                    line: { title: "Evidence 2", tags: ["test"] },
                    record: { id: "record-2" },
                    object: { sha256Hex: "hash2", sizeBytes: 2048, mime: "text/csv" }
                }
            ];

            // Mock manifest and lines results - handled by chain mock
            mockDb.limit
                .mockResolvedValueOnce([mockManifest])
                .mockResolvedValueOnce(mockLines);

            const result = await service.buildBinder(mockCompanyId, mockUserId, mockData);

            expect(result.scope_kind).toBe("CTRL_RUN");
            expect(result.scope_id).toBe("ctrl-run-123");
            expect(result.manifest_id).toBe("manifest-123");
            expect(result.format).toBe("ZIP");
            expect(result.size_bytes).toBeGreaterThan(0);
            expect(result.sha256_hex).toBeDefined();

            expect(db.insert).toHaveBeenCalledTimes(1); // Binder
        });

        it("should throw error if manifest not found", async () => {
            const mockData = {
                manifest_id: "nonexistent-manifest",
                format: "ZIP" as const
            };

            // Mock empty result - handled by chain mock

            await expect(
                service.buildBinder(mockCompanyId, mockUserId, mockData)
            ).rejects.toThrow("Manifest not found");
        });
    });

    describe("attestBinder", () => {
        it("should attest eBinder with signature", async () => {
            const mockData = {
                binder_id: "binder-123",
                signer_role: "CONTROLLER" as const,
                statement: "I attest this evidence package is complete and accurate."
            };

            const mockBinder = {
                id: "binder-123",
                scopeKind: "CTRL_RUN",
                scopeId: "ctrl-run-123"
            };

            // Mock binder result - handled by chain mock
            mockDb.limit.mockResolvedValueOnce([mockBinder]);

            const result = await service.attestBinder(mockCompanyId, mockUserId, mockData);

            expect(result.binder_id).toBe("binder-123");
            expect(result.signer_id).toBe(mockUserId);
            expect(result.signer_role).toBe("CONTROLLER");
            expect(result.payload.statement).toBe(mockData.statement);
            expect(result.sha256_hex).toBeDefined();

            expect(db.insert).toHaveBeenCalledTimes(1);
        });

        it("should throw error if binder not found", async () => {
            const mockData = {
                binder_id: "nonexistent-binder",
                signer_role: "CONTROLLER" as const,
                statement: "Test statement"
            };

            // Mock empty result - handled by chain mock

            await expect(
                service.attestBinder(mockCompanyId, mockUserId, mockData)
            ).rejects.toThrow("Binder not found");
        });
    });

    describe("utility methods", () => {
        it("should compute SHA256 hash correctly", () => {
            const content = "test content";
            const hash = (service as any).computeSHA256(content);

            expect(hash).toBe("a8f5f167f44f4964e6c998dee827110c");
        });

        it("should get correct file extension from MIME type", () => {
            const getExtension = (service as any).getFileExtension;

            expect(getExtension("application/pdf")).toBe("pdf");
            expect(getExtension("text/csv")).toBe("csv");
            expect(getExtension("application/json")).toBe("json");
            expect(getExtension("unknown/mime")).toBe("bin");
        });
    });
});
