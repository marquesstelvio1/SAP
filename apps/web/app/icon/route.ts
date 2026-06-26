export async function GET(): Promise<Response> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" role="img" aria-label="SAPTM">
    <rect width="100" height="100" rx="20" fill="#1e3a5f"/>
    <text x="50" y="68" font-family="system-ui, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle">S</text>
  </svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
