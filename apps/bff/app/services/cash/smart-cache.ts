// M15.2 Phase 2: Smart Caching System
// Intelligent caching to avoid redundant calculations

import { pool } from "../../lib/db";
import { createHash } from "crypto";

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    hash: string;
    expires_at: number;
}

export interface CacheConfig {
    ttl_ms: number;
    max_entries: number;
    cleanup_interval_ms: number;
}

export class SmartCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private config: CacheConfig;
    private cleanupTimer?: NodeJS.Timeout;

    constructor(config: CacheConfig) {
        this.config = config;
        this.startCleanupTimer();
    }

    async get(key: string, dataFetcher: () => Promise<T>, dataHasher: () => Promise<string>): Promise<T> {
        const entry = this.cache.get(key);
        const now = Date.now();

        // Check if entry exists and is not expired
        if (entry && entry.expires_at > now) {
            // Check if data has changed
            const currentHash = await dataHasher();
            if (entry.hash === currentHash) {
                console.log(`🎯 Cache hit for key: ${key}`);
                return entry.data;
            } else {
                console.log(`🔄 Cache miss - data changed for key: ${key}`);
            }
        }

        // Fetch fresh data
        console.log(`📥 Fetching fresh data for key: ${key}`);
        const data = await dataFetcher();
        const hash = await dataHasher();

        // Store in cache
        this.cache.set(key, {
            data,
            timestamp: now,
            hash,
            expires_at: now + this.config.ttl_ms,
        });

        // Cleanup if cache is too large
        if (this.cache.size > this.config.max_entries) {
            this.cleanup();
        }

        return data;
    }

    set(key: string, data: T, hash: string): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            hash,
            expires_at: now + this.config.ttl_ms,
        });
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());

        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest entries until we're under the limit
        const toRemove = entries.length - this.config.max_entries;
        for (let i = 0; i < toRemove; i++) {
            const entry = entries[i];
            if (entry) {
                this.cache.delete(entry[0]);
            }
        }

        // Remove expired entries
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expires_at <= now) {
                this.cache.delete(key);
            }
        }
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanup_interval_ms);
    }

    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cache.clear();
    }

    getStats(): {
        size: number;
        max_size: number;
        hit_rate: number;
        oldest_entry: number;
        newest_entry: number;
    } {
        const entries = Array.from(this.cache.values());
        const timestamps = entries.map(e => e.timestamp);

        return {
            size: this.cache.size,
            max_size: this.config.max_entries,
            hit_rate: 0, // Would need to track hits/misses for accurate calculation
            oldest_entry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            newest_entry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
        };
    }
}

export class CashAlertsCache {
    private cashMetricsCache: SmartCache<any>;
    private companyConfigCache: SmartCache<any>;
    private alertRulesCache: SmartCache<any>;

    constructor() {
        this.cashMetricsCache = new SmartCache({
            ttl_ms: 5 * 60 * 1000, // 5 minutes
            max_entries: 1000,
            cleanup_interval_ms: 60 * 1000, // 1 minute
        });

        this.companyConfigCache = new SmartCache({
            ttl_ms: 30 * 60 * 1000, // 30 minutes
            max_entries: 100,
            cleanup_interval_ms: 5 * 60 * 1000, // 5 minutes
        });

        this.alertRulesCache = new SmartCache({
            ttl_ms: 10 * 60 * 1000, // 10 minutes
            max_entries: 500,
            cleanup_interval_ms: 2 * 60 * 1000, // 2 minutes
        });
    }

    async getCashMetrics(
        companyId: string,
        versionId: string,
        year: number,
        month: number,
        costCenter?: string,
        project?: string
    ): Promise<any> {
        const key = `cash_metrics:${companyId}:${versionId}:${year}:${month}:${costCenter || 'all'}:${project || 'all'}`;

        return await this.cashMetricsCache.get(
            key,
            async () => {
                const query = `
          SELECT * FROM get_cash_metrics($1, $2, $3, $4, $5, $6)
        `;
                const result = await pool.query(query, [companyId, versionId, year, month, costCenter, project]);
                return result.rows[0] || null;
            },
            async () => {
                // Generate hash based on cash_line data for this company/version/period
                const hashQuery = `
          SELECT 
            COUNT(*) as row_count,
            SUM(net_change) as total_net_change,
            MAX(created_at) as last_updated
          FROM cash_line 
          WHERE company_id = $1 AND version_id = $2 AND year = $3 AND month = $4
        `;
                const result = await pool.query(hashQuery, [companyId, versionId, year, month]);
                const row = result.rows[0];
                return createHash('sha256').update(
                    `${row.row_count}:${row.total_net_change}:${row.last_updated}`
                ).digest('hex');
            }
        );
    }

