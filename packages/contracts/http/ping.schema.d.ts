import { z } from 'zod';
export declare const PingRequest: z.ZodObject<
  {
    msg: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    msg: string;
  },
  {
    msg: string;
  }
>;
export declare const PingResponse: z.ZodObject<
  {
    ok: z.ZodLiteral<true>;
    echo: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    ok: true;
    echo: string;
  },
  {
    ok: true;
    echo: string;
  }
>;
export type PingRequest = z.infer<typeof PingRequest>;
export type PingResponse = z.infer<typeof PingResponse>;
