import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import type { ReactNode } from "react";

type CargoStatus =
  | "registered"
  | "ready_for_transport"
  | "in_transport"
  | "held"
  | "delivered"
  | "cancelled";

const LIFECYCLE_STEPS = [
  { key: "registration", label: "Registo" },
  { key: "compliance", label: "Compliance" },
  { key: "release", label: "Liberacao" },
  { key: "planning", label: "Planeamento" },
  { key: "departure", label: "Partida" },
  { key: "arrival", label: "Chegada" },
  { key: "delivery", label: "Entrega" },
] as const;

/** Determines which steps are complete based on cargo status */
function computeLifecycleProgress(status: CargoStatus): {
  steps: typeof LIFECYCLE_STEPS;
  currentIndex: number;
} {
  const statusToLastCompleted: Record<string, number> = {
    registered: 2, // registration + compliance + release
    ready_for_transport: 2,
    in_transport: 4, // up to departure
    held: 2, // blocked at release
    delivered: 6, // all
    cancelled: -1, // cancelled
  };

  const lastCompleted = statusToLastCompleted[status] ?? -1;

  return {
    steps: LIFECYCLE_STEPS,
    currentIndex: lastCompleted,
  };
}

export type LifecycleStage = "pre-transport" | "in-transit" | "delivery" | "completed";

export type CargoLifecycleGroupProps = {
  stage: LifecycleStage;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
};

const STAGE_ORDER: LifecycleStage[] = ["pre-transport", "in-transit", "delivery", "completed"];

export function CargoLifecycleGroup({
  stage,
  title,
  description,
  badge,
  children,
}: CargoLifecycleGroupProps) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={resolveStageBadgeVariant(stage)} className="uppercase tracking-[0.12em]">
          Fase {STAGE_ORDER.indexOf(stage) + 1}: {title}
        </Badge>
        {badge !== undefined ? <Badge variant="outline">{badge}</Badge> : null}
      </div>
      <div className="mb-2 text-muted-foreground text-sm">{description}</div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function LifecycleProgressIndicator({
  cargoStatuses,
}: {
  cargoStatuses: readonly { status: CargoStatus; count: number }[];
}) {
  const activeStatuses = cargoStatuses.filter((s) => s.count > 0).map((s) => s.status);
  const dominantStatus = activeStatuses[0] ?? "registered";
  const { steps, currentIndex } = computeLifecycleProgress(dominantStatus);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Lifecycle P0</Badge>
          <Badge variant="outline">Progresso operacional</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg">Estado do ciclo de vida</CardTitle>
          <CardDescription className="text-sm leading-6">
            Progresso das cargas atraves das etapas: Registo → Compliance → Liberacao → Planeamento
            → Partida → Chegada → Entrega
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isComplete = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <div className="flex items-center gap-1" key={step.key}>
                <div
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                    isComplete
                      ? isCurrent
                        ? "bg-primary/15 text-primary font-medium"
                        : "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex size-4 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                      isComplete
                        ? "bg-success text-success-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {isComplete ? "✓" : index + 1}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>
                </div>
                {isLast ? null : (
                  <div
                    className={`h-px w-3 ${
                      index < currentIndex ? "bg-success/40" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function resolveStageBadgeVariant(
  stage: LifecycleStage,
): "success" | "info" | "warning" | "outline" {
  if (stage === "pre-transport") return "info";
  if (stage === "in-transit") return "warning";
  if (stage === "delivery") return "success";
  return "outline";
}
