import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  refreshSpotifyAccessToken,
  searchSpotifyTracks,
} from "@/lib/spotifyApi";

export const dynamic = "force-dynamic";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

type Tier = "free" | "premium" | "pro";

async function getSessionOwnerId(sessionId: string): Promise<string | null> {
  const { data: ownerLink } = await adminSupabase
    .from("session_hosts")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerLink?.user_id) {
    return ownerLink.user_id;
  }

  const { data: legacySession } = await adminSupabase
    .from("sessions")
    .select("host_id")
    .eq("id", sessionId)
    .maybeSingle();

  return legacySession?.host_id || null;
}

function hasSpotifyAccess(tier: Tier | null | undefined) {
  return tier === "premium" || tier === "pro";
}

async function fallbackYouTube(request: NextRequest, query: string) {
  const fallbackResponse = await fetch(
    `${request.nextUrl.origin}/api/youtube-search?q=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(10000) },
  );

  if (!fallbackResponse.ok) {
    return [];
  }

  const youtubeData = await fallbackResponse.json();
  if (!youtubeData?.videoId) {
    return [];
  }

  return [
    {
      id: youtubeData.videoId,
      title: youtubeData.title || query,
      artist: youtubeData.author || "Artiste inconnu",
      cover_url: `https://img.youtube.com/vi/${youtubeData.videoId}/mqdefault.jpg`,
      spotify_id: null,
      source: "youtube",
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!query || !sessionId) {
      return NextResponse.json(
        { error: "Paramètres q et sessionId requis" },
        { status: 400 },
      );
    }

    const ownerId = await getSessionOwnerId(sessionId);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 },
      );
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select(
        "subscription_tier, spotify_access_token, spotify_refresh_token, spotify_token_expires_at",
      )
      .eq("id", ownerId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil hôte introuvable" },
        { status: 404 },
      );
    }

    const tier = profile.subscription_tier as Tier;

    if (!hasSpotifyAccess(tier)) {
      const tracks = await fallbackYouTube(request, query);
      return NextResponse.json({ source: "youtube", tracks });
    }

    let accessToken: string | null = profile.spotify_access_token;
    let refreshToken: string | null = profile.spotify_refresh_token;
    const expiresAt = profile.spotify_token_expires_at
      ? new Date(profile.spotify_token_expires_at).getTime()
      : 0;

    if (accessToken && refreshToken && expiresAt && Date.now() >= expiresAt) {
      try {
        const refreshed = await refreshSpotifyAccessToken(refreshToken);
        accessToken = refreshed.access_token;
        refreshToken = refreshed.refresh_token ?? refreshToken;

        await adminSupabase
          .from("profiles")
          .update({
            spotify_access_token: accessToken,
            spotify_refresh_token: refreshToken,
            spotify_token_expires_at: new Date(
              Date.now() + refreshed.expires_in * 1000,
            ).toISOString(),
          })
          .eq("id", ownerId);
      } catch (error) {
        console.warn("Spotify token refresh failed, fallback YouTube:", error);
      }
    }

    if (accessToken) {
      try {
        const spotifyTracks = await searchSpotifyTracks(query, accessToken);
        if (spotifyTracks.length > 0) {
          return NextResponse.json({
            source: "spotify",
            tracks: spotifyTracks.map((track) => ({
              ...track,
              source: "spotify",
            })),
          });
        }
      } catch (error) {
        console.warn("Spotify search failed, fallback YouTube:", error);
      }
    }

    const tracks = await fallbackYouTube(request, query);
    return NextResponse.json({ source: "youtube", tracks });
  } catch (error) {
    console.error("Music search API error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
