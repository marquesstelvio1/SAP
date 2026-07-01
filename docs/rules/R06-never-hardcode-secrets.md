# Rule R06: Never Hardcode Secrets

**Purpose:** Prevent credential leaks and security incidents.

**Allowed:**
- Environment variables for all secrets
- GitHub Secrets for CI/CD
- External Secrets Operator for Kubernetes
- `.env.example` with placeholder values

**Forbidden:**
- Hardcoded passwords, API keys, or tokens in source code
- Committing `.env` files
- Secrets in Dockerfiles or build args
- Secrets in CI workflow files (use GitHub Secrets)
- Logging secrets in plaintext

**Validation:**
- Secret scanning pre-commit (git hooks)
- Trivy scan for container secrets
- Code review must verify no secrets in code
- Regular audit of `.env.example` for completeness

**Failure Consequences:**
- Security incident
- Secret rotation required
- Potential data breach

**Severity:** critical
