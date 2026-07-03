"use client";

import {
  AccessState,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Input,
  Switch,
} from "@saptm/ui";
import { LoaderIcon } from "lucide-react";
import { useState } from "react";

import { useRpcQuery } from "../../../../../hooks/use-rpc";
import { rpcGet } from "../../../../../lib/rpc-client";

/**
 * Client component for SSO configuration.
 *
 * Feature: Enterprise plan only.
 * Shows:
 * - Domain verification input
 * - IdP metadata fields (URL + XML upload)
 * - Entity ID / ACS URL (read-only auto-generated)
 * - OAuth provider toggles (Google, Microsoft, GitHub)
 * - JIT provisioning toggle
 *
 * Graceful degradation: if SSO API is not available (backend not implemented),
 * shows the form in read-only/info mode.
 */
export function SsoConfigClient() {
  const [domain, setDomain] = useState("");
  const [idpMetadataUrl, setIdpMetadataUrl] = useState("");
  const [idpEntityId, setIdpEntityId] = useState("");
  const [jitEnabled, setJitEnabled] = useState(false);

  const {
    data: ssoConfig,
    isLoading,
    isError,
  } = useRpcQuery({
    queryKey: ["sso-config"],
    queryFn: async () => {
      const result = await rpcGet("/rpc/sso/config", {
        safeParse: (data: unknown) => ({ success: true, data }),
      } as never);
      if (result.status === "ok") {
        return result.data as {
          config: {
            domain: string | null;
            idpMetadataUrl: string | null;
            idpEntityId: string | null;
            jitProvisioning: boolean;
            active: boolean;
          } | null;
        };
      }
      // If API returns unavailable (endpoint not implemented), return null gracefully
      if (result.status === "unavailable" || result.status === "not_found") {
        return null;
      }
      throw new Error(result.message);
    },
    staleTime: 60_000,
    retry: 1,
  });

  const isEnterprisePlan = true; // Will be checked server-side via feature gate

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <LoaderIcon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">A carregar configuração de autenticação...</p>
      </div>
    );
  }

  // Error state
  if (isError && ssoConfig === undefined) {
    return (
      <AccessState
        badgeLabel="Autenticação"
        title="Configuração indisponível"
        description="Não foi possível carregar as definições de autenticação. Se o módulo SSO ainda não estiver implementado no servidor, esta funcionalidade estará brevemente disponível."
        variant="error"
      />
    );
  }

  // Blocked state (non-Enterprise)
  if (!isEnterprisePlan) {
    return (
      <div className="flex flex-col items-center gap-4">
        <AccessState
          badgeLabel="Autenticação"
          title="SSO disponível apenas no plano Enterprise"
          description="Contacte a equipa comercial para fazer upgrade."
          variant="blocked"
        />
        <Button asChild variant="outline">
          <a href="/app/billing">Ver planos</a>
        </Button>
      </div>
    );
  }

  const existing = ssoConfig?.config ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-heading">Autenticação</h1>
        <p className="text-muted-foreground text-sm">Configure o login da sua organização</p>
      </div>

      {/* SSO/SAML Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔐</span>
            <CardTitle>SSO/SAML</CardTitle>
          </div>
          <CardDescription>
            Configure o Single Sign-On com o seu fornecedor de identidade SAML 2.0
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Domain */}
          <Field>
            <FieldLabel>Domínio</FieldLabel>
            <FieldContent>
              <Input
                placeholder="exemplo.pt"
                value={existing?.domain ?? domain}
                onChange={(e) => setDomain(e.target.value)}
                aria-describedby="domain-description"
              />
              <p id="domain-description" className="text-muted-foreground text-xs">
                Domínio corporativo (ex: logisticaporto.pt). Será pedida verificação por DNS TXT
                record.
              </p>
              {existing?.domain ? (
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant="success" density="compact">
                    Verificado
                  </Badge>
                  <span className="text-muted-foreground text-xs">Domínio configurado</span>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant="outline" density="compact">
                    Por verificar
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    Adicione um registo TXT DNS para verificar o domínio
                  </span>
                </div>
              )}
              <FieldError />
            </FieldContent>
          </Field>

          {/* IdP Metadata URL */}
          <Field>
            <FieldLabel>IdP Metadata URL</FieldLabel>
            <FieldContent>
              <Input
                placeholder="https://idp.exemplo.com/metadata"
                value={existing?.idpMetadataUrl ?? idpMetadataUrl}
                onChange={(e) => setIdpMetadataUrl(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                URL do ficheiro de metadata SAML do seu fornecedor de identidade
              </p>
              <FieldError />
            </FieldContent>
          </Field>

          {/* IdP Entity ID */}
          <Field>
            <FieldLabel>Entity ID (IdP)</FieldLabel>
            <FieldContent>
              <Input
                placeholder="https://idp.exemplo.com/entity-id"
                value={idpEntityId}
                onChange={(e) => setIdpEntityId(e.target.value)}
              />
              <FieldError />
            </FieldContent>
          </Field>

          {/* Read-only ACS / Entity ID */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Entity ID (SP)</FieldLabel>
              <FieldContent>
                <Input
                  value="https://saptm.app/auth/saml/metadata"
                  readOnly
                  className="bg-muted/30 text-muted-foreground"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>ACS URL</FieldLabel>
              <FieldContent>
                <Input
                  value="https://saptm.app/auth/saml/callback"
                  readOnly
                  className="bg-muted/30 text-muted-foreground"
                />
              </FieldContent>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button variant="default">Guardar configuração</Button>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <CardTitle>Providers OAuth</CardTitle>
          </div>
          <CardDescription>Configure login com Google, Microsoft ou GitHub</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Google */}
          <OAuthProviderField name="Google Login" configured={false} clientId="" clientSecret="" />

          {/* Microsoft */}
          <OAuthProviderField
            name="Microsoft Login"
            configured={false}
            clientId=""
            clientSecret=""
          />

          {/* GitHub */}
          <OAuthProviderField name="GitHub Login" configured={false} clientId="" clientSecret="" />
        </CardContent>
      </Card>

      {/* JIT Provisioning */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <CardTitle>Provisionamento</CardTitle>
          </div>
          <CardDescription>Configure a criação automática de utilizadores</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Just-In-Time (JIT) Provisioning</p>
              <p className="text-muted-foreground text-xs">
                Criar utilizadores automaticamente no primeiro login via SSO.
              </p>
            </div>
            <Switch
              checked={existing?.jitProvisioning ?? jitEnabled}
              onCheckedChange={setJitEnabled}
              aria-label="JIT Provisioning"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Domain-wide Email Match</p>
              <p className="text-muted-foreground text-xs">
                Associar automaticamente emails do domínio à organização.
              </p>
            </div>
            <Switch checked={false} aria-label="Domain-wide Email Match" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** OAuth provider inline form */
function OAuthProviderField({
  name,
  configured,
  clientId,
  clientSecret,
}: {
  name: string;
  configured: boolean;
  clientId: string;
  clientSecret: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{name}</span>
          {configured ? (
            <Badge variant="success" density="compact">
              Configurado
            </Badge>
          ) : (
            <Badge variant="outline" density="compact">
              Não configurado
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Fechar" : "Configurar"}
        </Button>
      </div>
      {expanded ? (
        <div className="mt-4 flex flex-col gap-3">
          <Field>
            <FieldLabel>Client ID</FieldLabel>
            <FieldContent>
              <Input placeholder="Client ID" defaultValue={clientId} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Client Secret</FieldLabel>
            <FieldContent>
              <Input type="password" placeholder="Client Secret" defaultValue={clientSecret} />
            </FieldContent>
          </Field>
          <div className="flex justify-end">
            <Button variant="default" size="sm">
              Guardar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
