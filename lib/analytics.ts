import { createClient } from "@/lib/supabase-browser";

// =============================================
// TYPES
// =============================================

export interface SessionStats {
  sessionId: string;
  sessionName: string;
  totalTracksSuggested: number;
  totalTracksApproved: number;
  totalTracksRejected: number;
  totalTracksPlayed: number;
  uniqueContributors: number;
  avgApprovalTimeSeconds: number | null;
  peakGuests: number;
  sessionDurationMinutes: number | null;
  approvalRate: number; // Pourcentage
  rejectionRate: number; // Pourcentage
  createdAt: string;
  endedAt: string | null;
  isActive: boolean;
}

export interface AnalyticsSummary {
  totalSessions: number;
  activeSessions: number;
  archivedSessions: number;
  totalTracks: number;
  totalApproved: number;
  totalRejected: number;
  totalPlayed: number;
  avgApprovalRate: number;
  totalContributors: number;
}

export interface TopTrack {
  title: string;
  artist: string;
  timesRequested: number;
  timesApproved: number;
  timesPlayed: number;
  approvalRate: number;
}

export interface EngagementMetrics {
  totalSuggestions: number;
  approvedSuggestions: number;
  rejectedSuggestions: number;
  pendingSuggestions: number;
  approvalRate: number;
  rejectionRate: number;
  avgResponseTimeMinutes: number | null;
  peakActivityHour: number | null;
  uniqueContributors: number;
}

export interface TimelineEvent {
  id: string;
  type: "suggestion" | "approval" | "rejection" | "played" | "session_start" | "session_end";
  timestamp: string;
  trackTitle?: string;
  trackArtist?: string;
  contributorName?: string;
}

// =============================================
// FONCTIONS PRINCIPALES
// =============================================

/**
 * Récupère les statistiques détaillées d'une session
 */
export async function getSessionDetailedStats(
  sessionId: string
): Promise<SessionStats | null> {
  const supabase = createClient();

  try {
    // Récupérer les infos de session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, name, created_at, ended_at, is_active")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching session:", sessionError);
      return null;
    }

    // Récupérer les stats depuis session_stats (si elles existent)
    const { data: stats } = await supabase
      .from("session_stats")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    // Récupérer les tracks pour calculer les stats en temps réel
    const { data: tracks } = await supabase
      .from("tracks")
      .select("status, suggested_by, created_at, approved_at, rejected_at")
      .eq("session_id", sessionId);

    const totalSuggested = tracks?.length || 0;
    const approved = tracks?.filter((t) => t.status === "approved").length || 0;
    const rejected = tracks?.filter((t) => t.status === "rejected").length || 0;
    const played = tracks?.filter((t) => t.status === "played").length || 0;

    // Calculer le temps moyen d'approbation
    const approvedTracks = tracks?.filter(
      (t) => t.approved_at && t.created_at
    ) || [];
    const avgApprovalTime = approvedTracks.length > 0
      ? approvedTracks.reduce((sum, track) => {
          const created = new Date(track.created_at).getTime();
          const approved = new Date(track.approved_at!).getTime();
          return sum + (approved - created) / 1000; // en secondes
        }, 0) / approvedTracks.length
      : null;

    // Contributeurs uniques
    const uniqueContributors = new Set(
      tracks?.filter((t) => t.suggested_by).map((t) => t.suggested_by)
    ).size;

    const approvalRate =
      totalSuggested > 0 ? (approved / totalSuggested) * 100 : 0;
    const rejectionRate =
      totalSuggested > 0 ? (rejected / totalSuggested) * 100 : 0;

    return {
      sessionId: session.id,
      sessionName: session.name,
      totalTracksSuggested: totalSuggested,
      totalTracksApproved: approved,
      totalTracksRejected: rejected,
      totalTracksPlayed: played,
      uniqueContributors,
      avgApprovalTimeSeconds: avgApprovalTime,
      peakGuests: stats?.peak_guests || 0,
      sessionDurationMinutes: stats?.session_duration_minutes || null,
      approvalRate,
      rejectionRate,
      createdAt: session.created_at,
      endedAt: session.ended_at,
      isActive: session.is_active,
    };
  } catch (error) {
    console.error("Error in getSessionDetailedStats:", error);
    return null;
  }
}

