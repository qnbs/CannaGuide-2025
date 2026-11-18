//! Pure state for the quit handshake and the update flow. No Tauri types, so the
//! rules run under `cargo test --lib` without a window or a webview.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::time::Duration;

/// How long a quit waits for the web frontend to confirm that persisted state is
/// flushed before the app exits anyway (a frontend that never loaded, or hangs). The
/// frontend saves up to three times while changes keep arriving, so a large snapshot
/// on a slow device needs this headroom; the window stays open meanwhile.
pub const QUIT_FLUSH_TIMEOUT: Duration = Duration::from_secs(10);

/// A check is one small request; without a deadline a stalled one would hold the
/// update guard until the app restarts.
pub const UPDATE_CHECK_TIMEOUT: Duration = Duration::from_secs(30);

/// A whole download (reqwest counts the body too): generous enough for a 100 MB
/// bundle on a slow link. The card's Cancel stops it sooner.
pub const UPDATE_DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(20 * 60);

/// Whether a new check may keep the bundle already downloaded and verified: only
/// when it reports the same version. A later check (the startup one, say) must not
/// throw away a finished download; `install()` verifies the bytes again regardless.
pub fn keeps_download(previous_version: Option<&str>, next_version: Option<&str>) -> bool {
    matches!((previous_version, next_version), (Some(previous), Some(next)) if previous == next)
}

/// What a quit request should do now.
#[derive(Debug, PartialEq, Eq)]
pub enum QuitDecision {
    /// The flush is confirmed (or timed out): let the app exit.
    Exit,
    /// First request: hold the quit and ask the frontend to flush.
    AskFrontend,
    /// A flush request is already pending: keep holding.
    Wait,
    /// An update is installing: the quit is remembered and held until it ends.
    Held,
}

/// What a failed install leaves to do with quits that arrived while it ran.
#[derive(Debug, PartialEq, Eq)]
pub enum AfterInstall {
    /// Nothing was asked.
    Nothing,
    /// A quit's save had already been confirmed: exit now.
    Exit,
    /// A quit was asked but not yet saved: start (or keep) its handshake.
    Request,
}

#[derive(Default)]
struct GateState {
    requested: bool,
    confirmed: bool,
    installing: bool,
    held_request: bool,
    held_exit: bool,
}

/// Quit handshake. Every user-initiated quit (tray, close button, Cmd+Q) first asks
/// the frontend to flush; only its confirmation or the timeout lets the app exit.
/// Before this, the tray quit exited after a fixed 250 ms and the close button did
/// not wait at all, so a pending IndexedDB write could be cut off.
///
/// While an update installs, no quit path may end the process: the install ends it
/// itself, after its own final save. A new request, and the confirmation or timeout
/// of a handshake that started before the install, are remembered and held; a failed
/// install hands them back (`install_failed`). One lock covers all of it, so starting
/// an install and confirming a quit cannot interleave (Codex and CodeAnt on #878).
#[derive(Default)]
pub struct QuitGate {
    state: Mutex<GateState>,
}

impl QuitGate {
    fn lock(&self) -> MutexGuard<'_, GateState> {
        self.state
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// A user asked to quit.
    pub fn request(&self) -> QuitDecision {
        let mut state = self.lock();
        if state.confirmed {
            return QuitDecision::Exit;
        }
        if state.installing {
            state.held_request = true;
            return QuitDecision::Held;
        }
        if state.requested {
            QuitDecision::Wait
        } else {
            state.requested = true;
            QuitDecision::AskFrontend
        }
    }

    /// The frontend confirmed the flush, or the timeout fired. True only for the
    /// first confirmation of a pending request, and never while an update installs
    /// (then it is remembered): a confirmation nobody asked for (a stray or scripted
    /// call) never exits the app.
    pub fn confirm(&self) -> bool {
        let mut state = self.lock();
        if !state.requested || state.confirmed {
            return false;
        }
        if state.installing {
            state.held_exit = true;
            return false;
        }
        state.confirmed = true;
        true
    }

    /// Whether the app may exit without asking again.
    pub fn is_confirmed(&self) -> bool {
        self.lock().confirmed
    }

    /// Marks an install as running. False when the app is already exiting: the
    /// install must not start then.
    pub fn begin_install(&self) -> bool {
        let mut state = self.lock();
        if state.confirmed {
            return false;
        }
        state.installing = true;
        true
    }

