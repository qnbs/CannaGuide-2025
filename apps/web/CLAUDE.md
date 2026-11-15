# Web application instructions

Applies to `apps/web/**`. Root `CLAUDE.md` and `AGENTS.md` remain binding global contracts; this file adds web-specific constraints only.

- WEB-16: BYOK provider keys are configured through Settings and use the existing `services/aiFacade.ts` -> `services/aiService.ts` -> `services/aiProviderService.ts` flow. Do not read provider keys in UI components or route around the shared facade.

- WEB-01: Use the shared `AiDisclaimer` component for every UI surface rendering AI output. Use its `medical` prop for health or diagnosis surfaces; do not add inline replacement copy.
- WEB-02: User-visible text must use the established i18n system. Preserve parity across the five supported locale resources and add the relevant tests; do not infer support for a new locale from one page.
- WEB-03: Redux Toolkit (`stores/store.ts`, `stores/slices/*`) owns persisted domain state. Zustand (`stores/use*Store.ts`, `sensorStore.ts`) owns UI-facing state; these stores are not all transient, and the earlier "never persisted" description was too broad: `useIotStore` persists selected IoT MQTT settings in localStorage, while `sensorStore` is in-memory. Cross through `services/uiStateBridge.ts` (`getReduxSnapshot`, `subscribeToRedux`, `dispatchToRedux`) only. IndexedDB is primary; localStorage is limited to small non-secret flags, with the existing IoT MQTT config exception. Inspect each store's persistence middleware and `partialize()` rules before changing these boundaries.
- WEB-04: Respect consent, local-only and offline behavior at each network boundary. A local model or cached asset does not imply zero egress; inspect fetch policy, service-worker behavior and user mode before making privacy claims.
- WEB-05: Prefer the documented scoped verification commands from root `AGENTS.md`; never launch unfiltered Turbo work on the low-memory host. Heavy browser/native suites belong in CI.
- WEB-06: Follow the repository file-size and lint gates; refactor coherent modules rather than adding broad suppressions.
- WEB-07: Keep react and react-dom versions aligned; apps/web/package.json and pnpm-lock.yaml are canonical.
- WEB-08: For shared-module Vitest mocks use vi.hoisted() for stable references and vi.resetModules() plus dynamic import in beforeEach when import-time binding requires it; see services/aiResponseValidation.test.ts and services/growLogRagService.test.ts.
- WEB-17: If unrelated full-suite failures appear intermittent, rerun the affected file in isolation to confirm whether the regression reproduces.
- WEB-09: The only known filtered TS2719 is at stores/store.ts; the same diagnostic elsewhere is a real type error and must not be suppressed.
- WEB-10: Cloud calls follow services/aiFacade.ts -> services/aiService.ts -> services/aiProviderService.ts for Gemini, OpenAI, Claude and Grok, with rate limits and Zod-validated output; orchestration and prompt safety live in services/ai/.
- WEB-11: Local inference uses the WebLLM -> Transformers.js -> heuristics fallback and caches inference in IndexedDB; model and artifact downloads are separate network requests and must follow consent and Local-Only policy.
- WEB-12: Heavy web work goes through WorkerBus; worker implementations are dispatched through services/worker-bus/ and are not invoked directly. Preserve backpressure, abort and transfer contracts.
- WEB-13: User-visible strings use i18n.ts and locale resources en, de, es, fr and nl; run check:i18n, check:i18n-usage and lint:i18n for new text surfaces.
- WEB-14: Keep new or heavily changed files within 200-700 LOC using check:file-budget; split oversized views into components/hooks and services into thematic modules.
- WEB-15: Run the web app from apps/web with the scoped Vite command; root-wide dev invokes the desktop workspace and requires Rust/Tauri.
