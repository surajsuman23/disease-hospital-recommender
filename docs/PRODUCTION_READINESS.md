# Production readiness

Readiness is a set of release gates, not a defensible percentage.

| Area                                     | Current state                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| Independent source and application       | Separate repository, frontend, backend and deployment                                         |
| API contracts                            | Versioned routes, shared strict schemas, OpenAPI, structured errors                           |
| Inference reproducibility                | Versioned artifact, dataset digest, training seed and runtime metadata                        |
| Model consistency                        | Python/backend parity for every binary feature pattern                                        |
| Automated verification                   | API, frontend, model and Python tests; type checking and CI workflow                          |
| Dependency management                    | npm lockfile, pinned ML runtime, dependency audit and update configuration                    |
| Input protection                         | Body-size limit, coordinate validation, unknown-field rejection, same-origin browser requests |
| Privacy                                  | No prediction persistence; payloads and coordinates excluded from application logs            |
| Delivery                                 | Production frontend and API bundles, Node and Worker adapters                                 |
| Operations                               | Health/readiness routes, request IDs, optional safe logs, shutdown and timeout handling       |
| Container                                | Non-root Docker and Compose; CI build, health and load checks (see exact commit result)       |
| Abuse control                            | Atomic aggregate D1 request budget in hosted Worker; local fallback in Node                   |
| Clinical suitability                     | NOT READY: arbitrary synthetic labels, no clinical validation                                 |
| Independent security review              | Not completed                                                                                 |
| Sustained load and failure testing       | Bounded local smoke/short-soak and API failure tests; sustained capacity still open           |
| Cross-browser/accessibility audit        | Automated Chromium, Firefox, WebKit, mobile and axe checks in CI; manual audit still open     |
| Monitoring, alerts and on-call ownership | Scheduled GitHub availability checks; paging, SLOs and operator ownership remain open         |

The public release is suitable for demonstrating the software architecture with fictional data. It is not ready to accept patient records or make medical decisions. Replacing synthetic data, adding authentication or introducing persistence changes the risk and requires a separate design review.
