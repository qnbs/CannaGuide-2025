if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute('href') || './manifest.json'
        const scopeUrl = new URL('./', new URL(manifestHref, window.location.href))
        const swUrl = new URL('sw.js', scopeUrl)

        navigator.serviceWorker
            .register(swUrl.pathname, { scope: scopeUrl.pathname, updateViaCache: 'none' })
            .then((registration) => {
                console.log('ServiceWorker registration successful:', registration);

                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                }, { once: true });

                const dispatchSwUpdate = () => {
                    const event = new CustomEvent('swUpdate', { detail: registration });
                    window.dispatchEvent(event);
                };

                if (registration.waiting && navigator.serviceWorker.controller) {
                    dispatchSwUpdate();
                }

                // This logic checks for updates to the service worker.
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            // A new service worker is installed and waiting to activate.
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Dispatch a custom event that the React app can listen for.
                                dispatchSwUpdate();
                                console.log('[SW] New content is available and will be used when all tabs for this page are closed. Firing swUpdate event.');
                            }
                        });
                    }
                });

                const triggerUpdateCheck = () => {
                    registration.update().catch((error) => {
                        console.warn('[SW] Update check failed:', error);
                    });
                };

                triggerUpdateCheck();
                window.setInterval(triggerUpdateCheck, 5 * 60 * 1000);
                window.addEventListener('focus', triggerUpdateCheck);
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        triggerUpdateCheck();
                    }
                });
            })
            .catch((error) => {
                console.error('ServiceWorker registration failed:', error);
            });
    });
}