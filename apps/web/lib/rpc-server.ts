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

const ORG_COOKIE = "saptm_active_org";

/**
 * Parse a specific cookie value from a cookie header string.
 */
function parseCookieFromHeader(cookieString: string | null, name: string): string | undefined {
  if (!cookieString) return undefined;
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1] ?? "") : undefined;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function rpcGet<T>(
  path: string,
  schema: Schema<T>,
  options: RpcQueryOptions = {},
): Promise<RpcResult<T>> {
  const headers = await nextHeaders();
  const cookie = headers.get("cookie");
  const orgId = parseCookieFromHeader(cookie, ORG_COOKIE);
  return clientRpcGet(path, schema, {
    ...options,
    ...(cookie ? { cookie } : {}),
    ...(orgId ? { orgId } : {}),
  });
}

export async function rpcPost<T>(
  path: string,
  schema: Schema<T>,
  input: unknown,
): Promise<RpcResult<T>> {
  const headers = await nextHeaders();
  const cookie = headers.get("cookie");
  const orgId = parseCookieFromHeader(cookie, ORG_COOKIE);
  return clientRpcPost(path, schema, input, {
    ...(cookie ? { cookie } : {}),
    ...(orgId ? { orgId } : {}),
  });
}
