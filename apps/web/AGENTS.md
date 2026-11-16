# Web application instructions for Codex

Applies to `apps/web/**` and is additive to the root `AGENTS.md`. The root safety, lease, signing, hook, privacy, release and CI rules always apply.

- WEB-CODEX-01: For user-visible AI output, reuse `components/common/AiDisclaimer.tsx`; use `medical` for health or diagnosis content.
- WEB-CODEX-02: User-facing strings require the established translation keys and five-locale parity checks.
- WEB-CODEX-03: Keep web verification scoped with the root `pnpm verify`, `pnpm verify:test` and `pnpm verify:lint` entrypoints; do not run unfiltered Turbo tasks locally.
- WEB-CODEX-04: Before changing web persistence or cross-tab behavior, inspect every reader/writer and preserve user data; follow the deeper contract in `services/db/AGENTS.md`.
- WEB-CODEX-05: Keep react and react-dom versions aligned; apps/web/package.json and pnpm-lock.yaml are canonical.
- WEB-CODEX-06: For suites mocking shared modules (`@/services/sentryService`, `@/services/local-ai`, etc.), use vi.hoisted() for stable references and vi.resetModules() plus dynamic import in beforeEach when the module binds mocks at import time; see services/aiResponseValidation.test.ts and services/growLogRagService.test.ts.
- WEB-CODEX-11: If unrelated full-suite failures appear intermittent, rerun the affected file in isolation to confirm whether the regression reproduces.
- WEB-CODEX-07: The only known filtered TS2719 is at stores/store.ts; the same diagnostic elsewhere is a real type error and must not be suppressed.
- WEB-CODEX-08: Redux Toolkit owns persisted domain state; Zustand is generally for transient UI state, with `useIotStore` as an explicit persistence exception for MQTT broker settings. That store persists only `encryptedPassword` (never the runtime plaintext `password`) with its broker URL, username, topic prefix and enabled flag under `cannaguide-iot-settings`. Keep the existing encrypted credential behavior intact. Cross Redux and Zustand only through `services/uiStateBridge.ts`; persist domain data through IndexedDB, and use localStorage only for small flags or this documented IoT settings exception.
- WEB-CODEX-09: Keep new or heavily changed files within 200-700 LOC; run check:file-budget and split oversized modules before merge.
- WEB-CODEX-10: Route heavy web work through WorkerBus; do not invoke worker implementations directly. Keep the promise-based dispatcher, priority queue, retry, AbortController cancellation, backpressure and transferable zero-copy message contracts intact. Do not combine automatic retries with transferred buffers: the current dispatcher reuses payload/transfer lists after postMessage detaches them; that combination is unsupported until fresh payloads per attempt are implemented and tested.

- WEB-CODEX-12: For web-only development, run `cd apps/web && pnpm run dev --host 127.0.0.1`; the base path is `/CannaGuide-2025/` at port 5173. Use `cd apps/web && pnpm run dev --host 0.0.0.0` only when intentionally exposing the server to a trusted LAN. Production preview uses `pnpm run build` then `pnpm run preview` on port 4173.
- WEB-CODEX-13: Playwright E2E and full browser suites run in CI only; do not run them locally.
- WEB-CODEX-14: The optional IoT mock is `node docker/iot-mocks/src/server.mjs` on port 3001.
