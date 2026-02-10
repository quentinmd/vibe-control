// API Service pour la recherche de musique
// Utilise iTunes Search API (gratuit, pas de clé nécessaire)

export interface TrackResult {
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  preview_url?: string;
  spotify_id?: string; // Pour compatibilité future
}

/**
 * Recherche de musique via iTunes Search API
 * @param query - Terme de recherche (titre, artiste, etc.)
 * @returns Liste de morceaux trouvés
 */
export async function searchMusic(query: string): Promise<TrackResult[]> {
  if (!query.trim()) return [];

  try {
    // iTunes Search API (gratuit, pas de clé nécessaire)
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`,
    );

    if (!response.ok) {
      throw new Error("Erreur de recherche");
    }

    const data = await response.json();

    // Transformer les résultats iTunes en format TrackResult
    return data.results.map((track: any) => ({
      title: track.trackName || "Sans titre",
      artist: track.artistName || "Artiste inconnu",
      album: track.collectionName,
      cover_url: track.artworkUrl100?.replace("100x100", "600x600"), // Meilleure qualité
      preview_url: track.previewUrl, // Audio 30s
      spotify_id: null, // Pas de Spotify ID avec iTunes
    }));
  } catch (error) {
    console.error("Erreur recherche iTunes:", error);
    throw error;
  }
}

/**
 * ALTERNATIVE : YouTube Data API v3 (nécessite clé API gratuite)
 * Décommentez et configurez si vous préférez YouTube
 */
/*
export async function searchMusicYouTube(query: string): Promise<TrackResult[]> {
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  
  if (!API_KEY) {
    console.warn('YouTube API key manquante, utilisez iTunes')
    return searchMusic(query)
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${API_KEY}`
    )

    const data = await response.json()

    return data.items.map((item: any) => ({
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      album: null,
      cover_url: item.snippet.thumbnails.high.url,
      preview_url: null,
      spotify_id: item.id.videoId, // Utiliser comme YouTube video ID
    }))
  } catch (error) {
    console.error('Erreur recherche YouTube:', error)
    throw error
  }
}
*/
