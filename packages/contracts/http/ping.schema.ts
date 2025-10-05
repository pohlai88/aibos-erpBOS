import { z } from "zod";

export const PingRequest = z.object({ msg: z.string().min(1) });
export const PingResponse = z.object({ ok: z.literal(true), echo: z.string() });

export type PingRequest = z.infer<typeof PingRequest>;
export type PingResponse = z.infer<typeof PingResponse>;
