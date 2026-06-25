import type { DocumentEvidenceType, DocumentValidationStatus } from "@saptm/rpc";

/**
 * Document entity shape as stored in the CargoComplianceEvidence table.
 */
export type DocumentEntity = {
  id: string;
  organizationId: string;
  cargoId: string;
  evidenceType: DocumentEvidenceType;
  documentReference: string;
  documentTitle: string;
  documentUri: string | null;
  issuerName: string;
  status: DocumentValidationStatus;
  reviewerName: string | null;
  reviewReference: string | null;
  reviewSummary: string | null;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  recordedAt: Date;
  updatedAt: Date;
};

export type ListDocumentsServiceInput = {
  organizationId: string;
  cargoId: string | undefined;
  evidenceType: DocumentEvidenceType | undefined;
  validationStatus: DocumentValidationStatus | undefined;
  limit: number | undefined;
  offset: number | undefined;
};

export type GetDocumentServiceInput = {
  organizationId: string;
  documentId: string;
};
