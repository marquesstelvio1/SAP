import { headers as nextHeaders } from "next/headers";

import type { RpcFailure, RpcResult } from "./rpc-client";
import { rpcGet as clientRpcGet, rpcPost as clientRpcPost } from "./rpc-client";

export type { RpcFailure, RpcResult };

type Schema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false };
};

type RpcQueryOptions = {
  searchParams?: Record<string, string | number | undefined>;
};

export async function rpcGet<T>(
  path: string,
  schema: Schema<T>,
  options: RpcQueryOptions = {},
): Promise<RpcResult<T>> {
  const headers = await nextHeaders();
  const cookie = headers.get("cookie");
  return clientRpcGet(path, schema, {
    ...options,
    ...(cookie ? { cookie } : {}),
  });
}

export async function rpcPost<T>(
  path: string,
  schema: Schema<T>,
  input: unknown,
): Promise<RpcResult<T>> {
  const headers = await nextHeaders();
  const cookie = headers.get("cookie");
  return clientRpcPost(path, schema, input, {
    ...(cookie ? { cookie } : {}),
  });
}
