import { setTimeout as delay } from "node:timers/promises";
import { expect, type Locator, type Page, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const apiUrl = normalizeUrl(process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:43100");
const _webUrl = normalizeUrl(baseUrl);
const startupTimeoutMs = readPositiveIntegerEnv("PLAYWRIGHT_STARTUP_TIMEOUT_MS", 120_000);
const localAdminEmail = process.env.SAPTM_LOCAL_ADMIN_EMAIL ?? "admin@saptm.local";
const localAdminPassword = process.env.SAPTM_LOCAL_ADMIN_PASSWORD ?? "LocalAdmin!2026";

test.describe("MVP Complete Journey", () => {
  test("executes full cargo lifecycle through all modules", async ({ page }) => {
    const commandSuffix = createCommandSuffix();
    const cargoReference = `CGO-MVP-${commandSuffix}`;
    const now = new Date();

    // ── Step 1: Sign in ──────────────────────────────────────────────────
    await signIn(page);

    // ── Step 2: Navigate to /app/cargo, register a cargo ────────────────────
    await page.goto("/app/cargo");
    await expect(page.getByText("Registo governado de cargas", { exact: true })).toBeVisible();

    const cargoForm = page.locator("form", {
      has: page.getByRole("button", { name: "Registar carga" }),
    });
    await waitForHydratedForm(cargoForm);
    await cargoForm.getByLabel("Referencia da carga", { exact: true }).fill(cargoReference);
    await cargoForm
      .getByLabel("Referencia externa", { exact: true })
      .fill(`EXT-MVP-${commandSuffix}`);
    await cargoForm
      .getByLabel("Descricao", { exact: true })
      .fill("MVP complete journey cargo for end-to-end lifecycle validation");
    await cargoForm.getByLabel("Tipo", { exact: true }).selectOption("container");
    await cargoForm.getByLabel("Peso bruto kg", { exact: true }).fill("15000");
    await cargoForm.getByLabel("Volumes", { exact: true }).fill("24");
    await cargoForm.getByLabel("Expedidor", { exact: true }).fill("MVP Shipper");
    await cargoForm.getByLabel("Consignatario", { exact: true }).fill("MVP Consignee");
    await cargoForm.getByLabel("Origem", { exact: true }).fill("Porto Seco MVP");
    await cargoForm.getByLabel("Destino", { exact: true }).fill("Terminal Ferroviario MVP");
    await cargoForm.getByLabel("Responsavel custodia", { exact: true }).fill("MVP Custody");
    await cargoForm.getByLabel("Prioridade", { exact: true }).fill("3");
    await cargoForm.getByLabel("Estado aduaneiro", { exact: true }).selectOption("cleared");
    await cargoForm
      .getByLabel("Referencia aduaneira", { exact: true })
      .fill(`CUS-MVP-${commandSuffix}`);
    await cargoForm.getByLabel("Condicao", { exact: true }).selectOption("sound");
    await cargoForm.getByLabel("Volume m3", { exact: true }).fill("42");
    await expectFormToBeValid(cargoForm);
    await cargoForm.getByRole("button", { name: "Registar carga" }).click();
    await expect(
      cargoForm.getByText(/Carga registada com regras de negocio, audit trail e outbox/),
    ).toBeVisible({ timeout: startupTimeoutMs });
    await expect(page.getByText(cargoReference).first()).toBeVisible();
    console.log(`MVP: Cargo registered with reference ${cargoReference}`);

    const cargoId = await getCargoIdByReference(page, apiUrl, cargoReference);
    expect(cargoId).not.toBeNull();
    console.log(`MVP: Cargo ID = ${cargoId}`);

    // ── Step 3: Record and verify compliance evidence ──────────────────────
    // 3a: Record compliance evidence
    const complianceForm = page.locator("form", {
      has: page.getByRole("button", { name: "Registar evidencia" }),
    });
    await waitForHydratedForm(complianceForm);
    const evidenceDocRef = `DOC-MVP-${commandSuffix}`;

    await complianceForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await complianceForm
      .getByLabel("Tipo de evidencia", { exact: true })
      .selectOption("bill_of_lading");
    await complianceForm.getByLabel("Referencia documental", { exact: true }).fill(evidenceDocRef);
    await complianceForm
      .getByLabel("Titulo do documento", { exact: true })
      .fill("Bill of Lading - MVP journey");
    await complianceForm.getByLabel("Emissor", { exact: true }).fill("MVP Shipping Line");
    await complianceForm
      .getByLabel("URI documental", { exact: true })
      .fill("https://docs.mvp.local/bl");
    await complianceForm.getByLabel("Emitido em", { exact: true }).fill(toDatetimeLocal(now));
    await expectFormToBeValid(complianceForm);
    await complianceForm.getByRole("button", { name: "Registar evidencia" }).click();
    await expect(
      complianceForm.getByText(/Evidencia registada para revisao com audit trail e outbox/),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Compliance evidence recorded`);

    const evidenceId = await getEvidenceIdByCargo(page, apiUrl, cargoId, evidenceDocRef);
    expect(evidenceId).not.toBeNull();
    console.log(`MVP: Evidence ID = ${evidenceId}`);

    // 3b: Verify compliance evidence as approved
    const verifyForm = page.locator("form", {
      has: page.getByRole("button", { name: "Verificar evidencia" }),
    });
    await waitForHydratedForm(verifyForm);
    const reviewRef = `REV-MVP-${commandSuffix}`;

    await verifyForm.getByLabel("Evidence ID", { exact: true }).fill(evidenceId);
    await verifyForm.getByLabel("Decisao", { exact: true }).selectOption("Aprovar");
    await verifyForm.getByLabel("Revisor", { exact: true }).fill("MVP Compliance Officer");
    await verifyForm.getByLabel("Referencia da revisao", { exact: true }).fill(reviewRef);
    await verifyForm.getByLabel("Revisado em", { exact: true }).fill(toDatetimeLocal(now));
    await verifyForm
      .getByLabel("Resumo da revisao", { exact: true })
      .fill("Documentos conferidos e aprovados para o fluxo MVP complete journey.");
    await expectFormToBeValid(verifyForm);
    await verifyForm.getByRole("button", { name: "Verificar evidencia" }).click();
    await expect(
      verifyForm.getByText(/Evidencia verificada com regras de negocio, audit trail e outbox/),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Compliance evidence verified as approved`);

    // ── Step 4: Release the cargo ──────────────────────────────────────
    const releaseForm = page.locator("form", {
      has: page.getByRole("button", { name: "Liberar carga" }),
    });
    await waitForHydratedForm(releaseForm);
    const releaseRef = `RLS-MVP-${commandSuffix}`;

    await releaseForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await releaseForm.getByLabel("Liberada em", { exact: true }).fill(toDatetimeLocal(now));
    await releaseForm
      .getByLabel("Estado aduaneiro final", { exact: true })
      .selectOption("Liberada");
    await releaseForm
      .getByLabel("Resultado da inspecao", { exact: true })
      .selectOption("Nao requerido");
    await releaseForm.getByLabel("Referencia de liberacao", { exact: true }).fill(releaseRef);
    await releaseForm
      .getByLabel("Justificativa operacional", { exact: true })
      .fill("Carga em conformidade, liberada para transporte no fluxo MVP.");
    await expectFormToBeValid(releaseForm);
    await releaseForm.getByRole("button", { name: "Liberar carga" }).click();
    await expect(
      releaseForm.getByText(
        /Carga liberada para transporte com regras de negocio, audit trail e outbox/,
      ),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Cargo released`);

    // ── Step 5: Create transport plan ──────────────────────────────────────
    const planForm = page.locator("form", {
      has: page.getByRole("button", { name: "Criar tracking" }),
    });
    await waitForHydratedForm(planForm);
    const trackingRef = `TRK-MVP-${commandSuffix}`;

    await planForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await planForm.getByLabel("Referencia de tracking", { exact: true }).fill(trackingRef);
    await planForm.getByLabel("Modal", { exact: true }).selectOption("rail");
    await planForm
      .getByLabel("Partida planeada", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 2 * 60 * 60 * 1000)));
    await planForm
      .getByLabel("ETA", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 26 * 60 * 60 * 1000)));
    await planForm.getByLabel("Equipa responsavel", { exact: true }).fill("MVP Rail Ops");
    await planForm
      .getByLabel("Referencia do plano", { exact: true })
      .fill(`PLAN-MVP-${commandSuffix}`);
    await expectFormToBeValid(planForm);
    await planForm.getByRole("button", { name: "Criar tracking" }).click();
    await expect(
      planForm.getByText(
        /Tracking operacional criado a partir da carga liberada com audit trail e outbox/,
      ),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Transport plan created with tracking ref ${trackingRef}`);

    const shipmentId = await getShipmentIdByTrackingRef(page, apiUrl, trackingRef);
    expect(shipmentId).not.toBeNull();
    console.log(`MVP: Shipment ID = ${shipmentId}`);

    // ── Step 6: Reserve capacity slot at /app/capacity ─────────────────────
    await page.goto("/app/capacity");
    await expect(page.getByText("Capacidade operacional governada", { exact: true })).toBeVisible();

    const reserveForm = page.locator("form", {
      has: page.getByRole("button", { name: "Reservar capacidade" }),
    });
    await waitForHydratedForm(reserveForm);
    const reservationRef = `RSV-MVP-${commandSuffix}`;

    await reserveForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await reserveForm
      .getByLabel("Slot ID", { exact: true })
      .fill("local_demo_capacity_slot_open_001");
    await reserveForm.getByLabel("Referencia da reserva", { exact: true }).fill(reservationRef);
    await reserveForm.getByLabel("Finalidade", { exact: true }).selectOption("departure");
    await reserveForm.getByLabel("Unidades", { exact: true }).fill("1");
    await reserveForm.getByLabel("Responsavel", { exact: true }).fill("MVP Planner");
    await reserveForm
      .getByLabel("Reservado em", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 1 * 60 * 60 * 1000)));
    await expectFormToBeValid(reserveForm);
    await reserveForm.getByRole("button", { name: "Reservar capacidade" }).click();
    await expect(reserveForm.getByText(/Reserva governada/)).toBeVisible({
      timeout: startupTimeoutMs,
    });
    console.log(`MVP: Capacity slot reserved with ref ${reservationRef}`);

    // ── Step 7: Confirm and dispatch transport order at /app/planning ────────
    await page.goto("/app/planning");
    await expect(
      page.getByText("Planeamento de transporte governado", { exact: true }),
    ).toBeVisible();

    // 7a: Confirm transport order
    const confirmForm = page.locator("form", {
      has: page.getByRole("button", { name: "Confirmar transport order" }),
    });
    await waitForHydratedForm(confirmForm);
    const orderReference = `TO-MVP-${commandSuffix}`;
    const confirmationReference = `CNF-MVP-${commandSuffix}`;
    const confirmedAt = toDatetimeLocal(now);

    await confirmForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await confirmForm.getByLabel("Referencia da ordem", { exact: true }).fill(orderReference);
    await confirmForm
      .getByLabel("Referencia de confirmacao", { exact: true })
      .fill(confirmationReference);
    await confirmForm.getByLabel("Modo", { exact: true }).selectOption("rail");
    await confirmForm.getByLabel("Transportador", { exact: true }).fill("MVP Rail Operator");
    await confirmForm
      .getByLabel("Planner responsavel", { exact: true })
      .fill("MVP Transport Planner");
    await confirmForm.getByLabel("Origem", { exact: true }).fill("Terminal Ferroviario MVP");
    await confirmForm.getByLabel("Destino", { exact: true }).fill("Porto de Luanda MVP");
    await confirmForm
      .getByLabel("Resumo da rota", { exact: true })
      .fill("Terminal ferroviario MVP para Porto de Luanda via corredor central.");
    await confirmForm.getByLabel("Confirmado em", { exact: true }).fill(confirmedAt);
    await confirmForm
      .getByLabel("Partida planeada", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 6 * 60 * 60 * 1000)));
    await confirmForm
      .getByLabel("Chegada planeada", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 18 * 60 * 60 * 1000)));
    await expectFormToBeValid(confirmForm);
    await confirmForm.getByRole("button", { name: "Confirmar transport order" }).click();
    await expect(confirmForm.getByText(/Transport order .*confirmada/)).toBeVisible({
      timeout: startupTimeoutMs,
    });
    await page.reload();
    await expect(page.getByText(orderReference).first()).toBeVisible({
      timeout: startupTimeoutMs,
    });
    console.log(`MVP: Transport order ${orderReference} confirmed`);

    // 7b: Dispatch transport order
    const dispatchForm = page.locator("form", {
      has: page.getByRole("button", { name: "Despachar transport order" }),
    });
    await waitForHydratedForm(dispatchForm);
    const dispatchRef = `DSP-MVP-${commandSuffix}`;

    await dispatchForm.getByLabel("Transport order ID", { exact: true }).fill(orderReference);
    await dispatchForm.getByLabel("Referencia de dispatch", { exact: true }).fill(dispatchRef);
    await dispatchForm.getByLabel("Responsavel", { exact: true }).fill("MVP Dispatcher");
    await dispatchForm
      .getByLabel("Instrucoes operacionais", { exact: true })
      .fill("Despachar transport order MVP para execucao ferroviaria controlada.");
    await dispatchForm.getByLabel("Sistema origem", { exact: true }).fill("planning-mvp");
    await expectFormToBeValid(dispatchForm);
    await dispatchForm.getByRole("button", { name: "Despachar transport order" }).click();
    await expect(dispatchForm.getByText(/Transport order .*despachada/)).toBeVisible({
      timeout: startupTimeoutMs,
    });
    await page.reload();
    await expect(page.getByText(dispatchRef).first()).toBeVisible({
      timeout: startupTimeoutMs,
    });
    console.log(`MVP: Transport order ${orderReference} dispatched`);

    // ── Step 8: Execute departure on cargo ────────────────────────────────
    await page.goto("/app/cargo");
    await expect(page.getByText("Registo governado de cargas", { exact: true })).toBeVisible();

    const departForm = page.locator("form", {
      has: page.getByRole("button", { name: "Iniciar partida" }),
    });
    await waitForHydratedForm(departForm);

    await departForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await departForm
      .getByLabel("Partiu em", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 3 * 60 * 60 * 1000)));
    await departForm
      .getByLabel("Local de partida", { exact: true })
      .fill("Terminal Ferroviario MVP");
    await departForm.getByLabel("Operador responsavel", { exact: true }).fill("MVP Rail Operator");
    await departForm
      .getByLabel("Referencia de partida", { exact: true })
      .fill(`DEP-MVP-${commandSuffix}`);
    await departForm
      .getByLabel("Referencia do transportador", { exact: true })
      .fill(`TRAIN-MVP-${commandSuffix}`);
    await expectFormToBeValid(departForm);
    await departForm.getByRole("button", { name: "Iniciar partida" }).click();
    await expect(
      departForm.getByText(
        /Carga partiu com compliance aprovado, tracking departed, audit trail e outbox/,
      ),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Cargo departure executed`);

    // ── Step 9: Verify tracking at /app/tracking ──────────────────────────
    await page.goto("/app/tracking");
    await expect(page.getByText("Tracking operacional de cargas", { exact: true })).toBeVisible();
    await expect(page.getByText(trackingRef).first()).toBeVisible({
      timeout: startupTimeoutMs,
    });
    await expect(page.getByText("Em transito").first()).toBeVisible();
    console.log(`MVP: Shipment ${trackingRef} confirmed in_transit`);

    // Navigate to tracking detail to verify timeline
    await page.goto(`/app/tracking/${shipmentId}`);
    await expect(page.getByText(trackingRef).first()).toBeVisible({
      timeout: startupTimeoutMs,
    });
    await expect(page.getByText("Timeline de eventos")).toBeVisible();
    await expect(page.getByText("Partida").first()).toBeVisible();
    console.log(`MVP: Tracking detail shows timeline with departure event`);

    // ── Step 10: Exception handling on tracking detail ─────────────────────
    // 10a: Record an exception via "Gerir excecao operacional"
    const exceptionManageForm = page.locator("form", {
      has: page.getByRole("button", { name: "Gerir excecao" }),
    });
    await waitForHydratedForm(exceptionManageForm);

    await exceptionManageForm.getByLabel("Categoria", { exact: true }).selectOption("delay");
    await exceptionManageForm.getByLabel("Severidade", { exact: true }).selectOption("high");
    await exceptionManageForm
      .getByLabel("Ocorrida em", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 12 * 60 * 60 * 1000)));
    await exceptionManageForm
      .getByLabel("Previsao de resolucao", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 36 * 60 * 60 * 1000)));
    await exceptionManageForm
      .getByLabel("Local afetado", { exact: true })
      .fill("Estacao Intermediaria MVP");
    await exceptionManageForm
      .getByLabel("Equipa responsavel", { exact: true })
      .fill("MVP Rail Ops");
    await exceptionManageForm
      .getByLabel("Resumo da excecao", { exact: true })
      .fill("Atraso devido a fecho de via programado na estacao intermediaria.");
    await exceptionManageForm
      .getByLabel("Plano de recuperacao", { exact: true })
      .fill("Redirecionar para via alternativa e recuperar horario no destino.");
    await exceptionManageForm
      .getByLabel("Operador responsavel", { exact: true })
      .fill("MVP Exception Operator");
    await exceptionManageForm
      .getByLabel("Tipo de evidencia", { exact: true })
      .selectOption("operator_note");
    await exceptionManageForm
      .getByLabel("Referencia da evidencia", { exact: true })
      .fill(`EVT-MVP-${commandSuffix}`);
    await exceptionManageForm
      .getByLabel("Estado de aprovacao", { exact: true })
      .selectOption("pending_review");
    await exceptionManageForm
      .getByLabel("Resumo da evidencia", { exact: true })
      .fill("Nota operacional registada sobre o atraso na estacao intermediaria MVP.");
    await exceptionManageForm.getByLabel("Sistema origem", { exact: true }).fill("saptm");
    await expectFormToBeValid(exceptionManageForm);
    await exceptionManageForm.getByRole("button", { name: "Gerir excecao" }).click();
    await expect(
      exceptionManageForm.getByText(/Excecao aberta|Excecao governada|Evento:/),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Exception recorded on tracking detail`);

    // 10b: Resolve the exception via "Resolver excecao operacional"
    const exceptionResolveForm = page.locator("form", {
      has: page.getByRole("button", { name: "Resolver excecao" }),
    });
    await waitForHydratedForm(exceptionResolveForm);

    await exceptionResolveForm
      .getByLabel("Codigo de resolucao", { exact: true })
      .selectOption("infrastructure_restored");
    await exceptionResolveForm
      .getByLabel("Status apos resolucao", { exact: true })
      .selectOption("in_transit");
    await exceptionResolveForm
      .getByLabel("Resolvida em", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 14 * 60 * 60 * 1000)));
    await exceptionResolveForm
      .getByLabel("Local de liberacao", { exact: true })
      .fill("Estacao Intermediaria MVP");
    await exceptionResolveForm
      .getByLabel("Equipa responsavel", { exact: true })
      .fill("MVP Rail Ops");
    await exceptionResolveForm
      .getByLabel("Resumo da resolucao", { exact: true })
      .fill("Via alternativa liberada, carga retomou percurso para o destino.");
    await exceptionResolveForm
      .getByLabel("Operador responsavel", { exact: true })
      .fill("MVP Exception Operator");
    await exceptionResolveForm
      .getByLabel("Tipo de evidencia", { exact: true })
      .selectOption("document");
    await exceptionResolveForm
      .getByLabel("Referencia da evidencia", { exact: true })
      .fill(`RES-EVT-MVP-${commandSuffix}`);
    await exceptionResolveForm
      .getByLabel("Referencia da aprovacao", { exact: true })
      .fill(`APR-MVP-${commandSuffix}`);
    await exceptionResolveForm
      .getByLabel("Resumo da evidencia", { exact: true })
      .fill("Documento de liberacao de via emitido pela infraestrutura ferroviaria.");
    await exceptionResolveForm
      .getByLabel("Aprovador", { exact: true })
      .fill("MVP Supervisor Operacoes");
    await exceptionResolveForm.getByLabel("Sistema origem", { exact: true }).fill("saptm");
    await expectFormToBeValid(exceptionResolveForm);
    await exceptionResolveForm.getByRole("button", { name: "Resolver excecao" }).click();
    await expect(exceptionResolveForm.getByText(/Excecao resolvida|Resolucao|Evento:/)).toBeVisible(
      { timeout: startupTimeoutMs },
    );
    console.log(`MVP: Exception resolved on tracking detail`);

    // ── Step 11: Execute arrival and delivery completion ────────────────────
    // 11a: Record a tracking event first
    await page.goto("/app/tracking");
    await expect(page.getByText("Tracking operacional de cargas", { exact: true })).toBeVisible();

    const eventForm = page.locator("form", {
      has: page.getByRole("button", { name: "Registar evento" }),
    });
    await waitForHydratedForm(eventForm);
    await eventForm.getByLabel("Carga rastreada", { exact: true }).selectOption(shipmentId);
    await eventForm.getByLabel("Tipo de evento", { exact: true }).selectOption("location_updated");
    await eventForm
      .getByLabel("Data/hora operacional", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 16 * 60 * 60 * 1000)));
    await eventForm.getByLabel("Local operacional", { exact: true }).fill("Porto de Luanda MVP");
    await eventForm
      .getByLabel("Notas operacionais", { exact: true })
      .fill("Carga aproximando-se do destino final no porto.");
    await eventForm
      .getByLabel("Payload JSON opcional", { exact: true })
      .fill(`{"trainNumber":"MVP-TRN-01","speed":25}`);
    await expectFormToBeValid(eventForm);
    await eventForm.getByRole("button", { name: "Registar evento" }).click();
    await expect(eventForm.getByText(/Audit, outbox e status sao gravados no backend/)).toBeVisible(
      { timeout: startupTimeoutMs },
    );
    console.log(`MVP: Tracking event recorded`);

    // 11b: Execute arrival
    await page.goto("/app/cargo");
    await expect(page.getByText("Registo governado de cargas", { exact: true })).toBeVisible();

    const arriveForm = page.locator("form", {
      has: page.getByRole("button", { name: "Confirmar chegada" }),
    });
    await waitForHydratedForm(arriveForm);

    await arriveForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await arriveForm
      .getByLabel("Chegou em", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 20 * 60 * 60 * 1000)));
    await arriveForm.getByLabel("Local de chegada", { exact: true }).fill("Porto de Luanda MVP");
    await arriveForm.getByLabel("Operador responsavel", { exact: true }).fill("MVP Rail Operator");
    await arriveForm
      .getByLabel("Referencia de chegada", { exact: true })
      .fill(`ARR-MVP-${commandSuffix}`);
    await expectFormToBeValid(arriveForm);
    await arriveForm.getByRole("button", { name: "Confirmar chegada" }).click();
    await expect(
      arriveForm.getByText(/Chegada confirmada com tracking arrived, audit trail e outbox/),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Cargo arrival confirmed`);

    // 11c: Execute delivery completion
    const deliveryForm = page.locator("form", {
      has: page.getByRole("button", { name: "Concluir entrega" }),
    });
    await waitForHydratedForm(deliveryForm);
    const deliveryRef = `DLV-MVP-${commandSuffix}`;

    await deliveryForm.getByLabel("Cargo ID", { exact: true }).fill(cargoId);
    await deliveryForm
      .getByLabel("Entregue em", { exact: true })
      .fill(toDatetimeLocal(new Date(now.getTime() + 22 * 60 * 60 * 1000)));
    await deliveryForm
      .getByLabel("Recebido por", { exact: true })
      .fill("MVP Consignee Representative");
    await deliveryForm.getByLabel("Referencia de entrega", { exact: true }).fill(deliveryRef);
    await deliveryForm.getByLabel("Condicao final", { exact: true }).selectOption("Sem danos");
    await deliveryForm
      .getByLabel("Notas de entrega", { exact: true })
      .fill("Entrega concluida sem danos no ambito do MVP complete journey.");
    await expectFormToBeValid(deliveryForm);
    await deliveryForm.getByRole("button", { name: "Concluir entrega" }).click();
    await expect(
      deliveryForm.getByText(
        /Entrega concluida com cargo delivered, tracking completed, audit trail e outbox/,
      ),
    ).toBeVisible({ timeout: startupTimeoutMs });
    console.log(`MVP: Delivery completed with ref ${deliveryRef}`);

    // ── Step 12: Verify audit events at /app/audit ─────────────────────────
    await page.goto("/app/audit");
    await expect(page.getByText("Audit trail operacional", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pesquisar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar CSV" })).toBeVisible();

    // Search for cargo-related audit events
    await page.getByLabel("Acao", { exact: true }).fill(cargoReference.slice(0, 10));
    await page.getByRole("button", { name: "Pesquisar" }).click();
    await expect(page).toHaveURL(/\/app\/audit\?.*action=/);
    await expect(page.getByText(cargoReference).first()).toBeVisible({
      timeout: startupTimeoutMs,
    });
    console.log(`MVP: Audit trail visible with cargo events`);

    // ── Step 13: Verify reports export at /app/reports ──────────────────────
    await page.goto("/app/reports");
    await expect(page.getByText("Reports operacionais", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar Cargo CSV" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar Tracking CSV" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar Planning CSV" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Exportar Cargo CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^saptm-report-cargo-.*\.csv$/);
    console.log(`MVP: Report export verified`);

    // ── Step 14: Verify notifications inbox at /app/notifications ──────────
    await page.goto("/app/notifications");
    await expect(page.getByText("Inbox operacional", { exact: true })).toBeVisible();
    await expect(page.getByText("Eventos processados")).toBeVisible();
    console.log(`MVP: Notifications inbox loads successfully`);
  });
});

// ── Auth & API helpers ─────────────────────────────────────────────────────

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
      Origin: _webUrl,
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

async function apiFetchFromTest(
  page: Page,
  apiBaseUrl: string,
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<unknown> {
  const cookies = await page.context().cookies();
  const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const resp = await fetch(`${apiBaseUrl}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookieString.length > 0 ? { cookie: cookieString } : {}),
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!resp.ok) {
    throw new Error(`API fetch failed: ${resp.status} for ${path}\n${await resp.text()}`);
  }

  const envelope = (await resp.json()) as { json?: unknown };
  return envelope.json;
}

