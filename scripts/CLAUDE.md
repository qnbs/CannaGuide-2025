# Repository script instructions

Applies to `scripts/**`.

- SCRIPT-01: Preserve argument validation, exit codes, signal forwarding and cleanup for child processes; test failure paths as well as success.
- SCRIPT-02: Verification scripts must use installed local tools and validated dependency state; never add an implicit install or lifecycle-script path to a hook.
- SCRIPT-03: Retention and cleanup scripts fail closed by immutable resource ID and current owner/state. Dry-run is the default; UNKNOWN, active, production and rollback-dependent resources are never deleted.
- SCRIPT-04: Keep scripts deterministic and idempotent where they mutate state. Print redacted evidence, not secrets, personal identity or user payloads.
