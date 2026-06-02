import type { AuthContext } from "@saptm/auth";
import type { RpcOperationMetadata } from "@saptm/rpc";

import type { RequestWithAuthContext } from "../auth/auth-context.js";

export type RpcRequestWithAuthContext = RequestWithAuthContext;

export type AuthorizedRpcContext = {
  metadata: RpcOperationMetadata;
  authContext?: AuthContext;
};
