import { Injectable } from "@nestjs/common";
import {
  type ResolvedUserAuthorization,
  resolveDefaultUserAuthorization as resolveUserAuthorization,
} from "@saptm/auth/server";

@Injectable()
export class UserAuthorizationService {
  async resolveDefaultUserAuthorization(userId: string): Promise<ResolvedUserAuthorization> {
    return resolveUserAuthorization(userId);
  }
}
