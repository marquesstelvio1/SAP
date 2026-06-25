"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@saptm/ui";
import { useRouter } from "next/navigation";
import { useActionState, useId } from "react";

export type CreateTeamFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialFormState: CreateTeamFormState = {
  status: "idle",
  message: "",
};

type CreateTeamDialogProps = {
  action: (_previousState: CreateTeamFormState, formData: FormData) => Promise<CreateTeamFormState>;
  canCreate: boolean;
  children?: React.ReactNode;
};

export function CreateTeamDialog({ action, canCreate, children }: CreateTeamDialogProps) {
  const id = useId();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  if (state.status === "success") {
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild disabled={!canCreate}>
        {children ?? <Button>Nova equipa</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar equipa</DialogTitle>
          <DialogDescription>
            Cria uma nova equipa com slug unico dentro da organizacao.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-name`}>Nome</Label>
            <Input
              id={`${id}-name`}
              name="name"
              placeholder="Ex: Operacoes Portuarias"
              required
              minLength={2}
              maxLength={160}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-slug`}>Slug</Label>
            <Input
              id={`${id}-slug`}
              name="slug"
              placeholder="Ex: operacoes-portuarias"
              required
              minLength={2}
              maxLength={120}
              pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-description`}>Descricao</Label>
            <Textarea
              id={`${id}-description`}
              name="description"
              placeholder="Descricao opcional da equipa"
              rows={3}
            />
          </div>
          {state.status === "error" ? (
            <p className="text-destructive text-sm">{state.message}</p>
          ) : null}
          {state.status === "success" ? (
            <p className="text-success text-sm">{state.message}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A criar..." : "Criar equipa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
