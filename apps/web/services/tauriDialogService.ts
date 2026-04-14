// ---------------------------------------------------------------------------
// Tauri Dialog Service -- native file dialogs for desktop
//
// Provides save/open file dialog wrappers that delegate to Tauri plugins.
// Falls back gracefully on web/PWA (returns null).
// ---------------------------------------------------------------------------

import { platform } from '@/services/platformService'

export interface TauriSaveResult {
    /** Absolute path chosen by the user, or null if canceled */
    path: string | null
}

export interface TauriOpenResult {
    /** Absolute path chosen by the user, or null if canceled */
    path: string | null
    /** File contents as UTF-8 string */
    content: string | null
}

/**
 * Open a native Save-File dialog and write data to the chosen path.
 * Returns the chosen path or null if the user cancels.
 * On web/PWA this is a no-op returning null.
 */
export async function saveFileDialog(
    data: string,
    defaultPath?: string | undefined,
): Promise<TauriSaveResult> {
    if (!platform.isTauri) return { path: null }

    try {
        const { save } = await import('@tauri-apps/plugin-dialog')
        const { invoke } = await import('@tauri-apps/api/core')

        const filePath = await save({
            defaultPath,
            filters: [
                { name: 'CannaGuide Data', extensions: ['json', 'cannaguide'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        })

        if (filePath === null) return { path: null }

        await invoke('export_data', { path: filePath, data })
        return { path: filePath }
    } catch {
        console.debug('[TauriDialog] Save dialog failed')
        return { path: null }
    }
}

/**
 * Open a native Open-File dialog and read the chosen file.
 * Returns the path and contents or null if the user cancels.
 * On web/PWA this is a no-op returning null.
 */
export async function openFileDialog(
    defaultPath?: string | undefined,
): Promise<TauriOpenResult> {
    if (!platform.isTauri) return { path: null, content: null }

    try {
        const { open } = await import('@tauri-apps/plugin-dialog')
        const { invoke } = await import('@tauri-apps/api/core')

        const filePath = await open({
            defaultPath,
            multiple: false,
            filters: [
                { name: 'CannaGuide Data', extensions: ['json', 'cannaguide'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        })

        if (filePath === null) return { path: null, content: null }

        const content = await invoke<string>('import_data', { path: filePath })
        return { path: filePath, content }
    } catch {
        console.debug('[TauriDialog] Open dialog failed')
        return { path: null, content: null }
    }
}
