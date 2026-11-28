# AI history lifecycle

The **Clear AI History on Exit** setting covers saved Mentor and Advisor replies in the Redux `archives` slice. It does not clear transient chat text, AI-derived planner values, generated files, or exports that a user has already saved outside CannaGuide.

When the setting is enabled, the app listens for the browser or desktop `pagehide` close signal. It clears the two archive collections in memory before requesting a persisted snapshot. Hiding a tab is not treated as closing the app.

Browser storage writes are asynchronous and a browser may stop the page before a write finishes. CannaGuide records a payload-free pending marker before the write. If the next launch sees that marker, it suppresses the saved archives before rendering hydrated state and retries persistence during startup. When the cross-tab recovery lock is available, recognized backup, quarantine, and recovery-rollback snapshots are selectively cleared and read back. A snapshot whose format cannot be safely recognized is preserved. The retry marker is removed after an archive-free active snapshot is saved, so it cannot erase archives created during a later session; an inaccessible recovery copy may still retain an older archive.

This setting is a best-effort app storage cleanup, not secure erasure from browser-managed backups, filesystem snapshots, or user-created exports.
