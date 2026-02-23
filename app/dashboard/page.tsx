"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserUsageStats } from "@/lib/subscription-limits";
import { supabase } from "@/lib/supabase";
import { getSessionDetailedStats, type SessionStats } from "@/lib/analytics";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import {
  Music,
  Crown,
  Settings,
  Calendar,
  Users,
  Loader2,
  ExternalLink,
  Clock,
  Download,
  BarChart3,
  Link2,
} from "lucide-react";

interface SessionData {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  ended_at: string | null;
}

type TabType = "active" | "archives" | "analytics";

export default function DashboardPage() {
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    refreshProfile,
  } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [selectedSessionStats, setSelectedSessionStats] =
    useState<SessionStats | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const router = useRouter();

  const canUseSpotify =
    profile?.subscription_tier === "premium" ||
    profile?.subscription_tier === "pro";
  const isSpotifyConnected = Boolean(profile?.spotify_connected_at);

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

  const handleSpotifyConnect = () => {
    router.push("/api/spotify/connect");
  };

  const handleViewSessionDetails = async (sessionId: string) => {
    const sessionStats = await getSessionDetailedStats(sessionId);
    setSelectedSessionStats(sessionStats);
    setShowSessionDetails(true);
  };

  const handleExportSession = async (
    sessionId: string,
    sessionName: string,
  ) => {
    try {
      // Récupérer toutes les données de la session
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      const { data: tracks } = await supabase
        .from("tracks")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      const stats = await getSessionDetailedStats(sessionId);

      const exportData = {
        session: sessionData,
        tracks: tracks || [],
        statistics: stats,
        exported_at: new Date().toISOString(),
      };

      // Créer et télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-${sessionName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting session:", error);
      alert("Erreur lors de l'export de la session");
    }
  };

  const activeSessions = sessions.filter((s) => s.is_active);
  const archivedSessions = sessions.filter((s) => !s.is_active);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600 mb-2">Chargement de votre dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Redirection...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-700 mb-3">Configuration de votre compte...</p>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
          Le profil est en cours de synchronisation. Réessayez dans quelques
          secondes.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => void refreshProfile()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Gérer mon abonnement
              </h2>
              <p className="text-sm text-gray-600">
                {profile.subscription_tier === "free"
                  ? "Passez à Premium pour débloquer toutes les fonctionnalités"
                  : "Modifiez votre abonnement, mettez à jour vos informations de paiement"}
              </p>

              {canUseSpotify && (
                <p className="text-sm mt-2 text-gray-700 inline-flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  {isSpotifyConnected
                    ? "Spotify connecté"
                    : "Spotify non connecté"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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

              {canUseSpotify && !isSpotifyConnected && (
                <button
                  onClick={handleSpotifyConnect}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Connecter Spotify
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des sessions avec onglets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Onglets */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "active"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Sessions actives ({activeSessions.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab("archives")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "archives"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Archives ({archivedSessions.length})
                </span>
              </button>
              {(profile?.subscription_tier === "premium" ||
                profile?.subscription_tier === "pro") && (
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === "analytics"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6">
            {activeTab === "active" && (
              <div className="divide-y divide-gray-200">
                {activeSessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      Aucune session active pour le moment
                    </p>
                    <Link href="/host" className="inline-block btn-primary">
                      Créer une session
                    </Link>
                  </div>
                ) : (
                  activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="py-4 hover:bg-gray-50 transition rounded-lg px-4 -mx-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">
                              {session.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
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
                        <Link
                          href={`/host?sessionId=${session.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Gérer →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "archives" && (
              <div className="divide-y divide-gray-200">
                {archivedSessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune session archivée</p>
                  </div>
                ) : (
                  archivedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="py-4 hover:bg-gray-50 transition rounded-lg px-4 -mx-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">
                              {session.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              Terminée
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(session.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                            {session.ended_at &&
                              ` - ${new Date(session.ended_at).toLocaleDateString("fr-FR")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewSessionDetails(session.id)}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-primary-50 transition"
                          >
                            Détails
                          </button>
                          <button
                            onClick={() =>
                              handleExportSession(session.id, session.name)
                            }
                            className="text-accent-600 hover:text-accent-700 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-accent-50 transition flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <AnalyticsDashboard periodDays={30} />
            )}
          </div>
        </div>

        {/* Modale de détails de session */}
        {showSessionDetails && selectedSessionStats && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSessionDetails(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSessionStats.sessionName}
                </h2>
                <button
                  onClick={() => setShowSessionDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Stats de la session */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-1">
                    Suggestions
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedSessionStats.totalTracksSuggested}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">
                    Approuvés
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {selectedSessionStats.totalTracksApproved}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-600 font-medium mb-1">
                    Rejetés
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {selectedSessionStats.totalTracksRejected}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    Joués
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedSessionStats.totalTracksPlayed}
                  </p>
                </div>
              </div>

              {/* Métriques supplémentaires */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Taux d'approbation</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSessionStats.approvalRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Contributeurs uniques</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSessionStats.uniqueContributors}
                  </span>
                </div>
                {selectedSessionStats.sessionDurationMinutes && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Durée</span>
                    <span className="font-semibold text-gray-900">
                      {Math.floor(
                        selectedSessionStats.sessionDurationMinutes / 60,
                      )}
                      h{" "}
                      {Math.floor(
                        selectedSessionStats.sessionDurationMinutes % 60,
                      )}
                      min
                    </span>
                  </div>
                )}
                {selectedSessionStats.avgApprovalTimeSeconds && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">
                      Temps de réponse moyen
                    </span>
                    <span className="font-semibold text-gray-900">
                      {(
                        selectedSessionStats.avgApprovalTimeSeconds / 60
                      ).toFixed(1)}{" "}
                      min
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  handleExportSession(
                    selectedSessionStats.sessionId,
                    selectedSessionStats.sessionName,
                  )
                }
                className="w-full mt-6 btn-primary flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter cette session
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
