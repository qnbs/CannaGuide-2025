//! Pure state for the quit handshake and the update flow. No Tauri types, so the
//! rules run under `cargo test --lib` without a window or a webview.

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

/// How long a quit waits for the web frontend to confirm that persisted state is
/// flushed before the app exits anyway (a frontend that never loaded, or hangs).
pub const QUIT_FLUSH_TIMEOUT: Duration = Duration::from_secs(5);

/// What a quit request should do now.
#[derive(Debug, PartialEq, Eq)]
pub enum QuitDecision {
    /// The flush is confirmed (or timed out): let the app exit.
    Exit,
    /// First request: hold the quit and ask the frontend to flush.
    AskFrontend,
    /// A flush request is already pending: keep holding.
    Wait,
}

/// Quit handshake. Every user-initiated quit (tray, close button, Cmd+Q) first asks
/// the frontend to flush; only its confirmation or the timeout lets the app exit.
/// Before this, the tray quit exited after a fixed 250 ms and the close button did
/// not wait at all, so a pending IndexedDB write could be cut off.
#[derive(Default)]
pub struct QuitGate {
    requested: AtomicBool,
    confirmed: AtomicBool,
}

impl QuitGate {
    /// A user asked to quit.
    pub fn request(&self) -> QuitDecision {
        if self.confirmed.load(Ordering::SeqCst) {
            return QuitDecision::Exit;
        }
        if self.requested.swap(true, Ordering::SeqCst) {
            QuitDecision::Wait
        } else {
            QuitDecision::AskFrontend
        }
    }

    /// The frontend confirmed the flush, or the timeout fired. True only for the
    /// first confirmation of a pending request: a confirmation nobody asked for
    /// (a stray or scripted call) never exits the app.
    pub fn confirm(&self) -> bool {
        self.requested.load(Ordering::SeqCst) && !self.confirmed.swap(true, Ordering::SeqCst)
    }

    /// Whether the app may exit without asking again.
    pub fn is_confirmed(&self) -> bool {
        self.confirmed.load(Ordering::SeqCst)
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
