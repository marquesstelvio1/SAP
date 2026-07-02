import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DocumentSummary, GetDocumentOutput, ListDocumentsOutput } from "@saptm/rpc";

import { CARGO_REPOSITORY, type CargoRepository } from "../cargo/domain/cargo.repository.js";
import type { CargoComplianceEvidenceRecord } from "../cargo/domain/dto.js";
import type { GetDocumentServiceInput, ListDocumentsServiceInput } from "./documents.types.js";

@Injectable()
export class DocumentsService {
  constructor(@Inject(CARGO_REPOSITORY) private readonly cargoRepo: CargoRepository) {}

  async listDocuments(input: ListDocumentsServiceInput): Promise<ListDocumentsOutput> {
    const limit = input.limit ?? 25;
    const offset = input.offset ?? 0;

    const [records, totalCount] = await Promise.all([
      this.cargoRepo.findComplianceEvidenceMany(input.organizationId, {
        cargoId: input.cargoId,
        evidenceType: input.evidenceType,
        status: input.validationStatus,
        limit,
        offset,
      }),
      this.cargoRepo.countComplianceEvidence(input.organizationId, {
        cargoId: input.cargoId,
        evidenceType: input.evidenceType,
        status: input.validationStatus,
      }),
    ]);

    return {
      documents: records.map(mapEvidenceToSummary),
      pagination: { totalCount, limit, offset },
    };
  }

  async getDocument(input: GetDocumentServiceInput): Promise<GetDocumentOutput> {
    const record = await this.cargoRepo.findComplianceEvidenceById(
      input.organizationId,
      input.documentId,
    );

    if (record === null) {
      throw new NotFoundException("documents.document_not_found");
    }

    return {
      document: mapEvidenceToSummary(record),
    };
  }
}

function mapEvidenceToSummary(entity: CargoComplianceEvidenceRecord): DocumentSummary {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    cargoId: entity.cargoId,
    evidenceType: entity.evidenceType as DocumentSummary["evidenceType"],
    documentReference: entity.documentReference,
    documentTitle: entity.documentTitle,
    documentUri: entity.documentUri,
    issuerName: entity.issuerName,
    validationStatus: entity.status as DocumentSummary["validationStatus"],
    reviewerName: entity.reviewerName,
    reviewReference: entity.reviewReference,
    reviewSummary: entity.reviewSummary,
    rejectionReason: entity.rejectionReason,
    reviewedAt: entity.reviewedAt?.toISOString() ?? null,
    recordedAt: entity.recordedAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
