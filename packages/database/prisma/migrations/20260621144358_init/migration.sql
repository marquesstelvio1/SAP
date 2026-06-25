-- CreateIndex
CREATE INDEX "MembershipRole_membershipId_idx" ON "MembershipRole"("membershipId");

-- CreateIndex
CREATE INDEX "MembershipRole_roleId_idx" ON "MembershipRole"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- RenameIndex
ALTER INDEX "CapacityAdvisoryDecision_organizationId_decisionIdempotencyKey_" RENAME TO "CapacityAdvisoryDecision_organizationId_decisionIdempotency_key";

-- RenameIndex
ALTER INDEX "CapacityAdvisoryDecision_organizationId_decisionStatus_decidedA" RENAME TO "CapacityAdvisoryDecision_organizationId_decisionStatus_deci_idx";

-- RenameIndex
ALTER INDEX "CapacityAdvisoryDecision_organizationId_recommendationType_deci" RENAME TO "CapacityAdvisoryDecision_organizationId_recommendationType__idx";

-- RenameIndex
ALTER INDEX "CapacityAdvisoryDecision_organizationId_reservationId_decidedAt" RENAME TO "CapacityAdvisoryDecision_organizationId_reservationId_decid_idx";

-- RenameIndex
ALTER INDEX "CapacitySlotReservation_organizationId_cargoId_slotId_reservati" RENAME TO "CapacitySlotReservation_organizationId_cargoId_slotId_reser_key";

-- RenameIndex
ALTER INDEX "CapacitySlotReservation_organizationId_reserveIdempotencyKey_ke" RENAME TO "CapacitySlotReservation_organizationId_reserveIdempotencyKe_key";

-- RenameIndex
ALTER INDEX "CargoClaimSettlement_organizationId_settlementType_settledAt_id" RENAME TO "CargoClaimSettlement_organizationId_settlementType_settledA_idx";

-- RenameIndex
ALTER INDEX "CargoComplianceEvidence_organizationId_cargoId_evidenceType_doc" RENAME TO "CargoComplianceEvidence_organizationId_cargoId_evidenceType_key";

-- RenameIndex
ALTER INDEX "CargoOperationalHandoff_organizationId_handoffType_handoffAt_id" RENAME TO "CargoOperationalHandoff_organizationId_handoffType_handoffA_idx";

-- RenameIndex
ALTER INDEX "TransportOrderScheduleRevision_organizationId_idempotencyKey_ke" RENAME TO "TransportOrderScheduleRevision_organizationId_idempotencyKe_key";

-- RenameIndex
ALTER INDEX "TransportOrderScheduleRevision_organizationId_orderId_reschedul" RENAME TO "TransportOrderScheduleRevision_organizationId_orderId_resch_idx";

-- RenameIndex
ALTER INDEX "TransportOrderScheduleRevision_organizationId_revisionReference" RENAME TO "TransportOrderScheduleRevision_organizationId_revisionRefer_key";
