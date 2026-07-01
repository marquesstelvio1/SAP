# AI Engineering Audit — SAPTM

> **Date:** 2026-06-30
> **Scope:** Full inventory of AI/ML/analytics/advisory features, MCP blueprint, RAG for compliance, automation advisory evolution
> **Methodology:** Static analysis of TypeScript/Prisma codebase, RPC contracts, service implementations, UI components, and database schema

---

## Section 1 — Inventory

### 1.1 Summary

SAPTM currently has **no real AI/ML models, no LLM integration, no vector embeddings, no RAG pipelines, and no MCP servers**. What exists under "advisory" and "analytics" labels is entirely **rule-based logic** — deterministic functions with hardcoded confidence scores — wrapped in enterprise-grade API contracts (idempotency, audit, outbox, tenant-scoping).

The `ai_agent` actor type exists in the `ActorType` enum but is **never used**. The advisory/analytics systems are well-architected stubs awaiting real AI/ML integration.

### 1.2 Complete File Inventory

| # | File Path | Type | What It Does | AI Relevance |
|---|---|---|---|---|
| 1 | `packages/rpc/src/tracking.ts` | RPC Contract | Defines `trackingAnalyticsOutputSchema`, `trackingAdvisoryOutputSchema`, metadata for `tracking.analytics.read` and `tracking.ai.advisory.read` | Advisory recommendation types (`sla_risk`, `exception_recovery`, `priority_review`, `workflow_review`); hardcoded `source: "rule_based_operational_advisor"` |
| 2 | `packages/rpc/src/capacity.ts` | RPC Contract | Defines `capacityAdvisoryOutputSchema`, `capacityAdvisoryDecisionAnalyticsOutputSchema`, advisory recommendation types (`slot_saturation`, `expiring_slot`, `unused_capacity`, `reservation_imbalance`, `cancellation_review`) | Full decision lifecycle: recommend → human decide → analytics; `source: "rule_based_capacity_optimizer"` |
| 3 | `apps/api/src/tracking/tracking.service.ts` | Service | `getAnalytics()` — real SQL aggregation (KPIs, SLA risk, mode distribution). `getAdvisory()` — calls `createTrackingAdvisoryRecommendations()` | Analytics is real DB aggregation; advisory is rule-based stub |
| 4 | `apps/api/src/tracking/domain/tracking.dto.ts` | DTO/Logic | `createTrackingAdvisoryRecommendations()` — iterates active shipments, applies status/ETA/priority rules | Confidence scores hardcoded (0.62–0.88); no ML |
| 5 | `apps/api/src/capacity/capacity.service.ts` | Service | `getAdvisory()` — calls `createCapacityAdvisoryRecommendations()`. `getAdvisoryDecisionAnalytics()` — real DB aggregation on past decisions. `recordAdvisoryDecision()` — full CRUD with idempotency, audit, outbox | Advisory is rule-based; decision recording is production-grade |
| 6 | `apps/api/src/capacity/domain/capacity.dto.ts` | DTO/Logic | `createCapacityAdvisoryRecommendations()` — iterates slots/reservations, applies utilization/window rules | Confidence scores hardcoded (0.68–0.90); no ML |
| 7 | `apps/api/src/tracking/tracking-rpc.router.ts` | Router | Wires `tracking.analytics` (GET) and `tracking.advisory` (GET) RPC endpoints | Standard org-scoped auth |
| 8 | `apps/api/src/capacity/capacity-rpc.router.ts` | Router | Wires `capacity.advisory`, `capacity.advisoryDecisionAnalytics`, `capacity.recordAdvisoryDecision` | Decision analytics is the most mature "AI" feature |
| 9 | `apps/api/src/event-bus/event-types.ts` | Events | Defines `CAPACITY_ADVISORY_DECIDED` domain event | Advisory decisions are first-class domain events |
| 10 | `packages/database/prisma/schema.prisma` | Schema | `CapacityAdvisoryDecision` model, `ActorType.ai_agent` enum value | Decision storage exists; `ai_agent` actor unused |
| 11 | `apps/web/components/tracking/tracking-analytics-section.tsx` | UI Component | Renders analytics KPIs (MetricTile), SLA risk cards, mode distribution table, advisory recommendations cards, governance policy panel | Advisory UI shows severity, confidence %, humano-only approval |
| 12 | `apps/web/app/(platform)/app/tracking/logic.tsx` | UI Logic | Label maps for status, mode, event types, advisory types; severity variant resolver | No logic — pure presentation helpers |
| 13 | `apps/web/app/(platform)/app/tracking/TrackingOverviewClient.tsx` | Page Component | Orchestrates analytics + advisory queries with loading/error/empty states | Uses useTrackingAnalytics + useTrackingAdvisory hooks |
| 14 | `apps/web/hooks/use-tracking-advisory.ts` | Hook | TanStack Query wrapper for `getTrackingAdvisory()` | 30s staleTime |
| 15 | `apps/web/hooks/use-tracking-analytics.ts` | Hook | TanStack Query wrapper for `getTrackingAnalytics()` | 30s staleTime |
| 16 | `apps/web/lib/capacity-advisory.ts` | Server Lib | RPC client for `/rpc/capacity/advisory` | Schema-validated RPC call |
| 17 | `apps/web/lib/capacity-advisory-decision-analytics.ts` | Server Lib | RPC client for `/rpc/capacity/advisoryDecisionAnalytics` | Schema-validated RPC call |
| 18 | `apps/web/components/capacity/capacity-advisory-decision-form.tsx` | UI Component | Form for human decision on advisory recommendations | Exposes `capacity.advisory.decide` permission badge |
| 19 | `apps/web/app/(platform)/app/capacity/actions.ts` | Server Action | Handles `capacityAdvisoryDecisionRecordInput` submission | Full validation + RPC call |
| 20 | `apps/web/app/(platform)/app/capacity/page.tsx` | Page | Renders capacity overview + advisory decision form | Reads `capacity.advisory.decide` permission |
| 21 | `apps/api/src/capacity/domain/capacity.repository.ts` | Repository | `findAdvisoryDecisionsInWindow()` — real DB query for decision analytics | Used by `getAdvisoryDecisionAnalytics()` |
| 22 | `apps/api/src/capacity/domain/capacity.business-rules.ts` | Business Rules | Validates advisory decision business constraints (idempotency, slot existence, duplicate decisions) | Rule engine for decision governance |
| 23 | `apps/api/src/capacity/domain/capacity.audit-trail.ts` | Audit | Creates before/after audit records for advisory decisions | Full audit trail for every decision |
| 24 | `packages/rpc/src/metadata.ts` | RPC Metadata | `createRpcOperationMetadata()` — standard metadata factory | Advisory operations use same metadata as all mutations/queries |

