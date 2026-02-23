import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// =============================================
// GET - Lister les co-hôtes d'une session
// =============================================
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

    // Récupérer le sessionId
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    // Vérifier que l'utilisateur a accès à la session (owner ou moderator)
    const { data: userHost, error: hostError } = await supabase
      .from("session_hosts")
      .select("role")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (hostError || !userHost) {
      return NextResponse.json(
        { error: "Accès refusé à cette session" },
        { status: 403 },
      );
    }

    // Récupérer tous les co-hôtes de la session avec leurs infos
    const { data: hosts, error: hostsError } = await supabase
      .from("session_hosts")
      .select(
        `
        id,
        role,
        added_at,
        user_id,
        profiles:auth.users!session_hosts_user_id_fkey (
          id,
          email
        )
      `,
      )
      .eq("session_id", sessionId)
      .order("added_at", { ascending: true });

    if (hostsError) {
      console.error("Error fetching co-hosts:", hostsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des co-hôtes" },
        { status: 500 },
      );
    }

    // Récupérer les emails depuis la table profiles (car auth.users n'est pas toujours accessible)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", hosts?.map((h) => h.user_id) || []);

    // Combiner les données
    const hostsWithDetails = hosts?.map((host) => {
      const profile = profiles?.find((p) => p.id === host.user_id);
      return {
        id: host.id,
        user_id: host.user_id,
        role: host.role,
        added_at: host.added_at,
        email: profile?.email || "Email inconnu",
        full_name: profile?.full_name || null,
      };
    });

    return NextResponse.json({
      hosts: hostsWithDetails,
      currentUserRole: userHost.role,
    });
  } catch (error) {
    console.error("Error in GET co-hosts:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// =============================================
// POST - Ajouter un co-hôte à une session
// =============================================
export async function POST(request: NextRequest) {
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

    // Récupérer les données du body
    const body = await request.json();
    const { sessionId, email } = body;

    if (!sessionId || !email) {
      return NextResponse.json(
        { error: "sessionId et email requis" },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur actuel est owner de la session
    const { data: ownerCheck, error: ownerError } = await supabase
      .from("session_hosts")
      .select("role")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (ownerError || !ownerCheck || ownerCheck.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut ajouter des co-hôtes" },
        { status: 403 },
      );
    }

    // Vérifier si c'est un abonnement Pro
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_tier !== "pro") {
      return NextResponse.json(
        { error: "Fonctionnalité réservée aux abonnés Pro" },
        { status: 403 },
      );
    }

    // Trouver l'utilisateur à ajouter par email
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé avec cet email" },
        { status: 404 },
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà co-hôte
    const { data: existing } = await supabase
      .from("session_hosts")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", targetProfile.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà co-hôte de cette session" },
        { status: 400 },
      );
    }

    // Ajouter le co-hôte
    const { data: newHost, error: insertError } = await supabase
      .from("session_hosts")
      .insert({
        session_id: sessionId,
        user_id: targetProfile.id,
        role: "moderator",
        added_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding co-host:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de l'ajout du co-hôte" },
        { status: 500 },
      );
    }

    // TODO: Envoyer un email de notification (optionnel)

    return NextResponse.json({
      success: true,
      host: {
        id: newHost.id,
        user_id: targetProfile.id,
        email: targetProfile.email,
        role: newHost.role,
        added_at: newHost.added_at,
      },
      message: `${targetProfile.email} a été ajouté comme co-modérateur`,
    });
  } catch (error) {
    console.error("Error in POST co-hosts:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// =============================================
// DELETE - Retirer un co-hôte d'une session
// =============================================
export async function DELETE(request: NextRequest) {
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

    // Récupérer les données du body
    const body = await request.json();
    const { sessionId, hostId } = body;

    if (!sessionId || !hostId) {
      return NextResponse.json(
        { error: "sessionId et hostId requis" },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur actuel est owner de la session
    const { data: ownerCheck, error: ownerError } = await supabase
      .from("session_hosts")
      .select("role")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (ownerError || !ownerCheck || ownerCheck.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut retirer des co-hôtes" },
        { status: 403 },
      );
    }

    // Récupérer les infos du co-hôte à retirer
    const { data: hostToRemove, error: hostError } = await supabase
      .from("session_hosts")
      .select("role, user_id")
      .eq("id", hostId)
      .eq("session_id", sessionId)
      .single();

    if (hostError || !hostToRemove) {
      return NextResponse.json(
        { error: "Co-hôte non trouvé" },
        { status: 404 },
      );
    }

    // Empêcher de retirer l'owner
    if (hostToRemove.role === "owner") {
      return NextResponse.json(
        { error: "Impossible de retirer le propriétaire" },
        { status: 400 },
      );
    }

    // Retirer le co-hôte
    const { error: deleteError } = await supabase
      .from("session_hosts")
      .delete()
      .eq("id", hostId)
      .eq("session_id", sessionId);

    if (deleteError) {
      console.error("Error removing co-host:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors du retrait du co-hôte" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Co-modérateur retiré avec succès",
    });
  } catch (error) {
    console.error("Error in DELETE co-hosts:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
