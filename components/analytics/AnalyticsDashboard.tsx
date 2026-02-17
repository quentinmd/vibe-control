"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getUserAnalyticsSummary,
  getTopTracks,
  type AnalyticsSummary,
  type TopTrack,
} from "@/lib/analytics";
import {
  BarChart3,
  TrendingUp,
  Users,
  Music,
  ThumbsUp,
  ThumbsDown,
  Play,
  Calendar,
} from "lucide-react";

interface AnalyticsDashboardProps {
  periodDays?: number;
}

export default function AnalyticsDashboard({
  periodDays = 30,
}: AnalyticsDashboardProps) {
  const { user, profile } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(periodDays);

  // Vérifier si l'utilisateur a accès aux analytics
  const hasAccess =
    profile?.subscription_tier === "premium" ||
    profile?.subscription_tier === "pro";

  useEffect(() => {
    if (user && hasAccess) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [user, hasAccess, selectedPeriod]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [summaryData, topTracksData] = await Promise.all([
        getUserAnalyticsSummary(user.id, selectedPeriod),
        getTopTracks(user.id, 10),
      ]);

      setSummary(summaryData);
      setTopTracks(topTracksData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-8 text-center border border-purple-500/20">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-purple-400" />
        <h3 className="text-2xl font-bold mb-2">Analytics Avancés</h3>
        <p className="text-gray-400 mb-6">
          Les analytics avancés sont réservés aux abonnements Premium et Pro.
        </p>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Découvrir les offres
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres de période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-purple-500" />
            Analytics Avancés
          </h2>
          <p className="text-gray-400 mt-1">
            Statistiques détaillées de vos sessions
          </p>
        </div>

        {/* Sélection de période */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedPeriod === days
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {days}j
            </button>
          ))}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Total Sessions"
          value={summary?.totalSessions || 0}
          subValue={`${summary?.activeSessions || 0} actives`}
          color="blue"
        />

        {/* Total Tracks */}
        <StatCard
          icon={<Music className="w-6 h-6" />}
          label="Morceaux Suggérés"
          value={summary?.totalTracks || 0}
          subValue={`${summary?.totalPlayed || 0} joués`}
          color="purple"
        />

        {/* Taux d'approbation */}
        <StatCard
          icon={<ThumbsUp className="w-6 h-6" />}
          label="Taux d'approbation"
          value={`${summary?.avgApprovalRate.toFixed(1) || 0}%`}
          subValue={`${summary?.totalApproved || 0} approuvés`}
          color="green"
        />

        {/* Contributeurs */}
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Contributeurs"
          value={summary?.totalContributors || 0}
          subValue="uniques"
          color="pink"
        />
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des statuts */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Distribution des Morceaux
          </h3>
          <div className="space-y-3">
            <StatusBar
              label="Approuvés"
              value={summary?.totalApproved || 0}
              total={summary?.totalTracks || 1}
              color="green"
            />
            <StatusBar
              label="Rejetés"
              value={summary?.totalRejected || 0}
              total={summary?.totalTracks || 1}
              color="red"
            />
            <StatusBar
              label="Joués"
              value={summary?.totalPlayed || 0}
              total={summary?.totalTracks || 1}
              color="blue"
            />
          </div>
        </div>

        {/* Top Morceaux */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-pink-400" />
            Top 5 Morceaux Suggérés
          </h3>
          {topTracks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aucune donnée disponible
            </p>
          ) : (
            <div className="space-y-3">
              {topTracks.slice(0, 5).map((track, index) => (
                <div
                  key={`${track.title}-${track.artist}`}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{track.title}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-400">
                      {track.timesRequested}
                    </p>
                    <p className="text-xs text-gray-400">suggéré(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <InsightItem
            label="Sessions archivées"
            value={summary?.archivedSessions || 0}
          />
          <InsightItem
            label="Morceaux rejetés"
            value={summary?.totalRejected || 0}
          />
          <InsightItem
            label="Taux de conversion"
            value={`${summary?.avgApprovalRate.toFixed(1) || 0}%`}
          />
        </div>
      </div>
    </div>
  );
}

// Composants auxiliaires

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue: string;
  color: "blue" | "purple" | "green" | "pink";
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    purple:
      "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    pink: "from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={colorClasses[color]}>{icon}</div>
        <p className="text-gray-400 text-sm font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{subValue}</p>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: "green" | "red" | "blue";
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colorClasses = {
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function InsightItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-purple-400">{value}</p>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  );
}
