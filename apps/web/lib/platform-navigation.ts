import type { PlatformPermission } from "@saptm/auth";

export type PlatformNavigationStatus = "available" | "locked" | "planned";

export type PlatformNavigationItem = {
  label: string;
  href: string;
  description: string;
  status: PlatformNavigationStatus;
  requiredPermissions?: readonly PlatformPermission[];
};

export type ResolvedPlatformNavigationItem = PlatformNavigationItem & {
  allowed: boolean;
};

export type PlatformNavigationGroup = {
  label: string;
  items: readonly PlatformNavigationItem[];
};

export type ResolvedPlatformNavigationGroup = {
  label: string;
  items: readonly ResolvedPlatformNavigationItem[];
};

export type PlatformPermissionCatalogItem = {
  key: PlatformPermission;
  label: string;
  description: string;
};

export const platformPermissionCatalog = [
  {
    key: "tenant.manage",
    label: "Tenant",
    description: "Administrar tenant, organização e controlos administrativos.",
  },
  {
    key: "identity.user.invite",
    label: "Convites",
    description: "Convidar utilizadores para uma organização.",
  },
  {
    key: "identity.role.assign",
    label: "Roles",
    description: "Atribuir roles e permissões a membros.",
  },
  {
    key: "integration.api_key.manage",
    label: "Integrações",
    description: "Gerir API keys e service accounts.",
  },
  {
    key: "integration.event.ingest",
    label: "Eventos externos",
    description: "Registar eventos externos idempotentes por service account.",
  },
  {
    key: "audit.read",
    label: "Auditoria",
    description: "Ler trilhas de auditoria e eventos de segurança.",
  },
  {
    key: "report.export",
    label: "Relatórios",
    description: "Exportar relatórios auditáveis.",
  },
  {
    key: "notification.read",
    label: "Notificações",
    description: "Ler e reconhecer notificações operacionais geradas pelo outbox.",
  },
  {
    key: "cargo.read",
    label: "Cargas",
    description: "Ler cargas, estados de compliance e bloqueios operacionais.",
  },
  {
    key: "cargo.register",
    label: "Registo de cargas",
    description: "Registar cargas com regras de negócio, idempotência e auditoria.",
  },
  {
    key: "cargo.release",
    label: "Libertação de cargas",
    description: "Libertar cargas para transporte após compliance, inspeção, audit e outbox.",
  },
  {
    key: "cargo.transport.plan",
    label: "Plano de transporte",
    description: "Criar shipment de tracking a partir de carga libertada com auditoria.",
  },
  {
    key: "cargo.transport.depart",
    label: "Partida de transporte",
    description: "Iniciar partida operacional com compliance aprovado, tracking e auditoria.",
  },
  {
    key: "cargo.transport.arrive",
    label: "Chegada de transporte",
    description: "Confirmar chegada operacional com tracking arrived e auditoria.",
  },
  {
    key: "cargo.handoff.record",
    label: "Handoff operacional",
    description: "Registar transferência de custódia porto/ferrovia/terminal com auditoria.",
  },
  {
    key: "cargo.claim.settle",
    label: "Liquidação de claims",
    description: "Registar settlement contabilístico de claims aceites com auditoria.",
  },
  {
    key: "cargo.delivery.complete",
    label: "Entrega de carga",
    description: "Concluir entrega final com cargo delivered, tracking completed e auditoria.",
  },
  {
    key: "cargo.delivery.exception.record",
    label: "Exceção de entrega",
    description: "Registar entrega danificada ou não conforme com cargo held e tracking exception.",
  },
  {
    key: "cargo.delivery.exception.resolve",
    label: "Resolução de entrega",
    description: "Resolver exceção de entrega e restaurar carga para handover final.",
  },
  {
    key: "cargo.compliance.record",
    label: "Evidências de compliance",
    description: "Registar evidências documentais de carga com idempotência e auditoria.",
  },
  {
    key: "cargo.compliance.verify",
    label: "Verificação de compliance",
    description: "Aprovar ou rejeitar evidências pendentes com decisão auditável.",
  },
  {
    key: "capacity.read",
    label: "Capacidade",
    description: "Ler recursos, slots e reservas de capacidade operacional.",
  },
  {
    key: "capacity.manage",
    label: "Gestão de capacidade",
    description: "Registar recursos e abrir slots operacionais com auditoria.",
  },
  {
    key: "capacity.slot.reserve",
    label: "Reserva de slots",
    description: "Reservar unidades de capacidade para cargas elegíveis sem overbooking.",
  },
  {
    key: "capacity.slot.cancel",
    label: "Cancelamento de slots",
    description: "Cancelar reservas ativas e libertar capacidade com trilha auditável.",
  },
  {
    key: "billing.read",
    label: "Faturação",
    description: "Ler subscrição, uso e faturas da organização.",
  },
  {
    key: "capacity.advisory.decide",
    label: "Decisão de advisory",
    description: "Aprovar ou rejeitar recomendações de capacidade com evidência humana.",
  },
  {
    key: "planning.order.read",
    label: "Planeamento",
    description: "Ler ordens de transporte, confirmações, links de carga, tracking e capacidade.",
  },
  {
    key: "planning.order.confirm",
    label: "Confirmação de transporte",
    description: "Confirmar transport orders com regras de carga, rota, capacidade e auditoria.",
  },
  {
    key: "planning.order.reschedule",
    label: "Replaneamento de transporte",
    description: "Replanear transport orders confirmadas com revisão, timing, auditoria e outbox.",
  },
  {
    key: "planning.order.dispatch",
    label: "Dispatch de transporte",
    description: "Despachar transport orders confirmadas para execução com instruções e auditoria.",
  },
  {
    key: "planning.order.cancel",
    label: "Cancelamento de transporte",
    description: "Cancelar transport orders confirmadas antes da partida com motivo e auditoria.",
  },
  {
    key: "tariff.read",
    label: "Tarifas",
    description: "Ler rate cards, regras tarifárias e cotações operacionais.",
  },
  {
    key: "tariff.manage",
    label: "Gestão tarifária",
    description: "Gerir rate cards e regras de pricing com auditoria.",
  },
  {
    key: "tariff.quote.calculate",
    label: "Cálculo de cotação",
    description: "Calcular cotações para cargas elegíveis com rate cards ativos.",
  },
  {
    key: "tariff.quote.approve",
    label: "Aprovação de cotação",
    description: "Aprovar cotações calculadas com evidência financeira.",
  },
  {
    key: "tracking.shipment.read",
    label: "Tracking",
    description: "Ler cargas rastreadas, estados operacionais e movimentos recentes.",
  },
  {
    key: "tracking.event.record",
    label: "Eventos",
    description: "Registar eventos operacionais de tracking.",
  },
  {
    key: "tracking.exception.manage",
    label: "Exceções",
    description: "Gerir atrasos, holds e exceções operacionais.",
  },
  {
    key: "tracking.exception.resolve",
    label: "Resolução",
    description: "Resolver exceções e libertar cargas de holds operacionais.",
  },
] as const satisfies readonly PlatformPermissionCatalogItem[];

