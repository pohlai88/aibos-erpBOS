// Bulk Posting Tests
// Tests for bulk asset posting functionality

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bulkPostAssets, getPostingSummary, validatePostingSafety } from "../bulkPost";

// Mock the database pool
vi.mock("../../../lib/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock the posting services
vi.mock("../../capex/post", () => ({
  postDepreciation: vi.fn(),
}));

vi.mock("../../intangibles/post", () => ({
  postAmortization: vi.fn(),
}));

describe("bulk post dry-run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns diff summary for depreciation", async () => {
    const { pool } = await import("../../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          plan_id: "plan-1",
          year: 2025,
          month: 11,
          amount: "1000.00",
          booked_flag: false,
          present_ccy: "MYR",
        },
        {
          plan_id: "plan-2", 
          year: 2025,
          month: 11,
          amount: "500.00",
          booked_flag: false,
          present_ccy: "MYR",
        },
      ],
    });

    const result = await bulkPostAssets(
      "company-1",
      "depr",
      2025,
      11,
      true, // dry run
      "Test memo"
    );

    expect(result.dry_run).toBe(true);
    expect(result.kind).toBe("depr");
    expect(result.year).toBe(2025);
    expect(result.month).toBe(11);
    expect(result.plans).toBe(2);
    expect(result.lines).toBe(2);
    expect(result.total_amount).toBe(1500.00);
    expect(result.sample).toHaveLength(2);
  });

  it("returns diff summary for amortization", async () => {
    const { pool } = await import("../../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          plan_id: "intangible-1",
          year: 2025,
          month: 11,
          amount: "800.00",
          booked_flag: false,
          present_ccy: "MYR",
        },
      ],
    });

    const result = await bulkPostAssets(
      "company-1",
      "amort",
      2025,
      11,
      true, // dry run
      "Test memo"
    );

    expect(result.dry_run).toBe(true);
    expect(result.kind).toBe("amort");
    expect(result.plans).toBe(1);
    expect(result.lines).toBe(1);
    expect(result.total_amount).toBe(800.00);
  });

  it("filters by plan IDs when provided", async () => {
    const { pool } = await import("../../../lib/db");
    
    // Mock database response
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          plan_id: "plan-1",
          year: 2025,
          month: 11,
          amount: "1000.00",
          booked_flag: false,
          present_ccy: "MYR",
        },
        {
          plan_id: "plan-2",
          year: 2025,
          month: 11,
          amount: "500.00",
          booked_flag: false,
          present_ccy: "MYR",
        },
      ],
    });

    const result = await bulkPostAssets(
      "company-1",
      "depr",
      2025,
      11,
      true,
      "Test memo",
      ["plan-1"] // Only plan-1
    );

    expect(result.plans).toBe(1);
    expect(result.lines).toBe(1);
    expect(result.total_amount).toBe(1000.00);
  });

  it("validates posting safety", async () => {
    const { pool } = await import("../../../lib/db");
    
    // Mock database response for existing posted entries
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ count: "2" }],
    });

    const result = await validatePostingSafety(
      "company-1",
      "depr",
      2025,
      11
    );

    expect(result.safe).toBe(false);
    expect(result.warnings).toContain("Some entries for 2025-11 are already posted");
  });

  it("warns about future periods", async () => {
    const { pool } = await import("../../../lib/db");
    
    // Mock database response for no existing entries
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ count: "0" }],
    });

    const futureYear = new Date().getFullYear() + 1;
    const result = await validatePostingSafety(
      "company-1",
      "depr",
      futureYear,
      1
    );

    expect(result.safe).toBe(false);
    expect(result.warnings).toContain(`Posting for future period ${futureYear}-01`);
  });
});
