const SOFT_DELETABLE_MODELS = new Set([
  "Membership",
  "ServiceAccount",
  "IntegrationEvent",
  "Notification",
  "Cargo",
  "CargoDeliveryException",
  "CargoClaimSettlement",
  "CargoOperationalHandoff",
  "CargoComplianceEvidence",
  "CapacityResource",
  "CapacitySlot",
  "CapacitySlotReservation",
  "CapacityAdvisoryDecision",
  "TransportOrder",
  "TransportOrderDispatch",
  "TransportOrderScheduleRevision",
  "TariffRateCard",
  "TariffRateRule",
  "TariffQuote",
  "TrackingShipment",
  "TrackingEvent",
  "Subscription",
  "Invoice",
  "UsageRecord",
  "WebhookEndpoint",
  "WebhookDelivery",
  "Team",
  "Organization",
  "Role",
]);

export function createSoftDeleteExtension() {
  return {
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }): Promise<unknown> {
          if (!SOFT_DELETABLE_MODELS.has(model)) {
            return query(args);
          }

          if (operation === "delete" || operation === "deleteMany") {
            throw new Error(
              `Direct delete on ${model} is not allowed. Use update() with deletedAt: new Date() instead.`,
            );
          }

          switch (operation) {
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "findUnique":
            case "findUniqueOrThrow":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "upsert": {
              const where = (args.where as Record<string, unknown> | undefined) ?? {};

              if (where.deletedAt === undefined) {
                args.where = { ...where, deletedAt: null } as Record<string, unknown>;
              }
              break;
            }

            default:
              break;
          }

          return query(args);
        },
      },
    },
  } as const;
}
