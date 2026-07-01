# Skill: audit-security

**Mission:** Perform comprehensive security audit focusing on OWASP Top 10 and supply chain security.

**Inputs:**
- Repository source code
- CI/CD configuration
- Docker/infrastructure configuration

**Outputs:**
- Security diagnostic report
- Vulnerability list with CVSS scores
- Remediation recommendations

**Workflow:**
1. Review authentication implementation
2. Review authorization enforcement
3. Review API security (CSRF, CORS, headers)
4. Review dependency vulnerabilities
5. Review container security
6. Review secret management
7. Generate report with CVSS-scored findings

**Validation:**
- All OWASP Top 10 categories checked
- CVSS scores for all findings
- Remediation steps for each finding

**Deliverables:**
- Security diagnostic section in docs/diagnostics/
- docs/standards/security.md updates
