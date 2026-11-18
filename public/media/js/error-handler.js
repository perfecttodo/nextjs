(function () {
    'use strict';
    window.addEventListener('unhandledrejection', (e) => {
        console.error('[Global] Promise:', e.reason);
        e.preventDefault();
    });
    window.addEventListener('error', (e) => {
        console.error('[Global] Error:', e.error || e.message);
    });
})();