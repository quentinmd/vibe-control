"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Session } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { canCreateSession } from "@/lib/subscription-limits";
import HostDashboard from "@/components/HostDashboard";
import SessionHeader from "@/components/SessionHeader";
import {
  Music,
  Plus,
  Loader2,
  ArrowLeft,
  LogOut,
  Crown,
  History,
  User,
} from "lucide-react";

export default function HostPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Charger la session active quand l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      loadActiveSession(user.id);
    }
  }, [user]);

  const loadActiveSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("host_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setSession(data || null);
    } catch (error) {
      console.error("Erreur chargement session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !user) return;

    setLimitError(null);

    // Vérifier les limites d'abonnement
    const limitCheck = await canCreateSession(user.id);

    if (!limitCheck.allowed) {
      setLimitError(limitCheck.reason || "Limite de sessions atteinte");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert([
          {
            host_id: user.id,
            name: sessionName,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSession(data);
      setSessionName("");
    } catch (error) {
      console.error("Erreur création session:", error);
      alert("Erreur lors de la création de la session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;

    const confirmed = confirm(
      "Êtes-vous sûr de vouloir terminer cette session ?",
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", session.id);

      if (error) throw error;

      setSession(null);
    } catch (error) {
      console.error("Erreur fin session:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Ne rien afficher si pas d'utilisateur (redirection en cours)
  if (!user) {
    return null;
  }

  // Si l'utilisateur existe mais pas de profil, le créer
  if (user && !profile && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600 mb-4">Configuration de votre compte...</p>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
          Si cette page persiste, essayez de vous déconnecter et de vous
          reconnecter.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Recharger la page
          </button>
          <button
            onClick={() => {
              signOut();
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-md w-full">
          {/* Header avec profil */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Accueil
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <History className="w-4 h-4" />
                Historique
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            {/* Profil utilisateur */}
            <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {profile?.full_name?.[0]?.toUpperCase() ||
                    profile?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {profile?.full_name || profile?.email || "Utilisateur"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        profile?.subscription_tier === "pro"
                          ? "bg-accent-100 text-accent-700"
                          : profile?.subscription_tier === "premium"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {profile?.subscription_tier === "pro" && (
                        <Crown className="w-3 h-3" />
                      )}
                      {profile?.subscription_tier === "premium" && (
                        <Crown className="w-3 h-3" />
                      )}
                      Plan{" "}
                      {profile?.subscription_tier === "free"
                        ? "Gratuit"
                        : profile?.subscription_tier === "premium"
                          ? "Premium"
                          : "Pro"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <Music className="w-16 h-16 mx-auto mb-4 text-primary-600" />
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Créer une Session
              </h1>
              <p className="text-gray-600">
                Commencez votre soirée Vibe Control
              </p>
            </div>

            {/* Message d'erreur de limite */}
            {limitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">{limitError}</p>
                {profile?.subscription_tier === "free" && (
                  <Link
                    href="/#pricing"
                    className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Passer à Premium →
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Nom de la session
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ex: Soirée du Vendredi"
                  className="w-full bg-white px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-gray-900 placeholder-gray-400 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
                />
              </div>

              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || isCreating}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Créer la session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 lg:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <SessionHeader
          sessionId={session.id}
          sessionName={session.name}
          onEndSession={handleEndSession}
        />
        <HostDashboard session={session} />
      </div>
    </main>
  );
}
