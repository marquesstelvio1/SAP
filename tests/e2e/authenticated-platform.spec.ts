import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { expect, type Locator, type Page, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const apiUrl = normalizeUrl(process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:43100");
const webUrl = normalizeUrl(baseUrl);
const apiReadyUrl = new URL("/health/ready", apiUrl).toString();
const webHealthUrl = new URL("/api/health", webUrl).toString();
const apiRuntimePort = new URL(apiUrl).port || "4000";
const runtimeHostname =
  new URL(webUrl).hostname === "localhost" ? "127.0.0.1" : new URL(webUrl).hostname;
const runtimePort = new URL(webUrl).port || "3100";
const startupTimeoutMs = readPositiveIntegerEnv("PLAYWRIGHT_STARTUP_TIMEOUT_MS", 120_000);
const commandTimeoutMs = readPositiveIntegerEnv("PLAYWRIGHT_COMMAND_TIMEOUT_MS", 120_000);
const bootstrapTimeoutMs = readPositiveIntegerEnv("PLAYWRIGHT_BOOTSTRAP_TIMEOUT_MS", 360_000);
const maxCapturedLogLength = 18_000;
const runtimeShutdownTimeoutMs = 30_000;
const webNextDevLockPath = "apps/web/.next/dev/lock";
const localAdminEmail = process.env.SAPTM_LOCAL_ADMIN_EMAIL ?? "admin@saptm.local";
const localAdminPassword = process.env.SAPTM_LOCAL_ADMIN_PASSWORD ?? "LocalAdmin!2026";

let apiRuntime: ChildProcess | undefined;
let webRuntime: ChildProcess | undefined;
let apiRuntimeLogs = "";
let webRuntimeLogs = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser: _browser }, testInfo) => {
  testInfo.setTimeout(bootstrapTimeoutMs);
  console.log(`E2E platform bootstrap: api=${apiReadyUrl} web=${webHealthUrl}`);

  if (process.env.PLAYWRIGHT_SKIP_PLATFORM_BOOTSTRAP !== "1") {
    await runWorkspaceCommand(["db:seed"]);
    await runWorkspaceCommand(["auth:seed-local-admin"]);
  }

  if (process.env.PLAYWRIGHT_SKIP_API_SERVER !== "1" && !(await isRuntimeHealthy(apiReadyUrl))) {
    await stopWindowsListeningPortProcesses(apiRuntimePort);
    apiRuntime = startRuntime("api");
    await waitForRuntimeHealth("api", apiReadyUrl);
  }

  if (process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== "1" && !(await isRuntimeHealthy(webHealthUrl))) {
    await stopWindowsListeningPortProcesses(runtimePort);
    await waitForNextDevLockRelease();
    webRuntime = startRuntime("web");
    await waitForRuntimeHealth("web", webHealthUrl);
  }
});

test.afterAll(async () => {
  if (webRuntime !== undefined) {
    await stopProcessTree(webRuntime);
    await stopWindowsListeningPortProcesses(runtimePort);
    await waitForNextDevLockRelease();
  }

  if (apiRuntime !== undefined) {
    await stopProcessTree(apiRuntime);
    await stopWindowsListeningPortProcesses(apiRuntimePort);
  }
});

test("authenticated operator can open the governed platform shell", async ({ page }) => {
  await signIn(page);

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("Foundation Control Center")).toBeVisible();
  await expect(page.getByText(localAdminEmail)).toBeVisible();
  await expect(page.getByRole("banner").getByText("RBAC ativo")).toBeVisible();
  const navigation = page.getByRole("navigation");
  await expect(navigation.getByRole("link", { name: /Gestao de cargas/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Tracking operacional/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Capacidade operacional/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /^Planeamento/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /^Tariff \/ Pricing/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /^Reports/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Notificacoes/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Integracoes/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /Identidade e RBAC/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /^Auditoria\b/i })).toBeVisible();
});

