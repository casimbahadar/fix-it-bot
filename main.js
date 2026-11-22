/* Fix-It Bot — start up, and register the offline helper so it works from the Home Screen. */
(function () {
  'use strict';
  window.FIB.App.start();
  // First tap anywhere wakes up sound (phones block sound until a person taps).
  document.addEventListener('pointerdown', function () { window.FIB.Voice.unlock(); }, { once: true, capture: true });
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode unavailable; the app still works online */ });
  }
})();
