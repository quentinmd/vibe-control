import { NextRequest, NextResponse } from "next/server";

// Liste des instances Invidious publiques (fallback)
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.privacyredirect.com",
  "https://invidious.protokolla.fi",
  "https://iv.nboeck.de",
  "https://invidious.lunar.icu",
];

/**
 * API Route pour rechercher des vidéos YouTube
 * Évite les problèmes CORS en faisant la requête côté serveur
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

  // Essayer chaque instance jusqu'à ce qu'une fonctionne
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`🔍 Tentative avec ${instance}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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

  // Toutes les instances ont échoué
  console.error("❌ Toutes les instances Invidious ont échoué");
  return NextResponse.json(
    {
      error: "Impossible de trouver la vidéo",
      message:
        "Toutes les instances de recherche sont indisponibles. Utilisez le bouton manuel.",
    },
    { status: 503 },
  );
}