### 1.3 Advisory Recommendation Types (Current Stub Logic)

**Tracking Advisory** (4 types):
| Type | Trigger | Severity | Confidence |
|---|---|---|---|
| `exception_recovery` | Shipment status in exception/delayed | critical/high (by priority) | 0.82–0.88 |
| `sla_risk` | ETA passed, shipment still active | high/medium (by priority) | 0.78 |
| `priority_review` | Priority ≤ 2, no ETA set | medium | 0.70 |
| `workflow_review` | Fallback when no other issues | medium | 0.62 |

**Capacity Advisory** (5 types):
| Type | Trigger | Severity | Confidence |
|---|---|---|---|
| `slot_saturation` | Utilization ≥ 85% | critical/high (100% → critical) | 0.84–0.90 |
| `expiring_slot` | Available units > 0, ≤ 24h window | high/medium (≤6h → high) | 0.74–0.82 |
| `unused_capacity` | Units ≥ 4, utilization ≤ 25% | low | 0.68 |
| `reservation_imbalance` | ≥3 reservations/slot, util ≥ 70% | high/medium (≥90% → high) | 0.76 |
| `cancellation_review` | ≥2 cancelled reservations/resource | medium | 0.72 |

### 1.4 Anti-Patterns Detected

| Anti-Pattern | Location | Impact |
|---|---|---|
| Hardcoded confidence scores | `tracking.dto.ts:199`, `capacity.dto.ts:673` | No calibration — scores are guessed, not learned |
| Advisory labelled "IA" but no ML | `tracking-analytics-section.tsx:152` badge "IA advisory" | Misleading label creates wrong expectations |
| `ai_agent` actor type unused | `schema.prisma:29` | Dead code; no AI agent ever acts in the system |
| No model versioning | All advisory | No concept of model version, data drift, or A/B |
| No feedback loop | All advisory | Human decisions are stored (`CapacityAdvisoryDecision`) but never fed back into the recommendation engine |
| No performance metrics | All advisory | No precision/recall tracking for recommendations |

