import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { createClient as createServerClient } from "@/lib/supabase-server";

export type SubscriptionTier = "free" | "premium" | "pro";

export interface TierLimits {
  maxActiveSessions: number;
  maxSuggestionsPerSession: number;
  maxGuests: number;
  maxSessionDurationHours: number;
  hasSpotify: boolean;
  hasAnalytics: boolean;
  hasCustomBranding: boolean;
  hasMultiHost: boolean;
  hasAPI: boolean;
}

// Limites par tier
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxActiveSessions: 1,
    maxSuggestionsPerSession: 50,
    maxGuests: 20,
    maxSessionDurationHours: 4,
    hasSpotify: false,
    hasAnalytics: false,
    hasCustomBranding: false,
    hasMultiHost: false,
    hasAPI: false,
  },
  premium: {
    maxActiveSessions: 999999, // "unlimited"
    maxSuggestionsPerSession: 999999,
    maxGuests: 999999,
    maxSessionDurationHours: 999999,
    hasSpotify: true,
    hasAnalytics: true,
    hasCustomBranding: false,
    hasMultiHost: false,
    hasAPI: false,
  },
  pro: {
    maxActiveSessions: 999999, // "unlimited"
    maxSuggestionsPerSession: 999999,
    maxGuests: 999999,
    maxSessionDurationHours: 999999,
    hasSpotify: true,
    hasAnalytics: true,
    hasCustomBranding: true,
    hasMultiHost: true,
    hasAPI: true,
  },
};

// Récupérer les limites d'un utilisateur
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

// Vérifier si l'utilisateur peut créer une nouvelle session (côté client)
export async function canCreateSession(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const supabase = createBrowserClient();

  try {
    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        allowed: false,
        reason: "Profil utilisateur non trouvé",
      };
    }

    const tier = profile.subscription_tier as SubscriptionTier;
    const limits = getTierLimits(tier);

    // Compter les sessions actives - essayer d'abord avec session_hosts, puis fallback
    let currentCount = 0;

    // Essayer avec session_hosts (nouveau système)
    const { data: sessionHosts, error: hostsError } = await supabase
      .from("session_hosts")
      .select("session_id, sessions!inner(is_active)")
      .eq("user_id", userId)
      .eq("role", "owner")
      .eq("sessions.is_active", true);

    if (hostsError) {
      // Fallback vers l'ancien système sessions.host_id
      console.log("Fallback to old session counting method");
      const { count, error: countError } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("host_id", userId)
        .eq("is_active", true);

      if (countError) {
        console.error("Error counting sessions (fallback):", countError);
        return {
          allowed: false,
          reason: "Erreur lors de la vérification des limites",
        };
      }

      currentCount = count || 0;
    } else {
      currentCount = sessionHosts?.length || 0;
    }

    if (currentCount >= limits.maxActiveSessions) {
      return {
        allowed: false,
        reason: `Limite de sessions actives atteinte (${limits.maxActiveSessions})`,
        currentCount,
        limit: limits.maxActiveSessions,
      };
    }

    return {
      allowed: true,
      currentCount,
      limit: limits.maxActiveSessions,
    };
  } catch (error) {
    console.error("Error checking session limit:", error);
    return {
      allowed: false,
      reason: "Erreur inattendue",
    };
  }
}

// Vérifier si on peut ajouter une suggestion (côté client)
export async function canAddSuggestion(sessionId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const supabase = createBrowserClient();

  try {
    // Récupérer l'owner de la session - essayer session_hosts, puis fallback
    const { data: sessionHost, error: sessionError } = await supabase
      .from("session_hosts")
      .select("user_id")
      .eq("session_id", sessionId)
      .eq("role", "owner")
      .single();

    let hostId: string | null = null;

    if (sessionError) {
      // Fallback vers l'ancien système
      console.log("Fallback to old session owner method");
      const { data: session, error: fallbackError } = await supabase
        .from("sessions")
        .select("host_id")
        .eq("id", sessionId)
        .single();

      if (fallbackError || !session) {
        return {
          allowed: false,
          reason: "Session non trouvée",
        };
      }

      hostId = session.host_id;
    } else {
      hostId = sessionHost?.user_id || null;
    }

    if (!hostId) {
      return {
        allowed: false,
        reason: "Session non trouvée",
      };
    }

    // Récupérer le tier de l'hôte
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", hostId)
      .single();

    if (profileError || !profile) {
      return {
        allowed: false,
        reason: "Profil hôte non trouvé",
      };
    }

    const tier = profile.subscription_tier as SubscriptionTier;
    const limits = getTierLimits(tier);

    // Compter les suggestions dans cette session
    const { count, error: countError } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (countError) {
      console.error("Error counting suggestions:", countError);
      return {
        allowed: false,
        reason: "Erreur lors de la vérification des limites",
      };
    }

    const currentCount = count || 0;

    if (currentCount >= limits.maxSuggestionsPerSession) {
      return {
        allowed: false,
        reason: `Limite de suggestions atteinte (${limits.maxSuggestionsPerSession})`,
        currentCount,
        limit: limits.maxSuggestionsPerSession,
      };
    }

    return {
      allowed: true,
      currentCount,
      limit: limits.maxSuggestionsPerSession,
    };
  } catch (error) {
    console.error("Error checking suggestion limit:", error);
    return {
      allowed: false,
      reason: "Erreur inattendue",
    };
  }
}

// Récupérer les statistiques d'utilisation d'un utilisateur
export async function getUserUsageStats(userId: string) {
  const supabase = createBrowserClient();

  try {
    // Compter les sessions actives - essayer avec session_hosts, puis fallback
    const { data: activeHosts, error: activeError } = await supabase
      .from("session_hosts")
      .select("session_id, sessions!inner(is_active)")
      .eq("user_id", userId)
      .eq("role", "owner")
      .eq("sessions.is_active", true);

    // Compter le total de sessions - essayer avec session_hosts, puis fallback
    const { data: totalHosts, error: totalError } = await supabase
      .from("session_hosts")
      .select("session_id")
      .eq("user_id", userId)
      .eq("role", "owner");

    let activeSessions = 0;
    let totalSessions = 0;

    // Si erreur, fallback vers l'ancien système
    if (activeError || totalError) {
      console.log("Fallback to old session stats method");
      const { count: activeCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("host_id", userId)
        .eq("is_active", true);

      const { count: totalCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("host_id", userId);

      activeSessions = activeCount || 0;
      totalSessions = totalCount || 0;
    } else {
      activeSessions = activeHosts?.length || 0;
      totalSessions = totalHosts?.length || 0;
    }

    // Récupérer le tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    const tier = (profile?.subscription_tier as SubscriptionTier) || "free";
    const limits = getTierLimits(tier);

    return {
      tier,
      activeSessions,
      totalSessions,
      limits,
    };
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return null;
  }
}

// Vérifier si la session a dépassé la durée maximale
export function isSessionExpired(
  createdAt: string,
  tier: SubscriptionTier,
): boolean {
  const limits = getTierLimits(tier);

  // Si illimité, jamais expiré
  if (limits.maxSessionDurationHours >= 999999) {
    return false;
  }

  const createdDate = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

  return hoursDiff > limits.maxSessionDurationHours;
}

// Vérifier si l'utilisateur a accès à une fonctionnalité
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof TierLimits,
): boolean {
  const limits = getTierLimits(tier);
  return limits[feature] === true;
}
