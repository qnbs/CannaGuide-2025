//! Desktop update flow behind five commands, called by the web frontend's
//! desktopLifecycleService:
//!
//! 1. `update_check` asks the endpoint in tauri.conf.json for a newer version.
//! 2. `update_download` downloads the bundle; tauri-plugin-updater verifies its
//!    minisign signature against the configured public key before returning it.
//! 3. `update_cancel` stops the running check or download (the card's Cancel).
//! 4. `update_set_local_only` mirrors Local-Only mode: while it is on, check and
//!    download refuse, and switching it on stops the running check or download.
//! 5. `update_install` installs the verified bundle and restarts. The frontend calls
//!    it only after a settled save; right before the process ends -- the restart, or
//!    on Windows the installer taking over -- the app asks for one more save and
//!    waits for `confirm_final_save` (or QUIT_FLUSH_TIMEOUT), so an edit made while
//!    the install ran is saved too.
//!
//! Trust boundary: these are app commands, and Tauri lets any code running in the
//! webview call them (the webview has no permission for the plugin's own commands,
//! but that does not restrict app commands). What stands between the user and an
//! unwanted install is the webview's content -- the bundled app under its CSP -- not
//! this list. The checks here (Local-Only, one step at a time, deadlines, the
//! signature) catch bugs in the frontend; consent and the save before install are the
//! frontend's job and cannot be proven at this boundary.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Mutex, MutexGuard};

use serde::Serialize;
use tauri::{async_runtime, ipc::Channel, AppHandle, Emitter, Manager, State};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::lifecycle::{
    keeps_download, Busy, QUIT_FLUSH_TIMEOUT, UPDATE_CHECK_TIMEOUT, UPDATE_DOWNLOAD_TIMEOUT,
};

/// Asks the web app for a last save before an install ends the process.
const SAVE_BEFORE_RESTART: &str = "cannaguide://save-before-restart";

const BUSY: &str = "another update step is still running";
/// The frontend maps these exact texts to its own messages.
const CANCELLED: &str = "update request cancelled";
const LOCAL_ONLY: &str = "Local-only mode is on; the update server is not contacted";

#[derive(Default)]
pub struct UpdateState {
    busy: Busy,
    local_only: AtomicBool,
    pending: Mutex<Option<Update>>,
    downloaded: Mutex<Option<Vec<u8>>>,
    /// The running check or download; the busy guard allows only one at a time.
    network_task: Mutex<Option<async_runtime::JoinHandle<()>>>,
    /// Waits for `confirm_final_save` while an install is about to end the process.
    final_save: Mutex<Option<mpsc::Sender<()>>>,
    /// An install is running; a user quit is held until it ends (CodeAnt on #878).
    installing: AtomicBool,
}

