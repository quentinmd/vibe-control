"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, Session } from "@/lib/supabase";
import HostDashboard from "@/components/HostDashboard";
import SessionHeader from "@/components/SessionHeader";
import { Music, Plus, Loader2 } from "lucide-react";

export default function HostPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // VERSION SIMPLIFIÉE SANS AUTH
      // On génère ou récupère un ID utilisateur depuis le localStorage
      let hostId = localStorage.getItem("vibe_control_host_id");

      if (!hostId) {
        // Générer un UUID simple
        hostId =
          "host_" +
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        localStorage.setItem("vibe_control_host_id", hostId);
      }

      await loadActiveSession(hostId);
    } catch (error) {
      console.error("Erreur auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("host_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setSession(data || null);
    } catch (error) {
      console.error("Erreur chargement session:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    setIsCreating(true);
    try {
      // Récupérer l'ID hôte du localStorage
      const hostId = localStorage.getItem("vibe_control_host_id");
      if (!hostId) throw new Error("ID hôte non trouvé");

      const { data, error } = await supabase
        .from("sessions")
        .insert([
          {
            host_id: hostId,
            name: sessionName,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSession(data);
      setSessionName("");
    } catch (error) {
      console.error("Erreur création session:", error);
      alert("Erreur lors de la création de la session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;

    const confirmed = confirm(
      "Êtes-vous sûr de vouloir terminer cette session ?",
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", session.id);

      if (error) throw error;

      setSession(null);
    } catch (error) {
      console.error("Erreur fin session:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-neon-violet animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-bg to-purple-950">
        <div className="max-w-md w-full bg-dark-card rounded-xl p-8 border border-neon-violet/30">
          <div className="text-center mb-8">
            <Music className="w-16 h-16 mx-auto mb-4 text-neon-violet" />
            <h1 className="text-3xl font-bold mb-2">Créer une Session</h1>
            <p className="text-gray-400">Commencez votre soirée Vibe Control</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Nom de la session
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ex: Soirée du Vendredi"
                className="w-full bg-dark-bg px-4 py-3 rounded-lg border border-neon-violet/30 focus:outline-none focus:border-neon-violet text-white placeholder-gray-500"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
              />
            </div>

            <button
              onClick={handleCreateSession}
              disabled={!sessionName.trim() || isCreating}
              className="w-full btn-neon btn-neon-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Créer la session
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 lg:p-6 bg-gradient-to-br from-dark-bg via-dark-bg to-purple-950">
      <div className="max-w-7xl mx-auto">
        <SessionHeader
          sessionId={session.id}
          sessionName={session.name}
          onEndSession={handleEndSession}
        />
        <HostDashboard session={session} />
      </div>
    </main>
  );
}
