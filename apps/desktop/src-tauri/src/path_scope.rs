//! Path scoping for the `export_data` / `import_data` commands.
//!
//! Those two commands take an absolute path straight from the webview and hand
//! it to `std::fs`. Custom `#[tauri::command]` functions are **not** covered by
//! the allow/deny lists in `capabilities/fs.json` -- those only constrain the
//! `fs:` plugin -- so before this module any script executing in the webview
//! could do:
//!
//! ```js
//! invoke('export_data', { path: '/home/u/.ssh/authorized_keys', data: key })
//! invoke('import_data', { path: '/etc/shadow' })
//! ```
//!
//! The frontend picks the path with a native dialog, but nothing binds the
//! invoked path to that dialog result, and the desktop CSP allows
//! `script-src 'unsafe-inline'`. Any HTML-injection bug therefore became
//! arbitrary local file read/write.
//!
//! The logic here is deliberately pure and filesystem-free so it can be unit
//! tested without a running Tauri app (the desktop app cannot be built on the
//! maintainer's machine). The filesystem-dependent parts -- resolving symlinked
//! parents and refusing to follow a symlinked target -- live in `lib.rs`.

use std::path::{Component, Path, PathBuf};

/// Extensions the app is allowed to read or write outside its own data dir.
/// Mirrors the dialog filters in `apps/web/services/tauriDialogService.ts` and
/// the `$DOCUMENT/**/*.json` / `$DOCUMENT/**/*.cannaguide` entries in
/// `capabilities/fs.json`.
pub const ALLOWED_EXTENSIONS: [&str; 2] = ["json", "cannaguide"];

#[derive(Debug, PartialEq, Eq)]
pub enum ScopeError {
    NotAbsolute,
    Traversal,
    HiddenComponent,
    BadExtension,
    OutsideRoots,
}

impl ScopeError {
    /// Message surfaced to the frontend. Deliberately does not echo the path:
    /// the caller already knows it, and an injected script should not get a
    /// filesystem oracle out of the error string.
    pub fn message(&self) -> &'static str {
        match self {
            ScopeError::NotAbsolute => "Path must be absolute.",
            ScopeError::Traversal => "Path must not contain '..' components.",
            ScopeError::HiddenComponent => "Path must not traverse hidden directories or files.",
            ScopeError::BadExtension => "Only .json and .cannaguide files may be read or written.",
            ScopeError::OutsideRoots => {
                "Path is outside the directories this app is allowed to access."
            }
        }
    }
}

/// Validate a candidate path against the permitted roots.
///
/// `candidate` is expected to be already normalised by the caller (parent
/// canonicalised, file name re-joined), so this performs no I/O.
///
/// Hidden components are rejected wholesale. That is what keeps `~/.ssh/...`,
/// `~/.config/...` and `~/.gnupg/...` out even when `$HOME` happens to sit
/// above a permitted root -- and it costs nothing, because none of the app's
/// own data lives in a dot-directory.
pub fn validate_scoped(candidate: &Path, roots: &[PathBuf]) -> Result<(), ScopeError> {
    if !candidate.is_absolute() {
        return Err(ScopeError::NotAbsolute);
    }

    for component in candidate.components() {
        match component {
            Component::ParentDir => return Err(ScopeError::Traversal),
            Component::Normal(part) => {
                if part.to_string_lossy().starts_with('.') {
                    return Err(ScopeError::HiddenComponent);
                }
            }
            _ => {}
        }
    }

    let extension = candidate
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase());

    match extension {
        Some(ext) if ALLOWED_EXTENSIONS.contains(&ext.as_str()) => {}
        _ => return Err(ScopeError::BadExtension),
    }

    // `starts_with` compares whole path components, so `/home/u/docs-evil`
    // does not match the root `/home/u/docs`.
    if roots.iter().any(|root| candidate.starts_with(root)) {
        Ok(())
    } else {
        Err(ScopeError::OutsideRoots)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn roots() -> Vec<PathBuf> {
        vec![
            PathBuf::from("/home/u/.local/share/cannaguide"),
            PathBuf::from("/home/u/Documents"),
            PathBuf::from("/home/u/Downloads"),
        ]
    }

    #[test]
    fn accepts_a_document_export() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents/backup.json"), &roots()),
            Ok(())
        );
    }

    #[test]
    fn accepts_a_nested_download_with_the_app_extension() {
        assert_eq!(
            validate_scoped(
                Path::new("/home/u/Downloads/grows/tent-a.cannaguide"),
                &roots()
            ),
            Ok(())
        );
    }

    #[test]
    fn accepts_uppercase_extension() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents/BACKUP.JSON"), &roots()),
            Ok(())
        );
    }

    #[test]
    fn rejects_the_ssh_authorized_keys_attack() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/.ssh/authorized_keys"), &roots()),
            Err(ScopeError::HiddenComponent)
        );
    }

    #[test]
    fn rejects_reading_system_files() {
        assert_eq!(
            validate_scoped(Path::new("/etc/shadow"), &roots()),
            Err(ScopeError::BadExtension)
        );
    }

    #[test]
    fn rejects_a_json_file_outside_every_root() {
        assert_eq!(
            validate_scoped(Path::new("/etc/config.json"), &roots()),
            Err(ScopeError::OutsideRoots)
        );
    }

    #[test]
    fn rejects_parent_traversal() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents/../.ssh/id_rsa.json"), &roots()),
            Err(ScopeError::Traversal)
        );
    }

    #[test]
    fn rejects_relative_paths() {
        assert_eq!(
            validate_scoped(Path::new("Documents/backup.json"), &roots()),
            Err(ScopeError::NotAbsolute)
        );
    }

    #[test]
    fn rejects_an_executable_masquerading_in_a_permitted_root() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents/payload.sh"), &roots()),
            Err(ScopeError::BadExtension)
        );
    }

    #[test]
    fn rejects_a_hidden_file_inside_a_permitted_root() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents/.secrets.json"), &roots()),
            Err(ScopeError::HiddenComponent)
        );
    }

    #[test]
    fn does_not_treat_a_sibling_prefix_as_inside_a_root() {
        // `/home/u/Documents-evil` shares a string prefix with `/home/u/Documents`
        // but is a different directory; component-wise `starts_with` must reject it.
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents-evil/loot.json"), &roots()),
            Err(ScopeError::OutsideRoots)
        );
    }

    #[test]
    fn rejects_an_extensionless_path() {
        assert_eq!(
            validate_scoped(Path::new("/home/u/Documents/backup"), &roots()),
            Err(ScopeError::BadExtension)
        );
    }
}
