"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";
import { Track } from "@/lib/supabase";

interface YouTubePlayerProps {
  currentTrack: Track | null;
  playlist: Track[];
  onTrackEnd: (trackId: string) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  currentTrack,
  playlist,
  onTrackEnd,
}: YouTubePlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // Charger l'API YouTube IFrame
  useEffect(() => {
    // Si l'API est déjà chargée
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Charger le script YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Callback quand l'API est prête
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Créer le lecteur YouTube
  useEffect(() => {
    if (!isAPIReady || !playerRef.current || player) return;

    const ytPlayer = new window.YT.Player(playerRef.current, {
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          console.log("YouTube Player prêt");
          setPlayer(event.target);
        },
        onStateChange: (event: any) => {
          // État: 0 = Terminé, 1 = Lecture, 2 = Pause
          if (event.data === window.YT.PlayerState.ENDED) {
            handleTrackEnd();
          } else if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        },
      },
    });
  }, [isAPIReady]);

  // Charger une nouvelle vidéo quand le track change
  useEffect(() => {
    if (!player || !currentTrack) return;

    // Construire la requête de recherche
    const searchQuery = `${currentTrack.artist} ${currentTrack.title} official audio`;

    // Charger la vidéo (YouTube cherchera automatiquement)
    // Note: Pour de meilleurs résultats, utilisez l'API de recherche YouTube
    // et stockez le videoId dans la table tracks

    // Temporaire: on utilise une vidéo par défaut
    // En production, faites une recherche YouTube API et stockez le videoId
    player.loadVideoByUrl(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
    );

    // Alternative si vous avez le videoId:
    // if (currentTrack.spotify_id) {
    //   player.loadVideoById(currentTrack.spotify_id) // Utilisez spotify_id comme videoId
    // }
  }, [currentTrack, player]);

  const handleTrackEnd = () => {
    if (currentTrack) {
      onTrackEnd(currentTrack.id);
    }
  };

  const togglePlay = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const skipTrack = () => {
    handleTrackEnd();
  };

  const toggleMute = () => {
    if (!player) return;

    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const openInYouTube = () => {
    if (!currentTrack) return;
    const query = `${currentTrack.artist} ${currentTrack.title} official`;
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      "_blank",
    );
  };

  if (!currentTrack) {
    return (
      <div className="bg-dark-card rounded-xl p-6 border border-neon-violet/30">
        <div className="text-center py-8 text-gray-400">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun morceau en lecture</p>
          <p className="text-sm mt-2">Validez des suggestions pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-card rounded-xl p-6 border border-neon-violet/30 space-y-4">
      {/* Info du morceau en cours */}
      <div className="flex items-start gap-4">
        {currentTrack.cover_url ? (
          <img
            src={currentTrack.cover_url}
            alt={currentTrack.title}
            className="w-20 h-20 rounded object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded bg-neon-violet/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-neon-violet" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {currentTrack.title}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {currentTrack.artist}
          </p>
          {currentTrack.suggested_by && (
            <p className="text-xs text-neon-cyan mt-1">
              Suggéré par {currentTrack.suggested_by}
            </p>
          )}
        </div>

        <button
          onClick={openInYouTube}
          className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="Ouvrir sur YouTube"
        >
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>

      {/* Lecteur YouTube (caché visuellement, audio uniquement) */}
      <div className="hidden">
        <div ref={playerRef} />
      </div>

      {/* Message instructif */}
      <div className="bg-dark-bg rounded-lg p-4 border border-neon-cyan/20">
        <p className="text-sm text-gray-400 text-center">
          🎵 Cliquez sur le bouton YouTube ci-dessus pour lancer la musique dans
          un nouvel onglet
        </p>
        <p className="text-xs text-gray-500 text-center mt-2">
          Le lecteur automatique YouTube arrivera dans une prochaine version
        </p>
      </div>

      {/* Contrôles (désactivés pour le MVP - optionnel) */}
      <div className="flex items-center justify-center gap-4 opacity-50 pointer-events-none">
        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-dark-bg hover:bg-neon-violet/20 transition-colors"
          disabled
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={togglePlay}
          className="p-4 rounded-full bg-neon-violet neon-glow-violet hover:bg-opacity-90 transition-all transform hover:scale-105"
          disabled
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={skipTrack}
          className="p-3 rounded-full bg-dark-bg hover:bg-neon-violet/20 transition-colors"
          disabled
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* File d'attente */}
      <div className="pt-4 border-t border-neon-violet/20">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">
          À venir ({playlist.length - 1})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {playlist.slice(1, 4).map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <span className="w-6 text-center">{index + 2}.</span>
              <span className="truncate">{track.title}</span>
              <span className="text-gray-600">-</span>
              <span className="truncate">{track.artist}</span>
            </div>
          ))}
          {playlist.length > 4 && (
            <p className="text-xs text-gray-600 text-center">
              + {playlist.length - 4} autre(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
