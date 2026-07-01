import { Module } from "@nestjs/common";

import { TEAMS_REPOSITORY } from "./domain/teams.repository.js";
import { PrismaTeamsRepository } from "./infrastructure/prisma-teams.repository.js";
import { TeamsService } from "./teams.service.js";

@Module({
  providers: [TeamsService, { provide: TEAMS_REPOSITORY, useClass: PrismaTeamsRepository }],
  exports: [TeamsService],
})
export class TeamsModule {}
