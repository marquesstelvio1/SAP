import { SetMetadata } from "@nestjs/common";

export const PLAN_FEATURE_KEY = "saptm.plan.feature";

/**
 * Decorator that specifies which plan features are required for an operation.
 * Used by PlanGuard to check if the organization's plan includes the feature.
 *
 * @example
 * ```ts
 * @PlanFeature("advanced_tracking")
 * @Mutation(...)
 * async advancedTracking(...) { ... }
 * ```
 */
export function PlanFeature(feature: string) {
  return SetMetadata(PLAN_FEATURE_KEY, feature);
}
