"use client";

import type { TeamDetail } from "@saptm/rpc/teams";
import { teamRoles } from "@saptm/rpc/teams";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  SelectNative,
} from "@saptm/ui";
import { useRouter } from "next/navigation";
import { useActionState, useId } from "react";

export type TeamMembersFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialFormState: TeamMembersFormState = {
  status: "idle",
  message: "",
};

type TeamMembersDialogProps = {
  team: TeamDetail;
  addMemberAction: (
    _previousState: TeamMembersFormState,
    formData: FormData,
  ) => Promise<TeamMembersFormState>;
  removeMemberAction: (
    _previousState: TeamMembersFormState,
    formData: FormData,
  ) => Promise<TeamMembersFormState>;
  updateRoleAction: (
    _previousState: TeamMembersFormState,
    formData: FormData,
  ) => Promise<TeamMembersFormState>;
  canManage: boolean;
  users?: { id: string; name: string; email: string }[];
};

export function TeamMembersDialog({
  team,
  addMemberAction,
  removeMemberAction,
  updateRoleAction,
  canManage,
  users = [],
}: TeamMembersDialogProps) {
  const addId = useId();
  const router = useRouter();

  const [addState, addFormAction, addPending] = useActionState(addMemberAction, initialFormState);
  const [removeState, removeFormAction, removePending] = useActionState(
    removeMemberAction,
    initialFormState,
  );
  const [roleState, roleFormAction, rolePending] = useActionState(
    updateRoleAction,
    initialFormState,
  );

  if (addState.status === "success") {
    router.refresh();
  }
  if (removeState.status === "success") {
    router.refresh();
  }
  if (roleState.status === "success") {
    router.refresh();
  }

  const availableUsers = users.filter((u) => !team.members.some((m) => m.userId === u.id));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Membros ({team.memberCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
          <DialogDescription>Gerir membros da equipa e seus papeis.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-muted-foreground text-xs">{member.email}</span>
              </div>
              {canManage ? (
                <div className="flex items-center gap-2">
                  <form action={roleFormAction}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="userId" value={member.userId} />
                    <SelectNative
                      name="role"
                      defaultValue={member.role}
                      onChange={(e) => {
                        e.target.form?.requestSubmit();
                      }}
                      disabled={rolePending}
                      className="w-28 text-xs"
                    >
                      {teamRoles.map((role) => (
                        <option key={role} value={role}>
                          {role === "admin"
                            ? "Admin"
                            : role === "member"
                              ? "Membro"
                              : "Visualizador"}
                        </option>
                      ))}
                    </SelectNative>
                  </form>
                  <form action={removeFormAction}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="userId" value={member.userId} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={removePending}
                      className="text-destructive"
                    >
                      Remover
                    </Button>
                  </form>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs capitalize">
                  {member.role === "admin"
                    ? "Admin"
                    : member.role === "member"
                      ? "Membro"
                      : "Visualizador"}
                </span>
              )}
            </div>
          ))}
        </div>

        {canManage && availableUsers.length > 0 ? (
          <form action={addFormAction} className="flex flex-col gap-3 pt-2">
            <Label htmlFor={`${addId}-user`}>Adicionar membro</Label>
            <div className="flex gap-2">
              <input type="hidden" name="teamId" value={team.id} />
              <SelectNative id={`${addId}-user`} name="userId" required>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </SelectNative>
              <SelectNative name="role" defaultValue="member" className="w-28">
                {teamRoles.map((role) => (
                  <option key={role} value={role}>
                    {role === "admin" ? "Admin" : role === "member" ? "Membro" : "Visualizador"}
                  </option>
                ))}
              </SelectNative>
              <Button type="submit" disabled={addPending}>
                {addPending ? "A adicionar..." : "Adicionar"}
              </Button>
            </div>
            {addState.status === "error" ? (
              <p className="text-destructive text-xs">{addState.message}</p>
            ) : null}
            {addState.status === "success" ? (
              <p className="text-success text-xs">{addState.message}</p>
            ) : null}
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
