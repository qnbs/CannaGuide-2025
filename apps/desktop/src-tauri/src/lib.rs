mod instance_lock;
mod lifecycle;
mod startup;
mod update;

use lifecycle::{QuitDecision, QuitGate, QUIT_FLUSH_TIMEOUT};
use serde::Serialize;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, RunEvent, WindowEvent,
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

/// Holds a user-initiated quit until the frontend has flushed persisted state
/// (`confirm_quit`), or until QUIT_FLUSH_TIMEOUT for a frontend that never answers.
pub(crate) fn request_quit(app: &AppHandle) {
    match app.state::<QuitGate>().request() {
        QuitDecision::Exit => app.exit(0),
        // Held: an update is installing and ends the process itself after its final
        // save; the gate hands the quit back if the install fails (QuitGate).
        QuitDecision::Wait | QuitDecision::Held => {}
        QuitDecision::AskFrontend => {
            let _ = app.emit("tauri://before-quit", ());
            let app = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(QUIT_FLUSH_TIMEOUT);
                if app.state::<QuitGate>().confirm() {
                    eprintln!("[quit] no flush confirmation from the frontend; exiting anyway");
                    app.exit(0);
                }
            });
        }
    }
}

/// Called by the frontend once `flushPersistedState` has finished. `saved` is whether
/// that save succeeded (absent from a frontend that predates it); the quit goes on
/// either way, and the smoke test checks it.
#[tauri::command]
fn confirm_quit(app: AppHandle, gate: tauri::State<'_, QuitGate>, saved: Option<bool>) {
    startup::record_quit_ack(saved);
    if gate.confirm() {
        app.exit(0);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(startup::ProcessStart::default())
        .manage(QuitGate::default())
        .manage(update::UpdateState::default())
        // First plugin, as the plugin requires: a second launch hands over to this
        // instance and exits before anything else starts. Without a session bus
        // (Linux) it logs a warning and launches normally.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // When two launches race the window may not exist yet; the lock holder then
            // shows it as soon as it does (instance_lock.rs).
            if !instance_lock::focus_main_window(app) {
                if let Ok(dir) = app.path().app_data_dir() {
                    let _ = instance_lock::request_focus(&dir);
                }
            }
        }))
        // Before any window exists: a process that cannot lock this profile exits, which
        // covers what the plugin above cannot (no D-Bus session bus, two cold launches
        // at once on macOS). See instance_lock.rs.
        .plugin(instance_lock::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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
                        // Flushes persisted state first; see request_quit.
                        "quit" => request_quit(app_handle),
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
            startup::trace(app.handle(), "native setup done");
            Ok(())
        })
        // Smoke-harness trace only: whether the webview started and finished loading.
        .on_page_load(|webview, payload| {
            let milestone = match payload.event() {
                tauri::webview::PageLoadEvent::Started => "page load started",
                tauri::webview::PageLoadEvent::Finished => "page load finished",
            };
            startup::trace(webview.app_handle(), milestone);
        })
        // Closing the main window quits the app, so it waits for the flush too.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                if window.label() == "main" && !app.state::<QuitGate>().is_confirmed() {
                    api.prevent_close();
                    request_quit(app);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_native_capabilities,
            open_log_dir,
            clear_native_cache,
            confirm_quit,
            startup::frontend_ready,
            update::update_check,
            update::update_download,
            update::update_cancel,
            update::update_set_local_only,
            update::confirm_final_save,
            update::update_install,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app, event| {
        // A user quit (Cmd+Q, the last window closing) has no exit code; exit() and
        // restart() carry one and pass. Only an unconfirmed user quit is held.
        if let RunEvent::ExitRequested {
            code: None, api, ..
        } = event
        {
            if !app.state::<QuitGate>().is_confirmed() {
                api.prevent_exit();
                request_quit(app);
            }
        }
    });
}

/// `plugins` in tauri.conf.json is handed to each plugin at startup, and a value its
/// config type does not accept makes `build()` fail before any window opens: v1.12.0
/// shipped `"window-state": {"all": true}` and `"store": {}`, and every desktop build
/// exited with PluginInitialization. Plugins built with `Builder::new(name)` and no
/// config type take `()`, which only an absent entry (null) satisfies.
#[cfg(test)]
mod plugin_config_tests {
    use serde_json::Value;

    const CONFIG: &str = include_str!("../tauri.conf.json");
    /// Every plugin `run()` registers; none of them but the updater has a config type.
    const UNIT_CONFIG_PLUGINS: &[&str] = &[
        "single-instance",
        "instance-lock",
        "dialog",
        "fs",
        "notification",
        "global-shortcut",
        "shell",
        "process",
        "window-state",
        "store",
    ];

    fn plugins() -> serde_json::Map<String, Value> {
        let config: Value = serde_json::from_str(CONFIG).expect("tauri.conf.json is JSON");
        config["plugins"].as_object().cloned().unwrap_or_default()
    }

    #[test]
    fn the_updater_configuration_parses_as_the_updater_plugin_reads_it() {
        let updater = plugins()
            .remove("updater")
            .expect("plugins.updater is required");
        let parsed: tauri_plugin_updater::Config = serde_json::from_value(updater)
            .expect("plugins.updater matches tauri_plugin_updater::Config");
        assert!(
            !parsed.endpoints.is_empty(),
            "the updater needs an endpoint"
        );
    }

    #[test]
    fn plugins_without_a_config_type_have_no_entry() {
        for (name, value) in plugins() {
            if name == "updater" {
                continue;
            }
            // The same call Tauri makes for a plugin whose config type is ().
            let accepted = serde_json::from_value::<()>(value.clone());
            assert!(
                accepted.is_ok(),
                "plugins.{name} = {value} fails at startup: {}",
                accepted.unwrap_err()
            );
            assert!(
                UNIT_CONFIG_PLUGINS.contains(&name.as_str()),
                "plugins.{name} configures a plugin run() does not register"
            );
        }
    }

    #[test]
    fn the_v1_12_0_entries_are_what_this_test_rejects() {
        for value in [serde_json::json!({ "all": true }), serde_json::json!({})] {
            let error = serde_json::from_value::<()>(value).unwrap_err().to_string();
            assert!(error.contains("expected unit"), "{error}");
        }
        assert!(serde_json::from_value::<()>(Value::Null).is_ok());
    }
}
