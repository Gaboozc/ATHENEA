import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import "./SyncQRModal.css";

export function SyncImportModal({ onClose }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("idle");
  const [url, setUrl] = useState("");

  const importFromUrl = async (syncUrl) => {
    try {
      setStatus("loading");
      const res = await fetch(syncUrl);
      if (!res.ok) throw new Error("Error al conectar");
      const backup = await res.json();
      await applyBackup(backup);
      setStatus("success");
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error("Import error:", err);
      setStatus("error");
    }
  };

  const applyBackup = async (backup) => {
    if (!backup?.data) return;
    const { data } = backup;

    // Guarda slices clave para que redux-persist recargue en el reinicio.
    if (data.tasks) {
      localStorage.setItem("persist:tasks", JSON.stringify(data.tasks));
    }
    if (data.wallets) {
      localStorage.setItem("persist:wallets", JSON.stringify(data.wallets));
    }
    if (data.userSettings) {
      localStorage.setItem("persist:userSettings", JSON.stringify(data.userSettings));
    }
    if (data.projects) {
      localStorage.setItem("persist:projects", JSON.stringify(data.projects));
    }
    if (data.debts) {
      localStorage.setItem("persist:debts", JSON.stringify(data.debts));
    }
    if (data.budget) {
      localStorage.setItem("persist:budget", JSON.stringify(data.budget));
    }
    if (data.routines) {
      localStorage.setItem("persist:routines", JSON.stringify(data.routines));
    }
    if (data.checkins) {
      localStorage.setItem("persist:checkins", JSON.stringify(data.checkins));
    }
    if (data.focus) {
      localStorage.setItem("persist:focus", JSON.stringify(data.focus));
    }

    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="sync-modal-overlay" onClick={onClose}>
      <div className="sync-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sync-modal-header">
          <h2>{t("Import from desktop")}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="sync-modal-body">
          {status === "idle" && (
            <>
              <p className="sync-instructions">{t("Enter the URL shown in desktop QR:")}</p>
              <input
                type="url"
                className="sync-url-input"
                placeholder="http://192.168.x.x:7432/sync"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                className="settings-btn primary sync-import-btn"
                onClick={() => importFromUrl(url)}
                disabled={!url}
              >
                {t("Import data")}
              </button>
            </>
          )}

          {status === "loading" && <div className="sync-loading">{t("Importing data...")}</div>}

          {status === "success" && <div className="sync-success">✓ {t("Data imported successfully")}</div>}

          {status === "error" && (
            <div className="sync-error">
              {t("Error importing. Verify URL and both devices on same WiFi.")}
              <button onClick={() => setStatus("idle")}>{t("Retry")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
