#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const API_DIR = join(ROOT, "apps", "api", "src");
const RPC_DIR = join(ROOT, "packages", "rpc", "src");
const OUTPUT = join(ROOT, "docs", "openapi.json");

const openApiDoc = {
  openapi: "3.1.0",
  info: {
    title: "SAPTM API",
    version: "1.0.0",
    description: "SAPTM \u2014 Logistics Transport Management Platform API",
    contact: { name: "SAPTM Engineering" },
  },
  servers: [
    { url: "/api/rpc", description: "RPC API endpoint (legacy prefix)" },
    { url: "/api/v1/rpc", description: "RPC API endpoint" },
  ],
  paths: {},
  components: {
    schemas: {},
    securitySchemes: {
      session: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth-session",
        description: "Better Auth session cookie",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Service account API key",
      },
    },
  },
  security: [{ session: [] }, { apiKey: [] }],
};

const metadataImports = {};

function scanRouterFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name.at(0) !== ".") {
      files.push(...scanRouterFiles(fullPath));
    } else if (entry.name.endsWith("-rpc.router.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseRouteBlock(block, opName) {
  const routeMatch = block.match(
    /\.route\(\s*\{[^}]*?method:\s*"(\w+)"[^}]*?path:\s*"([^"]+)"[^}]*?\}\)/s,
  );
  if (!routeMatch) return null;
  const method = routeMatch[1].toLowerCase();
  const path = routeMatch[2];

  const inputMatch = block.match(/\.input\((\w+)\)/);
  const outputMatch = block.match(/\.output\((\w+)\)/);

  return {
    name: opName,
    method,
    path,
    inputSchema: inputMatch?.[1],
    outputSchema: outputMatch?.[1],
  };
}

