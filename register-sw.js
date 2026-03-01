if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const scopeUrl = new URL('./', window.location.href)
        const swUrl = new URL('sw.js', scopeUrl)

        navigator.serviceWorker
            .register(swUrl.pathname, { scope: scopeUrl.pathname })
            .then((registration) => {
                console.log('ServiceWorker registration successful:', registration);

                // This logic checks for updates to the service worker.
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            // A new service worker is installed and waiting to activate.
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Dispatch a custom event that the React app can listen for.
                                const event = new CustomEvent('swUpdate', { detail: registration });
                                window.dispatchEvent(event);
                                console.log('[SW] New content is available and will be used when all tabs for this page are closed. Firing swUpdate event.');
                            }
                        });
                    }
                });
            })
            .catch((error) => {
                console.error('ServiceWorker registration failed:', error);
            });
    });
}