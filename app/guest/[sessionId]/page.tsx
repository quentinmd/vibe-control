"use client";

import { useEffect, useState } from "react";
import { supabase, Session } from "@/lib/supabase";
import GuestSubmission from "@/components/GuestSubmission";
import { Music, PartyPopper, AlertCircle, Loader2 } from "lucide-react";

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default function GuestPage({ params }: PageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", params.sessionId)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setError("Session introuvable ou terminée");
        } else {
          throw error;
        }
      } else {
        setSession(data);
      }
    } catch (err) {
      console.error("Erreur chargement session:", err);
      setError("Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-neon-violet animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-bg to-purple-950">
        <div className="max-w-md w-full bg-dark-card rounded-xl p-8 border border-red-500/30 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-red-400">
            Session Introuvable
          </h1>
          <p className="text-gray-400 mb-6">
            {error || "Cette session n'existe pas ou a été terminée."}
          </p>
          <a href="/" className="btn-neon btn-neon-primary inline-block">
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 lg:p-6 bg-gradient-to-br from-dark-bg via-dark-bg to-purple-950">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <PartyPopper className="w-12 h-12 text-neon-violet animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-violet to-neon-cyan bg-clip-text text-transparent">
              {session.name}
            </h1>
          </div>
          <p className="text-gray-300">Suggérez vos morceaux préférés !</p>
        </div>

        {/* Composant de suggestion */}
        <GuestSubmission sessionId={session.id} />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Propulsé par{" "}
            <span className="text-neon-violet font-semibold">Vibe Control</span>
          </p>
        </div>
      </div>
    </main>
  );
}
