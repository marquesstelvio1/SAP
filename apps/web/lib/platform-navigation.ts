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
    description: "Administrar tenant, organizacao e controlos administrativos.",
  },
  {
    key: "identity.user.invite",
    label: "Convites",
    description: "Convidar utilizadores para uma organizacao.",
  },
  {
    key: "identity.role.assign",
    label: "Roles",
    description: "Atribuir roles e permissoes a membros.",
  },
  {
    key: "integration.api_key.manage",
    label: "Integracoes",
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
    description: "Ler trilhas de auditoria e eventos de seguranca.",
  },
  {
    key: "report.export",
    label: "Relatorios",
    description: "Exportar relatorios governados e auditaveis.",
  },
  {
    key: "notification.read",
    label: "Notificacoes",
    description: "Ler e reconhecer notificacoes operacionais geradas pelo outbox.",
  },
  {
    key: "cargo.read",
    label: "Cargas",
    description: "Ler cargas, estados de compliance e bloqueios operacionais.",
  },
  {
    key: "cargo.register",
    label: "Registo de cargas",
    description: "Registar cargas com regras de negocio, idempotencia e auditoria.",
  },
  {
    key: "cargo.release",
    label: "Liberacao de cargas",
    description: "Liberar cargas para transporte apos compliance, inspecao, audit e outbox.",
  },
  {
    key: "cargo.transport.plan",
    label: "Plano de transporte",
    description: "Criar shipment de tracking a partir de carga liberada com auditoria.",
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
    description: "Registar transferencia de custodia porto/ferrovia/terminal com auditoria.",
  },
  {
    key: "cargo.claim.settle",
    label: "Liquidacao de claims",
    description: "Registar settlement contabilistico de claims aceites com auditoria.",
  },
  {
    key: "cargo.delivery.complete",
    label: "Entrega de carga",
    description: "Concluir entrega final com cargo delivered, tracking completed e auditoria.",
  },
  {
    key: "cargo.delivery.exception.record",
    label: "Excecao de entrega",
    description: "Registar entrega danificada ou nao conforme com cargo held e tracking exception.",
  },
  {
    key: "cargo.delivery.exception.resolve",
    label: "Resolucao de entrega",
    description: "Resolver excecao de entrega e restaurar carga para handover final.",
  },
  {
    key: "cargo.compliance.record",
    label: "Evidencias de compliance",
    description: "Registar evidencias documentais de carga com idempotencia e auditoria.",
  },
  {
    key: "cargo.compliance.verify",
    label: "Verificacao de compliance",
    description: "Aprovar ou rejeitar evidencias pendentes com decisao auditavel.",
  },
  {
    key: "capacity.read",
    label: "Capacidade",
    description: "Ler recursos, slots e reservas de capacidade operacional.",
  },
  {
    key: "capacity.manage",
    label: "Gestao de capacidade",
    description: "Registar recursos e abrir slots operacionais com auditoria.",
  },
  {
    key: "capacity.slot.reserve",
    label: "Reserva de slots",
    description: "Reservar unidades de capacidade para cargas elegiveis sem overbooking.",
  },
  {
    key: "capacity.slot.cancel",
    label: "Cancelamento de slots",
    description: "Cancelar reservas ativas e libertar capacidade com trilha auditavel.",
  },
  {
    key: "capacity.advisory.decide",
    label: "Decisao de advisory",
    description: "Aprovar ou rejeitar recomendacoes de capacidade com evidencia humana.",
  },
  {
    key: "planning.order.read",
    label: "Planeamento",
    description: "Ler ordens de transporte, confirmacoes, links de carga, tracking e capacidade.",
  },
  {
    key: "planning.order.confirm",
    label: "Confirmacao de transporte",
    description: "Confirmar transport orders com regras de carga, rota, capacidade e auditoria.",
  },
  {
    key: "planning.order.reschedule",
    label: "Replaneamento de transporte",
    description: "Replanear transport orders confirmadas com revisao, timing, auditoria e outbox.",
  },
  {
    key: "planning.order.dispatch",
    label: "Dispatch de transporte",
    description: "Despachar transport orders confirmadas para execucao com instrucoes e auditoria.",
  },
  {
    key: "planning.order.cancel",
    label: "Cancelamento de transporte",
    description: "Cancelar transport orders confirmadas antes da partida com motivo e auditoria.",
  },
  {
    key: "tariff.read",
    label: "Tarifas",
    description: "Ler rate cards, regras tarifarias e cotacoes operacionais.",
  },
  {
    key: "tariff.manage",
    label: "Gestao tarifaria",
    description: "Gerir rate cards e regras de pricing com auditoria.",
  },
  {
    key: "tariff.quote.calculate",
    label: "Calculo de cotacao",
    description: "Calcular cotacoes para cargas elegiveis com rate cards ativos.",
  },
  {
    key: "tariff.quote.approve",
    label: "Aprovacao de cotacao",
    description: "Aprovar cotacoes calculadas com evidencia financeira.",
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
    label: "Excecoes",
    description: "Gerir atrasos, holds e excecoes operacionais.",
  },
  {
    key: "tracking.exception.resolve",
    label: "Resolucao",
    description: "Resolver excecoes e libertar cargas de holds operacionais.",
  },
] as const satisfies readonly PlatformPermissionCatalogItem[];

