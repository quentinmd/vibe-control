"use client";

import { useState } from "react";
import { Search, Music, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  spotify_id?: string;
  source: "spotify" | "youtube";
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  spotify_id?: string;
}

interface MusicSearchProps {
  sessionId: string;
  onSelectTrack: (track: Omit<Track, "id">) => void;
}

export default function MusicSearch({
  sessionId,
  onSelectTrack,
}: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceUsed, setSourceUsed] = useState<"spotify" | "youtube" | null>(
    null,
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSourceUsed(null);

    try {
      const response = await fetch(
        `/api/music-search?q=${encodeURIComponent(searchQuery)}&sessionId=${encodeURIComponent(sessionId)}`,
        { signal: AbortSignal.timeout(10000) },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erreur de recherche musicale");
      }

      if (data?.tracks?.length > 0) {
        setSearchResults(data.tracks);
        setSourceUsed(data.source || null);
      } else {
        setSearchResults([]);
        setError("Aucun résultat trouvé");
      }
    } catch (err) {
      console.error("Erreur recherche:", err);
      setError("Erreur lors de la recherche. Réessayez.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Rechercher un titre, un artiste..."
            className="w-full bg-white pl-10 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="btn-primary px-4 sm:px-6 md:px-8 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Rechercher"
          )}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Résultats de recherche */}
      {searchResults.length > 0 && !error && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {searchResults.map((track, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-16 h-16 rounded object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-primary-100 flex items-center justify-center">
                      <Music className="w-6 h-6 text-primary-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {track.title}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {track.artist}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      Source:{" "}
                      {track.source === "spotify" ? "Spotify" : "YouTube"}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onSelectTrack({
                        title: track.title,
                        artist: track.artist,
                        album: track.album,
                        cover_url: track.cover_url,
                        spotify_id: track.spotify_id,
                      })
                    }
                    className="btn-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm whitespace-nowrap"
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
        <div className="text-center py-12 text-gray-500">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Recherchez un morceau pour commencer</p>
          <p className="text-xs text-gray-400 mt-2">Propulsé par YouTube</p>
        </div>
      )}

      {sourceUsed && searchResults.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Recherche active via{" "}
          {sourceUsed === "spotify" ? "Spotify" : "YouTube"}
        </p>
      )}

      {/* Aucun résultat */}
      {searchResults.length === 0 &&
        searchQuery !== "" &&
        !isSearching &&
        !error && (
          <div className="text-center py-12 text-gray-500">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Aucun résultat trouvé pour "{searchQuery}"</p>
            <p className="text-sm mt-2 text-gray-400">
              Essayez un autre terme de recherche
            </p>
          </div>
        )}
    </div>
  );
}
