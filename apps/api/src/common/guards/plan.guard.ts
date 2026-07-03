import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getCurrentOrganizationId, getPrismaClient } from "@saptm/database";
import { z } from "zod";

import { PLAN_FEATURE_KEY } from "../decorators/plan-feature.decorator.js";
import { PlanCacheService } from "./plan-cache.service.js";

const PlanFeatureEntrySchema = z.object({
  key: z.string(),
  included: z.boolean(),
});

type PlanFeatureEntry = z.infer<typeof PlanFeatureEntrySchema>;

const PlanFeaturesArraySchema = z.array(PlanFeatureEntrySchema);

/**
 * Extracts and validates a plan's features array from the raw database value.
 * Uses Zod validation instead of an unsafe `as` cast to prevent runtime
 * crashes and ensure fail-closed behavior on malformed data.
 */
function parsePlanFeatures(raw: unknown): PlanFeatureEntry[] {
  const result = PlanFeaturesArraySchema.safeParse(raw);
  if (!result.success) {
    // SECURITY: Fail-closed — malformed features block access instead of
    // allowing silent bypass. Log the error for operational awareness.
    console.error(`[PLAN_GUARD] Invalid plan features structure: ${result.error.message}`);
    throw new InternalServerErrorException("plan.features_invalid");
  }
  return result.data;
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PlanCacheService) private readonly planCache: PlanCacheService,
  ) {}

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

    // Subscription query cannot be cached effectively (changes often via webhooks)
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (subscription === null) {
      return this.checkFreePlan(requiredFeature);
    }

    const planSlug = subscription.plan;

    // Plan lookups cached with 60s TTL + stale-while-revalidate
    const plan = await this.planCache.getPlanWithStaleRevalidate(planSlug, async () => {
      const p = await prisma.plan.findUnique({
        where: { slug: planSlug },
      });
      if (p === null) {
        throw new ForbiddenException("plan.nao_encontrado");
      }
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        features: p.features,
      };
    });

    // SECURITY: Validate features with Zod instead of unsafe `as` cast
    const features = parsePlanFeatures(plan.features);
    const hasFeature = features.some((f) => f.key === requiredFeature && f.included);

    if (!hasFeature) {
      const planName = plan.name ?? planSlug;
      throw new ForbiddenException(
        `Funcionalidade indisponivel no plano ${planName}. Faca upgrade para aceder.`,
      );
    }

    return true;
  }

  private async checkFreePlan(requiredFeature: string): Promise<boolean> {
    const freePlan = await this.planCache.getPlanWithStaleRevalidate("free", async () => {
      const prisma = getPrismaClient();
      const p = await prisma.plan.findUnique({
        where: { slug: "free" },
      });
      if (p === null) {
        throw new ForbiddenException("plan.nao_disponivel");
      }
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        features: p.features,
      };
    });

    // SECURITY: Validate features with Zod instead of unsafe `as` cast
    const features = parsePlanFeatures(freePlan.features);
    const hasFeature = features.some((f) => f.key === requiredFeature && f.included);

    if (!hasFeature) {
      throw new ForbiddenException("plan.feature_nao_disponivel");
    }

    return true;
  }
}
