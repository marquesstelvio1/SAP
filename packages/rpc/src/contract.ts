import { oc, populateContractRouterPaths } from "@orpc/contract";
import type { AnyContractRouter } from "@orpc/contract";

import { createRpcOperationMetadata } from "./metadata.js";
import type { CreateRpcOperationMetadataInput } from "./metadata.js";

export function defineRpcContract(input: CreateRpcOperationMetadataInput) {
  return oc.$meta(createRpcOperationMetadata(input));
}

export function defineRpcRouter<TContractRouter extends AnyContractRouter>(
  router: TContractRouter,
) {
  return populateContractRouterPaths(router);
}
