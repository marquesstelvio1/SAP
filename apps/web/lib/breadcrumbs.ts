const routeLabels: Record<string, string> = {
  app: "App",
  admin: "Administração",
  audit: "Auditoria",
  capacity: "Capacidade",
  cargo: "Cargas",
  integrations: "Integrações",
  notifications: "Notificações",
  planning: "Planeamento",
  reports: "Relatórios",
  security: "Segurança",
  settings: "Configurações",
  tariffs: "Tarifas",
  tracking: "Tracking",
  general: "Gerais",
  branding: "Marca",
  billing: "Faturação",
  teams: "Equipas",
  webhooks: "Webhooks",
  members: "Membros",
  roles: "Papéis",
  privacy: "Privacidade",
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

function isDynamicSegment(segment: string): boolean {
  return (
    /^[a-z0-9]{20,}$/i.test(segment) ||
    /^[a-z0-9]{8,}-[a-z0-9]{4,}/i.test(segment) ||
    /^[a-z0-9]{8,}_[a-z0-9]{4,}/i.test(segment)
  );
}

function formatDynamicSegment(segment: string): string {
  return `#${segment.slice(0, 8)}`;
}

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let accumulatedHref = "";

  for (const segment of segments) {
    accumulatedHref += `/${segment}`;

    const label = isDynamicSegment(segment)
      ? formatDynamicSegment(segment)
      : (routeLabels[segment] ?? segment);

    items.push({ label, href: accumulatedHref });
  }

  return items;
}
