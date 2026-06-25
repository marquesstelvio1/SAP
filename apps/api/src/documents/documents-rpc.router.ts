import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  getDocumentInputSchema,
  getDocumentMetadata,
  getDocumentOutputSchema,
  listDocumentsInputSchema,
  listDocumentsMetadata,
  listDocumentsOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { DocumentsService } from "./documents.service.js";

export type DocumentsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateDocumentsRpcRouterInput = {
  documentsService: Pick<DocumentsService, "listDocuments" | "getDocument">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const documentsRpc = os.$context<DocumentsRpcContext>();

export function createDocumentsRpcRouter(deps: CreateDocumentsRpcRouterInput) {
  return documentsRpc.router({
    documents: {
      list: documentsRpc
        .meta(listDocumentsMetadata)
        .route({ method: "GET", path: "/documents/list" })
        .input(listDocumentsInputSchema)
        .output(listDocumentsOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            listDocumentsMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("documents.organization_required");
          }

          return deps.documentsService.listDocuments({
            organizationId,
            cargoId: input.cargoId,
            evidenceType: input.evidenceType,
            validationStatus: input.validationStatus,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      get: documentsRpc
        .meta(getDocumentMetadata)
        .route({ method: "GET", path: "/documents/get" })
        .input(getDocumentInputSchema)
        .output(getDocumentOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            getDocumentMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("documents.organization_required");
          }

          return deps.documentsService.getDocument({
            organizationId,
            documentId: input.documentId,
          });
        }),
    },
  });
}

export type DocumentsRpcRouter = ReturnType<typeof createDocumentsRpcRouter>;
