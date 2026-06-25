# Rule R04: Always Update Documentation

**Purpose:** Keep documentation synchronized with code reality.

**Allowed:**
- Updating AGENTS.md when architecture changes
- Updating RPC contract docs when operations change
- Updating API_CONTRACTS.md when contracts change
- Updating diagnostics when implementing fixes

**Forbidden:**
- Merging code changes without corresponding doc updates
- Leaving TODO markers in docs without tracking as issues
- Documentation that contradicts actual code behavior

**Validation:**
- CI includes `validate-doc-freshness.mjs` check
- Code review must verify doc changes match code changes
- Documentation drift detected automatically

**Failure Consequences:**
- PR blocked by doc freshness check
- Documentation debt accumulates

**Severity:** warning
