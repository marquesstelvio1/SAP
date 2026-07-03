"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@saptm/ui";
import { CheckIcon } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
};

const defaultPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Para testar a plataforma",
    price: 0,
    features: ["Ate 10 cargas/mes", "Tracking basico", "1 utilizador", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para operações profissionais",
    price: 9900,
    features: [
      "Cargas ilimitadas",
      "Tracking avancado",
      "Ate 25 utilizadores",
      "Suporte prioritario",
      "API keys",
      "Relatorios exportaveis",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes operadores",
    price: 0,
    features: [
      "Tudo do Pro",
      "Utilizadores ilimitados",
      "SLA garantido",
      "Gerente de conta dedicado",
      "On-premise disponível",
      "Integrações personalizadas",
    ],
  },
];

export type PlanComparisonModalProps = {
  currentPlan: string | null;
  plans?: Plan[];
};

export function PlanComparisonModal({
  currentPlan,
  plans = defaultPlans,
}: PlanComparisonModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Comparar planos</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Planos</DialogTitle>
          <DialogDescription>Escolha o plano ideal para a sua operação</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col ${
                plan.id === currentPlan ? "border-primary ring-1 ring-primary" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.id === currentPlan ? <Badge variant="default">Plano atual</Badge> : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="mb-4">
                  <span className="text-3xl font-bold">
                    {plan.price === 0
                      ? "Gratuito"
                      : `${(plan.price / 100).toFixed(2).replace(".", ",")} €`}
                  </span>
                  {plan.price > 0 ? (
                    <span className="text-muted-foreground text-sm">/mes</span>
                  ) : null}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.id === currentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano atual
                  </Button>
                ) : plan.id === "enterprise" ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.location.href = "mailto:vendas@saptm.pt";
                    }}
                  >
                    Contactar vendas
                  </Button>
                ) : (
                  <form
                    action="/rpc/billing/createCheckoutSession"
                    method="POST"
                    className="w-full"
                  >
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="successUrl" value={window.location.href} />
                    <input type="hidden" name="cancelUrl" value={window.location.href} />
                    <Button type="submit" className="w-full">
                      Upgrade
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
