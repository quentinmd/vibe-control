"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Track } from "@/lib/supabase";
import { searchYouTubeNoAPI } from "@/lib/youtubeApi";

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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const hasLoadedTrack = useRef<string | null>(null);
  const playerIdRef = useRef(`youtube-player-${Date.now()}`);

  // Charger l'API YouTube IFrame
  useEffect(() => {
    console.log("🎬 Initialisation YouTube IFrame API...");

    // Si l'API est déjà chargée
    if (window.YT && window.YT.Player) {
      console.log("✅ YouTube API déjà chargée");
      setIsAPIReady(true);
      return;
    }

    // Charger le script YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    console.log("📥 Script YouTube IFrame API ajouté au DOM");

    // Callback quand l'API est prête
    window.onYouTubeIframeAPIReady = () => {
      console.log("✅ YouTube IFrame API prête !");
      setIsAPIReady(true);
    };
  }, []);

  // Créer le lecteur YouTube
  useEffect(() => {
    if (!isAPIReady) {
      console.log("⏳ En attente de l'API YouTube...");
      return;
    }

    if (player) {
      console.log("ℹ️ Player déjà créé");
      return;
    }

    // Attendre que le DOM soit prêt avec un petit délai
    const timer = setTimeout(() => {
      const targetElement = document.getElementById(playerIdRef.current);

      if (!targetElement) {
        console.error(
          "❌ Élément player introuvable dans le DOM:",
          playerIdRef.current,
        );
        console.log("🔄 Nouvelle tentative dans 500ms...");
        // Réessayer
        setIsAPIReady(false);
        setTimeout(() => setIsAPIReady(true), 500);
        return;
      }

      console.log("🎬 Création du lecteur YouTube...");
      console.log("🎯 Target element ID:", playerIdRef.current);
      console.log("✅ Element trouvé dans le DOM");

      try {
        const ytPlayer = new window.YT.Player(playerIdRef.current, {
          height: "360",
          width: "100%",
          videoId: undefined, // Pas de vidéo au démarrage
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              console.log("✅ YouTube Player prêt et opérationnel !");
              setPlayer(event.target);
              setIsPlayerReady(true);
              console.log("🔓 Player déverrouillé, prêt à charger des vidéos");
            },
            onStateChange: (event: any) => {
              const states: any = {
                [-1]: "Non démarré",
                0: "Terminé",
                1: "Lecture",
                2: "Pause",
                3: "Buffering",
                5: "Video cued",
              };
              console.log(
                `🎵 État YouTube: ${states[event.data] || event.data}`,
              );

              // État: 0 = Terminé, 1 = Lecture, 2 = Pause
              if (event.data === window.YT.PlayerState.ENDED) {
                console.log("⏭️ Morceau terminé, passage au suivant");
                handleTrackEnd();
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
            },
            onError: (event: any) => {
              console.error("❌ Erreur YouTube Player:", event.data);
              setSearchError(true);
            },
          },
        });
      } catch (error) {
        console.error("❌ Erreur création player:", error);
        setSearchError(true);
      }
    }, 100); // Délai de 100ms pour laisser le DOM se monter

    return () => clearTimeout(timer);
  }, [isAPIReady, player]);

  // Charger une nouvelle vidéo quand le track change
  useEffect(() => {
    if (!player || !currentTrack || !isPlayerReady) {
      if (!isPlayerReady && currentTrack) {
        console.log("⏳ En attente que le player soit complètement prêt...");
      }
      return;
    }

    // Éviter de recharger le même track
    if (hasLoadedTrack.current === currentTrack.id) {
      console.log("ℹ️ Track déjà chargé, skip");
      return;
    }

    const loadVideo = async () => {
      console.log(
        "🔍 Début chargement vidéo pour:",
        currentTrack.title,
        "-",
        currentTrack.artist,
      );
      setIsLoadingVideo(true);
      setSearchError(false);

      try {
        // Construire la requête de recherche
        const searchQuery = `${currentTrack.artist} ${currentTrack.title} official audio`;
        console.log("📡 Recherche YouTube:", searchQuery);

        // Rechercher le videoId
        const videoId = await searchYouTubeNoAPI(searchQuery);

        console.log("🔍 VideoId reçu:", videoId, "(type:", typeof videoId, ")");

        if (videoId) {
          // Validation du videoId (doit être une string de 11 caractères)
          const videoIdStr = String(videoId).trim();
          const isValidFormat = /^[a-zA-Z0-9_-]{11}$/.test(videoIdStr);

          console.log("✅ VideoId trouvé:", videoIdStr);
          console.log(
            "📏 Longueur:",
            videoIdStr.length,
            "/ Format valide:",
            isValidFormat,
          );

          if (!isValidFormat) {
            console.error("❌ Format videoId invalide:", videoIdStr);
            setSearchError(true);
            setIsLoadingVideo(false);
            return;
          }

          console.log("▶️ Chargement de la vidéo...");

          try {
            // Vérifier que le player est vraiment prêt
            if (typeof player.loadVideoById === "function") {
              console.log("🎬 Appel loadVideoById avec:", videoIdStr);
              player.loadVideoById({
                videoId: videoIdStr,
                startSeconds: 0,
                suggestedQuality: "default",
              });
              hasLoadedTrack.current = currentTrack.id;
              setSearchError(false);
              console.log("✅ Vidéo chargée avec succès");

              // Attendre que la vidéo soit cued avant de lancer
              setTimeout(() => {
                try {
                  if (player && typeof player.playVideo === "function") {
                    console.log("▶️ Lancement de la lecture...");
                    player.playVideo();
                  }
                } catch (e) {
                  console.warn("⚠️ Erreur playVideo:", e);
                }
              }, 1500);
            } else {
              console.error("❌ loadVideoById non disponible sur le player");
              setSearchError(true);
            }
          } catch (e) {
            console.error("❌ Erreur lors du chargement:", e);
            setSearchError(true);
          }
        } else {
          console.warn("⚠️ VideoId non trouvé pour:", searchQuery);
          // Fallback: essayer avec une recherche simplifiée
          const simpleQuery = `${currentTrack.artist} ${currentTrack.title}`;
          console.log("🔄 Tentative fallback:", simpleQuery);
          const fallbackVideoId = await searchYouTubeNoAPI(simpleQuery);

          if (fallbackVideoId) {
            console.log("✅ Fallback réussi:", fallbackVideoId);

            try {
              if (typeof player.loadVideoById === "function") {
                player.loadVideoById({
                  videoId: fallbackVideoId,
                  startSeconds: 0,
                  suggestedQuality: "default",
                });
                hasLoadedTrack.current = currentTrack.id;
                setSearchError(false);

                setTimeout(() => {
                  try {
                    if (player && typeof player.playVideo === "function") {
                      player.playVideo();
                    }
                  } catch (e) {
                    console.warn("⚠️ Erreur playVideo (fallback):", e);
                  }
                }, 1500);
              } else {
                setSearchError(true);
              }
            } catch (e) {
              console.error("❌ Erreur fallback:", e);
              setSearchError(true);
            }
          } else {
            console.error("❌ Aucun videoId trouvé après fallback");
            setSearchError(true);
          }
        }
      } catch (error) {
        console.error("❌ Erreur chargement vidéo:", error);
        setSearchError(true);
      } finally {
        setIsLoadingVideo(false);
      }
    };

    loadVideo();
  }, [currentTrack, player, isPlayerReady]);

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

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-neon-violet/20 text-neon-violet text-xs font-semibold">
            En cours
          </div>
        </div>
      </div>

      {/* Lecteur YouTube intégré */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {isLoadingVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-violet border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Recherche de la vidéo...</p>
            </div>
          </div>
        )}
        <div
          id={playerIdRef.current}
          ref={playerRef}
          className="w-full aspect-video"
        />
      </div>

      {/* Message d'état */}
      {!isAPIReady && (
        <div className="bg-dark-bg rounded-lg p-4 border border-neon-cyan/20">
          <p className="text-sm text-gray-400 text-center">
            ⏳ Chargement du lecteur YouTube...
          </p>
        </div>
      )}

      {/* Info de debug */}
      {isAPIReady && !player && (
        <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
          <p className="text-sm text-yellow-300 text-center">
            ⚙️ Lecteur YouTube en cours d'initialisation...
          </p>
        </div>
      )}

      {isAPIReady && player && !isLoadingVideo && !searchError && (
        <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
          <p className="text-xs text-green-300 text-center">
            ✅ Lecteur prêt • Ouvrez la console pour voir les logs
          </p>
        </div>
      )}

      {/* Message d'erreur avec bouton manuel */}
      {searchError && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300 font-semibold mb-2">
                Impossible de trouver la vidéo automatiquement
              </p>
              <p className="text-xs text-red-400/80 mb-3">
                Les serveurs de recherche sont temporairement indisponibles.
                Utilisez le bouton ci-dessous pour lancer manuellement.
              </p>
              <button
                onClick={openInYouTube}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir sur YouTube
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contrôles du lecteur */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-dark-bg hover:bg-neon-violet/20 transition-colors"
          disabled={!player}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={togglePlay}
          className="p-4 rounded-full bg-neon-violet neon-glow-violet hover:bg-opacity-90 transition-all transform hover:scale-105 disabled:opacity-50"
          disabled={!player}
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
          disabled={!player || playlist.length <= 1}
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
