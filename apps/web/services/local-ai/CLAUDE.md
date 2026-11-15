# Local AI runtime instructions

Applies to `apps/web/services/local-ai/**`.

- LOCAL-AI-01: Distinguish local inference from model/provider downloads and other network requests. Verify the fetch policy and consent/mode guards before claiming local-only or offline behavior.
- LOCAL-AI-02: Preserve the user's Local-Only choice across model routing, workers, caches, service workers and mode changes; abort or invalidate in-flight work when the mode changes.
- LOCAL-AI-03: Tie model readiness claims to actual loaded artifacts and runtime health, not merely a catalog entry or cached partial download.
- LOCAL-AI-04: Release GPU, worker, object URL, stream and cache resources on success, abort, timeout and failure. Add tests for cleanup and stale completions.
- LOCAL-AI-05: Keep fallback behavior explicit and truthful; do not silently route private input to a cloud provider.
- LOCAL-AI-06: The documented local fallback is WebLLM -> Transformers.js -> heuristics, with inference cached in IndexedDB. Verify model/artifact download egress separately from local inference and preserve consent and Local-Only checks.
