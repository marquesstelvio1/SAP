import { Injectable, NotFoundException } from "@nestjs/common";
import { getPrismaClient } from "@saptm/database";
import type { DocumentSummary, GetDocumentOutput, ListDocumentsOutput } from "@saptm/rpc";

import type {
  DocumentEntity,
  GetDocumentServiceInput,
  ListDocumentsServiceInput,
} from "./documents.types.js";

@Injectable()
export class DocumentsService {
  async listDocuments(input: ListDocumentsServiceInput): Promise<ListDocumentsOutput> {
    const prisma = getPrismaClient();
    const limit = input.limit ?? 25;
    const offset = input.offset ?? 0;

    const where = buildWhereClause(input);

    const [records, totalCount] = await Promise.all([
      prisma.cargoComplianceEvidence.findMany({
        where: where as Parameters<typeof prisma.cargoComplianceEvidence.findMany>[0]["where"],
        orderBy: { recordedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.cargoComplianceEvidence.count({
        where: where as Parameters<typeof prisma.cargoComplianceEvidence.count>[0]["where"],
      }),
    ]);

    return {
      documents: records.map(mapDocumentEntityToSummary),
      pagination: { totalCount, limit, offset },
    };
  }

  async getDocument(input: GetDocumentServiceInput): Promise<GetDocumentOutput> {
    const prisma = getPrismaClient();

    const record = await prisma.cargoComplianceEvidence.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.organizationId,
      },
    });

    if (record === null) {
      throw new NotFoundException("documents.document_not_found");
    }

    return {
      document: mapDocumentEntityToSummary(record),
    };
  }
}

function buildWhereClause(input: ListDocumentsServiceInput): Record<string, unknown> {
  const where: Record<string, unknown> = {
    organizationId: input.organizationId,
  };

  if (input.cargoId !== undefined) {
    where.cargoId = input.cargoId;
  }

  if (input.evidenceType !== undefined) {
    where.evidenceType = input.evidenceType;
  }

  if (input.validationStatus !== undefined) {
    where.status = input.validationStatus;
  }

  return where;
}

function mapDocumentEntityToSummary(entity: DocumentEntity): DocumentSummary {
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
