import Link from "next/link";
import { Music, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-dark-bg via-dark-bg to-purple-950">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Music className="w-16 h-16 text-neon-violet animate-pulse" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-violet to-neon-cyan bg-clip-text text-transparent">
            Vibe Control
          </h1>
          <Sparkles className="w-16 h-16 text-neon-cyan animate-pulse" />
        </div>

        <p className="text-xl text-gray-300">
          La playlist collaborative où l'hôte garde le contrôle
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link href="/host">
            <button className="btn-neon btn-neon-primary w-full sm:w-auto min-w-[200px]">
              Je suis l'Hôte
            </button>
          </Link>

          <div className="text-gray-400 flex items-center justify-center">
            <span>ou scannez le QR Code</span>
          </div>
        </div>

        <div className="mt-16 p-6 bg-dark-card rounded-lg border border-neon-violet/30">
          <h2 className="text-2xl font-semibold mb-4 text-neon-cyan">
            Comment ça marche ?
          </h2>
          <div className="space-y-3 text-left text-gray-300">
            <p>
              🎵 <strong>Hôte :</strong> Créez une session et partagez le QR
              Code
            </p>
            <p>
              📱 <strong>Invités :</strong> Scannez et suggérez vos morceaux
              préférés
            </p>
            <p>
              ✅ <strong>Validation :</strong> L'hôte approuve les suggestions
              en temps réel
            </p>
            <p>
              🎉 <strong>Party :</strong> Profitez d'une playlist collaborative
              contrôlée
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
