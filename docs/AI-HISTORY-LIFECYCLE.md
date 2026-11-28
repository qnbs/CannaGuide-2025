# AI history lifecycle

The **Clear Saved AI Archives on Exit** setting covers saved Mentor and Advisor replies in the Redux `archives` slice. It does not clear transient chat text, AI-derived planner values, generated files, or exports that a user has already saved outside CannaGuide.

When the setting is enabled, the app listens for the browser or desktop `pagehide` close signal. It clears the two archive collections in memory only after the payload-free retry marker is stored, then requests a persisted snapshot. If storage cannot record the marker, the active archives are left unchanged. A page entering the back-forward cache and a hidden tab are not treated as closing the app.

Browser storage writes are asynchronous and a browser may stop the page before a write finishes. The marker has two phases: `1` means the active snapshot still needs clearing; `2` means the active snapshot is safe and only recovery copies remain. A phase `1` marker suppresses the saved archives before rendering hydrated state. After the active snapshot is committed, startup retries process phase `2` without clearing archives created during a later session. When the cross-tab recovery lock is available, recognized backup, quarantine, and recovery-rollback snapshots are selectively cleared and read back. A read, write, or verification failure keeps the phase `2` marker for another retry. A snapshot whose format cannot be safely recognized is preserved; opaque recovery data may retain an older archive, and does not keep the cleanup marker indefinitely.

This setting is a best-effort app storage cleanup, not secure erasure from browser-managed backups, filesystem snapshots, or user-created exports.
