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

    // The app data dir may not exist yet on a fresh install, or after the user
    // clears application data. `canonicalize()` fails on a missing path, which
    // would silently drop the app's OWN directory from the permitted set and
    // reject every export to it -- the same class of failure as the `.local`
    // bug, arriving by a different route. Create it first; a creation failure
    // just means it stays out of the set, which fails closed.
    if let Ok(dir) = resolver.app_data_dir() {
        let _ = std::fs::create_dir_all(&dir);
    }

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
/// the write outside the permitted roots.
///
/// The symlink check on the target below is **advisory only**, and deliberately
/// so: it describes the state of the path at the moment it was inspected, and
/// nothing binds that observation to the later open. Treating it as the symlink
/// defence would be a check-then-use race. The actual guarantee lives at the
/// point of use -- `write_atomic_no_follow` renames over the target rather than
/// writing through it, and `read_no_follow` opens before it checks. This early
/// rejection only exists to fail fast with a clear message in the common,
/// non-adversarial case.
fn resolve_candidate(path: &str) -> Result<PathBuf, String> {
    let raw = Path::new(path);

    // Reject a relative path HERE, not in `validate_scoped`. By the time the
    // candidate reaches that function it has been made absolute by joining the
    // canonicalised parent, so its `NotAbsolute` branch is unreachable from this
    // path and `Documents/backup.json` would be resolved against the process
    // working directory instead of being refused. The unit test for that branch
    // calls `validate_scoped` directly, which is exactly why it never noticed.
    if !raw.is_absolute() {
        return Err(path_scope::ScopeError::NotAbsolute.message().to_string());
    }

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

/// Write `data` to `target` without ever writing *through* a symlink.
///
/// The `symlink_metadata` check in `resolve_candidate` is a check-then-use race
/// on its own: `std::fs::write` follows symlinks, so anyone able to create
/// entries in a permitted directory could swap the target for a symlink between
/// the check and the write and have the bytes land outside the permitted roots.
///
/// Writing a fresh temp file in the same (already canonicalised) directory and
/// renaming it over the target closes that window with no platform-specific open
/// flags: `create_new` refuses to touch an existing entry, so the temp file can
/// never be a planted symlink, and `rename` *replaces* whatever sits at the
/// destination rather than following it. The export also becomes atomic, so a
/// crash mid-write can no longer truncate an existing backup to nothing.
fn write_atomic_no_follow(target: &Path, data: &str) -> Result<(), String> {
    use std::io::Write;

    let parent = target
        .parent()
        .ok_or_else(|| "Path has no parent directory.".to_string())?;

    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let temp = parent.join(format!(".cannaguide-{}-{nanos}.tmp", std::process::id()));

    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temp)
        .map_err(|e| e.to_string())?;

    let written = file
        .write_all(data.as_bytes())
        .and_then(|()| file.sync_all())
        .map_err(|e| e.to_string());
    drop(file);

    if let Err(e) = written {
        let _ = std::fs::remove_file(&temp);
        return Err(e);
    }

    std::fs::rename(&temp, target).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        e.to_string()
    })
}

/// Read `source` without ever returning the contents of a symlink target.
///
/// Same race as the write path, opposite direction: a pre-open check cannot bind
/// the thing it inspected to the thing that is later read. Opening FIRST and
/// checking after does bind them. If the path was already a symlink, the check
/// reports it and the bytes are dropped without being handed back; if it became
/// one after the open, the handle still refers to the file that passed
/// validation and refusing is merely conservative. Either way the contents of a
/// swapped-in target are never returned.
fn read_no_follow(source: &Path) -> Result<String, String> {
    use std::io::Read;

    let mut file = std::fs::File::open(source).map_err(|e| e.to_string())?;

    let meta = std::fs::symlink_metadata(source).map_err(|e| e.to_string())?;
    if meta.file_type().is_symlink() {
        return Err("Refusing to follow a symlink.".to_string());
    }

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| e.to_string())?;
    Ok(contents)
}

#[tauri::command]
fn export_data(app: tauri::AppHandle, path: String, data: String) -> Result<(), String> {
    let target = scoped_path(&app, &path)?;
    write_atomic_no_follow(&target, &data)
}

