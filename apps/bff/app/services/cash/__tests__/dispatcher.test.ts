// M15.2: Cash Alerts Dispatcher Tests
// Smoke tests for email/webhook dispatch functionality

import { describe, it, expect } from './test-utils';
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

        resetMockFetch();
    });

    it("handles webhook failures gracefully", async () => {
        // Mock fetch to reject
        global.fetch = () => Promise.reject(new Error("Network error"));

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
            { webhook: "https://invalid-webhook.com" }
        );

        // Should return dispatched count of 0 when webhook fails
        expect(result.dispatched).toBe(0);
        expect(result.mode).toBe("webhook");

        resetMockFetch();
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

        resetMockFetch();
    });
});

console.log("\n🎉 All M15.2 Cash Alerts Dispatcher tests completed!");
