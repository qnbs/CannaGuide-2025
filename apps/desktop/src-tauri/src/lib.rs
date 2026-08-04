mod path_scope;

use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

#[derive(Serialize)]
struct AppInfo {
    version: String,
    platform: String,
    arch: String,
}

/// Capability snapshot exposed to the web frontend.
///
/// Mirrors the capability files under `apps/desktop/src-tauri/capabilities/`
/// plus a couple of computed booleans (`is_dev`, `is_macos_universal`). The
/// frontend reads this via `nativeCapabilitiesService.ts` to feature-flag UI
/// surfaces (e.g. "Show updater button" only when the updater capability is
/// active) without inspecting the capability JSON directly.
#[derive(Serialize)]
struct NativeCapabilities {
    fs: bool,
    dialog: bool,
    notification: bool,
    tray: bool,
    shortcut: bool,
    updater: bool,
    window_state: bool,
    store: bool,
    is_dev: bool,
    is_macos_universal: bool,
    log_dir: Option<String>,
}

#[tauri::command]
fn get_app_version() -> AppInfo {
    AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}

/// Directories these commands may touch: the app's own data dir, plus the
/// user's Documents and Downloads (where a save dialog realistically lands).
/// Anything unresolvable is simply omitted rather than failing the whole call.
fn permitted_roots(app: &tauri::AppHandle) -> Vec<PathBuf> {
    let resolver = app.path();
    [
        resolver.app_data_dir(),
        resolver.document_dir(),
        resolver.download_dir(),
    ]
    .into_iter()
    .filter_map(|dir| dir.ok())
    .filter_map(|dir| dir.canonicalize().ok())
    .collect()
}

/// Resolve `path` to a candidate that can be scope-checked without being fooled
/// by symlinks.
///
/// The parent is canonicalised (it must already exist, which is true for both a
/// save dialog and an open dialog), so a symlinked *directory* cannot smuggle
/// the write outside the permitted roots. If the target itself already exists
/// as a symlink it is refused outright rather than followed -- `fs::write`
/// would otherwise write through it.
fn resolve_candidate(path: &str) -> Result<PathBuf, String> {
    let raw = Path::new(path);

    // Reject `..` LEXICALLY, before canonicalisation. Canonicalising first would
    // silently resolve `Documents/../Downloads/x.json` into a path that passes
    // every later check, so the traversal rule could never actually fire. What
    // the caller asked for, not what it collapses to, is what must be judged.
    if raw
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err("Path must not contain '..' components.".to_string());
    }

    let file_name = raw
        .file_name()
        .ok_or_else(|| "Path has no file name.".to_string())?;
    let parent = raw
        .parent()
        .ok_or_else(|| "Path has no parent directory.".to_string())?;

    let parent = parent
        .canonicalize()
        .map_err(|_| "Directory does not exist.".to_string())?;

    let candidate = parent.join(file_name);

    if let Ok(meta) = std::fs::symlink_metadata(&candidate) {
        if meta.file_type().is_symlink() {
            return Err("Refusing to follow a symlink.".to_string());
        }
    }

    Ok(candidate)
}

/// Check `path` against the permitted roots and return the resolved path.
fn scoped_path(app: &tauri::AppHandle, path: &str) -> Result<PathBuf, String> {
    let candidate = resolve_candidate(path)?;
    path_scope::validate_scoped(&candidate, &permitted_roots(app))
        .map_err(|e| e.message().to_string())?;
    Ok(candidate)
}

#[tauri::command]
fn export_data(app: tauri::AppHandle, path: String, data: String) -> Result<(), String> {
    let target = scoped_path(&app, &path)?;
    std::fs::write(&target, &data).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_data(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let source = scoped_path(&app, &path)?;
    std::fs::read_to_string(&source).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_native_capabilities(app_handle: tauri::AppHandle) -> NativeCapabilities {
    let log_dir = app_handle
        .path()
        .app_log_dir()
        .ok()
        .and_then(|p| p.to_str().map(String::from));
    NativeCapabilities {
        fs: true,
        dialog: true,
        notification: true,
        tray: true,
        shortcut: true,
        updater: true,
        window_state: true,
        store: true,
        is_dev: cfg!(debug_assertions),
        is_macos_universal: cfg!(target_os = "macos") && cfg!(target_arch = "aarch64"),
        log_dir,
    }
}

#[tauri::command]
fn open_log_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let dir = app_handle.path().app_log_dir().map_err(|e| e.to_string())?;
    let dir_str = dir
        .to_str()
        .ok_or_else(|| "log_dir not utf-8".to_string())?;
    Ok(dir_str.to_string())
}

#[tauri::command]
fn clear_native_cache(app_handle: tauri::AppHandle) -> Result<u64, String> {
    let cache_dir = app_handle
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?;
    if !cache_dir.exists() {
        return Ok(0);
    }
    let mut bytes_freed: u64 = 0;
    for entry in std::fs::read_dir(&cache_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let meta = entry.metadata().map_err(|e| e.to_string())?;
        bytes_freed += meta.len();
        if meta.is_dir() {
            std::fs::remove_dir_all(entry.path()).map_err(|e| e.to_string())?;
        } else {
            std::fs::remove_file(entry.path()).map_err(|e| e.to_string())?;
        }
    }
    Ok(bytes_freed)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // -- Tray icon with context menu --------------------------------
            let show_item = MenuItemBuilder::with_id("show", "Show Window").build(app)?;
            let hide_item = MenuItemBuilder::with_id("hide", "Hide Window").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&hide_item)
                .separator()
                .item(&quit_item)
                .build()?;

            TrayIconBuilder::new()
                .menu(&tray_menu)
                .on_menu_event(move |app_handle, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(w) = app_handle.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(w) = app_handle.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                        "quit" => {
                            // Notify the frontend so it can flush
                            // Redux-Persist + IndexedDB before the process exits.
                            let _ = app_handle.emit("tauri://before-quit", ());
                            // Give the frontend ~250ms to react before we exit.
                            std::thread::spawn({
                                let app_handle = app_handle.clone();
                                move || {
                                    std::thread::sleep(std::time::Duration::from_millis(250));
                                    app_handle.exit(0);
                                }
                            });
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            export_data,
            import_data,
            get_native_capabilities,
            open_log_dir,
            clear_native_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
