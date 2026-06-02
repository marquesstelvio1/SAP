# Approval Matrix

| Scenario | AI may proceed | Human approval required |
| --- | --- | --- |
| Docs only change | yes | no |
| Non-critical UI improvement | yes | no |
| Backend refactor with no contract change | yes | recommended |
| API contract change | no | yes |
| Auth, RBAC, or session behavior change | no | yes |
| Infra or pipeline permission change | no | yes |
| Hotfix on production incident | limited | yes |