function extractOperations(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const operations = [];
  const opRegex = /^\s+(\w+):\s+(\w+)Rpc\s*[\s\S]*?\.handler\s*\(/gm;
  let match;
  while (true) {
    match = opRegex.exec(content);
    if (match === null) break;
    const opName = match[1];
    const block = match[0];
    const parsed = parseRouteBlock(block, opName);
    if (parsed) operations.push(parsed);
  }
  return operations;
}

function parseContractSchemas(filePath) {
  const schemas = {};
  const content = readFileSync(filePath, "utf-8");
  const schemaRegex = /export\s+(?:const|function)\s+(\w+Schema)\s*[:=]/g;
  let match;
  while (true) {
    match = schemaRegex.exec(content);
    if (match === null) break;
    schemas[match[1]] = true;
  }
  return schemas;
}

function extractMetadataFromContent(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const metadata = {};
  const metaRegex = /(\w+Metadata)\s*[:=]/g;
  let match;
  while (true) {
    match = metaRegex.exec(content);
    if (match === null) break;
    metadata[match[1]] = true;
  }
  return metadata;
}

const routerFiles = scanRouterFiles(API_DIR);

const contractFiles = {};
for (const file of readdirSync(RPC_DIR)) {
  if (
    file.endsWith(".ts") &&
    file !== "index.ts" &&
    file !== "errors.ts" &&
    file !== "metadata.ts" &&
    file !== "authorization.ts"
  ) {
    contractFiles[file.replace(".ts", "")] = join(RPC_DIR, file);
  }
}

const allContractSchemas = {};
for (const [name, path] of Object.entries(contractFiles)) {
  Object.assign(allContractSchemas, parseContractSchemas(path));
}

const moduleNameMap = {
  "admin-rpc.router": "admin",
  "audit-rpc.router": "audit",
  "billing-rpc.router": "billing",
  "capacity-rpc.router": "capacity",
  "cargo-rpc.router": "cargo",
  "integrations-rpc.router": "integrations",
  "notifications-rpc.router": "notifications",
  "planning-rpc.router": "planning",
  "reports-rpc.router": "reports",
  "tariff-rpc.router": "tariff",
  "teams-rpc.router": "teams",
  "tracking-rpc.router": "tracking",
  "webhooks-rpc.router": "webhooks",
  "platform-rpc.router": "system",
};

for (const filePath of routerFiles) {
  const fileName = basename(filePath).replace(/\.ts$/, "");
  const moduleTag = moduleNameMap[fileName] || fileName.replace("-rpc.router", "");
  const moduleMetadata = extractMetadataFromContent(filePath);
  const operations = extractOperations(filePath);

  for (const op of operations) {
    const pathKey = `/rpc${op.path}`;

    const requestBody =
      op.method === "post" && op.inputSchema
        ? {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${op.inputSchema}`,
                },
              },
            },
          }
        : undefined;

    const parameters = [];
    if (op.method === "get") {
      parameters.push({
        name: op.inputSchema ? `query (${op.inputSchema})` : "query",
        in: "query",
        description: op.inputSchema ? `Query parameters per ${op.inputSchema}` : "Query parameters",
        schema: op.inputSchema
          ? { $ref: `#/components/schemas/${op.inputSchema}` }
          : { type: "object" },
      });
    }

    parameters.push(
      {
        name: "x-request-id",
        in: "header",
        required: false,
        schema: { type: "string", format: "uuid" },
        description: "Client-generated request ID for idempotency",
      },
      {
        name: "x-correlation-id",
        in: "header",
        required: false,
        schema: { type: "string", format: "uuid" },
        description: "Correlation ID for distributed tracing",
      },
      {
        name: "x-tenant-id",
        in: "header",
        required: false,
        schema: { type: "string", format: "uuid" },
        description: "Organization/tenant ID (inferred from session if omitted)",
      },
    );

    const responses = {
      200: {
        description: "Successful operation",
        content: {
          "application/json": {
            schema: op.outputSchema
              ? { $ref: `#/components/schemas/${op.outputSchema}` }
              : { type: "object" },
          },
        },
      },
      400: { description: "Validation Error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Not Found" },
      409: { description: "Conflict" },
      429: { description: "Too Many Requests" },
      500: { description: "Internal Server Error" },
    };

    openApiDoc.paths[pathKey] = {
      [op.method]: {
        tags: [moduleTag === "system" ? "system" : moduleTag],
        summary: `${moduleTag}.${op.name}`,
        description: `RPC operation: ${moduleTag}.${op.name}`,
        operationId: `${moduleTag}_${op.name}`,
        parameters,
        ...(requestBody ? { requestBody } : {}),
        responses,
        "x-rpc-module": moduleTag,
        "x-rpc-operation": op.name,
      },
    };
  }
}

const allSchemaNames = new Set();
for (const filePath of routerFiles) {
  const content = readFileSync(filePath, "utf-8");
  const schemaRefs = content.matchAll(/\.(?:input|output)\((\w+Schema)\)/g);
  for (const ref of schemaRefs) {
    allSchemaNames.add(ref[1]);
  }
}

for (const schemaName of allSchemaNames) {
  if (allContractSchemas[schemaName]) {
    openApiDoc.components.schemas[schemaName] = {
      type: "object",
      description: `Zod schema defined in @saptm/rpc. Run pnpm build:openapi:schemas for full JSON Schema conversion.`,
      properties: {},
      additionalProperties: true,
    };
  } else {
    openApiDoc.components.schemas[schemaName] = {
      type: "object",
      description: `Referenced schema. Run pnpm build:openapi:schemas for full resolution.`,
      properties: {},
      additionalProperties: true,
    };
  }
}

writeFileSync(OUTPUT, `${JSON.stringify(openApiDoc, null, 2)}\n`, "utf-8");
const pathCount = Object.keys(openApiDoc.paths).length;
const schemaCount = Object.keys(openApiDoc.components.schemas).length;
console.log(`OpenAPI spec generated at ${OUTPUT}`);
console.log(`Endpoints: ${pathCount}`);
console.log(`Schema references: ${schemaCount}`);
