// M15.2: Cash Alerts Dispatcher Tests
// Smoke tests for email/webhook dispatch functionality

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dispatchCashNotifications } from '../alerts.dispatcher';

// Mock fetch for webhook testing
const originalFetch = global.fetch;
let mockFetch: any;

function setupMockFetch() {
    mockFetch = (url: string, options: any) => {
        return Promise.resolve({ ok: true });
    };
    global.fetch = mockFetch;
}

function resetMockFetch() {
    global.fetch = originalFetch;
}

describe("Cash Alerts Dispatcher", () => {
    beforeEach(() => {
        // Use fake timers for all tests to control retry delays
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Restore real timers after each test
        vi.useRealTimers();
        resetMockFetch();
    });

    it("handles empty breaches gracefully", async () => {
        const result = await dispatchCashNotifications("test-company", []);

        expect(result.dispatched).toBe(0);
        expect(result.mode).toBe("noop");
    });

    it("dispatches webhook successfully", async () => {
        setupMockFetch();

        const breaches = [
            {
                rule_id: "rule-1",
                name: "Low Cash Alert",
                type: "min_cash",
                threshold: 10000,
                balance: 5000
            }
        ];

        const result = await dispatchCashNotifications(
            "test-company",
            breaches,
            "cash:CFY26-01",
            { webhook: "https://webhook.site/test" }
        );

        expect(result.dispatched).toBe(1);
        expect(result.mode).toBe("webhook");
    });

    it("handles webhook failures gracefully", async () => {
        // Mock fetch to reject with network error
        const mockFetchReject = vi.fn().mockRejectedValue(new Error("Network error"));
        global.fetch = mockFetchReject;

        const breaches = [
            {
                rule_id: "rule-1",
                name: "Low Cash Alert",
                type: "min_cash",
                threshold: 10000,
                balance: 5000
            }
        ];

        // Start the dispatch operation
        const dispatchPromise = dispatchCashNotifications(
            "test-company",
            breaches,
            "cash:CFY26-01",
            { webhook: "https://invalid-webhook.com" }
        );

        // Advance timers to complete all retry attempts quickly
        await vi.runAllTimersAsync();

        const result = await dispatchPromise;

        // Should return dispatched count of 0 when webhook fails after all retries
        expect(result.dispatched).toBe(0);
        expect(result.mode).toBe("webhook");

        // Verify fetch was called multiple times due to retries
        expect(mockFetchReject).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it("returns noop mode when no delivery configured", async () => {
        const breaches = [
            {
                rule_id: "rule-1",
                name: "Low Cash Alert",
                type: "min_cash",
                threshold: 10000,
                balance: 5000
            }
        ];

        const result = await dispatchCashNotifications("test-company", breaches);

        expect(result.dispatched).toBe(0);
        expect(result.mode).toBe("noop");
    });

    it("handles multiple breach types correctly", async () => {
        setupMockFetch();

        const breaches = [
            {
                rule_id: "rule-1",
                name: "Low Cash Alert",
                type: "min_cash",
                threshold: 10000,
                balance: 5000
            },
            {
                rule_id: "rule-2",
                name: "High Burn Rate",
                type: "max_burn",
                threshold: 50000,
                burn_rate: 75000
            },
            {
                rule_id: "rule-3",
                name: "Short Runway",
                type: "runway_months",
                threshold: 3,
                runway_months: 1.5
            }
        ];

        const result = await dispatchCashNotifications(
            "test-company",
            breaches,
            "cash:CFY26-01",
            { webhook: "https://webhook.site/test" }
        );

        expect(result.dispatched).toBe(1);
        expect(result.mode).toBe("webhook");
    });
});

console.log("\n🎉 All M15.2 Cash Alerts Dispatcher tests completed!");
