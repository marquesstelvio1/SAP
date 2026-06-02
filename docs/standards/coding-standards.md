# Coding Standards

## Global

- Prefer explicit types and contracts.
- Avoid `any`.
- Validate input at boundaries.
- Preserve backward compatibility unless a migration is approved.
- Emit logs and metrics for critical workflows.
- Keep domain logic out of presentation layers.

## AI-specific

- Never apply a change without reading impacted context first.
- Never skip tests for changed critical paths.
- Never invent dependencies, APIs, or contracts without evidence.
- Always document assumptions and unresolved risks.