---

## Section 2 — MCP Blueprint

### 2.1 Rationale

Model Context Protocol (MCP) would allow LLM-powered agents (e.g., Claude Code, custom copilots) to **discover and interact with SAPTM's operational data** through standardized resources (read) and tools (write). Each MCP server would expose one bounded context of the logistics platform.

### 2.2 MCP Server Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MCP Gateway                         │
│                                                      │
│  /api/mcp/tracking ◄── LLM Agents (Claude, etc.)    │
│  /api/mcp/capacity                                   │
│  /api/mcp/cargo                                      │
│  /api/mcp/planning                                   │
│  /api/mcp/compliance (future)                        │
└─────────────────────────────────────────────────────┘
```

Each server is a separate MCP process/container behind the API gateway, authenticated via the same session/auth mechanism.

### 2.3 MCP Server: Tracking

| Resource URI | Description | Schema | Auth |
|---|---|---|---|
| `tracking://shipments` | List shipments with filters (status, mode, priority) | `trackingOverviewOutputSchema` | `tracking.shipment.read` |
| `tracking://shipments/{id}` | Single shipment detail + timeline | `trackingShipmentDetailOutputSchema` | `tracking.shipment.read` |
| `tracking://analytics` | Operational KPIs for lookback window | `trackingAnalyticsOutputSchema` | `tracking.shipment.read` |
| `tracking://analytics/advisory` | Current advisory recommendations | `trackingAdvisoryOutputSchema` | `tracking.shipment.read` |

| Tool | Description | Input | Output | Permission |
|---|---|---|---|---|
| `record_event` | Record tracking event (departed, arrived, delayed, etc.) | `trackingEventRecordInputSchema` | `trackingEventRecordOutputSchema` | `tracking.event.record` |
| `manage_exception` | Open a shipment exception | `trackingExceptionManageInputSchema` | `trackingExceptionManageOutputSchema` | `tracking.exception.manage` |
| `resolve_exception` | Resolve an active exception | `trackingExceptionResolveInputSchema` | `trackingExceptionResolveOutputSchema` | `tracking.exception.resolve` |

### 2.4 MCP Server: Capacity

| Resource URI | Description | Schema | Auth |
|---|---|---|---|
| `capacity://overview` | Resource + slot + reservation totals | `capacityOverviewOutputSchema` | `capacity.read` |
| `capacity://advisory` | Capacity optimization recommendations | `capacityAdvisoryOutputSchema` | `capacity.read` |
| `capacity://advisory/decisions` | Decision analytics for past recommendations | `capacityAdvisoryDecisionAnalyticsOutputSchema` | `capacity.read` |
| `capacity://slots` | Open/blocked/closed slots | `capacitySlotSummarySchema[]` | `capacity.read` |
| `capacity://resources` | Registered terminal/gate/berth resources | `capacityResourceSummarySchema[]` | `capacity.read` |

