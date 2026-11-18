//! One process per profile, enforced before any window or webview exists.
//!
//! tauri-plugin-single-instance hands a second launch over to the running app, but not
//! in every case: without a D-Bus session bus (Linux) it launches normally, and two
//! cold launches on macOS can both find no listener and both start (the plugin checks
//! for a listener before it binds its socket). Two processes on one profile are two
//! writers on the same WebKit storage, which the web app's writer lock cannot see
//! across processes (GH #669).
//!
//! This plugin takes an exclusive lock on a file in the app data folder. Tauri sets up
//! plugins before it creates the configured windows (tauri `app.rs`, `setup`), so a
//! process that cannot take the lock exits before it has a webview. It exits without
//! `cleanup_before_exit`, which on macOS would remove the running app's socket.
//!
//! The lock lives in the resource table, so `cleanup_before_exit` releases it before a
//! restart (the updater does one), as it does for the single-instance plugin's own
//! claim; a crash releases it with the process. It is an OS lock (`flock` /
//! `LockFileEx`) on an open file, so there is no stale lock and no PID to check.
//!
//! A process that cannot take the lock still makes the running app show itself: it writes
//! `.focus-request` next to the lock, and the holder, which polls for it, shows its main
//! window once that exists. The single-instance callback uses the same request when two
//! launches race and the window is not created yet.

use std::{
    fs::{self, File, OpenOptions, TryLockError},
    io,
    path::{Path, PathBuf},
    thread,
    time::{Duration, Instant},
};

use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle, Manager, Resource, Runtime,
};

const LOCK_FILE: &str = ".instance.lock";
const FOCUS_REQUEST: &str = ".focus-request";
const FOCUS_POLL: Duration = Duration::from_millis(500);
/// Exit status of a launch whose handover failed: the running app was not asked to
/// show itself, so nothing the user can see happened -- a failed launch, not a clean one.
const HANDOVER_FAILED: i32 = 1;
/// How long a launch that found the profile taken waits for the outcome of its request.
/// The holder answers within one `FOCUS_POLL` once its window exists.
const HANDOVER_WAIT: Duration = Duration::from_secs(3);
const HANDOVER_POLL: Duration = Duration::from_millis(100);

struct InstanceLock {
    _file: File,
}

impl Resource for InstanceLock {}

/// `Some(file)` while this process holds the lock, `None` when another one does.
pub(crate) fn try_acquire(dir: &Path) -> io::Result<Option<File>> {
    fs::create_dir_all(dir)?;
    let file = OpenOptions::new()
        .create(true)
        .truncate(false)
        .write(true)
        .open(dir.join(LOCK_FILE))?;
    match file.try_lock() {
        Ok(()) => Ok(Some(file)),
        Err(TryLockError::WouldBlock) => Ok(None),
        Err(TryLockError::Error(error)) => Err(error),
    }
}

/// Asks the process that holds the lock to show its window.
pub(crate) fn request_focus(dir: &Path) -> io::Result<()> {
    fs::write(dir.join(FOCUS_REQUEST), b"")
}

/// What a launch that found the profile taken does next.
#[derive(Debug)]
enum Handover {
    /// Leave with this exit status.
    Exit(i32),
    /// The holder let go meanwhile (it was on its way out): this launch holds the lock
    /// now and starts instead.
    TakeOver(File),
}

/// A launch that found the profile taken asks the running app to show itself, then
/// waits at most `wait` for the outcome (Sourcery and CodeAnt on #884: the holder may
/// be exiting, and a request nobody is left to take must not count as a handover):
/// - the holder took the request: exit 0;
/// - the lock became free: nobody is left to take it, so this launch takes over and
///   its own watcher answers the request;
/// - neither by the deadline: exit 0 if the request is written (the holder is still
///   creating its window and answers it then), `HANDOVER_FAILED` if it could not be.
fn hand_over(dir: &Path, wait: Duration) -> Handover {
    let written = match request_focus(dir) {
        Ok(()) => true,
        Err(error) => {
            eprintln!("[instance] could not ask the running app to show itself: {error}");
            false
        }
    };
    let deadline = Instant::now() + wait;
    loop {
        if let Ok(Some(file)) = try_acquire(dir) {
            eprintln!("[instance] the running app has exited meanwhile; starting instead");
            return Handover::TakeOver(file);
        }
        if written && !dir.join(FOCUS_REQUEST).exists() {
            eprintln!("[instance] the running app took the request; exiting");
            return Handover::Exit(0);
        }
        if Instant::now() >= deadline {
            break;
        }
        thread::sleep(HANDOVER_POLL);
    }
    if written {
        eprintln!("[instance] the running app holds this profile and has the request; exiting");
        Handover::Exit(0)
    } else {
        eprintln!("[instance] the running app holds this profile but was not asked; exiting");
        Handover::Exit(HANDOVER_FAILED)
    }
}

