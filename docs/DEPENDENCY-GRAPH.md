# Monorepo Dependency Graph

<!-- Audited: Session 138 (2026-04-11) -->

## Package Topology

```
cannaguide-2025 (workspace root)
|
+-- packages/
|   +-- @cannaguide/ai-core      Pure AI types, provider configs, Zod schemas, lazy ML loaders
|   |   deps: @google/genai, zod
|   |   optionalDeps: @xenova/transformers, @mlc-ai/web-llm, onnxruntime-web
|   |   exports: "." (types + providers + schemas), "./ml" (lazy ML loaders)
|   |
|   +-- @cannaguide/ui            Design system tokens, Tailwind preset, CSS custom properties
|       deps: (none)
|       exports: "." (theme types), "./tailwind-preset" (CJS), "./tokens.css" (CSS)
|
+-- apps/
    +-- @cannaguide/web           Main PWA (React 19 + Vite 7)
    |   deps: @cannaguide/ai-core, @cannaguide/ui
    |   117 service files, 25 hooks, 9 themes
```

## Dependency Direction

```
@cannaguide/web ──imports──> @cannaguide/ai-core    (3 TS imports: types + providers)
@cannaguide/web ──imports──> @cannaguide/ui          (CSS/Tailwind only, 0 TS imports)

@cannaguide/ai-core    X     @cannaguide/web         (no reverse imports -- correct)
@cannaguide/ai-core    X     @cannaguide/ui          (no cross-package -- correct)
@cannaguide/ui         X     @cannaguide/ai-core     (no cross-package -- correct)
```

## ESLint Enforcement

| Rule                                   | Scope               | Purpose                                                                          |
| -------------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| `import/no-cycle` (error, maxDepth: 3) | All `*.ts`, `*.tsx` | Prevents circular imports within and across packages                             |
| `no-restricted-imports` (error)        | All `*.ts`, `*.tsx` | Blocks `**/packages/*/src/*` deep imports -- forces `@cannaguide/*` entry points |

## TurboRepo Pipeline Dependencies

```
build       --> ^build (packages build first, then apps)
build:gh    --> ^build (same as build, GitHub Pages base path)
dev         --> ^build (packages must be built before dev server)
test        --> ^build (packages must be built before tests)
test:e2e    --> build  (full web build required for E2E)
typecheck   --> ^build (packages must be built for type resolution)
lint        --> ^build (packages must be built for import resolution)
```

## Cross-Package Import Inventory

### apps/web --> @cannaguide/ai-core (3 imports)

| File                            | Imports                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `services/aiConsentService.ts`  | `type AiProvider`                                                                            |
| `services/aiProviderService.ts` | `PROVIDER_CONFIGS`, `KEY_ROTATION_WINDOW_MS`, `isKeyRotationDue`, `isValidProviderKeyFormat` |
| `services/aiProviderService.ts` | `type AiProvider`, `type AiProviderConfig`, `type AiProviderKeyMetadata`                     |

### apps/web --> @cannaguide/ui (0 TS imports)

CSS/Tailwind integration only:

- `tailwind.config.cjs` references `@cannaguide/ui/tailwind-preset`
- `styles.css` imports `@cannaguide/ui/tokens.css`

## Audit Results (Session 62)

| Check                               | Result  |
| ----------------------------------- | ------- |
| Import cycles                       | 0 found |
| Cross-package boundary violations   | 0 found |
| Reverse imports (packages --> apps) | 0 found |
