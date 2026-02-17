"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  LogOut,
  QrCode as QrCodeIcon,
  History,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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
    <div className="bg-white rounded-xl p-6 mb-6 shadow-md border border-gray-200">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Info Session */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            {sessionName}
          </h1>
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Session ID:</span>
            <span className="text-sm font-mono px-3 py-1 bg-primary-50 text-primary-700 rounded-md border border-primary-200">
              {sessionId.slice(0, 8)}...
            </span>
          </div>

          {/* Lien invité */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={guestUrl}
              readOnly
              className="flex-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-300 text-sm font-mono text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-lg font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 flex items-center gap-2 border border-primary-300"
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

          {copied && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Lien copié dans le presse-papier
            </p>
          )}
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <QRCodeSVG
              value={guestUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
            <p className="text-center text-gray-700 text-xs mt-2 font-semibold">
              Scannez pour suggérer
            </p>
          </div>
        )}

        <button
          onClick={() => setShowQR(!showQR)}
          className="lg:hidden px-4 py-2 rounded-lg font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
        >
          <QrCodeIcon className="w-4 h-4" />
          {showQR ? "Masquer" : "Afficher"} QR
        </button>
      </div>

      {/* Navigation et actions */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 border border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 border border-gray-300"
          >
            <History className="w-4 h-4" />
            Historique
          </Link>
        </div>
        <button
          onClick={onEndSession}
          className="px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Terminer la session
        </button>
      </div>
    </div>
  );
}
