import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getSpotifyAuthorizeUrl } from "@/lib/spotifyApi";

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

function randomState() {
  return crypto.randomUUID();
}

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

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.redirect(
        new URL("/host?spotify=profile_error", request.url),
      );
    }

    if (profile.subscription_tier === "free") {
      return NextResponse.redirect(
        new URL("/host?spotify=upgrade_required", request.url),
      );
    }

    const state = randomState();
    const authorizeUrl = getSpotifyAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set({
      name: "spotify_oauth_state",
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("Spotify connect error:", error);
    return NextResponse.redirect(
      new URL("/host?spotify=connect_error", request.url),
    );
  }
}
