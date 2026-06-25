# Rule R05: Always Create Semantic Commits

**Purpose:** Maintain readable, automated changelog generation.

**Allowed:**
Conventional Commits format:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Formatting, linting
- `refactor:` — Code restructuring
- `test:` — Adding/updating tests
- `chore:` — Build, CI, dependencies
- `perf:` — Performance improvement
- `security:` — Security fix

**Forbidden:**
- Vague commit messages ("fix stuff", "updates", "changes")
- Commits that mix unrelated changes
- Commits with no description
- Force-pushing to shared branches without coordination

**Validation:**
- Commit message format enforced by git hooks (optional)
- PR titles must follow semantic format
- Changelog generated from commit history

**Failure Consequences:**
- Changelog gaps
- Difficulty in release note generation

**Severity:** warning
