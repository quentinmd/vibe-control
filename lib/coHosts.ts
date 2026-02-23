import { createClient } from "@/lib/supabase-browser";

// =============================================
// TYPES
// =============================================

export interface CoHost {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "moderator";
  added_at: string;
}

export interface CoHostsResponse {
  hosts: CoHost[];
  currentUserRole: "owner" | "moderator";
}

// =============================================
// FONCTIONS CÔTÉ CLIENT
// =============================================

/**
 * Récupérer les co-hôtes d'une session
 */
export async function getSessionCoHosts(
  sessionId: string,
): Promise<CoHostsResponse | null> {
  try {
    const response = await fetch(
      `/api/sessions/co-hosts?sessionId=${sessionId}`,
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error fetching co-hosts:", error);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getSessionCoHosts:", error);
    return null;
  }
}

/**
 * Ajouter un co-hôte à une session
 */
export async function addCoHost(
  sessionId: string,
  email: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch("/api/sessions/co-hosts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Erreur lors de l'ajout du co-hôte",
      };
    }

    return {
      success: true,
      message: data.message || "Co-hôte ajouté avec succès",
    };
  } catch (error) {
    console.error("Error in addCoHost:", error);
    return {
      success: false,
      error: "Erreur réseau lors de l'ajout du co-hôte",
    };
  }
}

/**
 * Retirer un co-hôte d'une session
 */
export async function removeCoHost(
  sessionId: string,
  hostId: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch("/api/sessions/co-hosts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, hostId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Erreur lors du retrait du co-hôte",
      };
    }

    return {
      success: true,
      message: data.message || "Co-hôte retiré avec succès",
    };
  } catch (error) {
    console.error("Error in removeCoHost:", error);
    return {
      success: false,
      error: "Erreur réseau lors du retrait du co-hôte",
    };
  }
}

/**
 * Vérifier si l'utilisateur est owner d'une session
 */
export async function isSessionOwner(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("session_hosts")
      .select("role")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === "owner";
  } catch (error) {
    console.error("Error checking owner status:", error);
    return false;
  }
}

/**
 * Obtenir le rôle de l'utilisateur dans une session
 */
export async function getUserSessionRole(
  sessionId: string,
  userId: string,
): Promise<"owner" | "moderator" | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("session_hosts")
      .select("role")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as "owner" | "moderator";
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Vérifier si un utilisateur a accès à une session (owner ou moderator)
 */
export async function hasSessionAccess(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("session_hosts")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error("Error checking session access:", error);
    return false;
  }
}

/**
 * Obtenir toutes les sessions où l'utilisateur est host (owner ou moderator)
 */
export async function getUserHostedSessions(userId: string) {
  const supabase = createClient();

  try {
    const { data: sessionHosts, error } = await supabase
      .from("session_hosts")
      .select(
        `
        role,
        added_at,
        session:sessions (
          id,
          name,
          created_at,
          is_active,
          ended_at,
          host_id
        )
      `,
      )
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching hosted sessions:", error);
      return [];
    }

    return (
      sessionHosts?.map((sh) => ({
        ...sh.session,
        user_role: sh.role,
        is_owner: sh.role === "owner",
      })) || []
    );
  } catch (error) {
    console.error("Error in getUserHostedSessions:", error);
    return [];
  }
}

/**
 * Compter le nombre de co-modérateurs d'une session
 */
export async function getCoHostsCount(sessionId: string): Promise<number> {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from("session_hosts")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("role", "moderator");

    if (error) {
      console.error("Error counting co-hosts:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getCoHostsCount:", error);
    return 0;
  }
}
