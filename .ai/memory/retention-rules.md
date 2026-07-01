# Memory Retention Rules

## Retention Periods

| Memory Type | Retention | Cleanup |
|---|---|---|
| Decision Log | Permanent | Never |
| Approved Patterns | Permanent | Never |
| Project Conventions | Permanent | Never |
| Design Tokens | Permanent | Never |
| ADRs | Permanent | Never |
| Release Reports | 2 years | After 2 years |
| Execution Reports | 1 year | After 1 year |
| Pipeline States | 90 days | After 90 days |

## Cleanup Triggers

- Monthly automated cleanup of expired reports
- Manual cleanup on request
- Pre-release cleanup of pipeline states

## Archival

Old reports are archived to `.ai/reports/archive/` before deletion.

## Critical Rule

NEVER delete:
- Decision logs
- ADRs
- Approved patterns
- Conventions
- Design tokens
