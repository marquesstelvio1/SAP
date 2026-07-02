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
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saptm/ui";
import { useActionState, useState } from "react";

import type { BrandingSettingsFormState } from "../../app/(platform)/app/settings/branding/form-state";

export type BrandingSettingsFormProps = {
  action: (
    previousState: BrandingSettingsFormState,
    formData: FormData,
  ) => Promise<BrandingSettingsFormState>;
  canManageTenant: boolean;
  initialState: BrandingSettingsFormState;
  organizationSlug: string;
};

const DEFAULT_PRIMARY_COLOR = "#FF6600";

export function BrandingSettingsForm({
  action,
  canManageTenant,
  initialState,
  organizationSlug,
}: BrandingSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const isDisabled = isPending || !canManageTenant;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Marca</Badge>
          <Badge variant={canManageTenant ? "success" : "warning"}>
            {canManageTenant ? "Gerir organizacao" : "Indisponível"}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-semibold text-3xl tracking-heading">Marca</h1>
          <p className="mt-2 text-muted-foreground">
            Personalize o aspeto visual da organização: logotipo, cor primária e favicon.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Logotipo</CardTitle>
              <CardDescription>
                Envie uma imagem para o logotipo da organização. Formatos aceites: PNG, SVG. Tamanho
                máximo: 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="org-logo">Logotipo</FieldLabel>
                <FieldContent>
                  <Input
                    accept=".png,.svg"
                    disabled={isDisabled}
                    id="org-logo"
                    name="logo"
                    type="file"
                  />
                  <FieldDescription>Recomendado: 256x256px, fundo transparente.</FieldDescription>
                </FieldContent>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cor primaria</CardTitle>
              <CardDescription>
                Define a cor principal da organização usada em headers, botões e acentos visuais.
              </CardDescription>
            </CardHeader>
            <form action={formAction}>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="primary-color">Cor primaria (hex)</FieldLabel>
                    <FieldContent>
                      <div className="flex gap-3">
                        <Input
                          defaultValue={DEFAULT_PRIMARY_COLOR}
                          disabled={isDisabled}
                          id="primary-color"
                          maxLength={7}
                          name="primaryColor"
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          pattern="^#[0-9a-fA-F]{6}$"
                          placeholder="#FF6600"
                          type="text"
                        />
                        <div
                          className="size-10 shrink-0 rounded-md border"
                          style={{ backgroundColor: primaryColor }}
                        />
                      </div>
                      <FieldDescription>
                        Formato hexadecimal de 6 dígitos (ex: #FF6600).
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
              <CardTitle>Favicon</CardTitle>
              <CardDescription>
                Envie uma imagem para o favicon da organizacao. Formatos aceites: ICO, PNG. Tamanho
                maximo: 1MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="org-favicon">Favicon</FieldLabel>
                <FieldContent>
                  <Input
                    accept=".ico,.png"
                    disabled={isDisabled}
                    id="org-favicon"
                    name="favicon"
                    type="file"
                  />
                  <FieldDescription>Recomendado: 32x32px, formato ICO.</FieldDescription>
                </FieldContent>
              </Field>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pre-visualizacao</CardTitle>
            <CardDescription>Como o branding sera aplicado na plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-xl font-semibold text-sm text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  ST
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm tracking-heading">SAPTM</span>
                  <span className="text-muted-foreground text-xs">{organizationSlug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 items-center rounded-md px-2 text-xs font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Pré-visualização marca
                </span>
                <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                  secondary
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-panel outline-none transition-colors hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  style={{ backgroundColor: primaryColor }}
                  type="button"
                >
                  Botao primario
                </button>
                <button
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-panel outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  type="button"
                >
                  Botao secundario
                </button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              A pre-visualizacao reflete as alteracoes na cor primaria.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
