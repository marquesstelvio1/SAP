# Flow: Discovery

**Phase:** 10 — Execution Pipeline

---

## Purpose
Complete repository understanding before making changes.

## Inputs
- Repository files
- Configuration
- Source code

## Outputs
- Repository analysis document
- Stack inventory
- Architecture overview

## Steps
1. Inspect root config (package.json, turbo.json, tsconfig, biome.json)
2. Inspect app directories (apps/api, apps/web)
3. Inspect packages (packages/*)
4. Inspect database schema
5. Inspect CI/CD configuration
6. Inspect tests
7. Inspect infrastructure (Docker, K8s)
8. Generate repository analysis

## Checkpoints
- [ ] All package.json files read
- [ ] Prisma schema analyzed
- [ ] CI workflows understood
- [ ] Docker configuration documented
- [ ] All source directories inventoried

## Quality Gates
- Complete stack inventory
- All dependencies cataloged
- Architecture patterns identified
- Risks and observations noted
