"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ContextRow,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saptm/ui";
import { useActionState } from "react";
import { formatDateTime } from "@/lib/format";
import { organizationStatusLabels } from "../../app/(platform)/app/admin/logic";
import type { GeneralSettingsFormState } from "../../app/(platform)/app/settings/general/form-state";

export type GeneralSettingsFormProps = {
  action: (
    previousState: GeneralSettingsFormState,
    formData: FormData,
  ) => Promise<GeneralSettingsFormState>;
  canManageTenant: boolean;
  initialState: GeneralSettingsFormState;
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
  };
};

export function GeneralSettingsForm({
  action,
  canManageTenant,
  initialState,
  organization,
}: GeneralSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isDisabled = isPending || !canManageTenant;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Configurações</Badge>
          <Badge variant={canManageTenant ? "success" : "warning"}>
            {canManageTenant ? "Gerir organizacao" : "Indisponivel"}
          </Badge>
          <Badge variant={organization.status === "active" ? "success" : "destructive"}>
            {organizationStatusLabels[
              organization.status as keyof typeof organizationStatusLabels
            ] ?? organization.status}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-semibold text-3xl tracking-tight">Configurações gerais</h1>
          <p className="mt-2 text-muted-foreground">
            Gerir nome, slug e estado da organização. As alterações são auditáveis e propagadas para
            todos os módulos.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informação da organização</CardTitle>
            <CardDescription>Altere o nome público ou o slug URL da organização.</CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Nome da organizacao</FieldLabel>
                  <FieldContent>
                    <Input
                      defaultValue={organization.name}
                      disabled={isDisabled}
                      id="org-name"
                      maxLength={160}
                      name="name"
                      placeholder="Ex: SAPTM Logistica"
                      required
                      type="text"
                    />
                    <FieldDescription>Nome visível em toda a plataforma.</FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="org-slug">Slug URL</FieldLabel>
                  <FieldContent>
                    <Input
                      defaultValue={organization.slug}
                      disabled={isDisabled}
                      id="org-slug"
                      maxLength={120}
                      name="slug"
                      placeholder="Ex: saptm-logistica"
                      pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
                      required
                      type="text"
                    />
                    <FieldDescription>
                      Identificador URL-safe: minúsculas, números e hífens.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldDescription>
                    {state.status === "success" ? state.message : state.message}
                  </FieldDescription>
                  {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <Button disabled={isDisabled} type="submit">
                {isPending ? "A guardar..." : "Guardar alterações"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Estado atual da organizacao.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ContextRow label="ID" value={organization.id} />
            <ContextRow
              label="Estado"
              value={
                organizationStatusLabels[
                  organization.status as keyof typeof organizationStatusLabels
                ] ?? organization.status
              }
            />
            <ContextRow label="Membros" value={organization.memberCount.toString()} />
            <ContextRow label="Criada em" value={formatDateTime(organization.createdAt)} />
            <ContextRow label="Atualizada em" value={formatDateTime(organization.updatedAt)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
