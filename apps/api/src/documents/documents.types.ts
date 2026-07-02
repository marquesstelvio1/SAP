import type { DocumentEvidenceType, DocumentValidationStatus } from "@saptm/rpc";

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
