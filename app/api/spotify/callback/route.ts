import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  exchangeSpotifyCodeForTokens,
  getSpotifyCurrentUser,
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

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?error=spotify_auth", request.url),
      );
    }

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const spotifyError = requestUrl.searchParams.get("error");
    const storedState = request.cookies.get("spotify_oauth_state")?.value;

    if (spotifyError) {
      const response = NextResponse.redirect(
        new URL(
          `/host?spotify=denied&error=${encodeURIComponent(spotifyError)}`,
          request.url,
        ),
      );
      response.cookies.delete("spotify_oauth_state");
      return response;
    }

    if (!code || !state || !storedState || state !== storedState) {
      const response = NextResponse.redirect(
        new URL("/host?spotify=invalid_state", request.url),
      );
      response.cookies.delete("spotify_oauth_state");
      return response;
    }

    const tokenResponse = await exchangeSpotifyCodeForTokens(code);
    const spotifyUser = await getSpotifyCurrentUser(tokenResponse.access_token);
    const expiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000,
    ).toISOString();

    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        spotify_user_id: spotifyUser.id,
        spotify_access_token: tokenResponse.access_token,
        spotify_refresh_token: tokenResponse.refresh_token,
        spotify_token_expires_at: expiresAt,
        spotify_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    const response = NextResponse.redirect(
      new URL("/host?spotify=connected", request.url),
    );
    response.cookies.delete("spotify_oauth_state");
    return response;
  } catch (error) {
    console.error("Spotify callback error:", error);
    const response = NextResponse.redirect(
      new URL("/host?spotify=callback_error", request.url),
    );
    response.cookies.delete("spotify_oauth_state");
    return response;
  }
}