| Tool | Description | Input | Output | Permission |
|---|---|---|---|---|
| `register_resource` | Register a terminal/gate/berth resource | `capacityResourceRegisterInputSchema` | `capacityResourceRegisterOutputSchema` | `capacity.manage` |
| `open_slot` | Open a capacity slot with window | `capacitySlotOpenInputSchema` | `capacitySlotOpenOutputSchema` | `capacity.manage` |
| `reserve_slot` | Reserve units in a slot | `capacitySlotReserveInputSchema` | `capacitySlotReserveOutputSchema` | `capacity.slot.reserve` |
| `cancel_reservation` | Cancel a slot reservation | `capacitySlotCancelInputSchema` | `capacitySlotCancelOutputSchema` | `capacity.slot.cancel` |
| `decide_advisory` | Record human decision on a recommendation | `capacityAdvisoryDecisionRecordInputSchema` | `capacityAdvisoryDecisionRecordOutputSchema` | `capacity.advisory.decide` |

### 2.5 MCP Server: Cargo

| Resource URI | Description | Schema | Auth |
|---|---|---|---|
| `cargo://items` | List cargo with filters | `cargoOverviewOutputSchema` | `cargo.read` |
| `cargo://items/{id}` | Single cargo detail | `cargoDetailOutputSchema` | `cargo.read` |

| Tool | Description | Permission |
|---|---|---|
| `register_cargo` | New cargo registration | `cargo.register` |
| `release_cargo` | Release cargo from custody | `cargo.release` |

### 2.6 MCP Server: Planning

| Resource URI | Description | Auth |
|---|---|---|
| `planning://orders` | Transport orders | `planning.order.read` |
| `planning://orders/{id}` | Single order + dispatch schedule | `planning.order.read` |

| Tool | Permission |
|---|---|
| `confirm_order` | `planning.order.confirm` |
| `dispatch_order` | `planning.order.dispatch` |
| `reschedule_order` | `planning.order.reschedule` |
| `cancel_order` | `planning.order.cancel` |

### 2.7 Implementation Priority

| Server | Priority | Rationale |
|---|---|---|
| **Tracking** | P0 | Most immediate value — LLM can answer "where is shipment X?" or "what's the SLA risk right now?" |
| **Capacity** | P0 | LLM can recommend slot allocation or flag saturation — natural fit for advisory workflows |
| **Cargo** | P1 | Useful for "what cargo is in my custody?" |
| **Planning** | P1 | LLM can orchestrate order dispatch based on advisory output |

### 2.8 Key Design Decisions

1. **Read-model mappings**: Each resource maps to an existing `outputSchema` from RPC — no new schemas needed
2. **Write-model as tools**: Each tool maps to an existing RPC mutation — reuses idempotency, audit, outbox
3. **Permission passthrough**: The MCP server uses the same `Authorization` header as the parent request, resolved by `RpcContextService.authorizeRequest()` under the hood
4. **Tenant scoping**: Each resource/tool auto-injects `organizationId` from the authenticated session (existing `tenant-scoping.ts` pattern)
5. **Rate limiting**: Inherit existing `@nestjs/throttler` tiers (org 1000/min, user 100/min)

---

## Section 3 — RAG for Compliance

### 3.1 Problem

Logistics compliance involves a complex web of regulations (customs, dangerous goods, cross-border trade, environmental). Currently, no system in SAPTM provides compliance question-answering or regulatory reference.

### 3.2 RAG Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│              │    │                  │    │              │
│  User Query  │───►│  Query Router   │───►│  Embedding   │
│  (PT-PT)     │    │  (classify       │    │  Model       │
│              │    │   domain:        │    │  (e.g.,      │
│              │    │   customs/danger │    │   text-      │
│              │    │   /env/contract) │    │   embed-3)   │
│              │    │                  │    │              │
└──────────────┘    └──────────────────┘    └──────┬───────┘
                                                    │
                                                    ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  Generation  │◄───│  Reranker        │◄───│  Vector DB   │
