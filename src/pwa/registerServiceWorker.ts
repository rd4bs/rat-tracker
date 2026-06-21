type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaStatusSnapshot = {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isOfflineReady: boolean;
  isUpdateAvailable: boolean;
  isSecureContext: boolean;
  isServiceWorkerSupported: boolean;
};

type PwaStatusListener = (snapshot: PwaStatusSnapshot) => void;

let hasStarted = false;
let installPromptEvent: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;
let shouldReloadOnControllerChange = false;

const listeners = new Set<PwaStatusListener>();

const status: PwaStatusSnapshot = {
  isOnline: navigator.onLine,
  isInstalled: isStandaloneMode(),
  isInstallable: false,
  isOfflineReady: false,
  isUpdateAvailable: false,
  isSecureContext: hasSecurePwaContext(),
  isServiceWorkerSupported: "serviceWorker" in navigator,
};

function isLocalhost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

function hasSecurePwaContext() {
  return window.location.protocol === "https:" || isLocalhost(window.location.hostname);
}

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function canRegisterServiceWorker() {
  return status.isServiceWorkerSupported && status.isSecureContext;
}

function emitStatus(nextStatus: Partial<PwaStatusSnapshot>) {
  Object.assign(status, nextStatus);
  const snapshot = getPwaStatus();
  listeners.forEach((listener) => listener(snapshot));
}

function watchInstallingWorker(registration: ServiceWorkerRegistration) {
  const installingWorker = registration.installing;
  if (!installingWorker) return;

  installingWorker.addEventListener("statechange", () => {
    if (installingWorker.state !== "installed") return;

    if (navigator.serviceWorker.controller) {
      waitingWorker = installingWorker;
      emitStatus({ isUpdateAvailable: true });
      return;
    }

    emitStatus({ isOfflineReady: true });
  });
}

function bindInstallPromptEvents() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event as BeforeInstallPromptEvent;
    emitStatus({ isInstallable: true });
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    emitStatus({
      isInstalled: true,
      isInstallable: false,
    });
  });
}

function bindNetworkEvents() {
  window.addEventListener("online", () => emitStatus({ isOnline: true }));
  window.addEventListener("offline", () => emitStatus({ isOnline: false }));
}

export function getPwaStatus() {
  return { ...status };
}

export function subscribePwaStatus(listener: PwaStatusListener) {
  listeners.add(listener);
  listener(getPwaStatus());

  return () => {
    listeners.delete(listener);
  };
}

export async function promptPwaInstall() {
  if (!installPromptEvent) return false;

  const promptEvent = installPromptEvent;
  installPromptEvent = null;
  emitStatus({ isInstallable: false });

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  return choice.outcome === "accepted";
}

export function applyPwaUpdate() {
  if (!waitingWorker) return;

  shouldReloadOnControllerChange = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

export function registerServiceWorker() {
  if (hasStarted) return;
  hasStarted = true;

  bindNetworkEvents();
  bindInstallPromptEvents();

  if (!canRegisterServiceWorker()) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (shouldReloadOnControllerChange) {
      window.location.reload();
    }
  });

  window.addEventListener("load", () => {
    const baseUrl = import.meta.env.BASE_URL;

    navigator.serviceWorker
      .register(`${baseUrl}sw.js`, { scope: baseUrl })
      .then((registration) => {
        if (registration.active || navigator.serviceWorker.controller) {
          emitStatus({ isOfflineReady: true });
        }

        if (registration.waiting) {
          waitingWorker = registration.waiting;
          emitStatus({ isUpdateAvailable: true });
        }

        registration.addEventListener("updatefound", () =>
          watchInstallingWorker(registration)
        );
      })
      .catch((error) => {
        console.error("Failed to register service worker:", error);
      });
  });
}
