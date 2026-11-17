//! Desktop update flow behind three commands, called only by the web frontend's
//! desktopUpdateService after the user asks for it:
//!
//! 1. `update_check` asks the endpoint in tauri.conf.json for a newer version.
//! 2. `update_download` downloads the bundle; tauri-plugin-updater verifies its
//!    minisign signature against the configured public key before returning it.
//! 3. `update_install` installs the verified bundle and restarts. The frontend calls
//!    it only after it has flushed persisted state: on Windows the installer ends the
//!    process from inside `install`.
//!
//! The webview gets no updater plugin permission, so no script can download or
//! install an update outside this flow.

use std::sync::{Mutex, MutexGuard};

use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::lifecycle::Busy;

const BUSY: &str = "another update step is still running";

#[derive(Default)]
pub struct UpdateState {
    busy: Busy,
    pending: Mutex<Option<Update>>,
    downloaded: Mutex<Option<Vec<u8>>>,
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

#[tauri::command]
pub async fn update_check(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<Option<UpdateInfo>, String> {
    let _busy = state.busy.try_acquire().ok_or(BUSY)?;
    let update = app
        .updater()
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
    *lock(&state.pending) = update;
    *lock(&state.downloaded) = None;
    Ok(info)
}

#[tauri::command]
pub async fn update_download(
    state: State<'_, UpdateState>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let _busy = state.busy.try_acquire().ok_or(BUSY)?;
    let update = lock(&state.pending)
        .clone()
        .ok_or("no update to download; check for updates first")?;
    let mut downloaded: u64 = 0;
    // download() verifies the signature before it returns the bytes, so a tampered
    // or foreign bundle is an error here and is never kept.
    let bytes = update
        .download(
            |chunk, total| {
                downloaded += chunk as u64;
                let _ = on_event.send(DownloadEvent::Progress { downloaded, total });
            },
            || {
                let _ = on_event.send(DownloadEvent::Finished);
            },
        )
        .await
        .map_err(|error| error.to_string())?;
    *lock(&state.downloaded) = Some(bytes);
    Ok(())
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
    // handshake lets through: the frontend flushed before calling this command.
    app.restart()
}