export const platformNavigation: readonly PlatformNavigationGroup[] = [
  {
    label: "Foundation",
    items: [
      {
        label: "Control Center",
        href: "/app",
        description: "Estado local da fundacao Web/Auth antes de features.",
        status: "available",
      },
      {
        label: "Seguranca da conta",
        href: "/app/security",
        description: "Sessao atual, revogacao de sessoes e readiness MFA.",
        status: "available",
      },
    ],
  },
  {
    label: "Operacoes",
    items: [
      {
        label: "Gestao de cargas",
        href: "/app/cargo",
        description: "Registo governado de cargas antes de transporte e tracking.",
        status: "available",
        requiredPermissions: ["cargo.read"],
      },
      {
        label: "Tracking operacional",
        href: "/app/tracking",
        description: "Visao segura de cargas, movimentos e excecoes operacionais.",
        status: "available",
        requiredPermissions: ["tracking.shipment.read"],
      },
      {
        label: "Capacidade operacional",
        href: "/app/capacity",
        description: "Slots, recursos e reservas sem overbooking para ferrovia, porto e logistica.",
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
        label: "Tariff / Pricing",
        href: "/app/tariffs",
        description: "Rate cards, regras tarifarias, cotacoes e aprovacao financeira.",
        status: "available",
        requiredPermissions: ["tariff.read"],
      },
      {
        label: "Reports",
        href: "/app/reports",
        description: "Exports CSV governados para Tracking, Cargo, Capacity, Planning e Tariff.",
        status: "available",
        requiredPermissions: ["report.export"],
      },
      {
        label: "Notificacoes",
        href: "/app/notifications",
        description: "Inbox operacional gerada pelo outbox para eventos criticos.",
        status: "available",
        requiredPermissions: ["notification.read"],
      },
    ],
  },
  {
    label: "Seguranca",
    items: [
      {
        label: "Integracoes",
        href: "/app/integrations",
        description: "Service accounts, API keys e eventos externos idempotentes.",
        status: "available",
        requiredPermissions: ["integration.api_key.manage"],
      },
      {
        label: "Identidade e RBAC",
        href: "/app/admin",
        description: "Utilizadores, memberships, roles, permissoes e governanca tenant-scoped.",
        status: "available",
        requiredPermissions: ["identity.role.assign"],
      },
      {
        label: "Auditoria",
        href: "/app/audit",
        description: "Base do audit trail para operacoes criticas.",
        status: "available",
        requiredPermissions: ["audit.read"],
      },
    ],
  },
  {
    label: "Preparacao",
    items: [
      {
        label: "Design System",
        href: "/app#design-system",
        description: "Tokens, primitivas e padroes aplicados no shell.",
        status: "available",
      },
      {
        label: "Features de negocio",
        href: "/app/planning",
        description: "Modulos ativos: Cargas, Tracking, Capacity, Planning e Tariff / Pricing.",
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