/// This process holds the profile: keep the lock for its lifetime and answer requests.
fn hold<R: Runtime>(app: &AppHandle<R>, dir: PathBuf, file: File) {
    app.resources_table().add(InstanceLock { _file: file });
    crate::startup::trace(app, "profile lock taken");
    // A pending request is kept, not cleared: a launch racing this one may have just
    // written it (Codex on #881). One left by an earlier run only shows the window this
    // start shows anyway.
    watch_focus_requests(app.clone(), dir);
}

/// Consumes a pending focus request; true only for the caller that removed it.
pub(crate) fn take_focus_request(dir: &Path) -> bool {
    fs::remove_file(dir.join(FOCUS_REQUEST)).is_ok()
}

/// Shows and focuses the main window; false while it does not exist yet.
pub(crate) fn focus_main_window<R: Runtime>(app: &AppHandle<R>) -> bool {
    let Some(window) = app.get_webview_window("main") else {
        return false;
    };
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    crate::startup::record_restore(
        window.is_visible().unwrap_or(false),
        window.is_focused().unwrap_or(false),
    );
    true
}

/// A request is consumed only once the window exists, so one that arrives during the
/// start is answered as soon as the window is there.
fn watch_focus_requests<R: Runtime>(app: AppHandle<R>, dir: PathBuf) {
    thread::spawn(move || loop {
        thread::sleep(FOCUS_POLL);
        if app.get_webview_window("main").is_some() && take_focus_request(&dir) {
            focus_main_window(&app);
        }
    });
}

