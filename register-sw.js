if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
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