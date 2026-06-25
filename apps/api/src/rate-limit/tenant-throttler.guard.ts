import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const authContext = (req as any).authContext;
    if (authContext?.organizationId) {
      return `org:${authContext.organizationId}`;
    }
    return (req.ip as string) || "anonymous";
  }

  protected async getUserTracker(req: Record<string, unknown>): Promise<string> {
    const authContext = (req as any).authContext;
    if (authContext?.userId) {
      return `user:${authContext.userId}`;
    }
    return this.getTracker(req);
  }
}