test("authenticated operator can read seeded business modules", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/tracking");
  await expect(page.getByText("Tracking operacional de cargas", { exact: true })).toBeVisible();
  await expect(page.getByText("TRK-LOCAL-RAIL-001").first()).toBeVisible();
  await expect(page.getByText("Agregados de risco e SLA")).toBeVisible();

  await page.goto("/app/cargo");
  await expect(page.getByText("Registo governado de cargas", { exact: true })).toBeVisible();
  await expect(page.getByText("CGO-LOCAL-RAIL-001").first()).toBeVisible();
  await expect(page.getByText("CGO-LOCAL-PORT-002").first()).toBeVisible();

  await page.goto("/app/capacity");
  await expect(page.getByText("Capacidade operacional governada", { exact: true })).toBeVisible();
  await expect(page.getByText("SLOT-LOCAL-SAT-001").first()).toBeVisible();
  await expect(page.getByText("Rever saturacao de slot operacional")).toBeVisible();
  await expect(page.getByText("Analytics de decisoes de advisory")).toBeVisible();
  await expect(page.locator("#capacity-advisory-decision-analytics")).toBeVisible();

  await page.goto("/app/planning");
  await expect(
    page.getByText("Planeamento de transporte governado", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("TO-LOCAL-CAP-001").first()).toBeVisible();
  await expect(page.getByText("Transport orders recentes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar transport order" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replanear transport order" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Despachar transport order" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancelar transport order" })).toBeVisible();

  await page.goto("/app/tariffs");
  await expect(page.getByText("Pricing operacional governado", { exact: true })).toBeVisible();
  await expect(page.getByText("RC-LOCAL-RAIL-2026").first()).toBeVisible();
  await expect(page.getByText("QUOTE-LOCAL-RAIL-001").first()).toBeVisible();

  await page.goto("/app/admin");
  await expect(
    page.getByText("Administracao de identidade e RBAC", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(localAdminEmail).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: /tenant\.admin/ }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: /identity\.role\.assign/ }).first()).toBeVisible();

  await page.goto("/app/audit");
  await expect(page.getByText("Audit trail operacional", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pesquisar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Exportar CSV" })).toBeVisible();

  await page.goto("/app/reports");
  await expect(page.getByText("Reports operacionais", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Exportar.*CSV/ }).first()).toBeVisible();

  await page.goto("/app/notifications");
  await expect(page.getByText("Inbox operacional", { exact: true })).toBeVisible();
  await expect(page.getByText("Eventos processados")).toBeVisible();

  await page.goto("/app/integrations");
  await expect(page.getByText("Integration Gateway", { exact: true })).toBeVisible();
  await expect(
    page.locator("[data-slot='card-title']").filter({ hasText: /^Service accounts$/ }),
  ).toBeVisible();
});

test("authenticated auditor can filter and export audit records", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/audit");
  await page.locator("#auditAction").fill("cargo");
  await page.getByLabel("Severidade", { exact: true }).selectOption("critical");
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await expect(page).toHaveURL(/\/app\/audit\?/);
  await expect(page.getByText("Audit trail operacional", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar CSV" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^saptm-audit-.*\.csv$/);
});

test("authenticated operator can export operational reports", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/reports");
  await expect(page.getByText("Reports operacionais", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar Cargo CSV" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^saptm-report-cargo-.*\.csv$/);
});

test("authenticated operator can submit governed planning commands", async ({ page }) => {
  await signIn(page);
  const orderReference = "TO-E2E-CAP-004";
  const confirmationReference = "CNF-TO-E2E-CAP-004";
  const confirmedAt = toDatetimeLocal(new Date());
  const plannedDepartureAt = toDatetimeLocal(new Date(Date.now() + 6 * 60 * 60 * 1000));
  const plannedArrivalAt = toDatetimeLocal(new Date(Date.now() + 18 * 60 * 60 * 1000));
  const rescheduledAt = toDatetimeLocal(new Date());
  const rescheduledDepartureAt = toDatetimeLocal(new Date(Date.now() + 8 * 60 * 60 * 1000));
  const rescheduledArrivalAt = toDatetimeLocal(new Date(Date.now() + 16 * 60 * 60 * 1000));
  const cancelledAt = toDatetimeLocal(new Date());

  await page.goto("/app/planning");
  const confirmForm = page.locator("form", {
    has: page.getByRole("button", { name: "Confirmar transport order" }),
  });
  await waitForHydratedForm(confirmForm);
  await setFormIdempotencyKey(confirmForm, "e2e-planning-confirm-cap-004");
  await confirmForm.getByLabel("Cargo ID", { exact: true }).fill("local_demo_cargo_capacity_004");
  await confirmForm.getByLabel("Referencia da ordem", { exact: true }).fill(orderReference);
  await confirmForm
    .getByLabel("Referencia de confirmacao", { exact: true })
    .fill(confirmationReference);
  await confirmForm.getByLabel("Modo", { exact: true }).selectOption("rail");
  await confirmForm.getByLabel("Transportador", { exact: true }).fill("E2E Rail Operator");
  await confirmForm.getByLabel("Planner responsavel", { exact: true }).fill("E2E Planner");
  await confirmForm.getByLabel("Origem", { exact: true }).fill("Terminal Ferroviario E2E");
  await confirmForm.getByLabel("Destino", { exact: true }).fill("Porto de Luanda E2E");
  await confirmForm
    .getByLabel("Resumo da rota", { exact: true })
    .fill("Terminal ferroviario E2E para Porto de Luanda com janela governada.");
  await confirmForm.getByLabel("Confirmado em", { exact: true }).fill(confirmedAt);
  await confirmForm.getByLabel("Partida planeada", { exact: true }).fill(plannedDepartureAt);
  await confirmForm.getByLabel("Chegada planeada", { exact: true }).fill(plannedArrivalAt);
  await expectFormToBeValid(confirmForm);
  await confirmForm.getByRole("button", { name: "Confirmar transport order" }).click();
  await expect(confirmForm.getByText(/Transport order .*confirmada/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expect(page.getByText(orderReference).first()).toBeVisible({
    timeout: startupTimeoutMs,
  });

  const rescheduleForm = page.locator("form", {
    has: page.getByRole("button", { name: "Replanear transport order" }),
  });
  await waitForHydratedForm(rescheduleForm);
  await setFormIdempotencyKey(rescheduleForm, "e2e-planning-reschedule-seeded-001");
  await rescheduleForm
    .getByLabel("Transport order ID", { exact: true })
    .fill("local_demo_transport_order_reschedule_001");
  await rescheduleForm
    .getByLabel("Referencia da revisao", { exact: true })
    .fill("REV-E2E-SEEDED-001");
  await rescheduleForm.getByLabel("Modo", { exact: true }).selectOption("rail");
  await rescheduleForm.getByLabel("Transportador", { exact: true }).fill("E2E Rail Rescheduler");
  await rescheduleForm.getByLabel("Responsavel", { exact: true }).fill("E2E Planner");
  await rescheduleForm.getByLabel("Origem", { exact: true }).fill("Patio Ferroviario E2E");
  await rescheduleForm.getByLabel("Destino", { exact: true }).fill("Porto de Luanda E2E");
  await rescheduleForm
    .getByLabel("Nova rota", { exact: true })
    .fill("Patio ferroviario E2E para Porto de Luanda com rota alternativa auditada.");
  await rescheduleForm.getByLabel("Replaneado em", { exact: true }).fill(rescheduledAt);
  await rescheduleForm.getByLabel("Nova partida", { exact: true }).fill(rescheduledDepartureAt);
  await rescheduleForm.getByLabel("Nova chegada", { exact: true }).fill(rescheduledArrivalAt);
  await rescheduleForm
    .getByLabel("Motivo operacional", { exact: true })
    .fill("Terminal ferroviario alterou janela de carga durante validacao operacional E2E.");
  await rescheduleForm.getByLabel("Sistema origem", { exact: true }).fill("planning-e2e");
  await expectFormToBeValid(rescheduleForm);
  await rescheduleForm.getByRole("button", { name: "Replanear transport order" }).click();
  await expect(rescheduleForm.getByText(/Transport order .*replaneada/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expect(page.getByText("REV-E2E-SEEDED-001").first()).toBeVisible({
    timeout: startupTimeoutMs,
  });

  const cancelForm = page.locator("form", {
    has: page.getByRole("button", { name: "Cancelar transport order" }),
  });
  await waitForHydratedForm(cancelForm);
  await setFormIdempotencyKey(cancelForm, "e2e-planning-cancel-seeded-001");
  await cancelForm
    .getByLabel("Transport order ID", { exact: true })
    .fill("local_demo_transport_order_cancel_001");
  await cancelForm
    .getByLabel("Referencia de cancelamento", { exact: true })
    .fill("CXL-E2E-SEEDED-001");
  await cancelForm.getByLabel("Responsavel", { exact: true }).fill("E2E Cancellation Controller");
  await cancelForm.getByLabel("Cancelado em", { exact: true }).fill(cancelledAt);
  await cancelForm.getByLabel("Sistema origem", { exact: true }).fill("planning-e2e");
  await cancelForm
    .getByLabel("Motivo operacional", { exact: true })
    .fill("Janela operacional cancelada por indisponibilidade validada no fluxo E2E.");
  await expectFormToBeValid(cancelForm);
  await cancelForm.getByRole("button", { name: "Cancelar transport order" }).click();
  await expect(cancelForm.getByText(/Transport order .*cancelada/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expect(page.getByText("CXL-E2E-SEEDED-001").first()).toBeVisible({
    timeout: startupTimeoutMs,
  });

  const dispatchForm = page.locator("form", {
    has: page.getByRole("button", { name: "Despachar transport order" }),
  });
  await waitForHydratedForm(dispatchForm);
  await setFormIdempotencyKey(dispatchForm, "e2e-planning-dispatch-seeded-001");
  await dispatchForm
    .getByLabel("Transport order ID", { exact: true })
    .fill("local_demo_transport_order_001");
  await dispatchForm
    .getByLabel("Referencia de dispatch", { exact: true })
    .fill("DSP-E2E-SEEDED-001");
  await dispatchForm.getByLabel("Responsavel", { exact: true }).fill("E2E Dispatcher");
  await dispatchForm
    .getByLabel("Instrucoes operacionais", { exact: true })
    .fill("Entregar transport order E2E para execucao ferroviaria controlada.");
  await dispatchForm.getByLabel("Sistema origem", { exact: true }).fill("planning-e2e");
  await expectFormToBeValid(dispatchForm);
  await dispatchForm.getByRole("button", { name: "Despachar transport order" }).click();
  await expect(dispatchForm.getByText(/Transport order .*despachada/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expect(page.getByText("DSP-E2E-SEEDED-001").first()).toBeVisible({
    timeout: startupTimeoutMs,
  });
});

test("authenticated operator can process outbox and acknowledge notifications", async ({
  page,
}) => {
  await signIn(page);

  await page.goto("/app/reports");
  await expect(page.getByText("Reports operacionais", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar Cargo CSV" }).click();
  await downloadPromise;

  await runWorkspaceCommand(["worker:outbox", "--", "--once", "--limit=50"]);

  await page.goto("/app/notifications?status=unread&limit=50");
  await expect(page.getByText("Inbox operacional", { exact: true })).toBeVisible();
  await expect(page.getByText("report.exported").first()).toBeVisible({
    timeout: startupTimeoutMs,
  });

  const markReadForm = page
    .locator("form", {
      has: page.getByRole("button", { name: "Marcar como lida" }),
    })
    .first();
  await Promise.all([
    page.waitForURL(/\/app\/notifications\?status=read&limit=50/),
    markReadForm.getByRole("button", { name: "Marcar como lida" }).click(),
  ]);
  await expect(page.getByText("Inbox operacional", { exact: true })).toBeVisible();
  await expect(page.getByText("report.exported").first()).toBeVisible();
  await expect(page.getByText("read").first()).toBeVisible();
});

test("authenticated admin can submit governed identity commands", async ({ page }) => {
  await signIn(page);
  const commandSuffix = createCommandSuffix();
  const invitedEmail = `operator-${commandSuffix.toLowerCase()}@saptm.local`;

  await page.goto("/app/admin");
  const inviteForm = page.locator("form", {
    has: page.getByRole("button", { name: "Convidar utilizador" }),
  });
  await waitForHydratedForm(inviteForm);
  await inviteForm.getByLabel("Nome", { exact: true }).fill("Operador E2E RBAC");
  await inviteForm.getByLabel("Email", { exact: true }).fill(invitedEmail);
  await inviteForm
    .getByLabel("Role inicial", { exact: true })
    .selectOption("tenant.operations_viewer");
  await expectFormToBeValid(inviteForm);
  await inviteForm.getByRole("button", { name: "Convidar utilizador" }).click();
  await expect(
    inviteForm.getByText(/Utilizador convidado com membership, roles, audit trail e outbox\./),
  ).toBeVisible({ timeout: startupTimeoutMs });
  const invitationAcceptUrl = await inviteForm.getByLabel("Link de aceite").inputValue();
  expect(invitationAcceptUrl).toContain("/accept-invitation?token=");

  const invitationPage = await page.context().newPage();
  await invitationPage.goto(invitationAcceptUrl);
  await expect(
    invitationPage.getByRole("heading", { name: "Ativar acesso empresarial" }),
  ).toBeVisible();
  await invitationPage.getByLabel("Nome completo", { exact: true }).fill("Operador E2E RBAC");
  await invitationPage.getByLabel("Password", { exact: true }).fill("OperatorE2E!2026");
  await invitationPage.getByLabel("Confirmar password", { exact: true }).fill("OperatorE2E!2026");
  await invitationPage.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(invitationPage.getByText(/Convite aceite/)).toBeVisible({
    timeout: startupTimeoutMs,
  });
  await invitationPage.close();

  await page.reload();
  await expect(page.getByRole("cell", { name: new RegExp(invitedEmail) }).first()).toBeVisible({
    timeout: startupTimeoutMs,
  });

  const assignRoleForm = page.locator("form", {
    has: page.getByRole("button", { name: "Atribuir role" }),
  });
  await waitForHydratedForm(assignRoleForm);
  const membershipValue = await readSelectOptionValueByText(
    assignRoleForm.getByLabel("Utilizador", { exact: true }),
    invitedEmail,
  );
  const roleValue = await readSelectOptionValueByText(
    assignRoleForm.getByLabel("Role", { exact: true }),
    "Operations Viewer",
  );

  await assignRoleForm.getByLabel("Utilizador", { exact: true }).selectOption(membershipValue);
  await assignRoleForm.getByLabel("Role", { exact: true }).selectOption(roleValue);
  await expectFormToBeValid(assignRoleForm);
  await assignRoleForm.getByRole("button", { name: "Atribuir role" }).click();
  await expect(
    assignRoleForm.getByText(/Role atribuida com RBAC tenant-scoped, audit trail e outbox\./),
  ).toBeVisible({ timeout: startupTimeoutMs });
});

test("authenticated user can review account security governance", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/security");
  await expect(page.getByRole("heading", { name: "Seguranca da conta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revogacao de sessoes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Politica MFA" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Revogar outras sessoes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar MFA" })).toBeVisible();
});

test("authenticated admin can submit governed integration commands", async ({ page }) => {
  await signIn(page);
  const commandSuffix = createCommandSuffix();
  const serviceAccountName = `E2E Port TOS ${commandSuffix}`;
  const externalId = `MOVE-E2E-${commandSuffix}`;
  const portTosExternalId = `TOS-MOVE-E2E-${commandSuffix}`;
  const railTmsExternalId = `RAIL-MOVE-E2E-${commandSuffix}`;
  const carrierTmsExternalId = `CARRIER-MOVE-E2E-${commandSuffix}`;
  const telematicsGpsExternalId = `GPS-POS-E2E-${commandSuffix}`;
  const customsErpExternalId = `CUSTOMS-ERP-E2E-${commandSuffix}`;
  const warehouseWmsExternalId = `WMS-ACT-E2E-${commandSuffix}`;

  await page.goto("/app/integrations");
  const createServiceAccountForm = page.locator("form", {
    has: page.getByRole("button", { name: "Criar service account" }),
  });
  await waitForHydratedForm(createServiceAccountForm);
  await createServiceAccountForm.getByLabel("Nome", { exact: true }).fill(serviceAccountName);
  await createServiceAccountForm
    .getByLabel("Escopo adicional opcional", { exact: true })
    .selectOption("tracking.event.record");
  await expectFormToBeValid(createServiceAccountForm);
  await createServiceAccountForm.getByRole("button", { name: "Criar service account" }).click();
  await expect(
    createServiceAccountForm.getByText(/Service account criado com API key hash-only/),
  ).toBeVisible({ timeout: startupTimeoutMs });
  await expect(createServiceAccountForm.getByText(/^saptm_sk_[a-f0-9]+$/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("table").first().getByText(serviceAccountName)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  const eventForm = page.locator("form", {
    has: page.getByRole("button", { name: "Registar evento externo" }),
  });
  const serviceAccountValue = await readSelectOptionValueByText(
    eventForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await eventForm.getByLabel("Service account", { exact: true }).selectOption(serviceAccountValue);
  await eventForm.getByLabel("Source system", { exact: true }).fill("port-tos-e2e");
  await eventForm.getByLabel("External ID", { exact: true }).fill(externalId);
  await eventForm.getByLabel("Event type", { exact: true }).fill("tracking.location_updated");
  await eventForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"location":"Terminal E2E","containers":7,"delayed":false}`);
  await expectFormToBeValid(eventForm);
  await eventForm.getByRole("button", { name: "Registar evento externo" }).click();
  await expect(
    eventForm.getByText(/Evento externo registado com idempotencia tenant-scoped/),
  ).toBeVisible({ timeout: startupTimeoutMs });

  await page.reload();
  await expectRecentIntegrationEvent(page, externalId);

  const portTosForm = page.locator("form", {
    has: page.getByRole("button", { name: "Processar Port TOS" }),
  });
  const portTosServiceAccountValue = await readSelectOptionValueByText(
    portTosForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await portTosForm
    .getByLabel("Service account", { exact: true })
    .selectOption(portTosServiceAccountValue);
  await portTosForm.getByLabel("Source system", { exact: true }).fill("port-tos-e2e");
  await portTosForm.getByLabel("External ID", { exact: true }).fill(portTosExternalId);
  await portTosForm.getByLabel("Shipment reference", { exact: true }).fill("TRK-LOCAL-PORT-002");
  await portTosForm.getByLabel("Movement type", { exact: true }).selectOption("gate_in");
  await portTosForm.getByLabel("Occurred at", { exact: true }).fill(toDatetimeLocal(new Date()));
  await portTosForm.getByLabel("Location", { exact: true }).fill("Terminal E2E");
  await portTosForm.getByLabel("Notes", { exact: true }).fill("E2E Port TOS adapter movement");
  await portTosForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"berth":"E2E","containers":9,"operatorConfirmed":true}`);
  await expectFormToBeValid(portTosForm);
  await portTosForm.getByRole("button", { name: "Processar Port TOS" }).click();
  await expect(portTosForm.getByText(/Movimento Port TOS processado em tracking/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expectRecentIntegrationEvent(page, portTosExternalId);

  const railTmsForm = page.locator("form", {
    has: page.getByRole("button", { name: "Processar Rail TMS" }),
  });
  const railTmsServiceAccountValue = await readSelectOptionValueByText(
    railTmsForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await railTmsForm
    .getByLabel("Service account", { exact: true })
    .selectOption(railTmsServiceAccountValue);
  await railTmsForm.getByLabel("Source system", { exact: true }).fill("rail-tms-e2e");
  await railTmsForm.getByLabel("External ID", { exact: true }).fill(railTmsExternalId);
  await railTmsForm.getByLabel("Shipment reference", { exact: true }).fill("TRK-LOCAL-RAIL-001");
  await railTmsForm.getByLabel("Movement type", { exact: true }).selectOption("train_departed");
  await railTmsForm.getByLabel("Occurred at", { exact: true }).fill(toDatetimeLocal(new Date()));
  await railTmsForm.getByLabel("Location", { exact: true }).fill("Luanda Yard E2E");
  await railTmsForm.getByLabel("Train number", { exact: true }).fill("TRN-E2E");
  await railTmsForm.getByLabel("Rail corridor", { exact: true }).fill("Luanda-Malanje");
  await railTmsForm.getByLabel("Wagon count", { exact: true }).fill("18");
  await railTmsForm.getByLabel("Notes", { exact: true }).fill("E2E Rail TMS adapter movement");
  await railTmsForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"locomotive":"LOCO-E2E","operatorConfirmed":true}`);
  await expectFormToBeValid(railTmsForm);
  await railTmsForm.getByRole("button", { name: "Processar Rail TMS" }).click();
  await expect(railTmsForm.getByText(/Movimento Rail TMS processado em tracking/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expectRecentIntegrationEvent(page, railTmsExternalId);

  const carrierTmsForm = page.locator("form", {
    has: page.getByRole("button", { name: "Processar Carrier TMS" }),
  });
  const carrierTmsServiceAccountValue = await readSelectOptionValueByText(
    carrierTmsForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await carrierTmsForm
    .getByLabel("Service account", { exact: true })
    .selectOption(carrierTmsServiceAccountValue);
  await carrierTmsForm.getByLabel("Source system", { exact: true }).fill("carrier-tms-e2e");
  await carrierTmsForm.getByLabel("External ID", { exact: true }).fill(carrierTmsExternalId);
  await carrierTmsForm
    .getByLabel("Shipment reference", { exact: true })
    .fill("TRK-LOCAL-MULTI-003");
  await carrierTmsForm
    .getByLabel("Movement type", { exact: true })
    .selectOption("delivery_completed");
  await carrierTmsForm.getByLabel("Occurred at", { exact: true }).fill(toDatetimeLocal(new Date()));
  await carrierTmsForm.getByLabel("Location", { exact: true }).fill("Viana Hub E2E");
  await carrierTmsForm.getByLabel("Carrier code", { exact: true }).fill("CARR-E2E");
  await carrierTmsForm.getByLabel("Vehicle plate", { exact: true }).fill("LD-E2E-01");
  await carrierTmsForm.getByLabel("Driver reference", { exact: true }).fill("DRV-E2E");
  await carrierTmsForm.getByLabel("Route code", { exact: true }).fill("LAD-VIA-E2E");
  await carrierTmsForm
    .getByLabel("Notes", { exact: true })
    .fill("E2E Carrier TMS adapter movement");
  await carrierTmsForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"trailer":"TRL-E2E","operatorConfirmed":true}`);
  await expectFormToBeValid(carrierTmsForm);
  await carrierTmsForm.getByRole("button", { name: "Processar Carrier TMS" }).click();
  await expect(
    carrierTmsForm.getByText(/Movimento Carrier TMS processado em tracking/),
  ).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expectRecentIntegrationEvent(page, carrierTmsExternalId);

  const telematicsGpsForm = page.locator("form", {
    has: page.getByRole("button", { name: "Processar Telematics/GPS" }),
  });
  const telematicsGpsServiceAccountValue = await readSelectOptionValueByText(
    telematicsGpsForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await telematicsGpsForm
    .getByLabel("Service account", { exact: true })
    .selectOption(telematicsGpsServiceAccountValue);
  await telematicsGpsForm.getByLabel("Source system", { exact: true }).fill("telematics-gps-e2e");
  await telematicsGpsForm.getByLabel("External ID", { exact: true }).fill(telematicsGpsExternalId);
  await telematicsGpsForm
    .getByLabel("Shipment reference", { exact: true })
    .fill("TRK-LOCAL-RAIL-001");
  await telematicsGpsForm
    .getByLabel("Position type", { exact: true })
    .selectOption("position_reported");
  await telematicsGpsForm
    .getByLabel("Occurred at", { exact: true })
    .fill(toDatetimeLocal(new Date()));
  await telematicsGpsForm.getByLabel("Latitude", { exact: true }).fill("-8.838333");
  await telematicsGpsForm.getByLabel("Longitude", { exact: true }).fill("13.234444");
  await telematicsGpsForm.getByLabel("Device ID", { exact: true }).fill("GPS-E2E");
  await telematicsGpsForm.getByLabel("Asset reference", { exact: true }).fill("LOCO-E2E");
  await telematicsGpsForm.getByLabel("Geofence name", { exact: true }).fill("Luanda Corridor E2E");
  await telematicsGpsForm.getByLabel("Speed KPH", { exact: true }).fill("42.5");
  await telematicsGpsForm.getByLabel("Heading degrees", { exact: true }).fill("93");
  await telematicsGpsForm.getByLabel("Route code", { exact: true }).fill("LAD-MSJ-E2E");
  await telematicsGpsForm
    .getByLabel("Notes", { exact: true })
    .fill("E2E Telematics GPS adapter position");
  await telematicsGpsForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"ignitionOn":true,"signalQuality":"good"}`);
  await expectFormToBeValid(telematicsGpsForm);
  await telematicsGpsForm.getByRole("button", { name: "Processar Telematics/GPS" }).click();
  await expect(
    telematicsGpsForm.getByText(/Posicao Telematics\/GPS processada em tracking/),
  ).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expectRecentIntegrationEvent(page, telematicsGpsExternalId);

  const customsErpForm = page.locator("form", {
    has: page.getByRole("button", { name: "Processar Customs/ERP" }),
  });
  const customsErpServiceAccountValue = await readSelectOptionValueByText(
    customsErpForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await customsErpForm
    .getByLabel("Service account", { exact: true })
    .selectOption(customsErpServiceAccountValue);
  await customsErpForm.getByLabel("Source system", { exact: true }).fill("customs-erp-e2e");
  await customsErpForm.getByLabel("External ID", { exact: true }).fill(customsErpExternalId);
  await customsErpForm.getByLabel("Shipment reference", { exact: true }).fill("TRK-LOCAL-PORT-002");
  await customsErpForm.getByLabel("Status type", { exact: true }).selectOption("customs_cleared");
  await customsErpForm.getByLabel("Occurred at", { exact: true }).fill(toDatetimeLocal(new Date()));
  await customsErpForm.getByLabel("Customs reference", { exact: true }).fill("CUS-E2E");
  await customsErpForm.getByLabel("Document reference", { exact: true }).fill("DOC-E2E");
  await customsErpForm.getByLabel("Declaration number", { exact: true }).fill("DECL-E2E");
  await customsErpForm.getByLabel("Broker reference", { exact: true }).fill("BRK-E2E");
  await customsErpForm.getByLabel("Authority code", { exact: true }).fill("AGT-E2E");
  await customsErpForm.getByLabel("Notes", { exact: true }).fill("E2E Customs ERP adapter status");
  await customsErpForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"channel":"green","operatorConfirmed":true}`);
  await expectFormToBeValid(customsErpForm);
  await customsErpForm.getByRole("button", { name: "Processar Customs/ERP" }).click();
  await expect(customsErpForm.getByText(/Status Customs\/ERP processado em tracking/)).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expectRecentIntegrationEvent(page, customsErpExternalId);

  const warehouseWmsForm = page.locator("form", {
    has: page.getByRole("button", { name: "Processar Warehouse/WMS" }),
  });
  const warehouseWmsServiceAccountValue = await readSelectOptionValueByText(
    warehouseWmsForm.getByLabel("Service account", { exact: true }),
    serviceAccountName,
  );
  await warehouseWmsForm
    .getByLabel("Service account", { exact: true })
    .selectOption(warehouseWmsServiceAccountValue);
  await warehouseWmsForm.getByLabel("Source system", { exact: true }).fill("warehouse-wms-e2e");
  await warehouseWmsForm.getByLabel("External ID", { exact: true }).fill(warehouseWmsExternalId);
  await warehouseWmsForm
    .getByLabel("Shipment reference", { exact: true })
    .fill("TRK-LOCAL-MULTI-003");
  await warehouseWmsForm
    .getByLabel("Activity type", { exact: true })
    .selectOption("loaded_for_dispatch");
  await warehouseWmsForm
    .getByLabel("Occurred at", { exact: true })
    .fill(toDatetimeLocal(new Date()));
  await warehouseWmsForm.getByLabel("Location", { exact: true }).fill("Viana Warehouse E2E");
  await warehouseWmsForm.getByLabel("Warehouse code", { exact: true }).fill("WH-E2E");
  await warehouseWmsForm.getByLabel("Zone code", { exact: true }).fill("Z-E2E");
  await warehouseWmsForm.getByLabel("Dock door", { exact: true }).fill("D-E2E");
  await warehouseWmsForm.getByLabel("Container reference", { exact: true }).fill("CONT-E2E");
  await warehouseWmsForm.getByLabel("Handling unit reference", { exact: true }).fill("HU-E2E");
  await warehouseWmsForm.getByLabel("Operator reference", { exact: true }).fill("OP-E2E");
  await warehouseWmsForm.getByLabel("Pallet count", { exact: true }).fill("24");
  await warehouseWmsForm
    .getByLabel("Notes", { exact: true })
    .fill("E2E Warehouse WMS adapter activity");
  await warehouseWmsForm
    .getByLabel("Payload JSON", { exact: true })
    .fill(`{"scannerConfirmed":true,"temperatureControlled":false}`);
  await expectFormToBeValid(warehouseWmsForm);
  await warehouseWmsForm.getByRole("button", { name: "Processar Warehouse/WMS" }).click();
  await expect(
    warehouseWmsForm.getByText(/Atividade Warehouse\/WMS processada em tracking/),
  ).toBeVisible({
    timeout: startupTimeoutMs,
  });

  await page.reload();
  await expectRecentIntegrationEvent(page, warehouseWmsExternalId);
});

test("authenticated operator can submit governed cargo and capacity commands", async ({ page }) => {
  await signIn(page);
  const commandSuffix = createCommandSuffix();
  const cargoReference = `CGO-E2E-${commandSuffix}`;
  const advisoryRecommendationId = `capacity-advisory:unused_capacity:local_demo_capacity_slot_unused_002:e2e-${commandSuffix}`;

  await page.goto("/app/cargo");
  const cargoForm = page.locator("form", {
    has: page.getByRole("button", { name: "Registar carga" }),
  });
  await waitForHydratedForm(cargoForm);
  await cargoForm.getByLabel("Referencia externa", { exact: true }).fill(`EXT-${commandSuffix}`);
  await cargoForm
    .getByLabel("Descricao", { exact: true })
    .fill("Carga E2E governada para validacao local");
  await cargoForm.getByLabel("Tipo", { exact: true }).selectOption("container");
  await cargoForm.getByLabel("Peso bruto kg", { exact: true }).fill("12000");
  await cargoForm.getByLabel("Volumes", { exact: true }).fill("20");
  await cargoForm.getByLabel("Expedidor", { exact: true }).fill("E2E Shipper");
  await cargoForm.getByLabel("Consignatario", { exact: true }).fill("E2E Consignee");
  await cargoForm.getByLabel("Origem", { exact: true }).fill("Porto Seco E2E");
  await cargoForm.getByLabel("Destino", { exact: true }).fill("Terminal Ferroviario E2E");
  await cargoForm.getByLabel("Responsavel custodia", { exact: true }).fill("E2E Custody Owner");
  await cargoForm.getByLabel("Prioridade", { exact: true }).fill("3");
  await cargoForm.getByLabel("Estado aduaneiro", { exact: true }).selectOption("cleared");
  await cargoForm.getByLabel("Referencia aduaneira", { exact: true }).fill(`CUS-${commandSuffix}`);
  await cargoForm.getByLabel("Condicao", { exact: true }).selectOption("sound");
  await cargoForm.getByLabel("Volume m3", { exact: true }).fill("35");
  await cargoForm.getByLabel("Referencia da carga", { exact: true }).fill(cargoReference);
  await expect(cargoForm.getByLabel("Referencia da carga", { exact: true })).toHaveValue(
    cargoReference,
  );
  await expectFormToBeValid(cargoForm);
  await cargoForm.getByRole("button", { name: "Registar carga" }).click();
  await expect(
    cargoForm.getByText(/Carga registada com regras de negocio, audit trail e outbox\./),
  ).toBeVisible({ timeout: startupTimeoutMs });
  await expect(page.getByText(cargoReference).first()).toBeVisible();

  await page.goto("/app/capacity");
  const advisoryDecisionForm = page.locator("form", {
    has: page.getByRole("button", { name: "Registar decisao" }),
  });
  await waitForHydratedForm(advisoryDecisionForm);
  await advisoryDecisionForm.getByLabel("Tipo", { exact: true }).selectOption("unused_capacity");
  await advisoryDecisionForm.getByLabel("Decisao", { exact: true }).selectOption("rejected");
  await advisoryDecisionForm
    .getByLabel("Permissao de follow-up", { exact: true })
    .selectOption("capacity.manage");
  await advisoryDecisionForm.getByLabel("Decisor", { exact: true }).fill("E2E Capacity Controller");
  await advisoryDecisionForm
    .getByLabel("Justificativa", { exact: true })
    .fill("Decisao humana E2E registada para validar auditoria local.");
  await advisoryDecisionForm
    .getByLabel("Recommendation ID", { exact: true })
    .fill(advisoryRecommendationId);
  await expect(advisoryDecisionForm.getByLabel("Recommendation ID", { exact: true })).toHaveValue(
    advisoryRecommendationId,
  );
  await advisoryDecisionForm
    .getByLabel("Slot ID", { exact: true })
    .fill("local_demo_capacity_slot_unused_002");
  await expect(advisoryDecisionForm.getByLabel("Slot ID", { exact: true })).toHaveValue(
    "local_demo_capacity_slot_unused_002",
  );
  await expectFormToBeValid(advisoryDecisionForm);
  await advisoryDecisionForm.getByRole("button", { name: "Registar decisao" }).click();
  await expect(
    advisoryDecisionForm.getByText(
      /Decisao humana registada com audit trail e outbox, sem executar automacao\./,
    ),
  ).toBeVisible({ timeout: startupTimeoutMs });
});

test("authenticated operator can submit governed tariff commands", async ({ page }) => {
  await signIn(page);
  const commandSuffix = createCommandSuffix();
  const rateCardCode = `RC-E2E-${commandSuffix}`;
  const quoteReference = `QUOTE-E2E-${commandSuffix}`;
  const now = new Date();
  const validFrom = toDatetimeLocal(new Date(now.getTime() - 60 * 60 * 1000));
  const validUntil = toDatetimeLocal(new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));
  const calculatedAt = toDatetimeLocal(now);

  await page.goto("/app/tariffs");
  const rateCardForm = page.locator("form", {
    has: page.getByRole("button", { name: "Registar rate card" }),
  });
  await waitForHydratedForm(rateCardForm);
  await rateCardForm.getByLabel("Nome", { exact: true }).fill("Rate Card E2E Local");
  await rateCardForm.getByLabel("Estado", { exact: true }).selectOption("active");
  await rateCardForm.getByLabel("Moeda", { exact: true }).fill("USD");
  await rateCardForm.getByLabel("Valido desde", { exact: true }).fill(validFrom);
  await rateCardForm.getByLabel("Valido ate", { exact: true }).fill(validUntil);
  await rateCardForm.getByLabel("Codigo", { exact: true }).fill(rateCardCode);
  await expect(rateCardForm.getByLabel("Codigo", { exact: true })).toHaveValue(rateCardCode);
  await expectFormToBeValid(rateCardForm);
  await rateCardForm.getByRole("button", { name: "Registar rate card" }).click();
  await expect(
    rateCardForm.getByText(
      /Rate card registado com validade, moeda normalizada, audit trail e outbox\./,
    ),
  ).toBeVisible({ timeout: startupTimeoutMs });
  await expect(page.getByText(rateCardCode).first()).toBeVisible();

  const quoteForm = page.locator("form", {
    has: page.getByRole("button", { name: "Calcular cotacao" }),
  });
  await waitForHydratedForm(quoteForm);
  await quoteForm
    .getByLabel("Rate card ID", { exact: true })
    .fill("local_demo_tariff_rate_card_001");
  await quoteForm.getByLabel("Referencia", { exact: true }).fill(quoteReference);
  await quoteForm.getByLabel("Distancia km", { exact: true }).fill("320");
  await quoteForm.getByLabel("Calculado em", { exact: true }).fill(calculatedAt);
  await quoteForm.getByLabel("Operador pricing", { exact: true }).fill("E2E Pricing Operator");
  await quoteForm.getByLabel("Cargo ID", { exact: true }).fill("local_demo_cargo_rail_001");
  await expect(quoteForm.getByLabel("Cargo ID", { exact: true })).toHaveValue(
    "local_demo_cargo_rail_001",
  );
  await expectFormToBeValid(quoteForm);
  await quoteForm.getByRole("button", { name: "Calcular cotacao" }).click();
  await expect(
    quoteForm.getByText(
      /Cotacao calculada com rate card ativo, regras aplicaveis, audit trail e outbox\./,
    ),
  ).toBeVisible({ timeout: startupTimeoutMs });
  await expect(page.getByText(quoteReference).first()).toBeVisible();
});

test("business module visual rules remain stable", async ({ page }) => {
  await signIn(page);

  await page.goto("/app/cargo");
  await expect(page.locator("#cargo-business-rules")).toHaveScreenshot("cargo-business-rules.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.02,
  });

  await page.goto("/app/capacity");
  await expect(page.locator("#capacity-optimization-policy")).toHaveScreenshot(
    "capacity-optimization-policy.png",
    {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    },
  );

  await page.setViewportSize({ height: 1000, width: 1440 });
  await page.goto("/app/planning");
  await expect(page.locator("#planning-post-dispatch-rules")).toHaveScreenshot(
    "planning-post-dispatch-rules.png",
    {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.05,
    },
  );

  await page.setViewportSize({ height: 720, width: 1280 });
  await page.goto("/app/tariffs");
  await expect(page.locator("#tariff-security-rules")).toHaveScreenshot(
    "tariff-security-rules.png",
    {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    },
  );

  await page.goto("/app/security");
  await expect(page.getByText("Politica MFA")).toBeVisible();
  await expect(page).toHaveScreenshot("account-security-page.png", {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    maxDiffPixelRatio: 0.03,
  });
});

async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");

  if (page.url().endsWith("/app")) {
    return;
  }

  const body = JSON.stringify({
    email: localAdminEmail,
    password: localAdminPassword,
    rememberMe: false,
    callbackURL: "/app",
  });

  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: {
      "Content-Type": "application/json",
      Origin: webUrl,
    },
    data: body,
  });

  if (!response.ok()) {
    throw new Error(
      `Better Auth sign-in failed: HTTP ${response.status()}\n${await response.text()}`,
    );
  }

  await page.goto("/app");
  await expect(page.getByText("Foundation Control Center")).toBeVisible({
    timeout: startupTimeoutMs,
  });
}

function startRuntime(kind: "api" | "web"): ChildProcess {
  const isWindows = process.platform === "win32";
  const packageManager = isWindows ? "pnpm.cmd" : "pnpm";
  const command = isWindows ? "cmd.exe" : packageManager;
  const args =
    kind === "api"
      ? createApiRuntimeArgs(isWindows, packageManager)
      : createWebRuntimeArgs(isWindows, packageManager);
  const env = createRuntimeEnv();

  console.log(
    `Starting ${kind} runtime: API_PORT=${env.API_PORT ?? ""} NEXT_PUBLIC_API_URL=${
      env.NEXT_PUBLIC_API_URL ?? ""
    } NEXT_PUBLIC_APP_URL=${env.NEXT_PUBLIC_APP_URL ?? ""}`,
  );

  const runtime = spawn(command, args, {
    cwd: process.cwd(),
    detached: !isWindows,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  runtime.stdout?.on("data", (chunk) => captureRuntimeLog(kind, chunk));
  runtime.stderr?.on("data", (chunk) => captureRuntimeLog(kind, chunk));

  return runtime;
}

function createApiRuntimeArgs(isWindows: boolean, packageManager: string): string[] {
  if (isWindows) {
    return ["/d", "/s", "/c", `${packageManager} --filter @saptm/api start`];
  }

  return ["--filter", "@saptm/api", "start"];
}

function createWebRuntimeArgs(isWindows: boolean, packageManager: string): string[] {
  if (isWindows) {
    return [
      "/d",
      "/s",
      "/c",
      `${packageManager} --filter @saptm/web dev --hostname ${runtimeHostname} --port ${runtimePort}`,
    ];
  }

  return ["--filter", "@saptm/web", "dev", "--hostname", runtimeHostname, "--port", runtimePort];
}

async function runWorkspaceCommand(args: readonly string[]): Promise<void> {
  const isWindows = process.platform === "win32";
  const packageManager = isWindows ? "pnpm.cmd" : "pnpm";
  const runtime = spawn(isWindows ? "cmd.exe" : packageManager, createWorkspaceCommandArgs(args), {
    cwd: process.cwd(),
    env: createRuntimeEnv(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";

  runtime.stdout?.on("data", (chunk) => {
    output = trimCapturedLog(`${output}${String(chunk)}`);
  });
  runtime.stderr?.on("data", (chunk) => {
    output = trimCapturedLog(`${output}${String(chunk)}`);
  });

  await Promise.race([
    new Promise<void>((resolve, reject) => {
      runtime.once("error", reject);
      runtime.once("close", (exitCode) => {
        if (exitCode === 0) {
          resolve();
          return;
        }

        reject(new Error(`Workspace command failed: pnpm ${args.join(" ")}\n${output}`));
      });
    }),
    delay(commandTimeoutMs).then(async () => {
      await stopProcessTree(runtime);
      throw new Error(`Workspace command timed out: pnpm ${args.join(" ")}\n${output}`);
    }),
  ]);
}

function createWorkspaceCommandArgs(args: readonly string[]): string[] {
  const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  if (process.platform === "win32") {
    return ["/d", "/s", "/c", `${packageManager} ${args.join(" ")}`];
  }

  return [...args];
}

async function waitForRuntimeHealth(kind: "api" | "web", url: string): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    const runtime = kind === "api" ? apiRuntime : webRuntime;

    if (runtime?.exitCode !== null && runtime?.exitCode !== undefined) {
      throw new Error(`${kind} runtime exited before readiness.\n${readRuntimeLogs(kind)}`);
    }

    if (await isRuntimeHealthy(url)) {
      return;
    }

    await delay(1_000);
  }

  throw new Error(
    `${kind} runtime did not become healthy within ${startupTimeoutMs}ms.\n${readRuntimeLogs(
      kind,
    )}`,
  );
}

async function isRuntimeHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as { status?: string };

    return body.status === "ok";
  } catch {
    return false;
  }
}

async function stopProcessTree(runtime: ChildProcess): Promise<void> {
  if (runtime.pid === undefined || runtime.exitCode !== null || runtime.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise<void>((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(runtime.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });

      killer.once("error", () => resolve());
      killer.once("close", () => resolve());
    });
  } else {
    try {
      process.kill(-runtime.pid, "SIGTERM");
    } catch {
      try {
        process.kill(runtime.pid, "SIGTERM");
      } catch {
        return;
      }
    }
  }

  await waitForRuntimeExit(runtime);
}

async function waitForRuntimeExit(runtime: ChildProcess): Promise<void> {
  if (runtime.exitCode !== null || runtime.signalCode !== null) {
    return;
  }

  await Promise.race([
    new Promise<void>((resolve) => {
      runtime.once("close", () => resolve());
    }),
    delay(5_000),
  ]);
}

async function stopWindowsListeningPortProcesses(port: string): Promise<void> {
  if (process.platform !== "win32" || !/^\d+$/.test(port)) {
    return;
  }

  const processIds = await readWindowsListeningPortProcessIds(port);

  for (const processId of processIds) {
    if (processId === String(process.pid)) {
      continue;
    }

    await captureProcessOutput("taskkill", ["/pid", processId, "/t", "/f"]);
  }

  await waitForWindowsListeningPortRelease(port);
}

async function waitForWindowsListeningPortRelease(port: string): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < runtimeShutdownTimeoutMs) {
    const processIds = await readWindowsListeningPortProcessIds(port);

    if (processIds.length === 0) {
      return;
    }

    await delay(500);
  }
}

async function readWindowsListeningPortProcessIds(port: string): Promise<string[]> {
  const output = await captureProcessOutput("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
  ]);

  return Array.from(new Set(output.split(/\s+/).filter((value) => /^\d+$/.test(value))));
}

async function waitForNextDevLockRelease(): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < runtimeShutdownTimeoutMs) {
    if (!existsSync(webNextDevLockPath)) {
      return;
    }

    await delay(500);
  }
}

function captureProcessOutput(command: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve) => {
    const runtime = spawn(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(output);
    };
    timeout = setTimeout(() => {
      runtime.kill();
      finish();
    }, 5_000);

    runtime.stdout?.on("data", (chunk) => {
      output = `${output}${String(chunk)}`;
    });
    runtime.stderr?.on("data", (chunk) => {
      output = `${output}${String(chunk)}`;
    });
    runtime.once("error", finish);
    runtime.once("close", finish);
  });
}

function createRuntimeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    API_CORS_ORIGINS: webUrl,
    API_PORT: apiRuntimePort,
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET ?? "local-better-auth-secret-for-e2e-validation-only",
    BETTER_AUTH_URL: webUrl,
    DATABASE_URL:
      process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:25432/saptm",
    FORCE_COLOR: "0",
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_APP_URL: webUrl,
    NEXT_TELEMETRY_DISABLED: "1",
    REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:26379",
    SAPTM_API_URL: apiUrl,
    SAPTM_WEB_URL: webUrl,
    TURBO_TELEMETRY_DISABLED: "1",
  };
}

function captureRuntimeLog(kind: "api" | "web", chunk: unknown): void {
  const log = trimCapturedLog(`${readRuntimeLogs(kind)}${String(chunk)}`);

  if (kind === "api") {
    apiRuntimeLogs = log;
    return;
  }

  webRuntimeLogs = log;
}

function readRuntimeLogs(kind: "api" | "web"): string {
  return kind === "api" ? apiRuntimeLogs : webRuntimeLogs;
}

function trimCapturedLog(log: string): string {
  return log.length > maxCapturedLogLength ? log.slice(-maxCapturedLogLength) : log;
}

function normalizeUrl(value: string): string {
  const url = new URL(value);

  return url.toString().replace(/\/$/, "");
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function waitForHydratedForm(form: Locator): Promise<void> {
  const idempotencyKey = form.locator('input[name="idempotencyKey"]');
  await expect(idempotencyKey).toHaveValue(/\S+/);

  let lastValue = "";
  let stableReads = 0;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const currentValue = await idempotencyKey.inputValue();

    if (currentValue === lastValue) {
      stableReads += 1;
    } else {
      lastValue = currentValue;
      stableReads = 0;
    }

    if (stableReads >= 5) {
      return;
    }

    await delay(100);
  }
}

async function setFormIdempotencyKey(form: Locator, value: string): Promise<void> {
  await form.locator('input[name="idempotencyKey"]').evaluate((element, idempotencyKey) => {
    if (!(element instanceof HTMLInputElement)) {
      throw new Error("idempotencyKey input did not resolve to an HTML input");
    }

    element.value = idempotencyKey;
  }, value);
}

async function readSelectOptionValueByText(select: Locator, text: string): Promise<string> {
  const option = select.locator("option", { hasText: text }).first();
  const value = await option.getAttribute("value");

  if (value === null) {
    throw new Error(`Select option not found: ${text}`);
  }

  return value;
}

async function expectRecentIntegrationEvent(page: Page, externalId: string): Promise<void> {
  const recentEvents = page.getByTestId("integration-recent-events");

  await expect(recentEvents.getByText(externalId, { exact: true })).toBeVisible({
    timeout: startupTimeoutMs,
  });
}

async function expectFormToBeValid(form: Locator): Promise<void> {
  const invalidControls = await form.evaluate((formElement) => {
    if (!(formElement instanceof HTMLFormElement)) {
      return ["locator_did_not_resolve_to_form"];
    }

    return Array.from(formElement.elements).flatMap((element) => {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
        )
      ) {
        return [];
      }

      if (element.checkValidity()) {
        return [];
      }

      return [
        `${element.name || element.id || element.tagName}: ${element.validationMessage}`.trim(),
      ];
    });
  });

  expect(invalidControls).toEqual([]);
}

function createCommandSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
}

function toDatetimeLocal(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
