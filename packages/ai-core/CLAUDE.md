# AI core package instructions

Applies to `packages/ai-core/**`.

- AI-CORE-01: Keep domain schemas, provider contracts and runtime adapters consistent; update validation and tests with contract changes.
- AI-CORE-02: Do not infer provider capability or fallback availability from types alone; verify runtime routing and privacy boundaries in the web integration.
- AI-CORE-03: Keep package boundaries explicit. Avoid importing app-only state or browser UI into shared domain modules.
- AI-CORE-04: Preserve truthful AI disclaimers at rendering surfaces; this package does not replace the shared UI disclaimer component.
- AI-CORE-05: The web cloud path is aiFacade -> aiService -> aiProviderService (Gemini, OpenAI, Claude and Grok); keep provider contracts and Zod output validation aligned with that integration.