│  (LLM)       │    │  (cross-encoder) │    │  (pgvector   │
│              │    │                  │    │   via Post-  │
│              │    │                  │    │   gres)      │
└──────────────┘    └──────────────────┘    └──────────────┘
```

### 3.3 Document Sources (Chunking Strategy)

| Document Type | Source | Chunk Strategy | Chunk Size | Overlap |
|---|---|---|---|---|
| Customs regulations | National customs authority PDFs | Semantic section break | 800 tokens | 150 |
| Dangerous goods (ADR/IMDG) | Published code documents | By article/section number | 600 tokens | 100 |
| Contract templates | Legal dept. Word docs | By clause | 500 tokens | 80 |
| Operational SOPs | Internal wikis/PDFs | By procedure step | 400 tokens | 60 |
| Carrier terms | Carrier API docs/PDFs | By service type | 700 tokens | 120 |
| Past compliance decisions | `CargoComplianceEvidence` records | Per record (single chunk) | N/A | N/A |

### 3.4 Data Model (Prisma Extension)

```prisma
model ComplianceDocument {
  id             String   @id @default(cuid())
  organizationId String
  title          String
  documentType   ComplianceDocumentType  // customs | dangerous_goods | contract | sop | carrier_terms
  sourceUrl      String?
  version        String
  chunkCount     Int
  checksum       String                  // SHA-256 for change detection
  status         DocumentStatus          // draft | active | superseded
  effectiveFrom  DateTime
  effectiveUntil DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization         @relation(...)
  chunks       ComplianceChunk[]

  @@unique([organizationId, checksum])
  @@index([organizationId, documentType, status])
}

model ComplianceChunk {
  id           String   @id @default(cuid())
  documentId   String
  chunkIndex   Int
  content      String   // actual text
  tokenCount   Int
  embedding    vector(1536)?   // pgvector; nullable until embedded
  created_at   DateTime @default(now())

  document ComplianceDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId, chunkIndex])
  @@index([embedding])  // IVFFlat or HNSW index
}

