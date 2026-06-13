function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function canRegisterServiceWorker() {
  return (
    "serviceWorker" in navigator &&
    (window.location.protocol === "https:" || isLocalhost(window.location.hostname))
  );
}

export function registerServiceWorker() {
  if (!canRegisterServiceWorker()) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  });
}
