import { z } from 'zod';
export declare const SalesInvoiceLine: z.ZodObject<
  {
    description: z.ZodString;
    qty: z.ZodNumber;
    unit_price: z.ZodObject<
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
    tax_code: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    description: string;
    qty: number;
    unit_price: {
      amount: string;
      currency: string;
    };
    tax_code?: string | undefined;
  },
  {
    description: string;
    qty: number;
    unit_price: {
      amount: string;
      currency: string;
    };
    tax_code?: string | undefined;
  }
>;
export declare const SalesInvoice: z.ZodObject<
  {
    id: z.ZodString;
    company_id: z.ZodString;
    customer_id: z.ZodString;
    doc_date: z.ZodString;
    currency: z.ZodEffects<z.ZodString, string, string>;
    lines: z.ZodArray<
      z.ZodObject<
        {
          description: z.ZodString;
          qty: z.ZodNumber;
          unit_price: z.ZodObject<
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
          tax_code: z.ZodOptional<z.ZodString>;
        },
        'strip',
        z.ZodTypeAny,
        {
          description: string;
          qty: number;
          unit_price: {
            amount: string;
            currency: string;
          };
          tax_code?: string | undefined;
        },
        {
          description: string;
          qty: number;
          unit_price: {
            amount: string;
            currency: string;
          };
          tax_code?: string | undefined;
        }
      >,
      'many'
    >;
    totals: z.ZodObject<
      {
        total: z.ZodObject<
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
        tax_total: z.ZodObject<
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
        grand_total: z.ZodObject<
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
      },
      'strip',
      z.ZodTypeAny,
      {
        total: {
          amount: string;
          currency: string;
        };
        tax_total: {
          amount: string;
          currency: string;
        };
        grand_total: {
          amount: string;
          currency: string;
        };
      },
      {
        total: {
          amount: string;
          currency: string;
        };
        tax_total: {
          amount: string;
          currency: string;
        };
        grand_total: {
          amount: string;
          currency: string;
        };
      }
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    company_id: string;
    lines: {
      description: string;
      qty: number;
      unit_price: {
        amount: string;
        currency: string;
      };
      tax_code?: string | undefined;
    }[];
    customer_id: string;
    currency: string;
    doc_date: string;
    totals: {
      total: {
        amount: string;
        currency: string;
      };
      tax_total: {
        amount: string;
        currency: string;
      };
      grand_total: {
        amount: string;
        currency: string;
      };
    };
  },
  {
    id: string;
    company_id: string;
    lines: {
      description: string;
      qty: number;
      unit_price: {
        amount: string;
        currency: string;
      };
      tax_code?: string | undefined;
    }[];
    customer_id: string;
    currency: string;
    doc_date: string;
    totals: {
      total: {
        amount: string;
        currency: string;
      };
      tax_total: {
        amount: string;
        currency: string;
      };
      grand_total: {
        amount: string;
        currency: string;
      };
    };
  }
>;
export type SalesInvoice = z.infer<typeof SalesInvoice>;
