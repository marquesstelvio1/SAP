# Resource Governance

## Purpose

Resource governance sets hard namespace budgets before business modules are deployed. It prevents
runaway workloads from consuming cluster capacity and makes every scale decision explicit.

## Application Namespace Budget

| Environment | CPU requests | CPU limits | Memory requests | Memory limits | Pods | Storage |
| --- | --- | --- | --- | --- | --- | --- |
| Base | `4` | `16` | `8Gi` | `20Gi` | `20` | `80Gi` |
| Staging | `2` | `8` | `4Gi` | `10Gi` | `10` | `40Gi` |
| Production | `8` | `32` | `16Gi` | `40Gi` | `40` | `160Gi` |

The application quota covers API, Web, backup CronJob, ingress, ConfigMaps, Secrets, Services, and
PVC consumption.

## Observability Budget

The observability namespace has a dedicated `ResourceQuota` because Prometheus, Grafana,
Alertmanager, and the OTel Collector have different memory and storage behavior from application
workloads.

| Budget | Value |
| --- | --- |
| CPU requests | `2` |
| CPU limits | `6` |
| Memory requests | `4Gi` |
| Memory limits | `8Gi` |
| Pods | `12` |
| Storage | `80Gi` |

## LimitRange Defaults

Every SAPTM namespace has a `LimitRange` that applies:

- default container requests and limits when a workload omits them;
- minimum container request size to avoid unschedulable tiny workloads;
- maximum container limit size to prevent unreviewed large pods;
- maximum limit-to-request ratio to reduce noisy-neighbor risk;
- PVC minimum and maximum storage bounds.

## Production Rules

- Do not increase production quotas without release approval and capacity evidence.
- Do not deploy a new workload class unless its requests, limits, HPA behavior, and quota impact are documented.
- Do not remove `LimitRange` defaults to bypass missing workload resources.
- Treat quota exhaustion as a capacity incident, not as an application bug.
- Review quotas after adding workers, queues, analytics jobs, or AI inference workloads.

## Acceptance Criteria

- Application overlays apply `ResourceQuota` and `LimitRange`.
- Staging and production use different quota budgets.
- Observability has an isolated quota and limit range.
- Observability deployments are compatible with SAPTM admission hardening.
- Platform CI runs `pnpm validate:resource-governance`.