impl UpdateState {
    /// Whether a user quit must wait: the install ends in a restart (or the Windows
    /// installer) anyway, and quitting in between would skip its final save.
    pub fn is_installing(&self) -> bool {
        self.installing.load(Ordering::SeqCst)
    }
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
    /// The download task is registered and running, so update_cancel reaches it from
    /// now on; the web app shows Cancel only after this (CodeAnt on #878).
    Started,
    Progress {
        downloaded: u64,
        total: Option<u64>,
    },
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

/// Aborts the running check or download; true if one was running.
fn abort_network_step(state: &UpdateState) -> bool {
    match lock(&state.network_task).take() {
        Some(task) => {
            task.abort();
            true
        }
        None => false,
    }
}

/// Runs a step that talks to the network as its own task, so it can be aborted:
/// dropping the request closes the connection, which a flag checked between
/// chunks would not, and covers a check waiting on a slow server as well.
async fn run_abortable<T, F>(state: &UpdateState, step: F) -> Result<T, String>
where
    T: Send + 'static,
    F: std::future::Future<Output = Result<T, String>> + Send + 'static,
{
    let (result_tx, mut result_rx) = async_runtime::channel::<Result<T, String>>(1);
    let (start_tx, mut start_rx) = async_runtime::channel::<()>(1);
    // The task waits for a start signal, so nothing goes out before its handle is
    // stored. update_set_local_only sets the flag, then aborts the stored handle;
    // this stores the handle, then reads the flag. Whichever runs second sees the
    // other, so Local-Only switched on in between never lets the request start.
    let task = async_runtime::spawn(async move {
        if start_rx.recv().await.is_some() {
            let _ = result_tx.send(step.await).await;
        }
    });
    *lock(&state.network_task) = Some(task);
    if state.local_only.load(Ordering::SeqCst) {
        abort_network_step(state);
        return Err(LOCAL_ONLY.into());
    }
    let _ = start_tx.send(()).await;
    // An aborted task drops its sender, so recv() yields None.
    let result = result_rx.recv().await;
    lock(&state.network_task).take();
    result.ok_or(CANCELLED)?
}

/// Blocks until the web app confirms its last save, or QUIT_FLUSH_TIMEOUT. Runs on a
/// worker thread (the install hook, or spawn_blocking), never on the main thread,
/// which has to keep the webview running for the save.
fn await_final_save(app: &AppHandle) -> bool {
    let (confirmed_tx, confirmed_rx) = mpsc::channel::<()>();
    *lock(&app.state::<UpdateState>().final_save) = Some(confirmed_tx);
    let confirmed = app.emit(SAVE_BEFORE_RESTART, ()).is_ok()
        && confirmed_rx.recv_timeout(QUIT_FLUSH_TIMEOUT).is_ok();
    lock(&app.state::<UpdateState>().final_save).take();
    if !confirmed {
        eprintln!("[update] no save confirmation before the restart; continuing");
    }
    confirmed
}

/// Called by the web app once the save requested by `await_final_save` finished.
#[tauri::command]
pub fn confirm_final_save(state: State<'_, UpdateState>) {
    if let Some(confirmed_tx) = lock(&state.final_save).take() {
        let _ = confirmed_tx.send(());
    }
}

#[tauri::command]
pub async fn update_check(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<Option<UpdateInfo>, String> {
    let _busy = state.busy.try_acquire().ok_or(BUSY)?;
    refuse_when_local_only(&state)?;
    let before_exit = app.clone();
    let updater = app
        .updater_builder()
        .timeout(UPDATE_CHECK_TIMEOUT)
        // Windows: install() runs this right before it starts the installer and ends
        // the process, so the last save happens before the process is gone.
        .on_before_exit(move || {
            await_final_save(&before_exit);
        })
        .build()
        .map_err(|error| error.to_string())?;
    let update = run_abortable(&state, async move {
        updater.check().await.map_err(|error| error.to_string())
    })
    .await?;
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
    let bytes = run_abortable(&state, async move {
        // run_abortable starts this only after the handle is stored, so a cancel
        // from here on finds the task.
        let _ = on_event.send(DownloadEvent::Started);
        let finished = on_event.clone();
        let mut downloaded: u64 = 0;
        // download() verifies the signature before it returns the bytes, so a
        // tampered or foreign bundle is an error here and is never kept.
        update
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
            .map_err(|error| error.to_string())
    })
    .await?;
    *lock(&state.downloaded) = Some(bytes);
    Ok(())
}

/// Stops the running check or download. Not behind the busy guard: that step holds it.
#[tauri::command]
pub fn update_cancel(state: State<'_, UpdateState>) -> bool {
    abort_network_step(&state)
}

/// Mirrors Local-Only mode; switching it on also stops the running check or download.
#[tauri::command]
pub fn update_set_local_only(state: State<'_, UpdateState>, enabled: bool) {
    state.local_only.store(enabled, Ordering::SeqCst);
    if enabled {
        abort_network_step(&state);
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
    state.installing.store(true, Ordering::SeqCst);
    // On Windows install() starts the installer and ends this process itself.
    if let Err(error) = update.install(&bytes) {
        // Nothing was installed: keep the verified bundle so Install can be retried,
        // and let quits through again.
        *lock(&state.downloaded) = Some(bytes);
        state.installing.store(false, Ordering::SeqCst);
        return Err(error.to_string());
    }
    // macOS and Linux: the new version is in place. Save once more -- an edit made
    // while install() ran is in no earlier save -- then restart. restart() requests
    // the exit with RESTART_EXIT_CODE, which the quit handshake lets through.
    let waiter = app.clone();
    let _ = async_runtime::spawn_blocking(move || await_final_save(&waiter)).await;
    app.restart()
}
