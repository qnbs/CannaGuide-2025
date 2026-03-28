const CONSENT_COOKIE_KEY = 'cg.gdpr.consent.v2'
const LEGACY_CONSENT_STORAGE_KEY = 'cg.gdpr.consent.v1'
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const readCookie = (name: string): string | null => {
    if (typeof document === 'undefined') {
        return null
    }

    const prefix = `${name}=`
    const entry = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))

    return entry ? decodeURIComponent(entry.slice(prefix.length)) : null
}

const writeCookie = (name: string, value: string, maxAgeSeconds: number): void => {
    if (typeof document === 'undefined') {
        return
    }

    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`
}

const deleteCookie = (name: string): void => {
    if (typeof document === 'undefined') {
        return
    }

    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
}

const readLegacyConsent = (): boolean => {
    try {
        return typeof localStorage !== 'undefined' && localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

export const consentService = {
    hasConsent(): boolean {
        const cookieValue = readCookie(CONSENT_COOKIE_KEY)
        if (cookieValue === '1') {
            return true
        }

        if (readLegacyConsent()) {
            writeCookie(CONSENT_COOKIE_KEY, '1', ONE_YEAR_IN_SECONDS)
            try {
                localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY)
            } catch {
                // Ignore storage failures during one-time migration.
            }
            return true
        }

        return false
    },

    grantConsent(): void {
        writeCookie(CONSENT_COOKIE_KEY, '1', ONE_YEAR_IN_SECONDS)
        try {
            localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY)
        } catch {
            // Ignore best-effort cleanup failures.
        }
    },

    revokeConsent(): void {
        deleteCookie(CONSENT_COOKIE_KEY)
        try {
            localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY)
        } catch {
            // Ignore best-effort cleanup failures.
        }
    },
}
