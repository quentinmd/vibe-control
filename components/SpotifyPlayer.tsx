"use client";

import { ExternalLink, SkipForward, Music2 } from "lucide-react";
import { Track } from "@/lib/supabase";

interface SpotifyPlayerProps {
  currentTrack: Track | null;
  playlist: Track[];
  onTrackEnd: (trackId: string) => void;
}

export default function SpotifyPlayer({
  currentTrack,
  playlist,
  onTrackEnd,
}: SpotifyPlayerProps) {
  if (!currentTrack || !currentTrack.spotify_id) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600">Aucun morceau Spotify en lecture</p>
          <p className="text-sm mt-2">
            Ajoutez un titre depuis Spotify pour commencer
          </p>
        </div>
      </div>
    );
  }

  const openInSpotify = () => {
    window.open(
      `https://open.spotify.com/track/${currentTrack.spotify_id}`,
      "_blank",
    );
  };

  const handleSkip = () => {
    onTrackEnd(currentTrack.id);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900">Lecture Spotify</h3>
          <p className="text-sm text-gray-600">
            {currentTrack.artist} — {currentTrack.title}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
          Spotify
        </span>
      </div>

      <iframe
        title={`Spotify: ${currentTrack.title}`}
        src={`https://open.spotify.com/embed/track/${currentTrack.spotify_id}?utm_source=generator`}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg border border-gray-200"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          File d'attente: {playlist.length} morceau
          {playlist.length > 1 ? "x" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={openInSpotify}
            className="btn-secondary px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir Spotify
          </button>
          <button
            onClick={handleSkip}
            className="btn-primary px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Morceau suivant
          </button>
        </div>
      </div>
    </div>
  );
}
