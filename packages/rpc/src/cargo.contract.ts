import { oc } from "@orpc/contract";

import {
  cargoClaimSettlementRecordInputSchema,
  cargoClaimSettlementRecordOutputSchema,
  cargoComplianceEvidenceRecordInputSchema,
  cargoComplianceEvidenceRecordOutputSchema,
  cargoComplianceEvidenceVerifyInputSchema,
  cargoComplianceEvidenceVerifyOutputSchema,
  cargoDeliveryCompleteInputSchema,
  cargoDeliveryCompleteOutputSchema,
  cargoDeliveryExceptionRecordInputSchema,
  cargoDeliveryExceptionRecordOutputSchema,
  cargoDeliveryExceptionResolveInputSchema,
  cargoDeliveryExceptionResolveOutputSchema,
  cargoOperationalHandoffRecordInputSchema,
  cargoOperationalHandoffRecordOutputSchema,
  cargoOverviewInputSchema,
  cargoOverviewOutputSchema,
  cargoRegisterInputSchema,
  cargoRegisterOutputSchema,
  cargoReleaseInputSchema,
  cargoReleaseOutputSchema,
  cargoTransportArriveInputSchema,
  cargoTransportArriveOutputSchema,
  cargoTransportDepartInputSchema,
  cargoTransportDepartOutputSchema,
  cargoTransportPlanInputSchema,
  cargoTransportPlanOutputSchema,
} from "./cargo.js";
import { complianceOverviewInputSchema, complianceOverviewOutputSchema } from "./compliance.js";
import { deliveryOverviewInputSchema, deliveryOverviewOutputSchema } from "./delivery.js";

export const cargoContract = {
  cargo: {
    overview: oc
      .route({ method: "GET", path: "/cargo/overview" })
      .input(cargoOverviewInputSchema)
      .output(cargoOverviewOutputSchema),
    complianceOverview: oc
      .route({ method: "GET", path: "/cargo/complianceOverview" })
      .input(complianceOverviewInputSchema)
      .output(complianceOverviewOutputSchema),
    deliveryOverview: oc
      .route({ method: "GET", path: "/cargo/deliveryOverview" })
      .input(deliveryOverviewInputSchema)
      .output(deliveryOverviewOutputSchema),
    register: oc
      .route({ method: "POST", path: "/cargo/register" })
      .input(cargoRegisterInputSchema)
      .output(cargoRegisterOutputSchema),
    release: oc
      .route({ method: "POST", path: "/cargo/release" })
      .input(cargoReleaseInputSchema)
      .output(cargoReleaseOutputSchema),
    planTransport: oc
      .route({ method: "POST", path: "/cargo/planTransport" })
      .input(cargoTransportPlanInputSchema)
      .output(cargoTransportPlanOutputSchema),
    departTransport: oc
      .route({ method: "POST", path: "/cargo/departTransport" })
      .input(cargoTransportDepartInputSchema)
      .output(cargoTransportDepartOutputSchema),
    arriveTransport: oc
      .route({ method: "POST", path: "/cargo/arriveTransport" })
      .input(cargoTransportArriveInputSchema)
      .output(cargoTransportArriveOutputSchema),
    completeDelivery: oc
      .route({ method: "POST", path: "/cargo/completeDelivery" })
      .input(cargoDeliveryCompleteInputSchema)
      .output(cargoDeliveryCompleteOutputSchema),
    recordDeliveryException: oc
      .route({ method: "POST", path: "/cargo/recordDeliveryException" })
      .input(cargoDeliveryExceptionRecordInputSchema)
      .output(cargoDeliveryExceptionRecordOutputSchema),
    resolveDeliveryException: oc
      .route({ method: "POST", path: "/cargo/resolveDeliveryException" })
      .input(cargoDeliveryExceptionResolveInputSchema)
      .output(cargoDeliveryExceptionResolveOutputSchema),
    recordOperationalHandoff: oc
      .route({ method: "POST", path: "/cargo/recordOperationalHandoff" })
      .input(cargoOperationalHandoffRecordInputSchema)
      .output(cargoOperationalHandoffRecordOutputSchema),
    recordClaimSettlement: oc
      .route({ method: "POST", path: "/cargo/recordClaimSettlement" })
      .input(cargoClaimSettlementRecordInputSchema)
      .output(cargoClaimSettlementRecordOutputSchema),
    recordComplianceEvidence: oc
      .route({ method: "POST", path: "/cargo/recordComplianceEvidence" })
      .input(cargoComplianceEvidenceRecordInputSchema)
      .output(cargoComplianceEvidenceRecordOutputSchema),
    verifyComplianceEvidence: oc
      .route({ method: "POST", path: "/cargo/verifyComplianceEvidence" })
      .input(cargoComplianceEvidenceVerifyInputSchema)
      .output(cargoComplianceEvidenceVerifyOutputSchema),
  },
};
