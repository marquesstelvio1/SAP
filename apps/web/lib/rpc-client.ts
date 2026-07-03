import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { getClientEnv } from "@saptm/config";
import type { contracts } from "@saptm/rpc/contracts";

// ── Existing RPC helpers (rpcGet, rpcPost) ──────────────────────────

const INTERNAL_REQUEST_HEADER = "x-internal-request" as const;
const ORG_HEADER = "x-saptm-org-id" as const;

export type RpcStatus = "unauthorized" | "forbidden" | "not_found" | "unavailable" | "invalid";

export class RpcError extends Error {
  constructor(
    public status: RpcStatus,
    message: string,
  ) {
    super(message);
    this.name = "RpcError";
  }
}

export type RpcSuccess<T> = { status: "ok"; data: T };

export type RpcFailure = { status: RpcStatus; message: string };

export type RpcResult<T> = RpcSuccess<T> | RpcFailure;

type RpcJsonEnvelope = {
  json?: unknown;
};

type Schema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false };
};

const RPC_TIMEOUT_MS = 30_000;

type RpcQueryOptions = {
  searchParams?: Record<string, string | number | undefined>;
  cookie?: string;
  orgId?: string;
};

function isServerSide(): boolean {
  return typeof window === "undefined";
}

function rpcUrl(path: string, hasCookie: boolean): URL {
  if (hasCookie || isServerSide()) {
    return new URL(path, getClientEnv().NEXT_PUBLIC_API_URL);
  }
  return new URL(`/api${path}`, window.location.origin);
}

export async function rpcGet<T>(
  path: string,
  schema: Schema<T>,
  options: RpcQueryOptions = {},
): Promise<RpcResult<T>> {
  const hasCookie = Boolean(options.cookie);
  const url = rpcUrl(path, hasCookie);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {};

  if (options.cookie) {
    headers.cookie = options.cookie;
  }

  if (options.orgId) {
    headers[ORG_HEADER] = options.orgId;
  }

  let response: Response;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    return {
      status: "unavailable",
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? "API nao respondeu dentro do tempo limite."
          : error instanceof TypeError
            ? error.message
            : "Erro de rede ao comunicar com API.",
    };
  } finally {
    clearTimeout(timeoutId);
  }

  return parseRpcResponse(response, schema);
}

export async function rpcPost<T>(
  path: string,
  schema: Schema<T>,
  input: unknown,
  options: RpcQueryOptions = {},
): Promise<RpcResult<T>> {
  const hasCookie = Boolean(options.cookie);
  const url = rpcUrl(path, hasCookie);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (hasCookie || isServerSide()) {
    headers[INTERNAL_REQUEST_HEADER] = "true";
  }

  if (options.cookie) {
    headers.cookie = options.cookie;
  }

  if (options.orgId) {
    headers[ORG_HEADER] = options.orgId;
  }

  let response: Response;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: JSON.stringify({ json: input }),
      signal: controller.signal,
    });
  } catch (error) {
    return {
      status: "unavailable",
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? "API nao respondeu dentro do tempo limite."
          : error instanceof TypeError
            ? error.message
            : "Erro de rede ao comunicar com API.",
    };
  } finally {
    clearTimeout(timeoutId);
  }

  return parseRpcResponse(response, schema);
}

async function parseRpcResponse<T>(response: Response, schema: Schema<T>): Promise<RpcResult<T>> {
  if (response.status === 401) {
    return {
      status: "unauthorized",
      message: "Sessao expirada ou invalida. Faca login novamente.",
    };
  }

  if (response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para esta operacao.",
    };
  }

  if (response.status === 404) {
    return {
      status: "not_found",
      message: "Recurso nao encontrado.",
    };
  }

  if (!response.ok) {
    let errorText: string;
    try {
      const errorBody = await response.text();
      errorText = errorBody || `API retornou HTTP ${response.status}.`;
    } catch {
      errorText = `API retornou HTTP ${response.status}.`;
    }
    return {
      status: "unavailable",
      message: errorText,
    };
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    return {
      status: "unavailable",
      message: "API retornou resposta invalida (nao JSON).",
    };
  }

  const envelope = responseBody as RpcJsonEnvelope;
  const parsed = schema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC retornou payload invalido.",
    };
  }

  return { status: "ok", data: parsed.data };
}

// ── Typed oRPC client (contract-first) ──────────────────────────────

const link = new RPCLink({
  url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/rpc`,
  headers: {},
});

export const rpcClient: ContractRouterClient<typeof contracts> = createORPCClient(link);