    /// The install failed, so the app keeps running: quits held meanwhile go on.
    pub fn install_failed(&self) -> AfterInstall {
        let mut state = self.lock();
        state.installing = false;
        let held_request = std::mem::take(&mut state.held_request);
        if std::mem::take(&mut state.held_exit) {
            state.confirmed = true;
            AfterInstall::Exit
        } else if held_request {
            AfterInstall::Request
        } else {
            AfterInstall::Nothing
        }
    }
}

/// Allows one update step (check, download, install) at a time, so two clicks or
/// a startup check racing a manual one cannot run two downloads or installs.
#[derive(Default)]
pub struct Busy(AtomicBool);

/// Holds [`Busy`] until dropped, also when the step fails or returns early.
pub struct BusyGuard<'a>(&'a AtomicBool);

impl Busy {
    pub fn try_acquire(&self) -> Option<BusyGuard<'_>> {
        if self.0.swap(true, Ordering::SeqCst) {
            None
        } else {
            Some(BusyGuard(&self.0))
        }
    }
}

impl Drop for BusyGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_first_quit_asks_the_frontend_and_later_ones_wait() {
        let gate = QuitGate::default();
        assert_eq!(gate.request(), QuitDecision::AskFrontend);
        assert_eq!(gate.request(), QuitDecision::Wait);
        assert!(!gate.is_confirmed());
    }

    #[test]
    fn a_confirmed_flush_lets_the_app_exit_once() {
        let gate = QuitGate::default();
        gate.request();
        assert!(gate.confirm());
        // The timeout firing after the frontend confirmed must not exit twice.
        assert!(!gate.confirm());
        assert!(gate.is_confirmed());
        assert_eq!(gate.request(), QuitDecision::Exit);
    }

    #[test]
    fn a_confirmation_without_a_quit_request_is_ignored() {
        let gate = QuitGate::default();
        assert!(!gate.confirm());
        assert!(!gate.is_confirmed());
        assert_eq!(gate.request(), QuitDecision::AskFrontend);
    }

    #[test]
    fn a_quit_during_an_install_is_held_and_comes_back_if_the_install_fails() {
        let gate = QuitGate::default();
        assert!(gate.begin_install());
        assert_eq!(gate.request(), QuitDecision::Held);
        assert!(!gate.is_confirmed());
        assert_eq!(gate.install_failed(), AfterInstall::Request);
        // The handshake then starts as usual.
        assert_eq!(gate.request(), QuitDecision::AskFrontend);
    }

    #[test]
    fn a_save_confirmed_during_an_install_exits_only_after_it_failed() {
        let gate = QuitGate::default();
        assert_eq!(gate.request(), QuitDecision::AskFrontend);
        // The install starts while the quit's save is still running.
        assert!(gate.begin_install());
        // Its confirmation (or the timeout) must not end the install.
        assert!(!gate.confirm());
        assert!(!gate.is_confirmed());
        assert_eq!(gate.install_failed(), AfterInstall::Exit);
        assert!(gate.is_confirmed());
        assert_eq!(gate.request(), QuitDecision::Exit);
    }

    #[test]
    fn an_install_does_not_start_once_the_app_is_exiting() {
        let gate = QuitGate::default();
        gate.request();
        assert!(gate.confirm());
        assert!(!gate.begin_install());
    }

    #[test]
    fn an_install_that_fails_without_any_quit_changes_nothing() {
        let gate = QuitGate::default();
        assert!(gate.begin_install());
        assert_eq!(gate.install_failed(), AfterInstall::Nothing);
        assert_eq!(gate.request(), QuitDecision::AskFrontend);
    }

    #[test]
    fn a_new_check_keeps_the_download_only_for_the_same_version() {
        assert!(keeps_download(Some("1.12.0"), Some("1.12.0")));
        assert!(!keeps_download(Some("1.12.0"), Some("1.12.1")));
        assert!(!keeps_download(Some("1.12.0"), None));
        assert!(!keeps_download(None, Some("1.12.0")));
        assert!(!keeps_download(None, None));
    }

    #[test]
    fn only_one_update_step_runs_at_a_time() {
        let busy = Busy::default();
        let first = busy.try_acquire();
        assert!(first.is_some());
        assert!(busy.try_acquire().is_none());
        drop(first);
        // Released on drop, including after an error or an early return.
        assert!(busy.try_acquire().is_some());
    }
}
