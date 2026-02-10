"use client";

import { useState } from "react";
import { supabase, Track } from "@/lib/supabase";
import MusicSearch from "@/components/MusicSearch";
import { Check, Loader2, Music } from "lucide-react";

interface GuestSubmissionProps {
  sessionId: string;
}

export default function GuestSubmission({ sessionId }: GuestSubmissionProps) {
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTracks, setSubmittedTracks] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitSuggestion = async (
    track: Omit<Track, "id" | "session_id" | "status" | "created_at">,
  ) => {
    if (!guestName.trim()) {
      alert("Veuillez entrer votre nom");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("tracks")
        .insert([
          {
            session_id: sessionId,
            title: track.title,
            artist: track.artist,
            album: track.album,
            cover_url: track.cover_url,
            spotify_id: track.spotify_id,
            suggested_by: guestName.trim(),
            status: "pending",
          },
        ])
        .select();

      if (error) throw error;

      // Succès
      setSubmittedTracks((prev) => [...prev, track.title]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erreur soumission:", error);
      alert("Erreur lors de la suggestion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message de succès */}
      {showSuccess && (
        <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 flex items-center gap-3 animate-slide-in">
          <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-400">Suggestion envoyée !</p>
            <p className="text-sm text-gray-300">
              L'hôte va examiner votre suggestion
            </p>
          </div>
        </div>
      )}

      {/* Input nom */}
      <div className="bg-dark-card rounded-lg p-4 border border-neon-cyan/30">
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Votre prénom/pseudo
        </label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Ex: Thomas"
          className="w-full bg-dark-bg px-4 py-2 rounded-lg border border-neon-violet/30 focus:outline-none focus:border-neon-violet text-white placeholder-gray-500"
        />
      </div>

      {/* Recherche musicale */}
      <div className="bg-dark-card rounded-lg p-6 border border-neon-violet/30">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Music className="w-6 h-6 text-neon-violet" />
          Suggérer un morceau
        </h2>
        <MusicSearch onSelectTrack={handleSubmitSuggestion} />
      </div>

      {/* Historique des suggestions */}
      {submittedTracks.length > 0 && (
        <div className="bg-dark-card rounded-lg p-4 border border-neon-cyan/30">
          <h3 className="text-lg font-semibold mb-3 text-neon-cyan">
            Vos suggestions ({submittedTracks.length})
          </h3>
          <ul className="space-y-2">
            {submittedTracks.map((title, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-gray-300"
              >
                <Check className="w-4 h-4 text-green-400" />
                {title}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">
            ✅ En attente de validation par l'hôte
          </p>
        </div>
      )}

      {/* Loader */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-neon-violet animate-spin" />
            <p>Envoi en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}
