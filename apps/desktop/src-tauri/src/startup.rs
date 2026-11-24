//! The frontend's startup report, and the hooks the desktop runtime smoke test
//! (`scripts/desktop-smoke.mjs`) drives the packaged app through.
//!
//! The frontend calls `frontend_ready` once, after its start has settled
//! (`apps/web/services/desktopStartupReport.ts`). Normally that only prints one line.
//! With `CANNAGUIDE_SMOKE_REPORT` set -- by the test harness, never by the app -- the
//! process also writes, next to that file:
//!
//! - the report itself (`<report>`);
//! - `<report>.quit-ack` when the frontend confirms a quit, with whether its save
//!   succeeded, so a run proves the quit went through the save rather than a fallback;
//! - with `CANNAGUIDE_SMOKE_HOLD`: `<report>.hidden` once `<report>.hide` appears (the
//!   window is hidden), `<report>.restored` when a second launch shows it again, and
//!   the quit once `<report>.quit` appears. Without HOLD the app quits right after the
//!   report, through the normal quit handshake (`request_quit`).
//!
//! Trust: like every app command, `frontend_ready` is callable by webview code. Without
//! the environment variable it only prints the outcome. The file path never comes from
//! the webview, the report has a fixed schema, and an error is recorded only by its
//! class name (`diagnostic_code`), never by its message.

use std::{
    env, fs, io,
    path::{Path, PathBuf},
    thread,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

pub(crate) const SMOKE_REPORT_ENV: &str = "CANNAGUIDE_SMOKE_REPORT";
pub(crate) const SMOKE_HOLD_ENV: &str = "CANNAGUIDE_SMOKE_HOLD";
const QUIT_POLL_INTERVAL: Duration = Duration::from_millis(200);
/// A held smoke run quits by itself after this, so a lost harness leaves no process.
const MAX_HOLD: Duration = Duration::from_secs(600);
const MAX_CODE_CHARS: usize = 64;
/// 3: the report says whether a service worker controls the page (GH #931).
const REPORT_SCHEMA: u32 = 3;

/// How the frontend's start ended; mirrors `DesktopStartupOutcome` in the web app.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum StartupOutcome {
    Started,
    Error,
    Reader,
    Unverified,
    Stale,
    NewerSnapshot,
}

impl StartupOutcome {
    fn as_str(self) -> &'static str {
        match self {
            Self::Started => "started",
            Self::Error => "error",
            Self::Reader => "reader",
            Self::Unverified => "unverified",
            Self::Stale => "stale",
            Self::NewerSnapshot => "newer-snapshot",
        }
    }
}

/// What is on screen when the start ends: the main view, a dialog (onboarding on a
/// first start), or nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum StartupView {
    App,
    Dialog,
    None,
}

/// Where the started state came from; mirrors `StartupHydration` in `stores/store.ts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum StartupHydration {
    Snapshot,
    Backup,
    Fresh,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FrontendReport {
    outcome: StartupOutcome,
    frontend_version: String,
    view: StartupView,
    /// `document.visibilityState == "visible"`: false for a window that starts hidden.
    visible: bool,
    hydration: StartupHydration,
    local_only: bool,
    saved_snapshot_present: bool,
    /// The desktop shell runs no service worker; true means one still controls the page.
    service_worker_controlled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    error_code: Option<String>,
}

/// When the process started, for the time-to-ready figure.
pub(crate) struct ProcessStart(Instant);

