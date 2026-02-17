"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement | null>(null);
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

    // Attendre que le DOM soit prêt
    const timer = setTimeout(() => {
      if (!playerContainerRef.current) {
        console.error("❌ Conteneur player introuvable");
        return;
      }

      // Créer le div du player de manière impérative s'il n'existe pas
      if (!playerDivRef.current) {
        const playerDiv = document.createElement("div");
        playerDiv.id = playerIdRef.current;
        playerDiv.className = "w-full aspect-video";
        playerContainerRef.current.appendChild(playerDiv);
        playerDivRef.current = playerDiv;
        console.log("✅ Div player créé de manière impérative");
      }

      console.log("🎬 Création du lecteur YouTube...");
      console.log("🎯 Target element ID:", playerIdRef.current);

      try {
        const ytPlayer = new window.YT.Player(playerIdRef.current, {
          height: "360",
          width: "100%",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              console.log("✅ YouTube Player prêt et opérationnel !");
              const playerInstance = event.target;

              // YouTube garantit que le player est prêt quand onReady est appelé
              setPlayer(playerInstance);
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
    }, 100);

    // Nettoyage : détruire le player quand le composant est démonté
    return () => {
      clearTimeout(timer);
      if (player) {
        try {
          player.destroy();
          console.log("🗑️ Player YouTube détruit");
        } catch (e) {
          console.warn("⚠️ Erreur destruction player:", e);
        }
      }
    };
  }, [isAPIReady, player]);

  // Réinitialiser hasLoadedTrack quand currentTrack devient null
  useEffect(() => {
    if (!currentTrack && hasLoadedTrack.current) {
      console.log("🔄 Track supprimé, réinitialisation de hasLoadedTrack");
      hasLoadedTrack.current = null;
    }
  }, [currentTrack]);

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
      console.log(
        "ℹ️ Track déjà chargé, skip - ID:",
        currentTrack.id,
        "Titre:",
        currentTrack.title,
      );
      return;
    }

    console.log(
      "🆕 Nouveau track détecté - ID:",
      currentTrack.id,
      "Ancien ID:",
      hasLoadedTrack.current,
    );

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
        console.log("🔎 Lancement recherche pour:", searchQuery);
        const videoId = await searchYouTubeNoAPI(searchQuery);

        console.log("🔍 VideoId reçu:", videoId, "(type:", typeof videoId, ")");
        console.log("🔍 VideoId raw:", JSON.stringify(videoId));

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
            // Charger la vidéo directement - YouTube garantit que le player est prêt
            if (typeof player.loadVideoById === "function") {
              console.log("🎬 Appel loadVideoById avec:", videoIdStr);

              player.loadVideoById({
                videoId: videoIdStr,
                startSeconds: 0,
                suggestedQuality: "default",
              });
              hasLoadedTrack.current = currentTrack.id;
              setSearchError(false);
              console.log("✅ loadVideoById appelé avec succès");

              // Attendre que la vidéo soit cued avant de lancer
              setTimeout(() => {
                try {
                  if (player && typeof player.playVideo === "function") {
                    console.log("▶️ Lancement de la lecture...");
                    player.playVideo();
                    console.log("✅ playVideo appelé avec succès");
                  }
                } catch (e) {
                  console.warn("⚠️ Erreur playVideo:", e);
                }
              }, 1000);
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
              // Charger la vidéo directement
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
                      console.log("✅ playVideo appelé (fallback)");
                    }
                  } catch (e) {
                    console.warn("⚠️ Erreur playVideo (fallback):", e);
                  }
                }, 1000);
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
      console.log(
        "🎬 handleTrackEnd appelé pour:",
        currentTrack.id,
        currentTrack.title,
      );
      // Réinitialiser hasLoadedTrack pour permettre le chargement du prochain track
      hasLoadedTrack.current = null;
      onTrackEnd(currentTrack.id);
    }
  };

  const togglePlay = () => {
    if (!player) return;

    try {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (e) {
      console.error("❌ Erreur togglePlay:", e);
    }
  };

  const skipTrack = () => {
    handleTrackEnd();
  };

  const toggleMute = () => {
    if (!player) return;

    try {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error("❌ Erreur toggleMute:", e);
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
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600">Aucun morceau en lecture</p>
          <p className="text-sm mt-2">Validez des suggestions pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 space-y-4">
      {/* Info du morceau en cours */}
      <div className="flex items-start gap-4">
        {currentTrack.cover_url ? (
          <img
            src={currentTrack.cover_url}
            alt={currentTrack.title}
            className="w-20 h-20 rounded object-cover shadow-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded bg-primary-100 flex items-center justify-center shadow-sm">
            <Play className="w-8 h-8 text-primary-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {currentTrack.title}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {currentTrack.artist}
          </p>
          {currentTrack.suggested_by && (
            <p className="text-xs text-primary-600 mt-1">
              Suggéré par {currentTrack.suggested_by}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold border border-primary-300">
            En cours
          </div>
        </div>
      </div>

      {/* Lecteur YouTube intégré */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-inner">
        {isLoadingVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-gray-300">Recherche de la vidéo...</p>
            </div>
          </div>
        )}
        <div ref={playerContainerRef} className="w-full aspect-video" />
      </div>

      {/* Message d'état */}
      {!isAPIReady && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            ⏳ Chargement du lecteur YouTube...
          </p>
        </div>
      )}

      {/* Info de debug */}
      {isAPIReady && !player && (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700 text-center">
            ⚙️ Lecteur YouTube en cours d'initialisation...
          </p>
        </div>
      )}

      {isAPIReady && player && !isLoadingVideo && !searchError && (
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-700 text-center">
            ✅ Lecteur prêt • Ouvrez la console pour voir les logs
          </p>
        </div>
      )}

      {/* Message d'erreur avec bouton manuel */}
      {searchError && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-semibold mb-2">
                Impossible de trouver la vidéo automatiquement
              </p>
              <p className="text-xs text-red-600 mb-3">
                Les serveurs de recherche sont temporairement indisponibles.
                Utilisez le bouton ci-dessous pour lancer manuellement.
              </p>
              <button
                onClick={openInYouTube}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm font-semibold"
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
          className="p-3 rounded-full bg-secondary-100 hover:bg-secondary-200 transition-all duration-200 text-secondary-700 disabled:opacity-50"
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
          className="p-4 rounded-full bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 text-white"
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
          className="p-3 rounded-full bg-secondary-100 hover:bg-secondary-200 transition-all duration-200 text-secondary-700 disabled:opacity-50"
          disabled={!player || playlist.length <= 1}
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* File d'attente */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          À venir ({playlist.length - 1})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {playlist.slice(1, 4).map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-2 text-sm text-gray-600 p-2 rounded hover:bg-gray-50 transition-colors border-l-4 border-primary-400"
            >
              <span className="w-6 text-center font-semibold text-primary-600">
                {index + 2}.
              </span>
              <span className="truncate font-medium">{track.title}</span>
              <span className="text-gray-400">-</span>
              <span className="truncate text-gray-500">{track.artist}</span>
            </div>
          ))}
          {playlist.length > 4 && (
            <p className="text-xs text-gray-500 text-center py-2">
              + {playlist.length - 4} autre(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
