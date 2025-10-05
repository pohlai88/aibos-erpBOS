import { z } from "zod";
export const ULID = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/,"ULID");
export const ISODate = z.string().datetime({ offset: true });
export const Currency = z.string().length(3).transform(s => s.toUpperCase());
export const Decimal = z.string().regex(/^-?\d+(\.\d+)?$/);
export const Money = z.object({ amount: Decimal, currency: Currency });