impl Default for ProcessStart {
    fn default() -> Self {
        Self(Instant::now())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SmokeRecord<'a> {
    schema: u32,
    native_version: &'static str,
    os: &'static str,
    arch: &'static str,
    ready_after_ms: u128,
    frontend: &'a FrontendReport,
}

/// The frontend's build version, recorded only as the native version it has to equal:
/// anything else the webview sends -- also text shaped like a version -- becomes
/// "mismatch", so the record never holds a string the webview chose.
fn version_label(frontend: &str, native: &str) -> String {
    if frontend == native {
        native.to_owned()
    } else {
        "mismatch".to_owned()
    }
}

/// An error's class name ("TypeError", "QuotaExceededError") passes; anything else --
/// a message, a path, user text -- becomes a fixed code.
fn diagnostic_code(raw: &str) -> String {
    let mut chars = raw.chars();
    let valid = raw.len() <= MAX_CODE_CHARS
        && chars
            .next()
            .is_some_and(|first| first.is_ascii_alphabetic())
        && chars.all(|rest| rest.is_ascii_alphanumeric());
    if valid {
        raw.to_owned()
    } else {
        "UnrecognizedError".to_owned()
    }
}

fn with_suffix(path: &Path, suffix: &str) -> PathBuf {
    let mut name = path.as_os_str().to_owned();
    name.push(suffix);
    PathBuf::from(name)
}

/// The file whose appearance ends a held smoke run.
pub(crate) fn quit_signal_path(report: &Path) -> PathBuf {
    with_suffix(report, ".quit")
}

/// Written beside the final name and renamed, so the harness never reads half a file.
fn write_atomically(path: &Path, bytes: &[u8]) -> io::Result<()> {
    let partial = with_suffix(path, ".partial");
    fs::write(&partial, bytes)?;
    fs::rename(&partial, path)
}

fn smoke_target() -> Option<PathBuf> {
    env::var_os(SMOKE_REPORT_ENV).map(PathBuf::from)
}

/// Under the smoke harness only: one stderr line per start milestone, with the time
/// since the process started, so a start that never reports shows how far it got
/// (native setup, page load started, page load finished). Normal runs print nothing.
pub(crate) fn trace<R: tauri::Runtime>(app: &tauri::AppHandle<R>, milestone: &str) {
    if smoke_target().is_none() {
        return;
    }
    let elapsed = app
        .try_state::<ProcessStart>()
        .map(|start| start.0.elapsed().as_millis())
        .unwrap_or_default();
    eprintln!("[startup] {milestone} after {elapsed} ms");
}

/// Writes a small smoke record next to the report; a failure is logged, never fatal.
fn write_beside_report(report: &Path, suffix: &str, value: &serde_json::Value) {
    let written = serde_json::to_vec(value)
        .map_err(io::Error::other)
        .and_then(|bytes| write_atomically(&with_suffix(report, suffix), &bytes));
    if let Err(error) = written {
        eprintln!("[smoke] {suffix} record not written: {error}");
    }
}

fn smoke_record_bytes(
    report: &FrontendReport,
    ready_after_ms: u128,
) -> serde_json::Result<Vec<u8>> {
    let report = FrontendReport {
        frontend_version: version_label(&report.frontend_version, env!("CARGO_PKG_VERSION")),
        error_code: report.error_code.as_deref().map(diagnostic_code),
        ..report.clone()
    };
    serde_json::to_vec_pretty(&SmokeRecord {
        schema: REPORT_SCHEMA,
        native_version: env!("CARGO_PKG_VERSION"),
        os: env::consts::OS,
        arch: env::consts::ARCH,
        ready_after_ms,
        frontend: &report,
    })
}

/// Called from `confirm_quit`: whether the frontend's save before the quit succeeded.
pub(crate) fn record_quit_ack(saved: Option<bool>) {
    let saved_text = match saved {
        Some(true) => "yes",
        Some(false) => "no",
        None => "unknown",
    };
    eprintln!("[quit] confirmed by the frontend (saved: {saved_text})");
    if let Some(report) = smoke_target() {
        let ack = serde_json::json!({ "schema": REPORT_SCHEMA, "saved": saved });
        write_beside_report(&report, ".quit-ack", &ack);
    }
}

/// Called once a second launch has made the running app show its window again. Focus
/// is recorded apart from visibility: a window manager may refuse it, and the smoke
/// test claims only that the window is shown again.
pub(crate) fn record_restore(visible: bool, focused: bool) {
    if let Some(report) = smoke_target() {
        let record =
            serde_json::json!({ "schema": REPORT_SCHEMA, "visible": visible, "focused": focused });
        write_beside_report(&report, ".restored", &record);
    }
}

fn hide_main_window(app: &AppHandle) -> bool {
    let Some(window) = app.get_webview_window("main") else {
        return false;
    };
    let _ = window.hide();
    window.is_visible().unwrap_or(true)
}

fn hold_until_signalled(app: AppHandle, report: PathBuf) {
    thread::spawn(move || {
        let deadline = Instant::now() + MAX_HOLD;
        let hide = with_suffix(&report, ".hide");
        let quit = quit_signal_path(&report);
        let mut hidden = false;
        while Instant::now() < deadline && !quit.exists() {
            if !hidden && hide.exists() {
                hidden = true;
                let still_visible = hide_main_window(&app);
                let record =
                    serde_json::json!({ "schema": REPORT_SCHEMA, "visible": still_visible });
                write_beside_report(&report, ".hidden", &record);
            }
            thread::sleep(QUIT_POLL_INTERVAL);
        }
        crate::request_quit(&app);
    });
}

/// Called by the frontend once its start has ended, whichever way it ended.
#[tauri::command]
pub(crate) fn frontend_ready(
    app: AppHandle,
    start: State<'_, ProcessStart>,
    report: FrontendReport,
) -> Result<(), String> {
    let ready_after_ms = start.0.elapsed().as_millis();
    eprintln!(
        "[startup] frontend reported {} after {ready_after_ms} ms",
        report.outcome.as_str()
    );
    let Some(target) = smoke_target() else {
        return Ok(());
    };
    let bytes = smoke_record_bytes(&report, ready_after_ms).map_err(|error| error.to_string())?;
    write_atomically(&target, &bytes)
        .map_err(|error| format!("smoke report not written: {error}"))?;
    if env::var_os(SMOKE_HOLD_ENV).is_some() {
        hold_until_signalled(app, target);
    } else {
        crate::request_quit(&app);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn report_json(extra: &str) -> String {
        format!(
            r#"{{"outcome":"newer-snapshot","frontendVersion":"1.12.1","view":"dialog","visible":true,"hydration":"backup","localOnly":true,"savedSnapshotPresent":false,"serviceWorkerControlled":false{extra}}}"#
        )
    }

    #[test]
    fn the_report_has_the_web_apps_field_names_and_values() {
        let report: FrontendReport = serde_json::from_str(&report_json("")).unwrap();
        assert_eq!(report.outcome, StartupOutcome::NewerSnapshot);
        assert_eq!(report.view, StartupView::Dialog);
        assert_eq!(report.hydration, StartupHydration::Backup);
        assert!(report.visible);
        assert!(report.local_only);
        assert!(!report.saved_snapshot_present);
        assert!(!report.service_worker_controlled);
        assert_eq!(report.error_code, None);
        assert_eq!(StartupOutcome::NewerSnapshot.as_str(), "newer-snapshot");
    }

    #[test]
    fn unknown_fields_and_outcomes_are_refused() {
        assert!(
            serde_json::from_str::<FrontendReport>(&report_json(r#","userData":"x""#)).is_err()
        );
        // The schema-1 free-text field is gone; a caller that still sends it is refused.
        assert!(serde_json::from_str::<FrontendReport>(&report_json(r#","detail":"x""#)).is_err());
        let unknown_outcome = report_json("").replace("newer-snapshot", "done");
        assert!(serde_json::from_str::<FrontendReport>(&unknown_outcome).is_err());
        let unknown_hydration = report_json("").replace("backup", "cloud");
        assert!(serde_json::from_str::<FrontendReport>(&unknown_hydration).is_err());
        // A schema-2 frontend omits the service-worker flag; the field is required.
        let without_flag = report_json("").replace(r#","serviceWorkerControlled":false"#, "");
        assert!(serde_json::from_str::<FrontendReport>(&without_flag).is_err());
    }

    #[test]
    fn only_an_error_class_name_reaches_the_record() {
        assert_eq!(diagnostic_code("TypeError"), "TypeError");
        assert_eq!(diagnostic_code("QuotaExceededError"), "QuotaExceededError");
        for raw in [
            "Error: secret note",
            "a b",
            "",
            "9Lives",
            "/home/user/x",
            &"A".repeat(65),
        ] {
            assert_eq!(diagnostic_code(raw), "UnrecognizedError", "{raw}");
        }
    }

    #[test]
    fn only_the_native_version_reaches_the_record() {
        let native = "1.12.1";
        assert_eq!(version_label("1.12.1", native), "1.12.1");
        for other in [
            "1.12.1-private-notes",
            "my notes",
            "1.12.0",
            "",
            "1.12.1 ",
            "1.12.1+x",
        ] {
            assert_eq!(version_label(other, native), "mismatch", "{other}");
        }
    }

    #[test]
    fn the_record_carries_the_native_side_and_only_a_code() {
        let report: FrontendReport =
            serde_json::from_str(&report_json(r#","errorCode":"Error: my plant notes""#)).unwrap();
        let record: serde_json::Value =
            serde_json::from_slice(&smoke_record_bytes(&report, 1234).unwrap()).unwrap();
        assert_eq!(record["schema"], REPORT_SCHEMA);
        assert_eq!(record["nativeVersion"], env!("CARGO_PKG_VERSION"));
        assert_eq!(record["readyAfterMs"], 1234);
        assert_eq!(record["frontend"]["outcome"], "newer-snapshot");
        assert_eq!(record["frontend"]["hydration"], "backup");
        assert_eq!(record["frontend"]["errorCode"], "UnrecognizedError");
    }

    #[test]
    fn the_report_file_appears_whole_and_the_signals_sit_beside_it() {
        let dir = env::temp_dir().join(format!("cannaguide-startup-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let target = dir.join("report.json");
        write_atomically(&target, b"{}").unwrap();
        assert_eq!(fs::read(&target).unwrap(), b"{}");
        assert!(!with_suffix(&target, ".partial").exists());
        assert_eq!(quit_signal_path(&target), dir.join("report.json.quit"));
        write_beside_report(&target, ".quit-ack", &serde_json::json!({ "saved": true }));
        let ack: serde_json::Value =
            serde_json::from_slice(&fs::read(dir.join("report.json.quit-ack")).unwrap()).unwrap();
        assert_eq!(ack["saved"], true);
        fs::remove_dir_all(&dir).unwrap();
    }
}
