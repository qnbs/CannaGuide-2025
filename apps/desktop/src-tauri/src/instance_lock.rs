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
//! claim; a crash releases it with the process.

use std::{
    fs::{self, File, OpenOptions, TryLockError},
    io,
    path::Path,
};

use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Resource, Runtime,
};

const LOCK_FILE: &str = ".instance.lock";

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

pub(crate) fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("instance-lock")
        .setup(|app, _api| {
            let dir = app.path().app_data_dir()?;
            match try_acquire(&dir) {
                Ok(Some(file)) => {
                    app.resources_table().add(InstanceLock { _file: file });
                }
                Ok(None) => {
                    eprintln!("[instance] another CannaGuide process holds this profile; exiting");
                    std::process::exit(0);
                }
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
    fn the_profile_folder_is_created_when_missing() {
        let dir = scratch("missing").join("nested");
        let held = try_acquire(&dir).unwrap();
        assert!(held.is_some());
        assert!(dir.join(LOCK_FILE).exists());
        drop(held);
        fs::remove_dir_all(dir.parent().unwrap()).unwrap();
    }
}
