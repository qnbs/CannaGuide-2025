import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'com.cannaguide.app',
    appName: 'CannaGuide 2025',
    webDir: 'apps/web/dist',
    bundledWebRuntime: false,
    server: {
        androidScheme: 'https',
    },
}

export default config
