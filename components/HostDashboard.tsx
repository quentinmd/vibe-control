"use client";

import { useEffect, useState } from "react";
import { supabase, Track, Session } from "@/lib/supabase";
import {
  Music,
  Check,
  X,
  Play,
  Clock,
  PartyPopper,
  Users,
  BarChart3,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import YouTubePlayer from "./YouTubePlayer";
import { getEngagementMetrics, type EngagementMetrics } from "@/lib/analytics";

interface HostDashboardProps {
  session: Session;
}

export default function HostDashboard({ session }: HostDashboardProps) {
  const [pendingTracks, setPendingTracks] = useState<Track[]>([]);
  const [approvedTracks, setApprovedTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [playedCount, setPlayedCount] = useState(0);
  const [updatingTrackIds, setUpdatingTrackIds] = useState<Set<string>>(
    new Set(),
  );

  // Mettre à jour le morceau en cours quand la playlist change
  useEffect(() => {
    // Si le track actuel n'est plus dans la liste approved (il a été joué/rejeté)
    if (currentTrack && !approvedTracks.find((t) => t.id === currentTrack.id)) {
      // Passer au track suivant
      if (approvedTracks.length > 0) {
        setCurrentTrack(approvedTracks[0]);
      } else {
        setCurrentTrack(null);
      }
    }
    // Si aucun track en cours mais des tracks disponibles
    else if (!currentTrack && approvedTracks.length > 0) {
      setCurrentTrack(approvedTracks[0]);
    }
    // Si plus de tracks disponibles
    else if (approvedTracks.length === 0 && currentTrack) {
      setCurrentTrack(null);
    }
  }, [approvedTracks, currentTrack]);

  // Charger les tracks initiales
  useEffect(() => {
    loadTracks();
    loadMetrics();
  }, [session.id]);

  // Recharger les métriques quand les tracks changent
  useEffect(() => {
    loadMetrics();
  }, [pendingTracks.length, approvedTracks.length, rejectedCount, playedCount]);

  // Écouter les changements en temps réel (CŒUR DU SYSTÈME)
  useEffect(() => {
    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracks",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          console.log("🔔 Changement détecté:", payload);
          handleRealtimeUpdate(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  const loadTracks = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Charger les tracks pending
      const { data: pending, error: pendingError } = await supabase
        .from("tracks")
        .select("*")
        .eq("session_id", session.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (pendingError) throw pendingError;

      // Charger les tracks approved
      const { data: approved, error: approvedError } = await supabase
        .from("tracks")
        .select("*")
        .eq("session_id", session.id)
        .eq("status", "approved")
        .order("order_index", { ascending: true });

      if (approvedError) throw approvedError;

      // Charger les compteurs rejected et played
      const { count: rejectedTotal, error: rejectedError } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("status", "rejected");

      if (rejectedError) throw rejectedError;

      const { count: playedTotal, error: playedError } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("status", "played");

      if (playedError) throw playedError;

      setPendingTracks(pending || []);
      setApprovedTracks(approved || []);
      setRejectedCount(rejectedTotal || 0);
      setPlayedCount(playedTotal || 0);
    } catch (error) {
      console.error("Erreur chargement tracks:", error);
      setLoadError("Impossible de charger la liste des morceaux.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await getEngagementMetrics(session.id);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Erreur chargement métriques:", error);
    }
  };

  const setTrackUpdating = (trackId: string, isUpdating: boolean) => {
    setUpdatingTrackIds((prev) => {
      const next = new Set(prev);
      if (isUpdating) {
        next.add(trackId);
      } else {
        next.delete(trackId);
      }
      return next;
    });
  };

  const updateTrackStatusWithRetry = async (
    trackId: string,
    updates: Record<string, any>,
    maxRetries = 2,
  ) => {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { error } = await supabase
        .from("tracks")
        .update(updates)
        .eq("id", trackId);

      if (!error) return;

      lastError = error;
      const isAbortError =
        (error.message || "").includes("AbortError") ||
        (error.hint || "").includes("Request was aborted");

      if (!isAbortError || attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }

    throw lastError;
  };

  const moderateTrackViaApi = async (
    trackId: string,
    action: "approve" | "reject" | "played",
  ) => {
    const response = await fetch("/api/tracks/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, action }),
    });

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "Erreur API de modération");
    }
  };

  // Gestion des mises à jour temps réel
  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === "INSERT") {
      // Nouvelle suggestion
      const track = newRecord as Track;
      if (track.status === "pending") {
        setPendingTracks((prev) => {
          if (prev.some((existingTrack) => existingTrack.id === track.id)) {
            return prev;
          }
          return [...prev, track];
        });
      }
    } else if (eventType === "UPDATE") {
      const track = newRecord as Track;

      // Retirer de pending
      setPendingTracks((prev) => prev.filter((t) => t.id !== track.id));

      // Ajouter à approved si validé
      if (track.status === "approved") {
        setApprovedTracks((prev) =>
          [...prev, track].sort(
            (a, b) => (a.order_index || 0) - (b.order_index || 0),
          ),
        );
      }
      // Retirer de approved si le track est terminé
      else if (track.status === "played" || track.status === "rejected") {
        setApprovedTracks((prev) => prev.filter((t) => t.id !== track.id));
      }
    } else if (eventType === "DELETE") {
      setPendingTracks((prev) => prev.filter((t) => t.id !== oldRecord.id));
      setApprovedTracks((prev) => prev.filter((t) => t.id !== oldRecord.id));
    }
  };

  // Valider une suggestion
  const handleApprove = async (trackId: string) => {
    if (updatingTrackIds.has(trackId)) return;
    setTrackUpdating(trackId, true);

    try {
      try {
        await moderateTrackViaApi(trackId, "approve");
      } catch (apiError) {
        console.warn("Fallback validation directe (client):", apiError);
        await updateTrackStatusWithRetry(trackId, {
          status: "approved",
          approved_at: new Date().toISOString(),
        });
      }

      // Animation "Hop" gérée par Realtime
    } catch (error) {
      console.error("Erreur validation:", error);
    } finally {
      setTrackUpdating(trackId, false);
    }
  };

  // Refuser une suggestion
  const handleReject = async (trackId: string) => {
    if (updatingTrackIds.has(trackId)) return;
    setTrackUpdating(trackId, true);

    try {
      try {
        await moderateTrackViaApi(trackId, "reject");
      } catch (apiError) {
        console.warn("Fallback rejet direct (client):", apiError);
        await updateTrackStatusWithRetry(trackId, {
          status: "rejected",
          rejected_at: new Date().toISOString(),
        });
      }

      setRejectedCount((prev) => prev + 1);
    } catch (error) {
      console.error("Erreur rejet:", error);
    } finally {
      setTrackUpdating(trackId, false);
    }
  };

  // Gérer la fin d'un morceau
  const handleTrackEnd = async (trackId: string) => {
    console.log("🎬 handleTrackEnd dans HostDashboard pour:", trackId);
    if (updatingTrackIds.has(trackId)) return;
    setTrackUpdating(trackId, true);

    try {
      // Marquer comme "played"
      try {
        await moderateTrackViaApi(trackId, "played");
      } catch (apiError) {
        console.warn("Fallback played direct (client):", apiError);
        await updateTrackStatusWithRetry(trackId, {
          status: "played",
          played_at: new Date().toISOString(),
        });
      }

      setPlayedCount((prev) => prev + 1);
      // Le useEffect ci-dessus gérera automatiquement le passage au track suivant
      // quand le realtime retirera ce track de approvedTracks
    } catch (error) {
      console.error("Erreur fin track:", error);
    } finally {
      setTrackUpdating(trackId, false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 order-1">
          <p className="text-sm text-red-700 font-medium">{loadError}</p>
        </div>
      )}

      {/* LECTEUR YOUTUBE */}
      <div className="order-3 pt-3">
        <YouTubePlayer
          currentTrack={currentTrack}
          playlist={approvedTracks}
          onTrackEnd={handleTrackEnd}
        />
      </div>

      {/* STATISTIQUES EN TEMPS RÉEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 order-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="En attente"
          value={pendingTracks.length}
          color="yellow"
        />
        <StatCard
          icon={<ThumbsUp className="w-5 h-5" />}
          label="Approuvés"
          value={approvedTracks.length}
          color="green"
        />
        <StatCard
          icon={<ThumbsDown className="w-5 h-5" />}
          label="Rejetés"
          value={rejectedCount}
          color="red"
        />
        <StatCard
          icon={<Play className="w-5 h-5" />}
          label="Joués"
          value={playedCount}
          color="blue"
        />
      </div>

      {/* MÉTRIQUES D'ENGAGEMENT (si disponibles) */}
      {metrics && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 order-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Engagement de la Session
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <MetricItem
              label="Taux d'approbation"
              value={`${metrics.approvalRate.toFixed(0)}%`}
              color="green"
            />
            <MetricItem
              label="Contributeurs uniques"
              value={metrics.uniqueContributors}
              color="purple"
            />
            {metrics.avgResponseTimeMinutes !== null && (
              <MetricItem
                label="Temps de réponse moy."
                value={`${metrics.avgResponseTimeMinutes.toFixed(1)} min`}
                color="blue"
              />
            )}
            {metrics.peakActivityHour !== null && (
              <MetricItem
                label="Heure de pointe"
                value={`${metrics.peakActivityHour}h`}
                color="pink"
              />
            )}
          </div>
        </div>
      )}

      {/* GRILLE 2 COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 order-2">
        {/* COLONNE 1: EN ATTENTE */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-accent-600" />
              En Attente
            </h2>
            <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-semibold border border-accent-200">
              {pendingTracks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {pendingTracks.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-lg">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune suggestion en attente</p>
              </div>
            ) : (
              pendingTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-slide-in hover:bg-white hover:shadow-md hover:border-accent-300 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-accent-100 flex items-center justify-center">
                        <Music className="w-6 h-6 text-accent-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {track.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {track.artist}
                      </p>
                      {track.suggested_by && (
                        <p className="text-xs text-primary-600 mt-1">
                          Par {track.suggested_by}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleApprove(track.id)}
                      disabled={updatingTrackIds.has(track.id)}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Valider
                    </button>
                    <button
                      onClick={() => handleReject(track.id)}
                      disabled={updatingTrackIds.has(track.id)}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLONNE 2: PLAYLIST ACTIVE */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <PartyPopper className="w-6 h-6 text-primary-600" />
              Playlist Active
            </h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold border border-primary-200">
              {approvedTracks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {approvedTracks.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-lg">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Validez des suggestions pour commencer</p>
              </div>
            ) : (
              approvedTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-slide-in hover:bg-white hover:shadow-md hover:border-primary-300 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold text-sm text-white shadow-sm">
                      {index + 1}
                    </span>

                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-primary-100 flex items-center justify-center">
                        <Music className="w-6 h-6 text-primary-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {track.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {track.artist}
                      </p>
                      {track.suggested_by && (
                        <p className="text-xs text-primary-600 mt-1">
                          Suggéré par {track.suggested_by}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants auxiliaires pour les statistiques

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "yellow" | "green" | "red" | "blue";
}) {
  const colorClasses = {
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };

  const iconColorClasses = {
    yellow: "text-yellow-600",
    green: "text-green-600",
    red: "text-red-600",
    blue: "text-blue-600",
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={iconColorClasses[color]}>{icon}</div>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "green" | "purple" | "blue" | "pink";
}) {
  const colorClasses = {
    green: "text-green-600",
    purple: "text-purple-600",
    blue: "text-blue-600",
    pink: "text-pink-600",
  };

  return (
    <div>
      <p className="text-gray-600 text-xs mb-1">{label}</p>
      <p className={`font-bold text-lg ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
