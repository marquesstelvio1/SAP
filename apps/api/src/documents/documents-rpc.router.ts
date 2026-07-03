import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  getDocumentInputSchema,
  getDocumentMetadata,
  getDocumentOutputSchema,
  listDocumentsInputSchema,
  listDocumentsMetadata,
  listDocumentsOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { DocumentsService } from "./documents.service.js";

export type DocumentsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateDocumentsRpcRouterInput = {
  documentsService: Pick<DocumentsService, "listDocuments" | "getDocument">;
  authMiddleware: RpcAuthMiddleware;
};

export function createDocumentsRpcRouter(deps: CreateDocumentsRpcRouterInput) {
  const documentsRpc = os.$context<DocumentsRpcContext>().use(deps.authMiddleware);

  return documentsRpc.router({
    documents: {
      list: documentsRpc
        .meta(listDocumentsMetadata)
        .route({ method: "GET", path: "/documents/list" })
        .input(listDocumentsInputSchema)
        .output(listDocumentsOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.documentsService.listDocuments({
            organizationId: context.organizationId,
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
          return deps.documentsService.getDocument({
            organizationId: context.organizationId,
            documentId: input.documentId,
          });
        }),
    },
  });
}

export type DocumentsRpcRouter = ReturnType<typeof createDocumentsRpcRouter>;