/**
 * Récupère un résumé analytique pour un utilisateur sur une période
 */
export async function getUserAnalyticsSummary(
  userId: string,
  periodDays: number = 30
): Promise<AnalyticsSummary | null> {
  const supabase = createClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Récupérer toutes les sessions de l'utilisateur
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, is_active, created_at")
      .eq("host_id", userId)
      .gte("created_at", startDate.toISOString());

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return null;
    }

    const sessionIds = sessions?.map((s) => s.id) || [];
    const activeSessions = sessions?.filter((s) => s.is_active).length || 0;

    // Récupérer tous les tracks de ces sessions
    const { data: tracks } = await supabase
      .from("tracks")
      .select("status, suggested_by")
      .in("session_id", sessionIds);

    const totalTracks = tracks?.length || 0;
    const totalApproved =
      tracks?.filter((t) => t.status === "approved").length || 0;
    const totalRejected =
      tracks?.filter((t) => t.status === "rejected").length || 0;
    const totalPlayed =
      tracks?.filter((t) => t.status === "played").length || 0;

    const avgApprovalRate =
      totalTracks > 0 ? (totalApproved / totalTracks) * 100 : 0;

    const totalContributors = new Set(
      tracks?.filter((t) => t.suggested_by).map((t) => t.suggested_by)
    ).size;

    return {
      totalSessions: sessions?.length || 0,
      activeSessions,
      archivedSessions: (sessions?.length || 0) - activeSessions,
      totalTracks,
      totalApproved,
      totalRejected,
      totalPlayed,
      avgApprovalRate,
      totalContributors,
    };
  } catch (error) {
    console.error("Error in getUserAnalyticsSummary:", error);
    return null;
  }
}

/**
 * Récupère les morceaux les plus demandés pour un utilisateur
 */
export async function getTopTracks(
  userId: string,
  limit: number = 10
): Promise<TopTrack[]> {
  const supabase = createClient();

  try {
    // Récupérer toutes les sessions de l'utilisateur
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("host_id", userId);

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);

    // Récupérer tous les tracks
    const { data: tracks } = await supabase
      .from("tracks")
      .select("title, artist, status")
      .in("session_id", sessionIds);

    if (!tracks || tracks.length === 0) return [];

    // Grouper par titre + artiste
    const trackMap = new Map<string, TopTrack>();

    tracks.forEach((track) => {
      const key = `${track.title}|||${track.artist}`;
      const existing = trackMap.get(key);

      if (existing) {
        existing.timesRequested++;
        if (track.status === "approved") existing.timesApproved++;
        if (track.status === "played") existing.timesPlayed++;
      } else {
        trackMap.set(key, {
          title: track.title,
          artist: track.artist,
          timesRequested: 1,
          timesApproved: track.status === "approved" ? 1 : 0,
          timesPlayed: track.status === "played" ? 1 : 0,
          approvalRate: 0,
        });
      }
    });

    // Calculer le taux d'approbation et trier
    const topTracks = Array.from(trackMap.values())
      .map((track) => ({
        ...track,
        approvalRate:
          track.timesRequested > 0
            ? (track.timesApproved / track.timesRequested) * 100
            : 0,
      }))
      .sort((a, b) => b.timesRequested - a.timesRequested)
      .slice(0, limit);

    return topTracks;
  } catch (error) {
    console.error("Error in getTopTracks:", error);
    return [];
  }
}

/**
 * Récupère les métriques d'engagement pour une session
 */
