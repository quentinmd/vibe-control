"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserUsageStats } from "@/lib/subscription-limits";
import { supabase } from "@/lib/supabase";
import {
  Music,
  Crown,
  Settings,
  Calendar,
  Users,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface SessionData {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  ended_at: string | null;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Charger les sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Charger les statistiques
      const statsData = await getUserUsageStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur: " + (data.error || "Impossible de créer la session"));
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      alert("Erreur lors de la création de la session de gestion");
    } finally {
      setManagingSubscription(false);
    }
  };

  // Timeout automatique pour éviter le loading infini
  useEffect(() => {
    if (authLoading || loading) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Loading timeout dépassé, forcer l'arrêt");
        setLoading(false);
      }, 5000); // 5 secondes max

      return () => clearTimeout(timeout);
    }
  }, [authLoading, loading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600 mb-2">Chargement de votre dashboard...</p>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
          Si cette page reste bloquée, utilisez le bouton ci-dessous
        </p>
        <button
          onClick={async () => {
            await signOut();
            window.location.href = "/login";
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Music className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Vibe Control
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/host" className="btn-primary">
                Créer une session
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Dashboard</h1>

        {/* Carte profil et abonnement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profil */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {profile.full_name?.[0]?.toUpperCase() ||
                  profile.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {profile.full_name || "Utilisateur"}
                </p>
                <p className="text-sm text-gray-600">{profile.email}</p>
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                profile.subscription_tier === "pro"
                  ? "bg-accent-100 text-accent-700"
                  : profile.subscription_tier === "premium"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {(profile.subscription_tier === "pro" ||
                profile.subscription_tier === "premium") && (
                <Crown className="w-4 h-4" />
              )}
              Plan{" "}
              {profile.subscription_tier === "free"
                ? "Gratuit"
                : profile.subscription_tier === "premium"
                  ? "Premium"
                  : "Pro"}
            </div>
          </div>

          {/* Statistiques */}
          {stats && (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <p className="text-sm font-medium text-gray-600">Sessions</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.activeSessions}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.activeSessions === 1
                    ? "session active"
                    : "sessions actives"}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-accent-600" />
                  <p className="text-sm font-medium text-gray-600">Total</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalSessions}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.totalSessions === 1
                    ? "session créée"
                    : "sessions créées"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions abonnement */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 mb-8 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Gérer mon abonnement
              </h2>
              <p className="text-sm text-gray-600">
                {profile.subscription_tier === "free"
                  ? "Passez à Premium pour débloquer toutes les fonctionnalités"
                  : "Modifiez votre abonnement, mettez à jour vos informations de paiement"}
              </p>
            </div>
            {profile.subscription_tier === "free" ? (
              <Link
                href="/#pricing"
                className="btn-primary flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Passer à Premium
              </Link>
            ) : (
              <button
                onClick={handleManageSubscription}
                disabled={managingSubscription}
                className="btn-secondary flex items-center gap-2"
              >
                {managingSubscription ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Gérer
                    <ExternalLink className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Liste des sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Mes sessions récentes
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  Aucune session pour le moment
                </p>
                <Link href="/host" className="inline-block btn-primary">
                  Créer votre première session
                </Link>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {session.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {session.is_active ? "Active" : "Terminée"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Créée le{" "}
                        {new Date(session.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    {session.is_active && (
                      <Link
                        href="/host"
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Gérer →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
