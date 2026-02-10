import { NextRequest, NextResponse } from "next/server";

// API YouTube Data v3 (optionnelle mais recommandée)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Liste des instances Invidious publiques (fallback)
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.privacyredirect.com",
  "https://invidious.protokolla.fi",
  "https://iv.nboeck.de",
  "https://invidious.lunar.icu",
  "https://yewtu.be",
  "https://invidious.fdn.fr",
  "https://inv.riverside.rocks",
];

/**
 * Recherche via YouTube Data API v3 (officielle, nécessite clé API)
 * Quota: 10,000 unités/jour (100 recherches environ)
 */
async function searchYouTubeOfficial(query: string) {
  if (!YOUTUBE_API_KEY) {
    console.log("⚠️ Pas de clé YouTube API, passage au fallback Invidious");
    return null;
  }

  try {
    console.log("🔍 Recherche YouTube officielle...");
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&videoCategoryId=10&maxResults=1&` +
        `q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) {
      console.warn(`❌ YouTube API: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      console.log(`✅ Trouvé via YouTube API: ${video.id.videoId}`);
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        author: video.snippet.channelTitle,
        instance: "YouTube Data API v3",
      };
    }

    return null;
  } catch (error: any) {
    console.error("❌ Erreur YouTube API:", error.message);
    return null;
  }
}

/**
 * API Route pour rechercher des vidéos YouTube
 * Évite les problèmes CORS en faisant la requête côté serveur
 * 1. Essaie YouTube Data API v3 (si clé disponible)
 * 2. Sinon essaie Invidious (instances multiples)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Paramètre 'q' manquant" },
      { status: 400 },
    );
  }

  // 1. Essayer l'API officielle YouTube d'abord (plus fiable)
  const officialResult = await searchYouTubeOfficial(query);
  if (officialResult) {
    return NextResponse.json(officialResult);
  }

  // 2. Essayer chaque instance Invidious jusqu'à ce qu'une fonctionne
  console.log("🔄 Essai des instances Invidious...");
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`🔍 Tentative avec ${instance}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "VibeControl/1.0",
          },
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`❌ ${instance} : ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        console.log(`✅ Trouvé avec ${instance} : ${data[0].videoId}`);
        return NextResponse.json({
          videoId: data[0].videoId,
          title: data[0].title,
          author: data[0].author,
          instance: instance,
        });
      }
    } catch (error: any) {
      console.warn(`❌ ${instance} erreur:`, error.message);
      continue;
    }
  }

  // 3. Toutes les méthodes ont échoué
  console.error("❌ Toutes les instances ont échoué");
  return NextResponse.json(
    {
      error: "Impossible de trouver la vidéo",
      message:
        "Service de recherche temporairement indisponible. Utilisez le bouton manuel ou ajoutez une clé YouTube API.",
    },
    { status: 503 },
  );
}
