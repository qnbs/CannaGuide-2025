# Monorepo Architecture

## Current State (Fully Migrated)

The project is a **Turborepo monorepo** with npm workspaces. All web application source code lives in `apps/web/`. Heavy ML dependencies are isolated in `@cannaguide/ai-core` as `optionalDependencies`.

### Turbo Pipeline

| Task          | Depends On | Outputs                              | Cached | Notes                                       |
| ------------- | ---------- | ------------------------------------ | ------ | ------------------------------------------- |
| `build`       | `^build`   | `dist/**`                            | Yes    | Web app (Vite) + workspace packages (tsc)   |
| `tauri:build` | `build`    | `src-tauri/target/release/bundle/**` | No     | Platform-specific binaries; env passthrough |
| `tauri:dev`   | `^build`   | --                                   | No     | Persistent dev process; env passthrough     |
| `dev`         | `^build`   | --                                   | No     | Persistent (Vite dev server)                |
| `test`        | `^build`   | `coverage/**`                        | Yes    |                                             |
| `test:e2e`    | `build`    | `test-results/**`                    | Yes    | Needs web build artifact                    |
| `lint`        | `^build`   | --                                   | Yes    |                                             |
| `typecheck`   | `^build`   | --                                   | Yes    |                                             |

### Directory Structure

```
CannaGuide-2025/
  package.json              # Workspace root (turbo, eslint, prettier -- NO app deps)
  turbo.json                # TurboRepo pipeline
  tsconfig.json             # References-only (apps/web, apps/desktop, packages/*)

  apps/
    web/                    # Main PWA (@cannaguide/web)
      package.json          # All frontend deps + @cannaguide/ai-core
      vite.config.ts        # Vite build + optionalMlPlugin() for ML stub fallback
      tsconfig.json         # strict, baseUrl ".", @/* path alias
      index.html            # Entry HTML
      index.tsx             # App bootstrap, SW registration, safe recovery
      components/           # React components
      stores/               # Redux slices, selectors, middleware
      services/             # Business logic (AI, DB, crypto, IoT, Sentry)
      hooks/                # Custom React hooks (17)
      data/                 # Static data: 800+ strains, FAQ, lexicon
      locales/              # i18n: en/, de/ (13 namespaces)
      workers/              # Web Workers
      utils/                # Shared utilities
      types/                # Zod schemas for AI validation
      lib/                  # cn(), VPD calculations
      public/               # Static assets, SW, manifest
      tests/                # E2E + Component tests
    desktop/                # Tauri v2 desktop wrapper
      package.json          # @cannaguide/desktop
      src/
        main.rs             # Tauri entry (with IPC commands)
        ipc.rs              # Binary IPC: image processing, sensor data

  packages/
    ai-core/                # Shared AI types + ML dependency isolation
      package.json          # @cannaguide/ai-core
      src/
        index.ts            # AI types, providers, schemas
        ml.ts               # Lazy loaders: loadTransformers(), loadWebLlm(), loadGenAI()
    ui/                     # Shared UI tokens & theme types
    iot-mocks/              # ESP32 sensor mock server (port 3001)

  src-tauri/                # Tauri v2 desktop config (Rust backend)
  scripts/                  # Build, lint, merge, CI scripts
  docker/                   # nginx config, esp32-mock, tauri-mock
```

### ML Isolation Strategy

Heavy ML dependencies are declared as `optionalDependencies` in `@cannaguide/ai-core/package.json`:

```json
{
    "optionalDependencies": {
        "@mlc-ai/web-llm": "*",
        "@xenova/transformers": "*",
        "onnxruntime-web": "*"
    }
}
```

The web app's `vite.config.ts` includes `optionalMlPlugin()` -- a custom Vite plugin that:

1. Detects which ML modules are missing via `require.resolve()`
2. Stubs them with modules that throw runtime errors ("not installed")
3. Allows the build to succeed without ML binaries installed

DevContainer uses `--no-optional` to skip all ML packages for fast boot:

```bash
CI=1 npm install -w @cannaguide/web -w @cannaguide/iot-mocks --include-workspace-root --no-optional
```

### Root package.json

The root `package.json` contains **zero application dependencies**. Only global dev tooling:

- turbo, eslint, prettier, husky, typescript, biome
- commitlint, snyk, anti-trojan-source, lint-staged
- Scripts delegate to `turbo run <task>`

### TypeScript Configuration

Root `tsconfig.json` is references-only:

```json
{
    "references": [
        { "path": "apps/web" },
        { "path": "apps/desktop" },
        { "path": "packages/ai-core" },
        { "path": "packages/ui" }
    ],
    "include": []
}
```

`apps/web/tsconfig.json` has full compiler options with `"baseUrl": "."` and `"paths": {"@/*": ["./*"]}` -- all `@/` imports resolve from `apps/web/`.

## State Management Strategy

| Data Type                      | Store                           | Rationale                                       |
| ------------------------------ | ------------------------------- | ----------------------------------------------- |
| User settings, plants, journal | **Redux** (IndexedDB persisted) | Infrequent updates, needs persistence           |
| AI responses, mentor history   | **Redux** (via RTK Query)       | Cache management, deduplication                 |
| Sensor readings (MQTT/BLE)     | **Zustand** (ephemeral)         | High-frequency (~500ms), no persistence needed  |
| UI navigation, modals          | **Redux**                       | Coordinated with persistence (last active view) |

## Tauri IPC Protocol

| Command                | Direction  | Payload                     | Benefit                          |
| ---------------------- | ---------- | --------------------------- | -------------------------------- |
| `process_image_binary` | JS -> Rust | `Vec<u8>` (raw JPEG/WebP)   | ~33% smaller than Base64-JSON    |
| `read_sensor_binary`   | JS -> Rust | `Vec<u8>` (interleaved f32) | Zero-copy from USB/serial buffer |
| `get_system_info`      | Rust -> JS | JSON                        | Adaptive model selection         |