pub(crate) fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("instance-lock")
        .setup(|app, _api| {
            let dir = app.path().app_data_dir()?;
            match try_acquire(&dir) {
                Ok(Some(file)) => hold(app, dir, file),
                Ok(None) => match hand_over(&dir, HANDOVER_WAIT) {
                    Handover::TakeOver(file) => hold(app, dir, file),
                    Handover::Exit(status) => std::process::exit(status),
                },
                // A folder that cannot hold a lock file must not stop the start; the
                // single-instance plugin still covers the usual second launch.
                Err(error) => {
                    eprintln!("[instance] profile lock unavailable ({error}); starting without it");
                }
            }
            Ok(())
        })
        .build()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn scratch(name: &str) -> std::path::PathBuf {
        env::temp_dir().join(format!("cannaguide-lock-{name}-{}", std::process::id()))
    }

    #[test]
    fn a_second_holder_is_refused_until_the_first_lets_go() {
        let dir = scratch("exclusive");
        let first = try_acquire(&dir).unwrap();
        assert!(first.is_some(), "the first process takes the lock");
        // A separate open file description, as a second process would have.
        assert!(
            try_acquire(&dir).unwrap().is_none(),
            "a second holder is refused"
        );
        drop(first);
        assert!(
            try_acquire(&dir).unwrap().is_some(),
            "free again once released"
        );
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn of_simultaneous_attempts_exactly_one_gets_the_lock() {
        use std::sync::{Arc, Barrier};
        let dir = scratch("race");
        fs::create_dir_all(&dir).unwrap();
        for round in 0..5 {
            let barrier = Arc::new(Barrier::new(8));
            let attempts: Vec<_> = (0..8)
                .map(|_| {
                    let barrier = Arc::clone(&barrier);
                    let dir = dir.clone();
                    thread::spawn(move || {
                        barrier.wait();
                        try_acquire(&dir).unwrap()
                    })
                })
                .collect();
            // The holders are kept alive until all attempts are in, then released.
            let held: Vec<_> = attempts
                .into_iter()
                .map(|attempt| attempt.join().unwrap())
                .collect();
            let winners = held.iter().filter(|lock| lock.is_some()).count();
            assert_eq!(winners, 1, "round {round}: {winners} holders");
        }
        fs::remove_dir_all(&dir).unwrap();
    }

    /// A holder in another thread: keeps the lock, and after `after` either takes the
    /// pending request (an app with a window) or lets the lock go (an app exiting).
    fn holder(dir: &Path, after: Duration, takes_request: bool) -> thread::JoinHandle<()> {
        let lock = try_acquire(dir)
            .unwrap()
            .expect("the holder takes the lock");
        let dir = dir.to_path_buf();
        thread::spawn(move || {
            thread::sleep(after);
            if takes_request {
                assert!(take_focus_request(&dir));
                thread::sleep(Duration::from_millis(500));
            }
            drop(lock);
        })
    }

    #[test]
    fn a_handover_the_running_app_answers_exits_cleanly() {
        let dir = scratch("handover-answered");
        fs::create_dir_all(&dir).unwrap();
        let running = holder(&dir, Duration::from_millis(200), true);
        let outcome = hand_over(&dir, Duration::from_secs(3));
        assert!(matches!(outcome, Handover::Exit(0)), "{outcome:?}");
        running.join().unwrap();
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_launch_takes_over_when_the_running_app_exits_meanwhile() {
        let dir = scratch("handover-exited");
        fs::create_dir_all(&dir).unwrap();
        let exiting = holder(&dir, Duration::from_millis(200), false);
        let outcome = hand_over(&dir, Duration::from_secs(3));
        exiting.join().unwrap();
        let Handover::TakeOver(lock) = outcome else {
            panic!("expected a takeover, got {outcome:?}");
        };
        assert!(
            try_acquire(&dir).unwrap().is_none(),
            "this launch holds the lock now"
        );
        assert!(
            take_focus_request(&dir),
            "its own watcher has the request to answer"
        );
        drop(lock);
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_request_that_cannot_be_written_is_a_failed_launch() {
        let dir = scratch("handover-failed");
        fs::create_dir_all(&dir).unwrap();
        // A directory where the request file belongs: the write fails.
        fs::create_dir_all(dir.join(FOCUS_REQUEST)).unwrap();
        let lock = try_acquire(&dir)
            .unwrap()
            .expect("a running app holds the profile");
        let outcome = hand_over(&dir, Duration::from_millis(300));
        assert!(
            matches!(outcome, Handover::Exit(HANDOVER_FAILED)),
            "{outcome:?}"
        );
        assert_ne!(HANDOVER_FAILED, 0);
        drop(lock);
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_written_request_for_an_app_still_starting_exits_cleanly() {
        // The holder has no window yet, so it does not take the request in time.
        let dir = scratch("handover-starting");
        fs::create_dir_all(&dir).unwrap();
        let lock = try_acquire(&dir)
            .unwrap()
            .expect("a running app holds the profile");
        let outcome = hand_over(&dir, Duration::from_millis(300));
        assert!(matches!(outcome, Handover::Exit(0)), "{outcome:?}");
        assert!(
            take_focus_request(&dir),
            "the request waits for the holder's window"
        );
        drop(lock);
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_focus_request_is_taken_exactly_once() {
        let dir = scratch("focus");
        fs::create_dir_all(&dir).unwrap();
        assert!(!take_focus_request(&dir), "nothing pending");
        request_focus(&dir).unwrap();
        request_focus(&dir).unwrap();
        assert!(take_focus_request(&dir), "the request is taken");
        assert!(!take_focus_request(&dir), "and only once");
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn the_profile_folder_is_created_when_missing() {
        let dir = scratch("missing").join("nested");
        let held = try_acquire(&dir).unwrap();
        assert!(held.is_some());
        assert!(dir.join(LOCK_FILE).exists());
        drop(held);
        fs::remove_dir_all(dir.parent().unwrap()).unwrap();
    }
}
