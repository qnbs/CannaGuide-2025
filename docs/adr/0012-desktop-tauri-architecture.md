# ADR-0012: Desktop/Tauri v2 Architecture

**Date:** 2026-04-20
**Status:** Accepted
**Deciders:** CannaGuide Team

## Context

CannaGuide 2025 supports multiple distribution targets (GitHub Pages PWA, Vercel, Cloudflare Pages). To provide a native desktop experience with system tray, native notifications, and file dialogs, we integrate Tauri v2 as our desktop wrapper. The architecture must:

1. Share 99% of code with the PWA
2. Maintain security through capability-based permissions
3. Support all three desktop platforms (Linux, macOS, Windows)
4. Enable auto-updates via GitHub Releases
5. Persist desktop-specific settings (window state, theme overrides, AI model selection)

The previous monolithic capability configuration posed security risks by granting overly broad permissions. Additionally, missing plugins (window-state, store) limited the desktop UX. Tray and menu capabilities were implicit rather than explicitly declared.

## Decision

### 1. Platform Detection Strategy

A single `platformService.ts` singleton detects the runtime environment:

```typescript
export interface PlatformInfo {
    readonly isTauri: boolean // __TAURI_INTERNALS__ present
    readonly isPwa: boolean // display-mode: standalone
    readonly isBrowser: boolean // Fallback web/browser tab
    readonly os: 'windows' | 'macos' | 'linux' | 'unknown'
}
```

Detection priority:

1. `__TAURI_INTERNALS__.platform` (Tauri-injected)
2. `navigator.userAgentData.platform` (Chromium User-Agent Hints)
3. `navigator.platform` (fallback)

The singleton is frozen at import time and never recomputed.

### 2. Modular Capability Files

Instead of a monolithic `default.json`, capabilities are organized into 10 separate files in `apps/desktop/src-tauri/capabilities/`:

| File                | Purpose                          | Key Permissions                                             |
| ------------------- | -------------------------------- | ----------------------------------------------------------- |
| `core.json`         | Window/event management          | `core:default`, `core:window:*`                             |
| `desktop.json`      | Tray, shell, process             | `shell:allow-open`, `process:allow-exit`                    |
| `fs.json`           | File system with scopes          | Scoped read/write to `$APPDATA/cannaguide/**`               |
| `dialog.json`       | Native file dialogs              | `dialog:allow-open`, `dialog:allow-save`                    |
| `notification.json` | Native notifications             | `notification:allow-notify`                                 |
| `tray.json`         | System tray menu                 | `core:tray:*`, `core:menu:*`                                |
| `shortcut.json`     | Global keyboard shortcuts        | `global-shortcut:allow-register`                            |
| `updater.json`      | Auto-updates                     | `updater:allow-check`, `updater:allow-download-and-install` |
| `window-state.json` | Window size/position persistence | `window-state:default`                                      |
| `store.json`        | Key-value settings store         | `store:allow-get`, `store:allow-set`                        |

### 3. File System Scopes

The `fs.json` capability restricts file access to specific paths:

**Allowed:**

- `$APPDATA/cannaguide/**` (app data directory)
- `$APPDATA/cannaguide/exports/*` (grow report exports)
- `$APPDATA/cannaguide/grows/*.crdt` (CRDT sync files)
- `$APPDATA/cannaguide/models/*` (local AI model cache)
- `$APPDATA/cannaguide/time-lapse/**` (time-lapse photography)
- `$DOCUMENT/**/*.json`, `$DOCUMENT/**/*.cannaguide` (user documents)

**Denied:**

- `$HOME/*` (user home)
- `$DESKTOP/*` (desktop folder)
- `$EXE/*` (executable directory)
- `$RESOURCE/*` (app resources)

### 4. IPC Boundary Rules

Six IPC commands handle the Rust/JS boundary (v1.9.0 — P1.3 hardening):

| Command                     | Direction  | Purpose                                                  |
| --------------------------- | ---------- | -------------------------------------------------------- |
| `get_app_version()`         | Rust -> JS | Returns version, platform, arch                          |
| `export_data(path, data)`   | JS -> Rust | Write JSON to user-selected path                         |
| `import_data(path)`         | JS -> Rust | Read JSON from user-selected path                        |
| `get_native_capabilities()` | Rust -> JS | Returns capability snapshot (`fs`, `updater`, `tray`, …) |
| `open_log_dir()`            | Rust -> JS | Returns the per-user log directory path                  |
| `clear_native_cache()`      | Rust -> JS | Clears the per-user cache directory; returns bytes freed |

