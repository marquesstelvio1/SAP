# Flow: Incident Response

**Phase:** 10 — Execution Pipeline

---

## Purpose
Respond to production incidents quickly and systematically.

## Inputs
- Incident alert or report

## Outputs
- Incident resolved
- Root cause analysis
- Prevention measures

## Steps
1. **Detect** — Alert from monitoring, user report, or audit
2. **Triage** — Assess severity and impact
3. **Contain** — Isolate affected component (feature flag, rollback, block traffic)
4. **Diagnose** — Identify root cause
5. **Fix** — Implement remediation
6. **Verify** — Confirm fix in production
7. **Post-mortem** — Document within 5 days
8. **Prevent** — Implement preventive measures

## Checkpoints
- [ ] Incident severity assessed
- [ ] Containment action taken
- [ ] Root cause identified
- [ ] Fix deployed
- [ ] Post-mortem completed

## Severity Levels

| Level | Response | SLA |
|---|---|---|
| SEV1 | Full team | 15 min response, 1 hr fix |
| SEV2 | DevOps + relevant agent | 1 hr response, 4 hr fix |
| SEV3 | Next business day | 8 hr response |
| SEV4 | Next sprint | Normal process |

## Quality Gates
- Root cause documented
- Regression test added
- Preventive measures implemented
- Incident logged in `.ai/executions/`
