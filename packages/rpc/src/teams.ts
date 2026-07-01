import { z } from "zod";
import { sharedAuditSchema, sharedOutboxSchema } from "./foundation.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const teamRoles = ["admin", "member", "viewer"] as const;

const teamIdempotencySchema = z.string().trim().min(12).max(128);
const teamSourceSystemSchema = z.string().trim().min(1).max(80).default("saptm");

export const teamNameSchema = z.string().trim().min(2).max(160);
export const teamDescriptionSchema = z.string().trim().min(0).max(500).optional();
export const teamSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Slug deve ser URL-safe, usando minusculas, numeros e hifens.",
  );

export const createTeamInputSchema = z.object({
  name: teamNameSchema,
  description: teamDescriptionSchema,
  slug: teamSlugSchema,
  idempotencyKey: teamIdempotencySchema,
  sourceSystem: teamSourceSystemSchema,
});

export const updateTeamInputSchema = z.object({
  teamId: z.string().trim().min(1),
  name: teamNameSchema.optional(),
  description: teamDescriptionSchema,
  idempotencyKey: teamIdempotencySchema,
  sourceSystem: teamSourceSystemSchema,
});

export const deleteTeamInputSchema = z.object({
  teamId: z.string().trim().min(1),
  idempotencyKey: teamIdempotencySchema,
  sourceSystem: teamSourceSystemSchema,
});

export const listTeamsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 25,
    offset: 0,
  });

export const getTeamInputSchema = z.object({
  teamId: z.string().trim().min(1),
});

export const addTeamMemberInputSchema = z.object({
  teamId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  role: z.enum(teamRoles).default("member"),
  idempotencyKey: teamIdempotencySchema,
  sourceSystem: teamSourceSystemSchema,
});

export const removeTeamMemberInputSchema = z.object({
  teamId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  idempotencyKey: teamIdempotencySchema,
  sourceSystem: teamSourceSystemSchema,
});

export const updateTeamMemberRoleInputSchema = z.object({
  teamId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  role: z.enum(teamRoles),
  idempotencyKey: teamIdempotencySchema,
  sourceSystem: teamSourceSystemSchema,
});

export const teamMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(teamRoles),
});

export const teamSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  organizationId: z.string(),
  memberCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const teamDetailSchema = teamSummarySchema.extend({
  members: z.array(teamMemberSchema),
});

export const createTeamOutputSchema = z.object({
  teamId: z.string(),
  team: teamSummarySchema,
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const updateTeamOutputSchema = z.object({
  teamId: z.string(),
  team: teamSummarySchema,
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const deleteTeamOutputSchema = z.object({
  teamId: z.string(),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const listTeamsOutputSchema = z.object({
  teams: z.array(teamSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const getTeamOutputSchema = z.object({
  team: teamDetailSchema,
});

export const addTeamMemberOutputSchema = z.object({
  teamId: z.string(),
  member: teamMemberSchema,
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const removeTeamMemberOutputSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const updateTeamMemberRoleOutputSchema = z.object({
  teamId: z.string(),
  member: teamMemberSchema,
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;
export type CreateTeamOutput = z.infer<typeof createTeamOutputSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;
export type UpdateTeamOutput = z.infer<typeof updateTeamOutputSchema>;
export type DeleteTeamInput = z.infer<typeof deleteTeamInputSchema>;
export type DeleteTeamOutput = z.infer<typeof deleteTeamOutputSchema>;
export type ListTeamsInput = z.infer<typeof listTeamsInputSchema>;
export type ListTeamsOutput = z.infer<typeof listTeamsOutputSchema>;
export type GetTeamInput = z.infer<typeof getTeamInputSchema>;
export type GetTeamOutput = z.infer<typeof getTeamOutputSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberInputSchema>;
export type AddTeamMemberOutput = z.infer<typeof addTeamMemberOutputSchema>;
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberInputSchema>;
export type RemoveTeamMemberOutput = z.infer<typeof removeTeamMemberOutputSchema>;
export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleInputSchema>;
export type UpdateTeamMemberRoleOutput = z.infer<typeof updateTeamMemberRoleOutputSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type TeamSummary = z.infer<typeof teamSummarySchema>;
export type TeamDetail = z.infer<typeof teamDetailSchema>;

export const createTeamMetadata = createRpcOperationMetadata({
  name: "team.create",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const updateTeamMetadata = createRpcOperationMetadata({
  name: "team.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const deleteTeamMetadata = createRpcOperationMetadata({
  name: "team.delete",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const listTeamsMetadata = createRpcOperationMetadata({
  name: "team.list",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export const getTeamMetadata = createRpcOperationMetadata({
  name: "team.get",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export const addTeamMemberMetadata = createRpcOperationMetadata({
  name: "team.member.add",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const removeTeamMemberMetadata = createRpcOperationMetadata({
  name: "team.member.remove",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const updateTeamMemberRoleMetadata = createRpcOperationMetadata({
  name: "team.member.role.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});
