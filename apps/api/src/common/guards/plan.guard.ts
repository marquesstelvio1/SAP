import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getCurrentOrganizationId, getPrismaClient } from "@saptm/database";

import { PLAN_FEATURE_KEY } from "../decorators/plan-feature.decorator.js";

type PlanFeatureEntry = {
  key: string;
  included: boolean;
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(PLAN_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredFeature === undefined) {
      return true;
    }

    const organizationId = getCurrentOrganizationId();

    if (organizationId === undefined) {
      throw new ForbiddenException("plan.organization_required");
    }

    const prisma = getPrismaClient();

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (subscription === null) {
      return this.checkFreePlan(requiredFeature, prisma);
    }

    const planSlug = subscription.plan;
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug },
    });

    if (plan === null) {
      throw new ForbiddenException("plan.nao_encontrado");
    }

    const features = plan.features as Array<PlanFeatureEntry>;
    const hasFeature = features.some((f) => f.key === requiredFeature && f.included);

    if (!hasFeature) {
      const planName = plan.name ?? planSlug;
      throw new ForbiddenException(
        `Funcionalidade indisponivel no plano ${planName}. Faca upgrade para aceder.`,
      );
    }

    return true;
  }

  private async checkFreePlan(
    requiredFeature: string,
    prisma: ReturnType<typeof getPrismaClient>,
  ): Promise<boolean> {
    const freePlan = await prisma.plan.findUnique({
      where: { slug: "free" },
    });

    if (freePlan === null) {
      throw new ForbiddenException("plan.nao_disponivel");
    }

    const features = freePlan.features as Array<PlanFeatureEntry>;
    const hasFeature = features.some((f) => f.key === requiredFeature && f.included);

    if (!hasFeature) {
      throw new ForbiddenException("plan.feature_nao_disponivel");
    }

    return true;
  }
}
