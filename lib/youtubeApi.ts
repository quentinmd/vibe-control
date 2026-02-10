// Service pour rechercher des vidéos YouTube
// Utilise l'API YouTube Data v3 (optionnel - clé gratuite)
// OU recherche directe via iframe (sans API)

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

/**
 * Recherche YouTube via Data API v3 (nécessite clé API)
 * Quota gratuit: 10,000 unités/jour (100 recherches)
 */
export async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!API_KEY) {
    console.warn("YouTube API key manquante, utilisez la recherche directe");
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&videoCategoryId=10&maxResults=1&` +
        `q=${encodeURIComponent(query)}&key=${API_KEY}`,
    );

    if (!response.ok) throw new Error("Erreur YouTube API");

    const data = await response.json();

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
    }));
  } catch (error) {
    console.error("Erreur recherche YouTube:", error);
    return [];
  }
}

/**
 * Rechercher un videoId YouTube sans clé API (méthode alternative)
 * Utilise notre API route Next.js qui fait un proxy vers Invidious
 * Évite les problèmes CORS en passant par le serveur
 */
export async function searchYouTubeNoAPI(
  query: string,
): Promise<string | null> {
  try {
    // Appeler notre API route qui gère le proxy
    const response = await fetch(
      `/api/youtube-search?q=${encodeURIComponent(query)}`,
      {
        signal: AbortSignal.timeout(10000), // 10s timeout
      },
    );

    if (!response.ok) {
      console.warn(
        `API YouTube search failed: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();

    if (data.videoId) {
      console.log(`✅ VideoId trouvé: ${data.videoId}`);
      return data.videoId;
    }

    return null;
  } catch (error: any) {
    console.error("Erreur recherche YouTube (no API):", error);
    return null;
  }
}

/**
 * Construire une URL de recherche YouTube directe (sans API)
 * Utile pour ouvrir dans un nouvel onglet ou iframe
 */
export function getYouTubeSearchUrl(title: string, artist: string): string {
  const query = `${artist} ${title} official audio`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Extraire l'ID vidéo d'une URL YouTube
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
