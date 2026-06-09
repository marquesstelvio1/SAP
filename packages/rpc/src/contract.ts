import type { AnyContractRouter } from "@orpc/contract";
import { oc, populateContractRouterPaths } from "@orpc/contract";

import type { CreateRpcOperationMetadataInput } from "./metadata.js";
import { createRpcOperationMetadata } from "./metadata.js";

export function defineRpcContract(input: CreateRpcOperationMetadataInput) {
  return oc.$meta(createRpcOperationMetadata(input));
}

export function defineRpcRouter<TContractRouter extends AnyContractRouter>(
  router: TContractRouter,
) {
  return populateContractRouterPaths(router);
}
