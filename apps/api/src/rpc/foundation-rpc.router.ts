import { os } from "@orpc/server";
import {
  createFoundationRpcHealthReport,
  foundationRpcHealthMetadata,
  foundationRpcHealthOutputSchema,
} from "@saptm/rpc";

export const foundationRpcRouter = os.router({
  system: {
    health: os
      .meta(foundationRpcHealthMetadata)
      .route({ method: "GET", path: "/system/health" })
      .output(foundationRpcHealthOutputSchema)
      .handler(() => createFoundationRpcHealthReport()),
  },
});

export type FoundationRpcRouter = typeof foundationRpcRouter;
