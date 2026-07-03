import type { IncomingMessage } from "node:http";

export function readRequestHeader(
  request: IncomingMessage,
  name: string,
): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value.at(0);
  }

  return value;
}

export function readRequestIp(request: IncomingMessage): string | undefined {
  return readRequestHeader(request, "x-forwarded-for")?.split(",").at(0)?.trim();
}
