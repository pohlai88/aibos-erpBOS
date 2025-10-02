import { z } from "zod";

export const CashAlertScheduleUpsert = z.object({
    enabled: z.boolean().default(true),
    hour_local: z.number().int().min(0).max(23).default(8),
    minute_local: z.number().int().min(0).max(59).default(0),
    timezone: z.string().min(1).default("Asia/Ho_Chi_Minh"),
    scenario_code: z.string().min(1), // e.g., "CFY26-01"
    // optional: who changed it (if you log separately)
});
export type CashAlertScheduleUpsert = z.infer<typeof CashAlertScheduleUpsert>;
