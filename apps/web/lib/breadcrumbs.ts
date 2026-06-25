const routeLabels: Record<string, string> = {
  app: "App",
  admin: "Administracao",
  audit: "Auditoria",
  capacity: "Capacidade",
  cargo: "Cargas",
  integrations: "Integracoes",
  notifications: "Notificacoes",
  planning: "Planeamento",
  reports: "Relatorios",
  security: "Seguranca",
  settings: "Configuracoes",
  tariffs: "Tarifas",
  tracking: "Tracking",
  general: "Gerais",
  branding: "Marca",
  billing: "Faturacao",
  teams: "Equipas",
  webhooks: "Webhooks",
  members: "Membros",
  roles: "Papeis",
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