model ComplianceQuery {
  id                    String   @id @default(cuid())
  organizationId        String
  query                 String   // user's question
  queryEmbedding        vector(1536)?
  retrievedChunkIds     String[]
  rerankedChunkIds      String[]
  llmResponse           String?
  confidenceScore       Float?
  userFeedback          Boolean? // thumbs up/down
  latencyMs             Int?
  createdAt             DateTime @default(now())
}
```

### 3.5 Pipeline Steps

1. **Document Ingestion**
   - Upload via admin UI or file watcher
   - Detect document type → select chunk strategy
   - Split into chunks → compute SHA-256 checksum → deduplicate
   - Generate embeddings (async batch job) → store in `ComplianceChunk.embedding`
   - Mark superseded documents

2. **Query Time**
   ```
   1. User question (PT-PT): "Quais os documentos necessários para carga perigosa classe 3?"
   2. Query router classifies domain → dangerous_goods
   3. Embed query → search (cosine similarity, top-k=20)
   4. Rerank with cross-encoder → top-5
   5. LLM generation with:
      - System prompt: "You are a logistics compliance assistant. Answer based on the retrieved context. If uncertain, say 'Consulte a equipa de compliance.' Always cite the document title and section."
      - Retrieved chunks as context
      - User question
   6. Log query, response, latency, confidence to ComplianceQuery
   7. Track user feedback for eval
   ```

3. **Maintenance**
   - Re-embed documents on model upgrade
   - Weekly re-index of pgvector
   - Archive queries with `userFeedback == false` for fine-tuning

### 3.6 Integration Points

| Existing Component | RAG Integration |
|---|---|
| `CargoComplianceEvidence` table | Add `complianceQueryId` FK to trace automated answers |
| `cargo.compliance_evidence.recorded` event | Trigger re-index of relevant compliance docs |
| Webhook system | Notify compliance team when new regulations are ingested |
| Audit system | Log each ComplianceQuery as audit record with `ai_agent` actor type |
| RPC | New `compliance.query` operation in RPC contracts |

### 3.7 Cost Estimation (Monthly)

| Component | Estimate | Notes |
|---|---|---|
| Embedding API (2M tokens) | ~$0.26 | `text-embedding-3-small` at $0.13/1M |
| LLM generation (10k queries x 500 tokens) | ~$15 | `gpt-4o-mini` at $0.15/1M in + $0.60/1M out |
| pgvector storage (50k chunks) | Negligible | Existing PostgreSQL instance |
| Reranker (cross-encoder local) | Free | `BAAI/bge-reranker-v2-m3` on CPU |
| **Total** | **~$16/month** | At startup scale |

---

## Section 4 — Automation Advisory: Evolution Roadmap

### 4.1 Current State

```
┌─────────────────────────────────────────────────┐
│              Current (Stub)                       │
│                                                   │
│  Tracking Advisory ─────► Rule-based (status,     │
│  Capacity Advisory  ─────►  ETA, priority,        │
│                            util%, window)         │
│                                                   │
│  Source: "rule_based_operational_advisor"         │
│  Source: "rule_based_capacity_optimizer"          │
│  Confidence: hardcoded 0.62-0.90                  │
│  Automation: BLOCKED (human-in-loop)              │
│  Feedback loop: NONE                              │
└─────────────────────────────────────────────────┘
```

### 4.2 Phase 1: ML-Enhanced Advisory (3 months)

**Goal:** Replace hardcoded scores with ML predictions while keeping human-in-loop governance.

#### Predictive ETAs

| Current | Target |
|---|---|
| `estimatedArrivalAt` is user-entered or copied from carrier | ML-predicted ETA based on historical transit times, mode, route, weather, terminal congestion |
| No ETA confidence | Predicted ETA ± confidence interval (e.g., "ETA 2026-07-02 14:00 ± 4h, 85% confidence") |

**Implementation:**
- Feature store: `TrackingEvent` timeline → extract features (leg duration, handover gaps, customs hold frequency, carrier historical delay rates)
- Model: Gradient Boosting (LightGBM/XGBoost) for regression of transit time per leg
- Data pipeline: Weekly batch retraining on last 12 months of events
- Output: Override `estimatedArrivalAt` with ML prediction + store `predictedArrivalAt` + `predictionConfidence` + `predictionModelVersion` in `TrackingShipment`
- API: New RPC `tracking.eta.prediction.read`

```prisma
model TrackingShipment {
  // ... existing fields ...
  predictedArrivalAt     DateTime?
  predictionConfidence  Float?          // 0-1
  predictionModelVersion String?
  predictionGeneratedAt  DateTime?
}
```

#### Anomaly Detection

| Current | Target |
|---|---|
| No anomaly detection | Real-time flagging of unusual shipment behavior (dwell time outliers, route deviation, event gaps) |

**Implementation:**
- Per-shipment event cadence monitoring (expected vs actual event intervals)
- Simple statistical model: rolling z-score of dwell times per location/mode
- Alert via existing `Notification` system when z-score > 3.0 or event gap > 2× historical median
- Severity classification: low (z-score 2-3), high (z-score 3-4), critical (z-score > 4 or missing events for 48h)

#### Capacity Forecasting

| Current | Target |
|---|---|
| Slot utilization advisory after the fact | Forecast slot demand 7-14 days ahead to prevent saturation |

**Implementation:**
- Historical reservation patterns per resource (day-of-week, month, seasonality)
- Simple time-series (Prophet or ARIMA) — low compute, interpretable
- Output: `capacityForecast` at `CapacityResource` level with expected utilization curve
- Advisory integration: Slot saturation warnings can reference forecast instead of only current utilization

### 4.3 Phase 2: Feedback Loop & Confidence Calibration (6 months)

**Goal:** Close the loop between recommendations, human decisions, and outcomes.

```
┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────┐
│ Advisory  │───►│ Human       │───►│ Outcome    │───►│ Training │
│ (ML)      │    │ Decision    │    │ (event     │    │ Pipeline │
│           │    │ (approve/   │    │  recorded) │    │          │
└──────────┘    │ reject)     │    └────────────┘    │ Model    │
                └──────────────┘                     │ Update   │
                                                      └──────────┘
