import { useState } from "react";
import {
  applyPwaUpdate,
  promptPwaInstall,
} from "@/pwa/registerServiceWorker";
import { usePwaStatus } from "@/pwa/usePwaStatus";

export default function PwaStatusBar() {
  const status = usePwaStatus();
  const [isPromptingInstall, setIsPromptingInstall] = useState(false);

  const handleInstall = async () => {
    setIsPromptingInstall(true);

    try {
      await promptPwaInstall();
    } finally {
      setIsPromptingInstall(false);
    }
  };

  const pwaLabel = status.isServiceWorkerSupported
    ? status.isSecureContext
      ? status.isOfflineReady
        ? "Offline Ready"
        : "Preparing Offline"
      : "HTTPS Needed"
    : "Browser Limited";

  return (
    <div className="pwa-status-bar" aria-live="polite">
      <span
        className={`pwa-status-pill ${
          status.isOnline ? "is-online" : "is-offline"
        }`}
      >
        {status.isOnline ? "Online" : "Offline"}
      </span>

      <span className="pwa-status-pill">{pwaLabel}</span>

      {status.isInstalled ? (
        <span className="pwa-status-pill">Installed</span>
      ) : null}

      {status.isInstallable ? (
        <button
          type="button"
          className="pwa-status-button"
          onClick={handleInstall}
          disabled={isPromptingInstall}
        >
          {isPromptingInstall ? "Installing..." : "Install"}
        </button>
      ) : null}

      {status.isUpdateAvailable ? (
        <button
          type="button"
          className="pwa-status-button"
          onClick={applyPwaUpdate}
        >
          Update
        </button>
      ) : null}
    </div>
  );
}
