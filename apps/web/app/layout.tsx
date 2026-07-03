import { ThemeProvider, Toaster } from "@saptm/ui";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { headers } from "next/headers";
import { type ReactNode, Suspense } from "react";

import { AnalyticsProvider } from "../components/analytics-provider";
import { QueryProvider } from "../components/query-provider";
import { WebVitalsReporter } from "../components/web-vitals-reporter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SAPTM",
    template: "%s | SAPTM",
  },
  description: "Enterprise logistics platform foundation",
  robots: { index: false, follow: false },
  openGraph: {
    title: "SAPTM",
    description: "Enterprise logistics platform foundation",
    siteName: "SAPTM",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let nonce = "";
  try {
    nonce = (await headers()).get("x-nonce") ?? "";
  } catch {
    // Static generation (/_not-found): no request context, nonce not needed.
  }

  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-command)] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-panel focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Saltar para o conteudo
          </a>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <QueryProvider>{children}</QueryProvider>
            </AnalyticsProvider>
          </Suspense>
          <Toaster />
        </ThemeProvider>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