export async function getEngagementMetrics(
  sessionId: string
): Promise<EngagementMetrics | null> {
  const supabase = createClient();

  try {
    const { data: tracks } = await supabase
      .from("tracks")
      .select("status, created_at, approved_at, rejected_at, suggested_by")
      .eq("session_id", sessionId);

    if (!tracks) return null;

    const total = tracks.length;
    const approved = tracks.filter((t) => t.status === "approved").length;
    const rejected = tracks.filter((t) => t.status === "rejected").length;
    const pending = tracks.filter((t) => t.status === "pending").length;

    // Temps de réponse moyen (en minutes)
    const responseTimes = tracks
      .filter((t) => t.approved_at || t.rejected_at)
      .map((t) => {
        const created = new Date(t.created_at).getTime();
        const responded = new Date(
          (t.approved_at || t.rejected_at)!
        ).getTime();
        return (responded - created) / 1000 / 60; // minutes
      });

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : null;

    // Heure de pic d'activité
    const hours = tracks.map((t) => new Date(t.created_at).getHours());
    const hourCounts = new Map<number, number>();
    hours.forEach((hour) => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const peakHour =
      hourCounts.size > 0
        ? Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    const uniqueContributors = new Set(
      tracks.filter((t) => t.suggested_by).map((t) => t.suggested_by)
    ).size;

    return {
      totalSuggestions: total,
      approvedSuggestions: approved,
      rejectedSuggestions: rejected,
      pendingSuggestions: pending,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
      avgResponseTimeMinutes: avgResponseTime,
      peakActivityHour: peakHour,
      uniqueContributors,
    };
  } catch (error) {
    console.error("Error in getEngagementMetrics:", error);
    return null;
  }
}

/**
 * Récupère la chronologie des événements d'une session
 */
export async function getSessionTimeline(
  sessionId: string
): Promise<TimelineEvent[]> {
  const supabase = createClient();

  try {
    // Récupérer la session
    const { data: session } = await supabase
      .from("sessions")
      .select("created_at, ended_at")
      .eq("id", sessionId)
      .single();

    // Récupérer les tracks
    const { data: tracks } = await supabase
      .from("tracks")
      .select("id, title, artist, status, created_at, approved_at, rejected_at, played_at, suggested_by")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const events: TimelineEvent[] = [];

    // Événement de début de session
    if (session) {
      events.push({
        id: `session-start-${sessionId}`,
        type: "session_start",
        timestamp: session.created_at,
      });
    }

    // Événements de tracks
    if (tracks) {
      tracks.forEach((track) => {
        // Suggestion
        events.push({
          id: `${track.id}-suggestion`,
          type: "suggestion",
          timestamp: track.created_at,
          trackTitle: track.title,
          trackArtist: track.artist,
          contributorName: track.suggested_by || "Anonyme",
        });

        // Approbation
        if (track.approved_at) {
          events.push({
            id: `${track.id}-approval`,
            type: "approval",
            timestamp: track.approved_at,
            trackTitle: track.title,
            trackArtist: track.artist,
          });
        }

        // Rejet
        if (track.rejected_at) {
          events.push({
            id: `${track.id}-rejection`,
            type: "rejection",
            timestamp: track.rejected_at,
            trackTitle: track.title,
            trackArtist: track.artist,
          });
        }

        // Lecture
        if (track.played_at) {
          events.push({
            id: `${track.id}-played`,
            type: "played",
            timestamp: track.played_at,
            trackTitle: track.title,
            trackArtist: track.artist,
          });
        }
      });
    }

    // Événement de fin de session
    if (session?.ended_at) {
      events.push({
        id: `session-end-${sessionId}`,
        type: "session_end",
        timestamp: session.ended_at,
      });
    }

    // Trier par timestamp
    return events.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error in getSessionTimeline:", error);
    return [];
  }
}

/**
 * Enregistre un guest dans session_guests (tracking simple)
 */
export async function trackGuestActivity(
  sessionId: string,
  guestName: string,
  guestIdentifier: string
): Promise<void> {
  const supabase = createClient();

  try {
    // Vérifier si le guest existe déjà
    const { data: existing } = await supabase
      .from("session_guests")
      .select("id, total_suggestions")
      .eq("session_id", sessionId)
      .eq("guest_identifier", guestIdentifier)
      .single();

    if (existing) {
      // Mettre à jour last_activity et total_suggestions
      await supabase
        .from("session_guests")
        .update({
          last_activity: new Date().toISOString(),
          total_suggestions: (existing.total_suggestions || 0) + 1,
        })
        .eq("id", existing.id);
    } else {
      // Créer nouveau guest
      await supabase.from("session_guests").insert({
        session_id: sessionId,
        guest_name: guestName,
        guest_identifier: guestIdentifier,
        total_suggestions: 1,
      });
    }
  } catch (error) {
    console.error("Error tracking guest activity:", error);
  }
}
