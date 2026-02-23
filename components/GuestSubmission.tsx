"use client";

import { useState } from "react";
import { supabase, Track } from "@/lib/supabase";
import { canAddSuggestion } from "@/lib/subscription-limits";
import MusicSearch from "@/components/MusicSearch";
import { Check, Loader2, Music, AlertCircle } from "lucide-react";

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
      // Vérifier les limites d'abonnement de l'hôte
      const limitCheck = await canAddSuggestion(sessionId);

      if (!limitCheck.allowed) {
        alert(
          limitCheck.reason ||
            "Limite de suggestions atteinte pour cette session",
        );
        setIsSubmitting(false);
        return;
      }

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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-slide-in shadow-md">
          <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-700">Suggestion envoyée !</p>
            <p className="text-sm text-green-600">
              L'hôte va examiner votre suggestion
            </p>
          </div>
        </div>
      )}

      {/* Input nom */}
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-lg">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Votre prénom/pseudo
        </label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Ex: Thomas"
          className="w-full bg-white px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
        />
      </div>

      {/* Recherche musicale */}
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 border border-gray-200 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-gray-900">
          <Music className="w-6 h-6 text-primary-600" />
          Suggérer un morceau
        </h2>
        <MusicSearch
          sessionId={sessionId}
          onSelectTrack={handleSubmitSuggestion}
        />
      </div>

      {/* Historique des suggestions */}
      {submittedTracks.length > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-primary-600">
            Vos suggestions ({submittedTracks.length})
          </h3>
          <ul className="space-y-2">
            {submittedTracks.map((title, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <Check className="w-4 h-4 text-green-600" />
                {title}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            ✅ En attente de validation par l'hôte
          </p>
        </div>
      )}

      {/* Loader */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-2xl">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            <p className="text-gray-900">Envoi en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}
