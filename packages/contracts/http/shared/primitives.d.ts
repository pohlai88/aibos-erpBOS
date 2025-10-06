import { z } from 'zod';
export declare const ULID: z.ZodString;
export declare const ISODate: z.ZodString;
export declare const Currency: z.ZodEffects<z.ZodString, string, string>;
export declare const Decimal: z.ZodString;
export declare const Money: z.ZodObject<
  {
    amount: z.ZodString;
    currency: z.ZodEffects<z.ZodString, string, string>;
  },
  'strip',
  z.ZodTypeAny,
  {
    amount: string;
    currency: string;
  },
  {
    amount: string;
    currency: string;
  }
>;