export const platformNavigation: readonly PlatformNavigationGroup[] = [
  {
    label: "Fundação",
    items: [
      {
        label: "Dashboard",
        href: "/app",
        description: "Visão geral das operações, métricas e indicadores.",
        status: "available",
      },
      {
        label: "Segurança da conta",
        href: "/app/security",
        description: "Gerir sessão, autenticação e verificação em duas etapas.",
        status: "available",
      },
      {
        label: "Configurações",
        href: "/app/settings/general",
        description: "Nome, branding, membros e preferências da organização.",
        status: "available",
        requiredPermissions: ["tenant.manage"],
      },
      {
        label: "Privacidade",
        href: "/app/settings/privacy",
        description: "Exportar dados pessoais ou solicitar eliminação da conta.",
        status: "available",
      },
    ],
  },
  {
    label: "Operações",
    items: [
      {
        label: "Gestão de cargas",
        href: "/app/cargo",
        description: "Registo de cargas antes de transporte e tracking.",
        status: "available",
        requiredPermissions: ["cargo.read"],
      },
      {
        label: "Tracking operacional",
        href: "/app/tracking",
        description: "Visão de cargas, movimentos e exceções operacionais.",
        status: "available",
        requiredPermissions: ["tracking.shipment.read"],
      },
      {
        label: "Capacidade operacional",
        href: "/app/capacity",
        description: "Slots, recursos e reservas sem overbooking para ferrovia, porto e logística.",
        status: "available",
        requiredPermissions: ["capacity.read"],
      },
      {
        label: "Planeamento",
        href: "/app/planning",
        description: "Transport orders confirmadas com carga, capacidade, tracking e auditoria.",
        status: "available",
        requiredPermissions: ["planning.order.read"],
      },
      {
        label: "Tarifas",
        href: "/app/tariffs",
        description: "Rate cards, regras tarifárias, cotações e aprovação financeira.",
        status: "available",
        requiredPermissions: ["tariff.read"],
      },
      {
        label: "Relatórios",
        href: "/app/reports",
        description: "Exportações CSV para Tracking, Cargo, Capacity, Planning e Tarifas.",
        status: "available",
        requiredPermissions: ["report.export"],
      },
      {
        label: "Notificações",
        href: "/app/notifications",
        description: "Inbox operacional gerada pelo outbox para eventos críticos.",
        status: "available",
        requiredPermissions: ["notification.read"],
      },
    ],
  },
  {
    label: "Governança",
    items: [
      {
        label: "Integrações",
        href: "/app/integrations",
        description: "Service accounts, API keys e eventos externos idempotentes.",
        status: "available",
        requiredPermissions: ["integration.api_key.manage"],
      },
      {
        label: "Identidade e permissões",
        href: "/app/admin",
        description: "Utilizadores, memberships, roles, permissões e governança tenant-scoped.",
        status: "available",
        requiredPermissions: ["identity.role.assign"],
      },
      {
        label: "Equipas",
        href: "/app/admin/teams",
        description: "Gerir equipas, membros e papéis dentro da organização.",
        status: "available",
        requiredPermissions: ["tenant.manage"],
      },
      {
        label: "Auditoria",
        href: "/app/audit",
        description: "Base do audit trail para operações críticas.",
        status: "available",
        requiredPermissions: ["audit.read"],
      },
    ],
  },
  {
    label: "Preparação",
    items: [
      {
        label: "Design System",
        href: "/app#design-system",
        description: "Tokens, primitivas e padrões aplicados no shell.",
        status: "available",
      },
      {
        label: "Funcionalidades",
        href: "/app/planning",
        description: "Módulos ativos: Cargas, Tracking, Capacity, Planning e Tarifas.",
        status: "available",
        requiredPermissions: ["planning.order.read"],
      },
    ],
  },
] as const;

export function resolvePlatformNavigation(
  permissions: readonly PlatformPermission[],
): ResolvedPlatformNavigationGroup[] {
  return platformNavigation.map((group) => ({
    label: group.label,
    items: group.items.map((item) => ({
      ...item,
      allowed: hasRequiredNavigationPermissions(permissions, item.requiredPermissions),
    })),
  }));
}

export function hasRequiredNavigationPermissions(
  permissions: readonly PlatformPermission[],
  requiredPermissions: readonly PlatformPermission[] = [],
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every((permission) => permissions.includes(permission));
}