```

**Mechanisms:**
1. **Decision → Outcome mapping**: Link approved advisory → subsequent events (e.g., slot was freed, exception was resolved). If outcome matches recommendation → positive signal.
2. **Confidence calibration**: Replace hardcoded scores with Platt scaling or isotonic regression on past recommendation/outcome pairs.
3. **Precision/Recall tracking**: Store every recommendation + outcome. Weekly report: `precision@k`, `recall@k`, `average precision` per recommendation type.
4. **Feature importance**: Log which features drove each recommendation (SHAP values) for audit and improvement.

### 4.4 Phase 3: Semi-Automation (12 months)

**Goal:** Allow advisory to auto-execute low-risk actions within configurable guardrails.

| Automation Level | Behavior | Confidence Threshold | Approval |
|---|---|---|---|
| `manual` (current) | Recommend only | N/A | Required |
| `supervised` | Auto-execute with real-time notification | ≥ 0.85 | Optional override |
| `autonomous` | Full execution | ≥ 0.95 | Post-hoc audit only |

**Governance model:**
- `Policy.automationAllowed` already exists in schemas — currently hardcoded `false`
- Org-level configuration per recommendation type:
  ```json
  {
    "tracking": {
      "sla_risk": { "level": "supervised", "confidenceThreshold": 0.85 },
      "exception_recovery": { "level": "manual" } // always human
    },
    "capacity": {
      "unused_capacity": { "level": "autonomous", "confidenceThreshold": 0.95 }
    }
  }
  ```
- Audit every auto-action with `ai_agent` actor type (currently defined but unused)
- Rollback capability: ability to revert auto-actions within a configurable window

### 4.5 Phase 4: LLM-Powered Natural Language Insights (18 months)

**Goal:** Add a conversational interface to the advisory system.

```
User: "Porque é que o contentor SAPTM-RAIL-042 está atrasado?"
System: "Análise de eventos indica:
         - Partida: 28 Jun 06:00 (dentro do prazo)
         - Handover em terminal: 29 Jun 14:00 (atraso de 8h — terminal congestionado)
         - Próxima ETA prevista: 01 Jul 18:00 ± 3h (ML, 78% confiança)
         Recomendação: Abrir exceção de atraso se não chegar até às 12h de hoje."
```

**Integration:**
- New MCP resource `tracking://analysis/{shipmentId}` returns natural-language summary
- LLM prompt uses structured data from `getShipmentDetail()` + `getAnalytics()` as context
- No RAG needed for operational data — it lives in PostgreSQL
- Rate-limited (cheapest model for simple "where is" queries, capable model for root-cause)

### 4.6 Evaluation Framework

#### ML Model Metrics (Phase 1+)

| Metric | Tracking (ETA) | Capacity (Forecast) | Anomaly |
|---|---|---|---|
| MAE | Hours ± prediction error | Utilization % error | N/A |
| RMSE | Robust to outliers | Same | N/A |
| Precision@k | % correct SLA risks | % correct saturation flags | % true anomalies |
| Recall@k | % detected SLA breaches | % detected saturation | % detected anomalies |
| F1 | Balanced | Balanced | Balanced |
| MAPE | Normalized error | N/A | N/A |
| AUC-ROC | For binary "will breach SLA" | For binary "will saturate" | For anomaly binary |

#### Business Metrics

