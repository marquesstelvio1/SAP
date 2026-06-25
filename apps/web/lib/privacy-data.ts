import {
  type PrivacyDeleteInput,
  type PrivacyDeleteOutput,
  type PrivacyExportInput,
  type PrivacyExportOutput,
  privacyDeleteInputSchema,
  privacyDeleteOutputSchema,
  privacyExportInputSchema,
  privacyExportOutputSchema,
} from "@saptm/rpc";

import { rpcPost } from "./rpc-server";

export async function exportUserData(input: PrivacyExportInput) {
  return rpcPost<PrivacyExportOutput>(
    "/rpc/privacy/export",
    privacyExportOutputSchema,
    privacyExportInputSchema.parse(input),
  );
}

export async function scheduleAccountDeletion(input: PrivacyDeleteInput) {
  return rpcPost<PrivacyDeleteOutput>(
    "/rpc/privacy/delete",
    privacyDeleteOutputSchema,
    privacyDeleteInputSchema.parse(input),
  );
}
