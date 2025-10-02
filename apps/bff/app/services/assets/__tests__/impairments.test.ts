// M16.3: Asset Impairments Tests
// Tests for asset impairment operations

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createImpairment, listImpairments } from "../impairments";

// Mock the database pool
vi.mock("../../lib/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock the journal service
vi.mock("../../gl/journals", () => ({
  postJournal: vi.fn(),
}));

describe("asset impairments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates impairment for CAPEX plan", async () => {
    const { pool } = await import("../../lib/db");
    const { postJournal } = await import("../../gl/journals");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] }) // Insert impairment
      .mockResolvedValueOnce({ rows: [{ asset_class: "IT", present_ccy: "MYR" }] }) // Get plan
      .mockResolvedValueOnce({ rows: [{ depr_expense_account: "7400", accum_depr_account: "1509" }] }); // Get posting map

    vi.mocked(postJournal).mockResolvedValueOnce({ journal_id: "journal-123" });

    const input = {
      plan_kind: "capex" as const,
      plan_id: "plan-123",
      date: "2025-11-15",
      amount: 25000,
      memo: "Plant write-down",
    };

    const result = await createImpairment("company-1", "user-1", input);

    expect(result.created).toBe(true);
    expect(result.journal_id).toBe("journal-123");
    expect(postJournal).toHaveBeenCalledWith("company-1", expect.objectContaining({
      memo: "Asset impairment - capex plan plan-123",
      lines: expect.arrayContaining([
        expect.objectContaining({ account_code: "7400", debit: 25000 }),
        expect.objectContaining({ account_code: "1509", credit: 25000 }),
      ]),
    }));
  });

  it("creates impairment for Intangible plan", async () => {
    const { pool } = await import("../../lib/db");
    const { postJournal } = await import("../../gl/journals");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] }) // Insert impairment
      .mockResolvedValueOnce({ rows: [{ class: "SOFTWARE", present_ccy: "MYR" }] }) // Get plan
      .mockResolvedValueOnce({ rows: [{ amort_expense_account: "7450", accum_amort_account: "1609" }] }); // Get posting map

    vi.mocked(postJournal).mockResolvedValueOnce({ journal_id: "journal-456" });

    const input = {
      plan_kind: "intangible" as const,
      plan_id: "intangible-123",
      date: "2025-11-15",
      amount: 15000,
      memo: "Software impairment",
    };

    const result = await createImpairment("company-1", "user-1", input);

    expect(result.created).toBe(true);
    expect(result.journal_id).toBe("journal-456");
    expect(postJournal).toHaveBeenCalledWith("company-1", expect.objectContaining({
      memo: "Asset impairment - intangible plan intangible-123",
      lines: expect.arrayContaining([
        expect.objectContaining({ account_code: "7450", debit: 15000 }),
        expect.objectContaining({ account_code: "1609", credit: 15000 }),
      ]),
    }));
  });

  it("lists impairments correctly", async () => {
    const { pool } = await import("../../../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: "imp-1",
          plan_kind: "capex",
          plan_id: "plan-1",
          date: "2025-11-15",
          amount: "25000",
          memo: "Plant write-down",
          created_at: "2025-11-15T10:00:00Z",
          created_by: "user-1",
        },
        {
          id: "imp-2",
          plan_kind: "intangible",
          plan_id: "intangible-1",
          date: "2025-11-16",
          amount: "15000",
          memo: null,
          created_at: "2025-11-16T10:00:00Z",
          created_by: "user-2",
        },
      ],
    });

    const result = await listImpairments("company-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "imp-1",
      plan_kind: "capex",
      plan_id: "plan-1",
      date: "2025-11-15",
      amount: 25000,
      memo: "Plant write-down",
      created_at: "2025-11-15T10:00:00Z",
      created_by: "user-1",
    });
    expect(result[1].memo).toBeNull();
  });

  it("filters impairments by plan kind", async () => {
    const { pool } = await import("../../../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: "imp-1",
          plan_kind: "capex",
          plan_id: "plan-1",
          date: "2025-11-15",
          amount: "25000",
          memo: "Plant write-down",
          created_at: "2025-11-15T10:00:00Z",
          created_by: "user-1",
        },
      ],
    });

    const result = await listImpairments("company-1", "capex");

    expect(result).toHaveLength(1);
    expect(result[0].plan_kind).toBe("capex");
  });
});
