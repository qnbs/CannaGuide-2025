# Desktop and Tauri instructions

Applies to `apps/desktop/**`.

- DESKTOP-01: Treat the Tauri command boundary and capability files as security boundaries. Keep permissions least-privilege and update tests/configuration with command changes.
- DESKTOP-02: Verify actual host requirements, supported targets and CI packaging before documenting or claiming release support.
- DESKTOP-03: Signing, updater feeds, publishing and releases remain governed by root owner gates and release policy; this file cannot authorize them.
- DESKTOP-04: Preserve web/desktop data and updater compatibility. Platform packaging and signatures require exact artifacts, checks and rollback evidence.
- DESKTOP-05: Desktop development requires Rust and Tauri v2; verify host prerequisites and package-specific commands instead of assuming the root web-only toolchain is sufficient.
