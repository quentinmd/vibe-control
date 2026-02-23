"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getSessionCoHosts,
  addCoHost,
  removeCoHost,
  type CoHost,
} from "@/lib/coHosts";
import { UserPlus, Crown, Users2, X, Loader2, Mail } from "lucide-react";

interface CoHostsManagerProps {
  sessionId: string;
}

export default function CoHostsManager({ sessionId }: CoHostsManagerProps) {
  const { user, profile } = useAuth();
  const [coHosts, setCoHosts] = useState<CoHost[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<
    "owner" | "moderator" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [newCoHostEmail, setNewCoHostEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";
  const isPro = profile?.subscription_tier === "pro";

  useEffect(() => {
    loadCoHosts();
  }, [sessionId]);

  const loadCoHosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessionCoHosts(sessionId);
      if (data) {
        setCoHosts(data.hosts);
        setCurrentUserRole(data.currentUserRole);
      }
    } catch (err) {
      console.error("Error loading co-hosts:", err);
      setError("Erreur lors du chargement des co-modérateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoHostEmail.trim() || !isOwner || !isPro) return;

    setAdding(true);
    setError(null);
    setSuccess(null);

    const result = await addCoHost(sessionId, newCoHostEmail.trim());

    if (result.success) {
      setSuccess(result.message || "Co-modérateur ajouté avec succès");
      setNewCoHostEmail("");
      loadCoHosts(); // Recharger la liste
    } else {
      setError(result.error || "Erreur lors de l'ajout");
    }

    setAdding(false);

    // Clear messages après 5 secondes
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleRemoveCoHost = async (hostId: string) => {
    if (!isOwner || !isPro) return;

    setRemoving(hostId);
    setError(null);
    setSuccess(null);

    const result = await removeCoHost(sessionId, hostId);

    if (result.success) {
      setSuccess(result.message || "Co-modérateur retiré avec succès");
      loadCoHosts(); // Recharger la liste
    } else {
      setError(result.error || "Erreur lors du retrait");
    }

    setRemoving(null);

    // Clear messages après 5 secondes
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  // Si pas Pro, afficher le message de mise à niveau
  if (!isPro) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <Users2 className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Co-modération (Pro)
            </h3>
            <p className="text-gray-600 mb-4">
              Ajoutez des co-modérateurs pour gérer vos sessions ensemble en
              temps réel. Parfait pour les événements professionnels et les
              grandes soirées.
            </p>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              <Crown className="w-4 h-4" />
              Passer à Pro
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const moderators = coHosts.filter((h) => h.role === "moderator");
  const owner = coHosts.find((h) => h.role === "owner");

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-purple-600" />
            Co-modérateurs
            {moderators.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                {moderators.length}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isOwner
              ? "Invitez d'autres personnes à modérer cette session"
              : "Vous êtes co-modérateur de cette session"}
          </p>
        </div>
      </div>

      {/* Messages de succès/erreur */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Formulaire d'ajout (seulement pour owner) */}
      {isOwner && (
        <form onSubmit={handleAddCoHost} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={newCoHostEmail}
                onChange={(e) => setNewCoHostEmail(e.target.value)}
                placeholder="Email du co-modérateur"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={adding}
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newCoHostEmail.trim()}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Inviter
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            L'utilisateur doit avoir un compte Vibe Control
          </p>
        </form>
      )}

      {/* Liste des co-hôtes */}
      <div className="space-y-2">
        {/* Owner */}
        {owner && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {owner.full_name?.[0] || owner.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {owner.full_name || owner.email}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-600" />
                  Propriétaire
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Moderators */}
        {moderators.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isOwner
                ? "Aucun co-modérateur pour l'instant"
                : "Pas d'autres modérateurs"}
            </p>
          </div>
        ) : (
          moderators.map((host) => (
            <div
              key={host.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                  {host.full_name?.[0] || host.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {host.full_name || host.email}
                  </p>
                  <p className="text-sm text-gray-600">Modérateur</p>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemoveCoHost(host.id)}
                  disabled={removing === host.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Retirer ce co-modérateur"
                >
                  {removing === host.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Info :</strong> Les co-modérateurs peuvent approuver et
          rejeter les suggestions en temps réel, mais seul le propriétaire peut
          modifier ou terminer la session.
        </p>
      </div>
    </div>
  );
}
