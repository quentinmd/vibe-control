import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getSessionDetailedStats } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const format = searchParams.get("format") || "json"; // json ou csv

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    // Vérifier que la session appartient à l'utilisateur
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("host_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session non trouvée ou accès refusé" },
        { status: 404 },
      );
    }

    // Récupérer les tracks de la session
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (tracksError) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des tracks" },
        { status: 500 },
      );
    }

    // Récupérer les statistiques
    const stats = await getSessionDetailedStats(sessionId);

    if (format === "csv") {
      // Générer CSV pour les tracks
      const headers = [
        "Titre",
        "Artiste",
        "Album",
        "Statut",
        "Suggéré par",
        "Date de suggestion",
        "Date d'approbation",
        "Date de rejet",
        "Date de lecture",
      ];

      const rows = (tracks || []).map((track) => [
        track.title,
        track.artist,
        track.album || "",
        track.status,
        track.suggested_by || "Anonyme",
        track.created_at,
        track.approved_at || "",
        track.rejected_at || "",
        track.played_at || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="session-${session.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // Format JSON (par défaut)
      const exportData = {
        session: {
          id: session.id,
          name: session.name,
          created_at: session.created_at,
          ended_at: session.ended_at,
          is_active: session.is_active,
        },
        tracks: tracks || [],
        statistics: stats,
        exported_at: new Date().toISOString(),
        export_version: "1.0",
      };

      return NextResponse.json(exportData, {
        headers: {
          "Content-Disposition": `attachment; filename="session-${session.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting session:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export de la session" },
      { status: 500 },
    );
  }
}
