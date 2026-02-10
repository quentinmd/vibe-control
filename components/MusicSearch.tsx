"use client";

import { useState } from "react";
import { Search, Music, Loader2 } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  spotify_id?: string;
}

interface MusicSearchProps {
  onSelectTrack: (track: Omit<Track, "id">) => void;
}

// Données mockées pour le MVP (à remplacer par l'API Spotify en prod)
const MOCK_TRACKS: Omit<Track, "id">[] = [
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b273ef5f3d70cfe0c5b7e8c16ec7",
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b273865c2eccd64e38f21c51d17d",
  },
  {
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b273634e29a7b75a7027616fae63",
  },
  {
    title: "One More Time",
    artist: "Daft Punk",
    album: "Discovery",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b273504177b83b69b5c1d4f27ded",
  },
  {
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    album: "Uptown Special",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b2736a44ce1b3c01f6d92e82bc30",
  },
  {
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    album: "Random Access Memories",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b2736a1e5e5e1c10ee18d285a8ba",
  },
  {
    title: "Don't Start Now",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b273865c2eccd64e38f21c51d17d",
  },
  {
    title: "Save Your Tears",
    artist: "The Weeknd",
    album: "After Hours",
    cover_url:
      "https://i.scdn.co/image/ab67616d0000b273ef5f3d70cfe0c5b7e8c16ec7",
  },
];

export default function MusicSearch({ onSelectTrack }: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Omit<Track, "id">[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Simuler un délai d'API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Filtrer les tracks mockées
    const results = MOCK_TRACKS.filter(
      (track) =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setSearchResults(results);
    setIsSearching(false);

    // TODO: Remplacer par un vrai appel API Spotify
    // const response = await fetch(`/api/search?q=${searchQuery}`)
    // const data = await response.json()
    // setSearchResults(data.tracks)
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Rechercher un titre, un artiste..."
            className="w-full bg-dark-bg pl-10 pr-4 py-3 rounded-lg border border-neon-violet/30 focus:outline-none focus:border-neon-violet text-white placeholder-gray-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="btn-neon btn-neon-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Rechercher"
          )}
        </button>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-300">
            {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {searchResults.map((track, index) => (
              <div
                key={index}
                className="bg-dark-bg rounded-lg p-4 border border-neon-violet/20 hover:border-neon-violet/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-neon-violet/20 flex items-center justify-center">
                      <Music className="w-6 h-6 text-neon-violet" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {track.title}
                    </h4>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artist}
                    </p>
                    {track.album && (
                      <p className="text-xs text-gray-500 truncate">
                        {track.album}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectTrack(track)}
                    className="btn-neon btn-neon-secondary px-4 py-2 text-sm whitespace-nowrap"
                  >
                    Suggérer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* État initial */}
      {searchResults.length === 0 && searchQuery === "" && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Recherchez un morceau pour commencer</p>
        </div>
      )}

      {/* Aucun résultat */}
      {searchResults.length === 0 && searchQuery !== "" && !isSearching && (
        <div className="text-center py-12 text-gray-400">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Aucun résultat trouvé pour "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
