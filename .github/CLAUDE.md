# GitHub automation and release workflow instructions

Applies to `.github/**`.

- GHA-01: Treat workflow triggers, permissions, expressions, shell interpolation, artifacts, caches, secrets and OIDC as security-sensitive interfaces.
- GHA-02: Keep `permissions` least-privilege and pin external actions to reviewed immutable SHAs; validate fork and untrusted-input behavior.
- GHA-03: Preserve required CI gates and exact-head evidence. A skipped, quota-limited or unrelated-SHA job is not a pass.
- GHA-04: Keep deployment, release, signing and updater actions behind their existing protected-ref and owner gates; never enable a workflow to bypass approval.
- GHA-05: Retention workflows must default to dry-run and fail closed; protect production, open PR, incident and rollback references.