#[tauri::command]
fn import_data(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let source = scoped_path(&app, &path)?;
    read_no_follow(&source)
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

/// Filesystem-backed tests for the command entry point.
///
/// `path_scope.rs` covers the pure validation rules; these cover the part it
/// deliberately cannot -- path normalisation and the symlink handling in
/// `resolve_candidate`, `write_atomic_no_follow` and `read_no_follow`. Both bugs
/// fixed alongside these tests were invisible to the pure suite: the relative
/// path never reached `validate_scoped`'s `NotAbsolute` branch, and no pure test
/// can express a write racing a symlink.
#[cfg(test)]
mod command_path_tests {
    use super::*;

    fn scratch(tag: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir =
            std::env::temp_dir().join(format!("cannaguide-{tag}-{}-{nanos}", std::process::id()));
        std::fs::create_dir_all(&dir).expect("create scratch dir");
        dir
    }

    /// Regression for the finding that `resolve_candidate` made relative paths
    /// absolute before anything judged them, so `validate_scoped`'s NotAbsolute
    /// branch was unreachable from the real command path.
    #[test]
    fn rejects_a_relative_path_before_touching_the_filesystem() {
        let err = resolve_candidate("Documents/backup.json").expect_err("must be rejected");
        assert_eq!(err, "Path must be absolute.");
    }

    #[test]
    fn rejects_parent_traversal_lexically() {
        let err = resolve_candidate("/tmp/Documents/../backup.json").expect_err("must be rejected");
        assert_eq!(err, "Path must not contain '..' components.");
    }

    #[test]
    fn accepts_an_absolute_path_in_an_existing_directory() {
        let dir = scratch("resolve-ok");
        let target = dir.join("backup.json");
        let resolved = resolve_candidate(target.to_str().expect("utf-8")).expect("must resolve");
        assert_eq!(resolved.file_name(), target.file_name());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[cfg(unix)]
    #[test]
    fn refuses_a_target_that_is_already_a_symlink() {
        let dir = scratch("resolve-symlink");
        let outside = dir.join("outside.json");
        std::fs::write(&outside, "secret").expect("seed outside file");
        let link = dir.join("link.json");
        std::os::unix::fs::symlink(&outside, &link).expect("create symlink");

        let err = resolve_candidate(link.to_str().expect("utf-8")).expect_err("must be rejected");
        assert_eq!(err, "Refusing to follow a symlink.");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A symlinked *parent* is allowed, but only because it is canonicalised --
    /// the candidate handed to `validate_scoped` is the real location, so a link
    /// cannot smuggle a write outside the permitted roots.
    #[cfg(unix)]
    #[test]
    fn canonicalises_a_symlinked_parent_to_its_real_location() {
        let dir = scratch("resolve-parent");
        let real = dir.join("real");
        std::fs::create_dir_all(&real).expect("create real dir");
        let link = dir.join("link");
        std::os::unix::fs::symlink(&real, &link).expect("create dir symlink");

        let via_link = link.join("backup.json");
        let resolved = resolve_candidate(via_link.to_str().expect("utf-8")).expect("must resolve");

        assert_eq!(
            resolved,
            real.canonicalize()
                .expect("canonicalise real")
                .join("backup.json"),
            "the symlinked parent must resolve to its real location"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// The TOCTOU fix. A symlink planted at the target must be REPLACED, not
    /// written through -- `std::fs::write` would have clobbered `outside.json`.
    #[cfg(unix)]
    #[test]
    fn writing_over_a_symlink_replaces_it_instead_of_following_it() {
        let dir = scratch("write-symlink");
        let outside = dir.join("outside.json");
        std::fs::write(&outside, "original").expect("seed outside file");
        let target = dir.join("target.json");
        std::os::unix::fs::symlink(&outside, &target).expect("create symlink");

        write_atomic_no_follow(&target, "new contents").expect("write must succeed");

        assert_eq!(
            std::fs::read_to_string(&outside).expect("read outside"),
            "original",
            "the symlink target must not have been written through"
        );
        assert!(
            !std::fs::symlink_metadata(&target)
                .expect("stat target")
                .file_type()
                .is_symlink(),
            "the symlink must have been replaced by a regular file"
        );
        assert_eq!(
            std::fs::read_to_string(&target).expect("read target"),
            "new contents"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn writing_leaves_no_temp_file_behind() {
        let dir = scratch("write-clean");
        let target = dir.join("backup.json");
        write_atomic_no_follow(&target, "{}").expect("write must succeed");

        let leftovers: Vec<_> = std::fs::read_dir(&dir)
            .expect("read scratch dir")
            .filter_map(|e| e.ok())
            .map(|e| e.file_name())
            .filter(|n| n.to_string_lossy().ends_with(".tmp"))
            .collect();
        assert!(
            leftovers.is_empty(),
            "temp files left behind: {leftovers:?}"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn writing_overwrites_an_existing_regular_file() {
        let dir = scratch("write-overwrite");
        let target = dir.join("backup.json");
        std::fs::write(&target, "old").expect("seed target");

        write_atomic_no_follow(&target, "new").expect("write must succeed");
        assert_eq!(
            std::fs::read_to_string(&target).expect("read target"),
            "new"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[cfg(unix)]
    #[test]
    fn reading_a_symlink_returns_an_error_not_the_target_contents() {
        let dir = scratch("read-symlink");
        let outside = dir.join("outside.json");
        std::fs::write(&outside, "secret").expect("seed outside file");
        let link = dir.join("link.json");
        std::os::unix::fs::symlink(&outside, &link).expect("create symlink");

        let err = read_no_follow(&link).expect_err("must be rejected");
        assert_eq!(err, "Refusing to follow a symlink.");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn reading_a_regular_file_returns_its_contents() {
        let dir = scratch("read-ok");
        let source = dir.join("backup.json");
        std::fs::write(&source, "{\"ok\":true}").expect("seed source");

        assert_eq!(
            read_no_follow(&source).expect("read must succeed"),
            "{\"ok\":true}"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }
}