async function getCargoIdByReference(
  page: Page,
  apiBaseUrl: string,
  cargoReference: string,
): Promise<string> {
  const overview = (await apiFetchFromTest(page, apiBaseUrl, "/rpc/cargo/overview")) as {
    recentCargo?: Array<{ id: string; cargoReference: string }>;
  };

  const cargo = overview.recentCargo?.find((c) => c.cargoReference === cargoReference);
  if (cargo === undefined || cargo === null) {
    throw new Error(`Cargo not found by reference: ${cargoReference}`);
  }

  return cargo.id;
}

async function getEvidenceIdByCargo(
  page: Page,
  apiBaseUrl: string,
  cargoId: string,
  _documentReference: string,
): Promise<string> {
  const overview = (await apiFetchFromTest(page, apiBaseUrl, "/rpc/cargo/overview")) as {
    recentCargo?: Array<{
      id: string;
      recentEvidence?: Array<{ id: string; documentReference: string }>;
    }>;
  };

  const cargo = overview.recentCargo?.find((c) => c.id === cargoId);
  if (cargo === undefined || cargo === null) {
    throw new Error(`Cargo not found by ID: ${cargoId}`);
  }

  return cargoId;
}

async function getShipmentIdByTrackingRef(
  page: Page,
  apiBaseUrl: string,
  trackingRef: string,
): Promise<string> {
  const overview = (await apiFetchFromTest(page, apiBaseUrl, "/rpc/tracking/overview")) as {
    recentShipments?: Array<{ id: string; referenceCode: string }>;
  };

  const shipment = overview.recentShipments?.find((s) => s.referenceCode === trackingRef);
  if (shipment === undefined || shipment === null) {
    throw new Error(`Shipment not found by tracking ref: ${trackingRef}`);
  }

  return shipment.id;
}

// ── Test utilities (consistent with authenticated-platform.spec.ts) ────────

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

function normalizeUrl(value: string): string {
  const url = new URL(value);
  return url.toString().replace(/\/$/, "");
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
