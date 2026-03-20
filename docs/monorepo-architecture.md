# Monorepo Architecture — Migration Guide

## Current State (Phase 1 — Completed)

The project has been configured as a **Turborepo monorepo** with npm workspaces.

### Directory Structure

```
CannaGuide-2025/
├── turbo.json                    # Turborepo pipeline configuration
├── package.json                  # Workspace root (also: web app)
│
├── apps/
│   └── desktop/                  # Tauri v2 desktop wrapper
│       ├── package.json          # @cannaguide/desktop
│       ├── tsconfig.json
│       └── src/
│           ├── main.rs           # Tauri entry (with IPC commands)
│           └── ipc.rs            # Binary IPC: image processing, sensor data
│
├── packages/
│   ├── ai-core/                  # Shared AI type definitions
│   │   ├── package.json          # @cannaguide/ai-core
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          # Public API re-exports
│   │       ├── types.ts          # AI response types (AIResponse, PlantDiagnosis, etc.)
│   │       ├── providers.ts      # AiProvider, AiProviderConfig
│   │       └── schemas.ts        # Zod validation schemas
│   │
│   ├── ui/                       # Shared UI tokens & theme types
│   │   ├── package.json          # @cannaguide/ui
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── theme.ts          # Theme type, ThemeTokens interface
│   │
│   └── iot-mocks/                # ESP32 sensor simulator (extracted)
│       ├── package.json          # @cannaguide/iot-mocks
│       ├── Dockerfile
│       └── src/
│           └── server.mjs        # HTTP sensor mock (diurnal cycle)
│
├── components/                   # React UI components (web app)
├── stores/                       # Redux + Zustand stores
│   ├── store.ts                  # Redux (global user state)
│   └── sensorStore.ts            # Zustand (high-frequency sensor data)
├── services/                     # Business logic
│   ├── tauriIpcService.ts        # Binary IPC bridge (Tauri ↔ Frontend)
│   ├── mqttSensorService.ts      # Pushes to Zustand sensor store
│   └── ...
├── hooks/
│   ├── useSensorData.ts          # Zustand-based sensor subscriptions
│   └── ...
└── src-tauri/                    # Tauri source (legacy path, synced to apps/desktop)
```

## Phase 2 — Move Web App to `apps/web/` (Next Session)

When ready, the main web application code should be moved into `apps/web/`:

1. `git mv components stores services hooks data locales workers utils types tests lib public scripts apps/web/`
2. `git mv index.tsx index.html types.ts constants.ts i18n.ts styles.css simulation.worker.ts vitest.setup.ts apps/web/`
3. `git mv vite.config.ts tsconfig.json tailwind.config.cjs postcss.config.cjs apps/web/`
4. Update `vite.config.ts` resolve alias: `'@': path.resolve('./')`
5. Update all CI/CD workflows in `.github/workflows/` to use `working-directory: apps/web`
6. Update `Dockerfile` COPY paths

## State Management Strategy

| Data Type                      | Store                           | Rationale                                       |
| ------------------------------ | ------------------------------- | ----------------------------------------------- |
| User settings, plants, journal | **Redux** (IndexedDB persisted) | Infrequent updates, needs persistence           |
| AI responses, mentor history   | **Redux** (via RTK Query)       | Cache management, deduplication                 |
| Sensor readings (MQTT/BLE)     | **Zustand** (ephemeral)         | High-frequency (~500ms), no persistence needed  |
| UI navigation, modals          | **Redux**                       | Coordinated with persistence (last active view) |

## Tauri IPC Protocol

| Command                | Direction | Payload                     | Benefit                          |
| ---------------------- | --------- | --------------------------- | -------------------------------- |
| `process_image_binary` | JS → Rust | `Vec<u8>` (raw JPEG/WebP)   | ~33% smaller than Base64-JSON    |
| `read_sensor_binary`   | JS → Rust | `Vec<u8>` (interleaved f32) | Zero-copy from USB/serial buffer |
| `get_system_info`      | Rust → JS | JSON                        | Adaptive model selection         |
