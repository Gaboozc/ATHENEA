import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import QRCode from "qrcode";
import { useLanguage } from "../../context/LanguageContext";
import { startSyncServer, stopSyncServer, isElectron } from "../../services/ElectronService";
import "./SyncQRModal.css";

export function SyncQRModal({ onClose }) {
  const { t } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [status, setStatus] = useState("generating");

  const state = useSelector((s) => s);

  useEffect(() => {
    generateQR();
    return () => {
      stopSyncServer();
    };
  }, []);

  const generateQR = async () => {
    try {
      setStatus("generating");

      const backup = {
        version: "1.0.1",
        timestamp: new Date().toISOString(),
        data: {
          tasks: state.tasks,
          wallets: state.wallets,
          debts: state.debts,
          budget: state.budget,
          userSettings: state.userSettings,
          checkins: state.checkins,
          routines: state.routines,
          projects: state.projects,
          focus: state.focus,
        },
      };

      const jsonData = JSON.stringify(backup);

      if (isElectron()) {
        const server = await startSyncServer(jsonData);
        if (!server?.url) {
          throw new Error("Sync server could not start");
        }

        setServerUrl(server.url);

        const qr = await QRCode.toDataURL(server.url, {
          width: 280,
          margin: 2,
          color: {
            dark: "#00d4ff",
            light: "#0a0d12",
          },
        });

        setQrDataUrl(qr);
        setStatus("ready");
        return;
      }

      const b64 = btoa(unescape(encodeURIComponent(jsonData)));
      const qr = await QRCode.toDataURL(`athenea://sync?data=${b64.substring(0, 500)}`, {
        width: 280,
        margin: 2,
      });

      setQrDataUrl(qr);
      setStatus("ready");
    } catch (err) {
      console.error("QR error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="sync-modal-overlay" onClick={onClose}>
      <div className="sync-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sync-modal-header">
          <h2>{t("Sync with mobile")}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="sync-modal-body">
          {status === "generating" && <div className="sync-loading">{t("Generating code...")}</div>}

          {status === "ready" && qrDataUrl && (
            <>
              <div className="sync-qr-container">
                <img src={qrDataUrl} alt="QR de sincronización" />
              </div>

              <p className="sync-instructions">
                1. {t("Open ATHENEA on your mobile")}
                <br />
                2. {t("Go to Settings -> Sync")}
                <br />
                3. {t("Scan this QR code")}
                <br />
                4. {t("Data will import automatically")}
              </p>

              {serverUrl && <p className="sync-url">{serverUrl}</p>}

              <p className="sync-warning">
                {t("Keep this window open while scanning from mobile. Make sure both devices are on same WiFi.")}
              </p>
            </>
          )}

          {status === "error" && (
            <div className="sync-error">
              {t("Error generating code.")}
              <button onClick={generateQR}>{t("Retry")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