All other operations use Tauri plugins (dialog, fs, notification, etc.) which have their own permission scopes.

#### `tauri://before-quit` event

When the tray menu issues "Quit", `lib.rs` first emits `tauri://before-quit` and waits ~250 ms before exiting. The web frontend listens via `@tauri-apps/api/event` and flushes the Redux-Persist snapshot to IndexedDB so no journal entries are lost during native shutdown.

### 5. Native Bridge Services

Three TypeScript services handle platform-specific operations:

**`nativeBridgeService.ts`:**

- Unified notification dispatch (Tauri -> `plugin-notification`, Web -> `Notification` API)
- Microphone permission request
- Lazy-loads Tauri modules (tree-shaken on web builds)

**`tauriDialogService.ts`:**

- Native file open/save dialogs
- Invokes `export_data`/`import_data` IPC commands
- Returns `{ path: null }` on web (graceful fallback)

**`nativeCapabilitiesService.ts`:** (added in v1.9.0)

- Read-only mirror of the Tauri capability set
- Invokes `get_native_capabilities`, `open_log_dir`, `clear_native_cache`
- Returns an all-`false` static stub on web so feature flags can be checked
  uniformly across PWA + Desktop without inspecting `platform.isTauri`

### 6. Plugin Configuration

9 Tauri v2 plugins are initialized:

| Plugin                         | Version | Purpose                           |
| ------------------------------ | ------- | --------------------------------- |
| `tauri-plugin-dialog`          | 2.x     | Native file dialogs               |
| `tauri-plugin-fs`              | 2.x     | Scoped file system access         |
| `tauri-plugin-notification`    | 2.x     | Native notifications              |
| `tauri-plugin-global-shortcut` | 2.x     | Global keyboard shortcuts         |
| `tauri-plugin-updater`         | 2.x     | Auto-updates from GitHub Releases |
| `tauri-plugin-shell`           | 2.x     | Open URLs externally              |
| `tauri-plugin-process`         | 2.x     | Process management                |
| `tauri-plugin-window-state`    | 2.x     | Persist window size/position      |
| `tauri-plugin-store`           | 2.x     | Desktop-specific settings         |

### 7. Auto-Updater Configuration

Updates are signed and distributed via GitHub Releases:

```json
{
    "plugins": {
        "updater": {
            "endpoints": [
                "https://github.com/qnbs/CannaGuide-2025/releases/latest/download/latest.json"
            ],
            "pubkey": "<base64-encoded-public-key>"
        }
    }
}
```

CI requires these secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: Base64-encoded private key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Key password

### 8. store Plugin Usage

Desktop-specific settings stored in `store`:

| Key                  | Type             | Purpose                                           |
| -------------------- | ---------------- | ------------------------------------------------- |
| `theme-override`     | `string \| null` | Desktop-specific theme (overrides PWA preference) |
| `window-prefs`       | `object`         | Custom window preferences                         |
| `ai-model-selection` | `string`         | Selected local AI model for Desktop               |

## Consequences

### Positive

- **Security:** Scoped FS permissions prevent unauthorized file access
- **Maintainability:** Modular capabilities are easier to audit and modify
- **UX:** Window state persistence, native notifications, and auto-updates improve desktop experience
- **Code Sharing:** 99% code reuse with PWA reduces maintenance burden
- **CI Integration:** Auto-updater enables seamless releases

### Negative

- **9 capability files:** More files to maintain
- **Key management:** Auto-updater requires signing key rotation and secure storage
- **Testing complexity:** Desktop-specific features require Tauri test framework

### Neutral

- **Tauri v2 dependency:** Locked to Tauri v2 API surface
- **Platform differences:** Some plugins behave differently across Linux/macOS/Windows

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Tauri Capability System](https://v2.tauri.app/security/capabilities/)
- [Tauri Plugin List](https://v2.tauri.app/plugin/)
- ADR-0004: CRDT/Y.js Offline Sync
- ADR-0011: Local AI Stack Restructuring
