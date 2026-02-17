"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, LogOut } from "lucide-react";

export default function LogoutPage() {
  const { signOut, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement si déjà déconnecté
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Forcer le nettoyage du cache
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Forcer la redirection même en cas d'erreur
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Déconnexion</h1>

        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className="text-gray-600">Déconnexion en cours...</span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Vous pouvez aussi accéder à cette page via{" "}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
              /logout
            </span>
          </p>
        </div>
      </div>

      {/* Instructions d'urgence */}
      <div className="mt-6 text-center max-w-md">
        <p className="text-xs text-gray-500">
          En cas de problème de chargement, cette page permet de forcer la
          déconnexion
        </p>
      </div>
    </div>
  );
}
