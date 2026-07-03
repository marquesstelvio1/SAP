import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getSsoConfigInputSchema,
  getSsoConfigMetadata,
  getSsoConfigOutputSchema,
  ssoConfigSchema,
  testSsoConfigInputSchema,
  testSsoConfigMetadata,
  testSsoConfigOutputSchema,
  updateSsoConfigInputSchema,
  updateSsoConfigMetadata,
  updateSsoConfigOutputSchema,
} from "../dist/index.js";

// ──────────────────────────────────────────────
// Work Stream D: SSO Config Schema Validation
// ──────────────────────────────────────────────

describe("sso.config.get RPC contract", () => {
  it("metadata defines query with sensitive audit", () => {
    assert.equal(getSsoConfigMetadata.name, "sso.config.get");
    assert.equal(getSsoConfigMetadata.kind, "query");
    assert.equal(getSsoConfigMetadata.auth, "session");
    assert.equal(getSsoConfigMetadata.organizationRequired, true);
    assert.deepEqual(getSsoConfigMetadata.permissions, ["tenant.manage"]);
    assert.equal(getSsoConfigMetadata.audit, "standard");
    assert.equal(getSsoConfigMetadata.idempotency, "none");
  });

  it("ssoConfigSchema validates a complete SSO config", () => {
    const config = ssoConfigSchema.parse({
      id: "sso_001",
      organizationId: "org_port_rail",
      domain: "saptm.pt",
      idpMetadataUrl: "https://idp.example.com/metadata",
      idpEntityId: "https://idp.example.com/entity",
      idpSsoUrl: "https://idp.example.com/sso",
      idpCertificate: "MIID...",
      jitProvisioning: true,
      jitDefaultRoleId: "role_operator",
      active: true,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });

    assert.equal(config.id, "sso_001");
    assert.equal(config.domain, "saptm.pt");
    assert.equal(config.jitProvisioning, true);
    assert.equal(config.active, true);
  });

  it("ssoConfigSchema validates config with null fields", () => {
    const config = ssoConfigSchema.parse({
      id: "sso_002",
      organizationId: "org_port_rail",
      domain: null,
      idpMetadataUrl: null,
      idpEntityId: null,
      idpSsoUrl: null,
      idpCertificate: null,
      jitProvisioning: false,
      jitDefaultRoleId: null,
      active: false,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    });

    assert.equal(config.domain, null);
    assert.equal(config.jitProvisioning, false);
    assert.equal(config.active, false);
  });

  it("rejects ssoConfigSchema with missing required fields", () => {
    assert.throws(() => {
      ssoConfigSchema.parse({ id: "sso_001" });
    }, /Required/);

    assert.throws(() => {
      ssoConfigSchema.parse({
        id: "sso_001",
        organizationId: "org_port_rail",
        domain: "saptm.pt",
        idpMetadataUrl: null,
        idpEntityId: null,
        idpSsoUrl: null,
        idpCertificate: null,
        jitProvisioning: false,
        jitDefaultRoleId: null,
        active: false,
        // no createdAt/updatedAt
      });
    }, /Required/);
  });

  it("getSsoConfigInputSchema validates optional organizationId", () => {
    const input = getSsoConfigInputSchema.parse({});
    assert.equal(input.organizationId, undefined);

    const explicitInput = getSsoConfigInputSchema.parse({ organizationId: "org_001" });
    assert.equal(explicitInput.organizationId, "org_001");
  });

  it("getSsoConfigOutputSchema validates config nullable", () => {
    const withConfig = getSsoConfigOutputSchema.parse({
      config: {
        id: "sso_001",
        organizationId: "org_port_rail",
        domain: "saptm.pt",
        idpMetadataUrl: null,
        idpEntityId: null,
        idpSsoUrl: null,
        idpCertificate: null,
        jitProvisioning: false,
        jitDefaultRoleId: null,
        active: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    });

    assert.ok(withConfig.config !== null);
    assert.equal(withConfig.config.active, true);

    const withoutConfig = getSsoConfigOutputSchema.parse({ config: null });
    assert.equal(withoutConfig.config, null);
  });
});

// ──────────────────────────────────────────────
// sso.config.update
// ──────────────────────────────────────────────

describe("sso.config.update RPC contract", () => {
  it("metadata defines mutation with sensitive audit and idempotency", () => {
    assert.equal(updateSsoConfigMetadata.name, "sso.config.update");
    assert.equal(updateSsoConfigMetadata.kind, "mutation");
    assert.equal(updateSsoConfigMetadata.auth, "session");
    assert.equal(updateSsoConfigMetadata.organizationRequired, true);
    assert.deepEqual(updateSsoConfigMetadata.permissions, ["tenant.manage"]);
    assert.equal(updateSsoConfigMetadata.audit, "sensitive");
    assert.equal(updateSsoConfigMetadata.idempotency, "required");
    assert.equal(updateSsoConfigMetadata.observability.criticality, "medium");
  });

  it("updateSsoConfigInputSchema validates all optional fields", () => {
    const fullInput = updateSsoConfigInputSchema.parse({
      domain: "saptm.pt",
      idpMetadataUrl: "https://idp.example.com/metadata",
      idpEntityId: "https://idp.example.com/entity",
      idpSsoUrl: "https://idp.example.com/sso",
      idpCertificate: "MIID...",
      jitProvisioning: true,
      jitDefaultRoleId: "role_operator",
      active: true,
      idempotencyKey: "idem_sso_update_001",
    });

    assert.equal(fullInput.domain, "saptm.pt");
    assert.equal(fullInput.jitProvisioning, true);
    assert.equal(fullInput.active, true);
  });

  it("updateSsoConfigInputSchema rejects with short idempotencyKey", () => {
    assert.throws(() => {
      updateSsoConfigInputSchema.parse({
        idempotencyKey: "short",
      });
    }, /too_small/);

    assert.throws(() => {
      updateSsoConfigInputSchema.parse({
        idempotencyKey: "",
      });
    }, /too_small/);
  });

  it("updateSsoConfigInputSchema accepts partial update", () => {
    const partialInput = updateSsoConfigInputSchema.parse({
      domain: "new-domain.pt",
      idempotencyKey: "idem_sso_partial_001",
    });

    assert.equal(partialInput.domain, "new-domain.pt");
    assert.equal(partialInput.jitProvisioning, undefined);
    assert.equal(partialInput.active, undefined);
  });

  it("updateSsoConfigOutputSchema validates full output with audit and outbox", () => {
    const output = updateSsoConfigOutputSchema.parse({
      config: {
        id: "sso_001",
        organizationId: "org_port_rail",
        domain: "saptm.pt",
        idpMetadataUrl: "https://idp.example.com/metadata",
        idpEntityId: "https://idp.example.com/entity",
        idpSsoUrl: "https://idp.example.com/sso",
        idpCertificate: "MIID...",
        jitProvisioning: true,
        jitDefaultRoleId: "role_operator",
        active: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
      idempotency: { key: "idem_sso_update_001", replayed: false },
      audit: {
        action: "sso.config.updated",
        subjectType: "sso_config",
        subjectId: "sso_001",
      },
      outbox: {
        eventType: "sso.config.updated",
        aggregateType: "sso_config",
        aggregateId: "sso_001",
      },
    });

    assert.equal(output.config.domain, "saptm.pt");
    assert.equal(output.idempotency.replayed, false);
    assert.equal(output.audit.action, "sso.config.updated");
    assert.equal(output.outbox.eventType, "sso.config.updated");
  });

  it("rejects updateSsoConfigOutputSchema with missing idempotency", () => {
    assert.throws(() => {
      updateSsoConfigOutputSchema.parse({
        config: {
          id: "sso_001",
          organizationId: "org_port_rail",
          domain: null,
          idpMetadataUrl: null,
          idpEntityId: null,
          idpSsoUrl: null,
          idpCertificate: null,
          jitProvisioning: false,
          jitDefaultRoleId: null,
          active: false,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
        audit: {
          action: "sso.config.updated",
          subjectType: "sso_config",
          subjectId: "sso_001",
        },
        outbox: {
          eventType: "sso.config.updated",
          aggregateType: "sso_config",
          aggregateId: "sso_001",
        },
      });
    }, /Required/);
  });
});

// ──────────────────────────────────────────────
// sso.config.test
// ──────────────────────────────────────────────

describe("sso.config.test RPC contract", () => {
  it("metadata defines mutation with no idempotency", () => {
    assert.equal(testSsoConfigMetadata.name, "sso.config.test");
    assert.equal(testSsoConfigMetadata.kind, "mutation");
    assert.equal(testSsoConfigMetadata.auth, "session");
    assert.equal(testSsoConfigMetadata.organizationRequired, true);
    assert.deepEqual(testSsoConfigMetadata.permissions, ["tenant.manage"]);
    assert.equal(testSsoConfigMetadata.audit, "standard");
    assert.equal(testSsoConfigMetadata.idempotency, "none");
  });

  it("testSsoConfigInputSchema validates all required fields", () => {
    const input = testSsoConfigInputSchema.parse({
      domain: "saptm.pt",
      idpSsoUrl: "https://idp.example.com/sso",
      idpEntityId: "https://idp.example.com/entity",
    });

    assert.equal(input.domain, "saptm.pt");
    assert.equal(input.idpSsoUrl, "https://idp.example.com/sso");
    assert.equal(input.idpEntityId, "https://idp.example.com/entity");
  });

  it("testSsoConfigInputSchema rejects missing domain", () => {
    assert.throws(() => {
      testSsoConfigInputSchema.parse({
        idpSsoUrl: "https://idp.example.com/sso",
        idpEntityId: "https://idp.example.com/entity",
      });
    }, /Required/);
  });

  it("testSsoConfigInputSchema rejects invalid URL", () => {
    assert.throws(() => {
      testSsoConfigInputSchema.parse({
        domain: "saptm.pt",
        idpSsoUrl: "not-a-url",
        idpEntityId: "https://idp.example.com/entity",
      });
    }, /Invalid url/);
  });

  it("testSsoConfigInputSchema rejects non-HTTPS URL", () => {
    assert.throws(() => {
      testSsoConfigInputSchema.parse({
        domain: "saptm.pt",
        idpSsoUrl: "http://idp.example.com/sso",
        idpEntityId: "https://idp.example.com/entity",
      });
    }, /Invalid url/);
  });

  it("testSsoConfigOutputSchema validates success result", () => {
    const output = testSsoConfigOutputSchema.parse({
      success: true,
      message: "Configuracao SSO testada com sucesso",
      details: {
        statusCode: 200,
        responseTimeMs: 245,
      },
    });

    assert.equal(output.success, true);
    assert.ok(output.message.length > 0);
    assert.equal(output.details.statusCode, 200);
  });

  it("testSsoConfigOutputSchema validates failure result without details", () => {
    const output = testSsoConfigOutputSchema.parse({
      success: false,
      message: "Falha na conexao ao IdP",
    });

    assert.equal(output.success, false);
    assert.equal(output.details, undefined);
  });

  it("rejects testSsoConfigOutputSchema with missing message", () => {
    assert.throws(() => {
      testSsoConfigOutputSchema.parse({
        success: true,
      });
    }, /Required/);
  });
});
