// M16.3: Unpost/Repost Tests
// Tests for unposting and reposting functionality

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { unpostAssets, validateUnpostSafety } from "../unpost";

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

describe("unpost/repost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns dry-run summary for depreciation", async () => {
    const { pool } = await import("../../../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: "depr-1",
          plan_id: "plan-1",
          year: 2025,
          month: 11,
          amount: "1000.00",
          booked_flag: true,
          booked_journal_id: "journal-1",
        },
        {
          id: "depr-2",
          plan_id: "plan-2",
          year: 2025,
          month: 11,
          amount: "500.00",
          booked_flag: true,
          booked_journal_id: "journal-2",
        },
      ],
    });

    const result = await unpostAssets("company-1", "depr", 2025, 11, undefined, true);

    expect(result.dry_run).toBe(true);
    expect(result.kind).toBe("depr");
    expect(result.year).toBe(2025);
    expect(result.month).toBe(11);
    expect(result.plans).toBe(2);
    expect(result.lines).toBe(2);
    expect(result.total_amount).toBe(1500.00);
    expect(result.journals_to_reverse).toEqual(["journal-1", "journal-2"]);
    expect(result.sample).toHaveLength(2);
  });

  it("executes actual unposting", async () => {
    const { pool } = await import("../../lib/db");
    const { postJournal } = await import("../../gl/journals");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            id: "depr-1",
            plan_id: "plan-1",
            year: 2025,
            month: 11,
            amount: "1000.00",
            booked_flag: true,
            booked_journal_id: "journal-1",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            posting_date: "2025-11-30T00:00:00Z",
            currency: "MYR",
            account_code: "7400",
            dc: "D",
            amount: "1000.00",
            line_currency: "MYR",
          },
          {
            posting_date: "2025-11-30T00:00:00Z",
            currency: "MYR",
            account_code: "1509",
            dc: "C",
            amount: "1000.00",
            line_currency: "MYR",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // Update schedule

    vi.mocked(postJournal).mockResolvedValueOnce({ journal_id: "reversal-1" });

    const result = await unpostAssets("company-1", "depr", 2025, 11, undefined, false);

    expect(result.dry_run).toBe(false);
    expect(result.journals_to_reverse).toEqual(["reversal-1"]);
    expect(postJournal).toHaveBeenCalledWith("company-1", expect.objectContaining({
      memo: "Reversal of depreciation 2025-11",
      lines: expect.arrayContaining([
        expect.objectContaining({ account_code: "7400", credit: 1000 }),
        expect.objectContaining({ account_code: "1509", debit: 1000 }),
      ]),
    }));
  });

  it("validates unposting safety", async () => {
    const { pool } = await import("../../../../lib/db");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ status: "open" }] }) // Period status
      .mockResolvedValueOnce({ rows: [{ count: "2" }] }) // Posted entries count
      .mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Recent unposting activity

    const result = await validateUnpostSafety("company-1", "depr", 2025, 11);

    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("warns about closed periods", async () => {
    const { pool } = await import("../../../../lib/db");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ status: "closed" }] }) // Period closed
      .mockResolvedValueOnce({ rows: [{ count: "2" }] }) // Posted entries count
      .mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Recent unposting activity

    const result = await validateUnpostSafety("company-1", "depr", 2025, 11);

    expect(result.safe).toBe(false);
    expect(result.warnings).toContain("Period 2025-11 is closed");
  });

  it("warns about no posted entries", async () => {
    const { pool } = await import("../../../../lib/db");
    
    // Mock database responses
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ status: "open" }] }) // Period open
      .mockResolvedValueOnce({ rows: [{ count: "0" }] }) // No posted entries
      .mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Recent unposting activity

    const result = await validateUnpostSafety("company-1", "depr", 2025, 11);

    expect(result.safe).toBe(false);
    expect(result.warnings).toContain("No posted entries found for 2025-11");
  });
});
