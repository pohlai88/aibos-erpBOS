// packages/contracts/scripts/build-openapi.ts
import { OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
extendZodWithOpenApi(z); // <-- add this line

import { registry as si } from "../http/sales/sales-invoice.routes.js";
import { registryPI } from "../http/purchase/purchase-invoice.routes.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const gen = new OpenApiGeneratorV3([si, registryPI].flatMap(r => r.definitions));
const doc = gen.generateDocument({
  openapi: "3.0.3",
  info: { title: "AIBOS API", version: "0.0.1" },
  servers: [{ url: "/api" }]
});
const outDir = dirname(fileURLToPath(import.meta.url)) + "/../openapi";
mkdirSync(outDir, { recursive: true });
writeFileSync(outDir + "/openapi.json", JSON.stringify(doc, null, 2));
console.log("OpenAPI written:", outDir + "/openapi.json");
