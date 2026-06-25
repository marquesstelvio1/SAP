# Frontend Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Tech Stack

- Next.js 16 (App Router)
- React 19.2.7
- Tailwind CSS v4
- TypeScript ^5.8
- shadcn/ui (new-york style)
- TanStack Query v5
- TanStack Table v8
- react-hook-form + @hookform/resolvers
- next-intl (i18n)
- next-themes (dark mode)
- Sentry (error tracking)
- PostHog (analytics)
- sonner (toasts)

## Architecture

```
app/
├── (platform)/          # Authenticated app (route group)
│   ├── app/             # Main platform pages
│   ├── layout.tsx       # Auth-checking layout
│   ├── loading.tsx      # Loading skeleton
│   └── error.tsx        # Error boundary
├── sign-in/             # Login page
├── forgot-password/     # Password recovery
├── reset-password/      # Password reset
├── two-factor/          # 2FA verification
├── accept-invitation/   # Org invitation
├── design-system/       # Component showcase
├── api/                 # Next.js API routes
│   ├── auth/            # Better Auth handlers
│   └── health/          # Health check
├── layout.tsx           # Root layout
├── loading.tsx          # Root loading
├── error.tsx            # Root error
├── global-error.tsx     # Global error
└── not-found.tsx        # 404
```

## Component Architecture

```
components/
├── admin/               # Admin panel components
├── auth/                # Auth-related components
├── capacity/            # Capacity management UI
├── cargo/               # Cargo management UI
├── integration/         # Integration gateway UI
├── notification/        # Notification components
├── planning/            # Transport planning UI
├── security/            # Security settings UI
├── settings/            # Organization settings
├── shell/               # App shell (sidebar, header)
├── tariff/              # Tariff management UI
├── tracking/            # Tracking overview UI
├── analytics-provider.tsx
├── query-provider.tsx
├── form-toast.tsx
└── web-vitals-reporter.tsx
```

## Data Flow

1. **Server components** fetch initial data directly
2. **Client components** use TanStack Query for data fetching
3. All API calls go through `@saptm/rpc` contracts
4. Better Auth client manages session state

## Rendering Strategy

- **Default:** Server components (RSC)
- **Client boundary:** Only where interactivity needed (forms, tables, charts)
- **Authentication pages:** Static rendering where possible
- **Platform pages:** `force-dynamic` for real-time data

## Styling Architecture

- CSS variables from `@saptm/ui/tokens`
- Tailwind utility classes
- CVA for component variants
- tailwind-merge for class deduplication
- Dark mode via `.dark` class (next-themes)
