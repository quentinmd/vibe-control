"use client";

import { useEffect, useState } from "react";
import { supabase, Track, Session } from "@/lib/supabase";
import { Music, Check, X, Play, Clock, PartyPopper } from "lucide-react";
import YouTubePlayer from "./YouTubePlayer";

interface HostDashboardProps {
  session: Session;
}

export default function HostDashboard({ session }: HostDashboardProps) {
  const [pendingTracks, setPendingTracks] = useState<Track[]>([]);
  const [approvedTracks, setApprovedTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [session.id]);

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
    try {
      // Charger les tracks pending
      const { data: pending } = await supabase
        .from("tracks")
        .select("*")
        .eq("session_id", session.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      // Charger les tracks approved
      const { data: approved } = await supabase
        .from("tracks")
        .select("*")
        .eq("session_id", session.id)
        .eq("status", "approved")
        .order("order_index", { ascending: true });

      setPendingTracks(pending || []);
      setApprovedTracks(approved || []);
    } catch (error) {
      console.error("Erreur chargement tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des mises à jour temps réel
  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === "INSERT") {
      // Nouvelle suggestion
      const track = newRecord as Track;
      if (track.status === "pending") {
        setPendingTracks((prev) => [...prev, track]);
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
    try {
      const { error } = await supabase
        .from("tracks")
        .update({ status: "approved" })
        .eq("id", trackId);

      if (error) throw error;

      // Animation "Hop" gérée par Realtime
    } catch (error) {
      console.error("Erreur validation:", error);
    }
  };

  // Refuser une suggestion
  const handleReject = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from("tracks")
        .update({ status: "rejected" })
        .eq("id", trackId);

      if (error) throw error;
    } catch (error) {
      console.error("Erreur rejet:", error);
    }
  };

  // Gérer la fin d'un morceau
  const handleTrackEnd = async (trackId: string) => {
    console.log("🎬 handleTrackEnd dans HostDashboard pour:", trackId);
    try {
      // Marquer comme "played"
      await supabase
        .from("tracks")
        .update({ status: "played", played_at: new Date().toISOString() })
        .eq("id", trackId);

      // Le useEffect ci-dessus gérera automatiquement le passage au track suivant
      // quand le realtime retirera ce track de approvedTracks
    } catch (error) {
      console.error("Erreur fin track:", error);
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
    <div className="space-y-6">
      {/* LECTEUR YOUTUBE */}
      <YouTubePlayer
        currentTrack={currentTrack}
        playlist={approvedTracks}
        onTrackEnd={handleTrackEnd}
      />

      {/* GRILLE 2 COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      className="flex-1 px-4 py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Valider
                    </button>
                    <button
                      onClick={() => handleReject(track.id)}
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
