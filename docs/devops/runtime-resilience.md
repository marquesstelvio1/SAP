# Runtime Resilience

## Purpose

Runtime resilience defines the minimum high-availability posture for SAPTM API and Web workloads
before business modules are introduced.

## Controls

| Control | API | Web |
| --- | --- | --- |
| Rolling update | `maxUnavailable: 0`, `maxSurge: 1` | `maxUnavailable: 0`, `maxSurge: 1` |
| HPA | CPU 70%, memory 80% | CPU 70%, memory 80% |
| Base replicas | 2 to 6 | 2 to 6 |
| Staging replicas | 1 to 2 | 1 to 2 |
| Production replicas | 3 to 10 | 3 to 10 |
| PDB | Base `minAvailable: 1`, production `minAvailable: 2` | Base `minAvailable: 1`, production `minAvailable: 2` |
| Distribution | Spread across `kubernetes.io/hostname` | Spread across `kubernetes.io/hostname` |

## Production Dependencies

- Kubernetes metrics-server or equivalent must be installed for HPA.
- Cluster nodes must have enough capacity for production minimum replicas.
- Pod disruption budgets must be validated before planned node maintenance.
- Readiness probes must stay dependency-aware so HPA and rollouts do not route traffic to unhealthy pods.
- ResourceQuota budgets must allow planned HPA maximum replicas plus rolling-update surge.

## Production Rules

- Do not reduce production API or Web minimum replicas below `3` without release approval.
- Do not disable PDBs during normal maintenance.
- Do not deploy business-critical modules without reviewing HPA targets against real traffic.
- Treat repeated HPA max-replica saturation as a capacity incident.
- Treat quota exhaustion during scale-out as capacity planning failure.

## Acceptance Criteria

- API and Web have HPA manifests.
- API and Web have PDB manifests.
- Production overlays set higher HPA and PDB thresholds than staging.
- Deployments spread pods across nodes when possible.
- Release gate requires capacity and disruption evidence.
- ResourceQuota limits are aligned with HPA maximums.
