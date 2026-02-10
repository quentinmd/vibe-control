"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, LogOut, QrCode as QrCodeIcon } from "lucide-react";

interface SessionHeaderProps {
  sessionId: string;
  sessionName: string;
  onEndSession: () => void;
}

export default function SessionHeader({
  sessionId,
  sessionName,
  onEndSession,
}: SessionHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(true);

  const guestUrl = `${window.location.origin}/guest/${sessionId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  return (
    <div className="bg-dark-card rounded-xl p-6 mb-6 border border-neon-violet/30">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Info Session */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neon-violet to-neon-cyan bg-clip-text text-transparent">
            {sessionName}
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            Session ID:{" "}
            <span className="text-neon-cyan font-mono">
              {sessionId.slice(0, 8)}...
            </span>
          </p>

          {/* Lien invité */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={guestUrl}
              readOnly
              className="flex-1 bg-dark-bg px-4 py-2 rounded-lg border border-neon-violet/30 text-sm font-mono focus:outline-none focus:border-neon-violet"
            />
            <button
              onClick={copyToClipboard}
              className="btn-neon btn-neon-primary flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG
              value={guestUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
            <p className="text-center text-dark-bg text-xs mt-2 font-semibold">
              Scannez pour suggérer
            </p>
          </div>
        )}

        <button
          onClick={() => setShowQR(!showQR)}
          className="lg:hidden btn-neon bg-dark-bg border border-neon-violet/30 flex items-center gap-2"
        >
          <QrCodeIcon className="w-4 h-4" />
          {showQR ? "Masquer" : "Afficher"} QR
        </button>
      </div>

      {/* Bouton terminer session */}
      <div className="mt-6 pt-6 border-t border-neon-violet/20">
        <button
          onClick={onEndSession}
          className="btn-neon bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Terminer la session
        </button>
      </div>
    </div>
  );
}
