const apiContentSecurityPolicy = [
  "default-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

export const apiSecurityHeaders = [
  ["Content-Security-Policy", apiContentSecurityPolicy],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Embedder-Policy", "require-corp"],
  ["Cross-Origin-Resource-Policy", "same-origin"],
  [
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), interest-cohort=(), payment=(), usb=()",
  ],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
] as const;

type HeaderResponse = {
  setHeader: (name: string, value: string) => void;
  removeHeader?: (name: string) => void;
};

type NextFunction = () => void;

export function applySecurityHeaders(
  _request: unknown,
  response: HeaderResponse,
  next: NextFunction,
): void {
  response.removeHeader?.("X-Powered-By");

  for (const [name, value] of apiSecurityHeaders) {
    response.setHeader(name, value);
  }

  next();
}