| Metric | Current Baseline | Target (Phase 1) | Target (Phase 2-3) |
|---|---|---|---|
| Task completion rate (advisory → action) | Not tracked | 30% | 60% |
| Time from advisory → decision | Not tracked | < 4h | < 30min (supervised) |
| False positive rate (recommendations ignored) | Not tracked | < 40% | < 20% |
| SLA breach prediction accuracy | 0% (no prediction) | 70% | 85% |
| Capacity utilization improvement | 0% | +5% | +15% |
| Cost per AI task | $0 (no AI) | ~$0.002/task | ~$0.01/task (LLM) |

### 4.7 Security & Safety Gates

| Gate | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| Human-in-loop | Yes (required) | Yes (required) | Configurable | Configurable |
| Permission check | Existing RPC | Existing RPC | + auto-action audit | Same |
| Rate limiting | Per org | Per org + per model | Per org + per level | Per user |
| Prompt injection | N/A (no LLM) | N/A | N/A | Input sanitization |
| Model versioning | File/hash | Database record | Database + rollback | Database + A/B |
| Audit trail | Existing | + recommendation outcome | + auto-action audit | + LLM conversation |
| Rollback | N/A | N/A | Configurable window | Same |

### 4.8 Anti-Patterns to Avoid

| Anti-Pattern | Phase | Mitigation |
|---|---|---|
| Jumping from rule-based to autonomous without ML feedback loop | Any | Phase 3 only after Phase 2 confidence calibration passes gates |
| Using LLM for raw SQL/data queries (hallucination risk) | Phase 4 | Use MCP tools (structured reads) as context; LLM formats response only |
| Trusting hardcoded confidence scores | Phase 0→1 | Replace before putting in front of users as "AI" |
| Siloing advisory data from event bus | All | All advisory decisions already publish domain events — keep this |
| Ignoring tenant-specific patterns | Phase 1+ | Train per-tenant models or at least per-tenant calibration (multi-tenant logistics patterns differ by port vs rail) |

---

## Summary: Maturity Levels

| Capability | Current Maturity | Target (Phase 1) | Target (Phase 2) | Target (Phase 3-4) |
|---|---|---|---|---|
| Tracking Analytics | 🔵 Level 3 — Real KPIs from DB | 🔵 Level 3 | 🔵 Level 3 | 🔵 Level 3 |
| Advisory Recommendations | 🟡 Level 1 — Rule-based stubs | 🟢 Level 2 — ML-driven | 🟢 Level 3 — Calibrated + feedback | 🟢 Level 4 — Semi-autonomous |
| ETA Prediction | 🔴 Level 0 — Not present | 🟡 Level 1 — ML baseline | 🟢 Level 2 — Confident + interval | 🟢 Level 3 — Adaptive |
| Anomaly Detection | 🔴 Level 0 — Not present | 🟡 Level 1 — Statistical | 🟢 Level 2 — ML classification | 🟢 Level 3 — Predictive |
| Capacity Forecasting | 🔴 Level 0 — Not present | 🟡 Level 1 — Time-series | 🟢 Level 2 — ML forecast | 🟢 Level 3 — Prescriptive |
| Compliance Q&A | 🔴 Level 0 — Not present | 🟡 Level 1 — RAG prototype | 🟢 Level 2 — Production RAG | 🟢 Level 3 — Auto-compliance check |
| MCP Integration | 🔴 Level 0 — Not present | 🟢 Level 2 — Tracking + Capacity | 🟢 Level 3 — All domains | 🟢 Level 4 — Tool orchestration |
| Natural Language Insights | 🔴 Level 0 — Not present | 🔴 Level 0 | 🟡 Level 1 — Structured summaries | 🟢 Level 2 — Conversational |

**Legend:** 🔴 Not present / 🟡 Partial / 🔵 Good / 🟢 Excellent

---

*End of AI Engineering Audit. Next step: Review by Enterprise Architecture and Product departments for prioritisation.*
