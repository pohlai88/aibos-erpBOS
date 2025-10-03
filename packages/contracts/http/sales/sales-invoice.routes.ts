import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SalesInvoice } from "./sales-invoice.schema.js";
import { z } from "zod";

export const registry = new OpenAPIRegistry();

// Create a proper Zod schema for the response
const PostSIResponse = z.object({
  journal_id: z.string()
});

registry.registerPath({
  method: "post",
  path: "/sales-invoices",
  summary: "Post a Sales Invoice",
  request: { body: { content: { "application/json": { schema: SalesInvoice } } } },
  responses: {
    201: {
      description: "Journal created",
      content: { "application/json": { schema: PostSIResponse } }
    },
    400: { description: "Validation error" }
  }
});
