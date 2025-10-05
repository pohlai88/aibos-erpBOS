import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PurchaseInvoice } from "./purchase-invoice.schema.js";
import { z } from "zod";

export const registryPI = new OpenAPIRegistry();

const PostPIResponse = z.object({
  journal_id: z.string()
});

registryPI.registerPath({
  method: "post",
  path: "/purchase-invoices",
  summary: "Post a Purchase Invoice",
  request: { body: { content: { "application/json": { schema: PurchaseInvoice } } } },
  responses: {
    201: {
      description: "Journal created",
      content: { "application/json": { schema: PostPIResponse } }
    }
  }
});