    async getCompanyConfig(companyId: string): Promise<any> {
        const key = `company_config:${companyId}`;

        return await this.companyConfigCache.get(
            key,
            async () => {
                const query = `
          SELECT 
            c.id,
            COALESCE(cs.timezone, 'Asia/Ho_Chi_Minh') as timezone,
            cs.cash_version_code,
            c.is_active
          FROM company c
          LEFT JOIN company_settings cs ON cs.company_id = c.id
          WHERE c.id = $1
        `;
                const result = await pool.query(query, [companyId]);
                return result.rows[0] || null;
            },
            async () => {
                // Generate hash based on company and settings data
                const hashQuery = `
          SELECT 
            c.updated_at as company_updated,
            cs.updated_at as settings_updated
          FROM company c
          LEFT JOIN company_settings cs ON cs.company_id = c.id
          WHERE c.id = $1
        `;
                const result = await pool.query(hashQuery, [companyId]);
                const row = result.rows[0];
                return createHash('sha256').update(
                    `${row.company_updated}:${row.settings_updated}`
                ).digest('hex');
            }
        );
    }

    async getAlertRules(companyId: string): Promise<any[]> {
        const key = `alert_rules:${companyId}`;

        return await this.alertRulesCache.get(
            key,
            async () => {
                const query = `
          SELECT id, name, type, threshold_num, filter_cc, filter_project, delivery
          FROM cash_alert_rule 
          WHERE company_id = $1 AND is_active = true
        `;
                const result = await pool.query(query, [companyId]);
                return result.rows;
            },
            async () => {
                // Generate hash based on alert rules data
                const hashQuery = `
          SELECT 
            COUNT(*) as rule_count,
            MAX(created_at) as last_created,
            MAX(updated_at) as last_updated
          FROM cash_alert_rule 
          WHERE company_id = $1 AND is_active = true
        `;
                const result = await pool.query(hashQuery, [companyId]);
                const row = result.rows[0];
                return createHash('sha256').update(
                    `${row.rule_count}:${row.last_created}:${row.last_updated}`
                ).digest('hex');
            }
        );
    }

    // Invalidation methods
    invalidateCompanyCache(companyId: string): void {
        this.companyConfigCache.invalidate(`company_config:${companyId}`);
        this.alertRulesCache.invalidate(`alert_rules:${companyId}`);
        this.cashMetricsCache.invalidatePattern(`cash_metrics:${companyId}:*`);
    }

    invalidateCashMetricsCache(companyId: string, versionId?: string): void {
        if (versionId) {
            this.cashMetricsCache.invalidatePattern(`cash_metrics:${companyId}:${versionId}:*`);
        } else {
            this.cashMetricsCache.invalidatePattern(`cash_metrics:${companyId}:*`);
        }
    }

    invalidateAlertRulesCache(companyId: string): void {
        this.alertRulesCache.invalidate(`alert_rules:${companyId}`);
    }

    // Cache statistics
    getCacheStats(): {
        cash_metrics: any;
        company_config: any;
        alert_rules: any;
    } {
        return {
            cash_metrics: this.cashMetricsCache.getStats(),
            company_config: this.companyConfigCache.getStats(),
            alert_rules: this.alertRulesCache.getStats(),
        };
    }

    // Clear all caches
    clearAll(): void {
        this.cashMetricsCache.clear();
        this.companyConfigCache.clear();
        this.alertRulesCache.clear();
    }

    // Destroy all caches
    destroy(): void {
        this.cashMetricsCache.destroy();
        this.companyConfigCache.destroy();
        this.alertRulesCache.destroy();
    }
}

// Global cache instance
export const cashAlertsCache = new CashAlertsCache();
