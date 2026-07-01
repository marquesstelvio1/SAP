import { getClientEnv } from "@saptm/config";

/**
 * Internal request marker for server-to-server RPC calls.
 * The API's CSRF middleware skips validation when this header is present.
 * CORS does not expose this header, so browser-origin requests cannot set it.
 */
const INTERNAL_REQUEST_HEADER = "x-internal-request" as const;

export type RpcStatus = "forbidden" | "not_found" | "unavailable" | "invalid";

export type RpcSuccess<T> = { status: "ok"; data: T };

export type RpcFailure = { status: RpcStatus; message: string };

export type RpcResult<T> = RpcSuccess<T> | RpcFailure;

type RpcJsonEnvelope = {
  json?: unknown;
};

type Schema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false };
};

type RpcQueryOptions = {
  searchParams?: Record<string, string | number | undefined>;
  /** Only needed for server-to-server calls. Browser calls send cookies automatically. */
  cookie?: string;
};

function isServerSide(): boolean {
  return typeof window === "undefined";
}

function rpcUrl(path: string, hasCookie: boolean): URL {
  // Server-side (Actions or Server Components): fetch directly from API
  // Browser: fetch through proxy (same-origin, avoids CORS/CSP/cookie issues)
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

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      headers,
    });
  } catch (error) {
    return {
      status: "unavailable",
      message: error instanceof TypeError ? error.message : "Erro de rede ao comunicar com API.",
    };
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

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: JSON.stringify({ json: input }),
    });
  } catch (error) {
    return {
      status: "unavailable",
      message: error instanceof TypeError ? error.message : "Erro de rede ao comunicar com API.",
    };
  }

  return parseRpcResponse(response, schema);
}

async function parseRpcResponse<T>(response: Response, schema: Schema<T>): Promise<RpcResult<T>> {
  if (response.status === 401 || response.status === 403) {
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
    return {
      status: "unavailable",
      message: `API indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = schema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC retornou payload invalido.",
    };
  }

  return { status: "ok", data: parsed.data };
}
