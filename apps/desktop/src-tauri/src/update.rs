//! Desktop update flow behind five commands, called by the web frontend's
//! desktopLifecycleService:
//!
//! 1. `update_check` asks the endpoint in tauri.conf.json for a newer version.
//! 2. `update_download` downloads the bundle; tauri-plugin-updater verifies its
//!    minisign signature against the configured public key before returning it.
//! 3. `update_cancel` stops a running download (the card's Cancel button).
//! 4. `update_set_local_only` mirrors Local-Only mode: while it is on, check and
//!    download refuse, and switching it on stops a running download.
//! 5. `update_install` installs the verified bundle and restarts. The frontend calls
//!    it only after it has saved persisted state: on Windows the installer ends the
//!    process from inside `install`.
//!
//! Trust boundary: these are app commands, and Tauri lets any code running in the
//! webview call them (the webview has no permission for the plugin's own commands,
//! but that does not restrict app commands). What stands between the user and an
//! unwanted install is the webview's content -- the bundled app under its CSP -- not
//! this list. The checks here (Local-Only, one step at a time, deadlines, the
//! signature) catch bugs in the frontend; consent and the save before install are the
//! frontend's job and cannot be proven at this boundary.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard};

use serde::Serialize;
use tauri::{async_runtime, ipc::Channel, AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::lifecycle::{keeps_download, Busy, UPDATE_CHECK_TIMEOUT, UPDATE_DOWNLOAD_TIMEOUT};

const BUSY: &str = "another update step is still running";
/// The frontend maps these exact texts to its own messages.
const CANCELLED: &str = "download cancelled";
const LOCAL_ONLY: &str = "Local-only mode is on; the update server is not contacted";

#[derive(Default)]
pub struct UpdateState {
    busy: Busy,
    local_only: AtomicBool,
    pending: Mutex<Option<Update>>,
    downloaded: Mutex<Option<Vec<u8>>>,
    download_task: Mutex<Option<async_runtime::JoinHandle<()>>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    version: String,
    current_version: String,
    notes: Option<String>,
    date: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum DownloadEvent {
    Progress { downloaded: u64, total: Option<u64> },
    Finished,
}

/// A poisoned lock only means an earlier step panicked; its data is still usable.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
}

fn refuse_when_local_only(state: &UpdateState) -> Result<(), String> {
    if state.local_only.load(Ordering::SeqCst) {
        Err(LOCAL_ONLY.into())
    } else {
        Ok(())
    }
}

/// Aborts a running download; true if one was running.
fn abort_download(state: &UpdateState) -> bool {
    match lock(&state.download_task).take() {
        Some(task) => {
            task.abort();
            true
        }
        None => false,
    }
}

#[tauri::command]
pub async fn update_check(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<Option<UpdateInfo>, String> {
    let _busy = state.busy.try_acquire().ok_or(BUSY)?;
    refuse_when_local_only(&state)?;
    let update = app
        .updater_builder()
        .timeout(UPDATE_CHECK_TIMEOUT)
        .build()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;
    let info = update.as_ref().map(|update| UpdateInfo {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        notes: update.body.clone(),
        date: update.date.map(|date| date.to_string()),
    });
    let previous_version = lock(&state.pending)
        .as_ref()
        .map(|update| update.version.clone());
    if !keeps_download(
        previous_version.as_deref(),
        update.as_ref().map(|update| update.version.as_str()),
    ) {
        *lock(&state.downloaded) = None;
    }
    *lock(&state.pending) = update;
    Ok(info)
}

#[tauri::command]
pub async fn update_download(
    state: State<'_, UpdateState>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let _busy = state.busy.try_acquire().ok_or(BUSY)?;
    refuse_when_local_only(&state)?;
    let mut update = lock(&state.pending)
        .clone()
        .ok_or("no update to download; check for updates first")?;
    // The check's deadline would cut off a large bundle on a slow link.
    update.timeout = Some(UPDATE_DOWNLOAD_TIMEOUT);
    // The download runs as its own task so it can be aborted: dropping the request
    // closes the connection, which a flag checked between chunks would not.
    let (result_tx, mut result_rx) = async_runtime::channel::<Result<Vec<u8>, String>>(1);
    let task = async_runtime::spawn(async move {
        let finished = on_event.clone();
        let mut downloaded: u64 = 0;
        // download() verifies the signature before it returns the bytes, so a
        // tampered or foreign bundle is an error here and is never kept.
        let result = update
            .download(
                |chunk, total| {
                    downloaded += chunk as u64;
                    let _ = on_event.send(DownloadEvent::Progress { downloaded, total });
                },
                || {
                    let _ = finished.send(DownloadEvent::Finished);
                },
            )
            .await
            .map_err(|error| error.to_string());
        let _ = result_tx.send(result).await;
    });
    *lock(&state.download_task) = Some(task);
    // An aborted task drops its sender, so recv() yields None.
    let result = result_rx.recv().await;
    lock(&state.download_task).take();
    let bytes = result.ok_or(CANCELLED)??;
    *lock(&state.downloaded) = Some(bytes);
    Ok(())
}

/// Stops a running download. Not behind the busy guard: the download holds it.
#[tauri::command]
pub fn update_cancel(state: State<'_, UpdateState>) -> bool {
    abort_download(&state)
}

/// Mirrors Local-Only mode; switching it on also stops a running download.
#[tauri::command]
pub fn update_set_local_only(state: State<'_, UpdateState>, enabled: bool) {
    state.local_only.store(enabled, Ordering::SeqCst);
    if enabled {
        abort_download(&state);
    }
}

#[tauri::command]
pub async fn update_install(app: AppHandle, state: State<'_, UpdateState>) -> Result<(), String> {
    let _busy = state.busy.try_acquire().ok_or(BUSY)?;
    let update = lock(&state.pending)
        .clone()
        .ok_or("no update to install; check for updates first")?;
    let bytes = lock(&state.downloaded)
        .take()
        .ok_or("the update is not downloaded yet")?;
    // On Windows install() starts the installer and ends this process itself.
    update.install(&bytes).map_err(|error| error.to_string())?;
    // restart() requests the exit with RESTART_EXIT_CODE, which the quit
    // handshake lets through: the frontend saved before calling this command.
    app.restart()
}
