# Session Activity Review -- 2026-03-30

## Monorepo Refactoring: Full Source Migration + ML Isolation

### Objective

Isolate multi-gigabyte ML dependencies (`@xenova/transformers`, `@mlc-ai/web-llm`, `onnxruntime-web`) from the frontend build to enable fast DevContainer boot and clean workspace separation.

### Phases Completed

#### Phase 3: ai-core ML Dependencies

- Added ML libs as `optionalDependencies` in `@cannaguide/ai-core`
- Created `packages/ai-core/src/ml.ts` with lazy async loaders
- Moved `@google/genai` from root to ai-core
- Bumped ai-core to v0.3.0 with `./ml` sub-path export

#### Phase 4: apps/web Package

- Created `apps/web/package.json` (`@cannaguide/web`)
- All frontend dependencies (React, Vite, Tailwind, Radix, etc.)
- Workspace dependency: `"@cannaguide/ai-core": "*"`

#### Phase 5: DevContainer Optimization

- Updated `.devcontainer/setup.sh` with workspace-filtered install
- `--no-optional` flag skips all ML binaries
- Verified: 0 ML packages installed in DevContainer mode

#### Phase 6: TurboRepo Pipeline

- Added `globalDependencies: ["tsconfig.json"]` to `turbo.json`
- Existing `^build` topological ordering already correct

#### Phase 1: Source Migration (root -> apps/web/)

- Moved 12 directories: components/, data/, hooks/, lib/, locales/, services/, stores/, types/, utils/, workers/, tests/, public/
- Moved 14 files: index.tsx, index.html, constants.ts, types.ts, i18n.ts, styles.css, simulation.worker.ts, vite.config.ts, tsconfig.json, tailwind.config.cjs, postcss.config.cjs, vitest.setup.ts, securityHeaders.ts, playwright configs
- Used `cp -r` + verification + `rm -rf` (DevContainer overlay FS workaround for silent `mv` failures)

#### Phase 2: Root Cleanup

- Emptied root `dependencies: {}`
- Reduced root `devDependencies` to global tools only
- Scripts delegate to `turbo run <task>`
- Root `tsconfig.json` converted to references-only

#### Vite ML-Stub Plugin

- Created `optionalMlPlugin()` in `apps/web/vite.config.ts`
- Detects missing ML modules via `require.resolve()`
- Stubs them with runtime-throwing modules
- Allows production build without ML binaries installed

### Validation Results

| Check                     | Result                                |
| ------------------------- | ------------------------------------- |
| `turbo run build`         | 2 tasks successful (35s)              |
| `tsc --noEmit` (apps/web) | 12 pre-existing ML/WebGPU errors only |
| Vite production build     | 121 precache entries                  |
| DevContainer install      | 0 ML packages (--no-optional works)   |
| `@/` import alias         | All 428 files resolve correctly       |

### Issues Encountered

1. **`mv` silently fails on DevContainer overlay FS** -- Solved with `cp -r` + file count verification + `rm -rf`
2. **Accidentally deleted source dirs** -- Restored via `git checkout HEAD -- <dirs>`
3. **ML module build failures** -- Solved with custom `optionalMlPlugin()` Vite plugin
4. **Transitive optional deps** -- `--no-optional` in setup.sh prevents ML leakage
5. **Workspace name vs path** -- Must use `npm install -w @cannaguide/web` (package name, not path)

### Documentation Updated

- `.github/copilot-instructions.md` -- Monorepo layout, ML isolation, commands, important files
- `docs/monorepo-architecture.md` -- Fully rewritten (Phase 2 complete)
- `docs/ARCHITECTURE.md` -- Directory structure updated to apps/web/
- `docs/next-session-handoff.md` -- New session entry with full changelog

### Remaining Work

- CI/CD workflows may need `working-directory: apps/web`
- Dockerfile COPY paths need updating
- netlify.toml build/publish paths
- Full test suite run + Playwright E2E verification
- CODEOWNERS path pattern review
