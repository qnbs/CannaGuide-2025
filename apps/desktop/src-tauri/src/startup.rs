//! The frontend's startup report, and the hooks the desktop runtime smoke test
//! (`scripts/desktop-smoke.mjs`) drives the packaged app through.
//!
//! The frontend calls `frontend_ready` once, at the end of its start
//! (`apps/web/services/desktopStartupReport.ts`). Normally that only prints one line.
//! With `CANNAGUIDE_SMOKE_REPORT` set -- by the test harness, never by the app -- the
//! report is also written to that file, and the app then quits through the normal
//! quit handshake (`request_quit`), or, with `CANNAGUIDE_SMOKE_HOLD` set as well, once
//! `<report>.quit` exists. So one launch proves the native start, a rendered bundle,
//! IPC in both directions and a flushed, clean quit.
//!
//! Trust: like every app command, `frontend_ready` is callable by webview code.
//! Without the environment variable it only prints the outcome; the file path never
//! comes from the webview, and the report has a fixed schema with no user data.

use std::{
    env, fs, io,
    path::{Path, PathBuf},
    thread,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

pub(crate) const SMOKE_REPORT_ENV: &str = "CANNAGUIDE_SMOKE_REPORT";
pub(crate) const SMOKE_HOLD_ENV: &str = "CANNAGUIDE_SMOKE_HOLD";
const QUIT_POLL_INTERVAL: Duration = Duration::from_millis(200);
/// A held smoke run quits by itself after this, so a lost harness leaves no process.
const MAX_HOLD: Duration = Duration::from_secs(600);
const MAX_DETAIL_CHARS: usize = 300;
const REPORT_SCHEMA: u32 = 1;

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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct FrontendReport {
    outcome: StartupOutcome,
    frontend_version: String,
    view: StartupView,
    local_only: bool,
    saved_snapshot_present: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    detail: Option<String>,
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

fn smoke_record_bytes(
    report: &FrontendReport,
    ready_after_ms: u128,
) -> serde_json::Result<Vec<u8>> {
    let report = FrontendReport {
        detail: report
            .detail
            .as_ref()
            .map(|detail| detail.chars().take(MAX_DETAIL_CHARS).collect()),
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

fn quit_when_signalled(app: AppHandle, signal: PathBuf) {
    thread::spawn(move || {
        let deadline = Instant::now() + MAX_HOLD;
        while Instant::now() < deadline && !signal.exists() {
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
    let Some(target) = env::var_os(SMOKE_REPORT_ENV).map(PathBuf::from) else {
        return Ok(());
    };
    let bytes = smoke_record_bytes(&report, ready_after_ms).map_err(|error| error.to_string())?;
    write_atomically(&target, &bytes)
        .map_err(|error| format!("smoke report not written: {error}"))?;
    if env::var_os(SMOKE_HOLD_ENV).is_some() {
        quit_when_signalled(app, quit_signal_path(&target));
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
            r#"{{"outcome":"newer-snapshot","frontendVersion":"1.12.1","view":"dialog","localOnly":true,"savedSnapshotPresent":false{extra}}}"#
        )
    }

    #[test]
    fn the_report_has_the_web_apps_field_names_and_values() {
        let report: FrontendReport = serde_json::from_str(&report_json("")).unwrap();
        assert_eq!(report.outcome, StartupOutcome::NewerSnapshot);
        assert_eq!(report.view, StartupView::Dialog);
        assert!(report.local_only);
        assert!(!report.saved_snapshot_present);
        assert_eq!(report.detail, None);
        assert_eq!(StartupOutcome::NewerSnapshot.as_str(), "newer-snapshot");
    }

    #[test]
    fn unknown_fields_and_outcomes_are_refused() {
        assert!(
            serde_json::from_str::<FrontendReport>(&report_json(r#","userData":"x""#)).is_err()
        );
        let unknown_outcome = report_json("").replace("newer-snapshot", "done");
        assert!(serde_json::from_str::<FrontendReport>(&unknown_outcome).is_err());
    }

    #[test]
    fn the_record_carries_the_native_side_and_a_bounded_detail() {
        let mut report: FrontendReport = serde_json::from_str(&report_json("")).unwrap();
        report.detail = Some("x".repeat(MAX_DETAIL_CHARS + 50));
        let record: serde_json::Value =
            serde_json::from_slice(&smoke_record_bytes(&report, 1234).unwrap()).unwrap();
        assert_eq!(record["schema"], REPORT_SCHEMA);
        assert_eq!(record["nativeVersion"], env!("CARGO_PKG_VERSION"));
        assert_eq!(record["readyAfterMs"], 1234);
        assert_eq!(record["frontend"]["outcome"], "newer-snapshot");
        assert_eq!(
            record["frontend"]["detail"]
                .as_str()
                .unwrap()
                .chars()
                .count(),
            MAX_DETAIL_CHARS
        );
    }

    #[test]
    fn the_report_file_appears_whole_and_the_quit_signal_sits_beside_it() {
        let dir = env::temp_dir().join(format!("cannaguide-startup-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let target = dir.join("report.json");
        write_atomically(&target, b"{}").unwrap();
        assert_eq!(fs::read(&target).unwrap(), b"{}");
        assert!(!with_suffix(&target, ".partial").exists());
        assert_eq!(quit_signal_path(&target), dir.join("report.json.quit"));
        fs::remove_dir_all(&dir).unwrap();
    }
}
