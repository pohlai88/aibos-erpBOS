// M16.3: UI Drafts Tests
// Tests for UI draft caching functionality

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { putDraft, getDraft, deleteDraft, listDrafts, cleanupExpiredDrafts } from "../uiDraft";

// Mock the database pool
vi.mock("../../lib/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe("ui drafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores and retrieves draft", async () => {
    const { pool } = await import("../../lib/db");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] }) // Insert draft
      .mockResolvedValueOnce({
        rows: [
          {
            id: "draft-123",
            payload: '{"total_amount":1500,"plans":2}',
            expires_at: "2025-12-01T10:00:00Z",
          },
        ],
      }); // Get draft

    const payload = { total_amount: 1500, plans: 2 };
    const draftId = await putDraft("company-1", "depr", 2025, 11, payload, 900);

    expect(draftId).toBeTruthy();

    const retrievedDraft = await getDraft("company-1", "depr", 2025, 11);

    expect(retrievedDraft).toEqual({
      id: "draft-123",
      company_id: "company-1",
      kind: "depr",
      year: 2025,
      month: 11,
      payload: { total_amount: 1500, plans: 2 },
      expires_at: "2025-12-01T10:00:00Z",
    });
  });

  it("returns null for expired draft", async () => {
    const { pool } = await import("../../lib/db");
    
    // Mock database response - no rows (expired)
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] });

    const retrievedDraft = await getDraft("company-1", "depr", 2025, 11);

    expect(retrievedDraft).toBeNull();
  });

  it("deletes draft successfully", async () => {
    const { pool } = await import("../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 1 });

    const deleted = await deleteDraft("company-1", "depr", 2025, 11);

    expect(deleted).toBe(true);
  });

  it("lists all drafts for company", async () => {
    const { pool } = await import("../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: "draft-1",
          kind: "depr",
          year: 2025,
          month: 11,
          expires_at: "2025-12-01T10:00:00Z",
        },
        {
          id: "draft-2",
          kind: "amort",
          year: 2025,
          month: 10,
          expires_at: "2025-11-30T10:00:00Z",
        },
      ],
    });

    const drafts = await listDrafts("company-1");

    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toEqual({
      id: "draft-1",
      kind: "depr",
      year: 2025,
      month: 11,
      expires_at: "2025-12-01T10:00:00Z",
    });
  });

  it("cleans up expired drafts", async () => {
    const { pool } = await import("../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 5 });

    const cleanedCount = await cleanupExpiredDrafts();

    expect(cleanedCount).toBe(5);
  });

  it("validates draft parameters", async () => {
    const { validateDraftParams } = await import("../uiDraft");

    expect(validateDraftParams("depr", 2025, 11, 900).valid).toBe(true);
    expect(validateDraftParams("invalid", 2025, 11, 900).valid).toBe(false);
    expect(validateDraftParams("depr", 1800, 11, 900).valid).toBe(false);
    expect(validateDraftParams("depr", 2025, 13, 900).valid).toBe(false);
    expect(validateDraftParams("depr", 2025, 11, 30).valid).toBe(false);
  });
});
