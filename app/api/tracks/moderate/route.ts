import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type ModerationAction = "approve" | "reject" | "played";

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

const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 2,
): Promise<T> => {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isAbortLike =
        (error?.message || "").includes("AbortError") ||
        (error?.hint || "").includes("Request was aborted");

      if (!isAbortLike || attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  throw lastError;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { trackId, action } = (await request.json()) as {
      trackId?: string;
      action?: ModerationAction;
    };

    if (!trackId || !action) {
      return NextResponse.json(
        { error: "trackId et action requis" },
        { status: 400 },
      );
    }

    if (!["approve", "reject", "played"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const { data: track, error: trackError } = await adminSupabase
      .from("tracks")
      .select("id, session_id, status")
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: "Track introuvable" }, { status: 404 });
    }

    const { data: hostLink } = await adminSupabase
      .from("session_hosts")
      .select("role")
      .eq("session_id", track.session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    let hasPermission = Boolean(hostLink);

    if (!hasPermission) {
      const { data: ownedSession } = await adminSupabase
        .from("sessions")
        .select("id")
        .eq("id", track.session_id)
        .eq("host_id", user.id)
        .maybeSingle();

      hasPermission = Boolean(ownedSession);
    }

    if (!hasPermission) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const now = new Date().toISOString();
    let updates: Record<string, any> = {};

    if (action === "approve") {
      updates = { status: "approved", approved_at: now };
    } else if (action === "reject") {
      updates = { status: "rejected", rejected_at: now };
    } else {
      updates = { status: "played", played_at: now };
    }

    if (
      (action === "approve" && track.status === "approved") ||
      (action === "reject" && track.status === "rejected") ||
      (action === "played" && track.status === "played")
    ) {
      return NextResponse.json({ success: true, status: track.status });
    }

    await withRetry(async () => {
      const { error } = await adminSupabase
        .from("tracks")
        .update(updates)
        .eq("id", trackId);

      if (error) throw error;
    });

    return NextResponse.json({ success: true, status: updates.status });
  } catch (error: any) {
    console.error("Erreur modération track:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la modération du morceau",
        details: error?.message || null,
      },
      { status: 500 },
    );
  }
}
