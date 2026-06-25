import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

/**
 * Document validation statuses aligned with CargoComplianceEvidenceStatus.
 */
export const documentValidationStatuses = ["pending_review", "approved", "rejected"] as const;

/**
 * Document evidence types aligned with CargoComplianceEvidenceType.
 */
export const documentEvidenceTypes = [
  "bill_of_lading",
  "customs_declaration",
  "inspection_certificate",
  "hazardous_goods_declaration",
  "packing_list",
  "insurance_certificate",
  "release_authorization",
  "other",
] as const;

// ── Schemas ──────────────────────────────────────────────

export const documentSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  cargoId: z.string(),
  evidenceType: z.enum(documentEvidenceTypes),
  documentReference: z.string(),
  documentTitle: z.string(),
  documentUri: z.string().nullable(),
  issuerName: z.string(),
  validationStatus: z.enum(documentValidationStatuses),
  reviewerName: z.string().nullable(),
  reviewReference: z.string().nullable(),
  reviewSummary: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  recordedAt: z.string(),
  updatedAt: z.string(),
});

export const listDocumentsInputSchema = z.object({
  cargoId: z.string().optional(),
  evidenceType: z.enum(documentEvidenceTypes).optional(),
  validationStatus: z.enum(documentValidationStatuses).optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

export const listDocumentsOutputSchema = z.object({
  documents: z.array(documentSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const getDocumentInputSchema = z.object({
  documentId: z.string().min(1),
});

export const getDocumentOutputSchema = z.object({
  document: documentSummarySchema,
});

// ── Types ────────────────────────────────────────────────

export type DocumentValidationStatus = (typeof documentValidationStatuses)[number];
export type DocumentEvidenceType = (typeof documentEvidenceTypes)[number];

export type DocumentSummary = z.infer<typeof documentSummarySchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsInputSchema>;
export type ListDocumentsOutput = z.infer<typeof listDocumentsOutputSchema>;
export type GetDocumentInput = z.infer<typeof getDocumentInputSchema>;
export type GetDocumentOutput = z.infer<typeof getDocumentOutputSchema>;

// ── Metadata ─────────────────────────────────────────────

export const listDocumentsMetadata = createRpcOperationMetadata({
  name: "document.list",
  kind: "query",
  auth: "session",
  permissions: ["cargo.read"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
});

export const getDocumentMetadata = createRpcOperationMetadata({
  name: "document.get",
  kind: "query",
  auth: "session",
  permissions: ["cargo.read"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
});
