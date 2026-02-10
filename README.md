# 🎵 Vibe Control - MVP

Application web collaborative de gestion de playlist pour soirées, où l'hôte garde le contrôle total des morceaux joués.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

---

## 🚀 Concept

**Vibe Control** est une PWA permettant à un organisateur de soirée (l'Hôte) de gérer une playlist collaborative :

- Les **invités** suggèrent des morceaux via leur smartphone
- L'**hôte** valide ou refuse chaque suggestion en temps réel
- Seuls les morceaux approuvés rejoignent la playlist active

**Particularité** : L'hôte garde le contrôle total grâce à un système de modération manuel.

---

## 📦 Stack Technique

| Technologie                 | Usage                                  |
| --------------------------- | -------------------------------------- |
| **Next.js 14** (App Router) | Framework React fullstack              |
| **Supabase**                | Backend (PostgreSQL + Realtime + Auth) |
| **Tailwind CSS**            | Styling (Dark Mode, Mobile-First)      |
| **Lucide React**            | Icônes                                 |
| **QRCode.react**            | Génération QR Code                     |
| **TypeScript**              | Typage statique                        |

---

## 🗂️ Structure du Projet

```
VibeControl/
├── app/
│   ├── layout.tsx          # Layout global
│   ├── page.tsx            # Page d'accueil
│   ├── globals.css         # Styles globaux
│   ├── host/
│   │   └── page.tsx        # Dashboard Hôte
│   └── guest/
│       └── [sessionId]/
│           └── page.tsx    # Interface Invité
├── components/
│   ├── HostDashboard.tsx   # Gestion Realtime des suggestions
│   ├── SessionHeader.tsx   # Header avec QR Code
│   ├── MusicSearch.tsx     # Recherche de musique
│   └── GuestSubmission.tsx # Soumission de suggestions
├── lib/
│   └── supabase.ts         # Client Supabase + Types
├── supabase/
│   ├── schema.sql          # Script de création BD
│   └── README.md           # Documentation BD
├── public/
│   └── manifest.json       # Manifest PWA
├── tailwind.config.ts      # Config Tailwind (Dark Mode + Neon)
└── package.json
```

---

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd VibeControl
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

#### a) Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez :
   - `URL du projet`
   - `anon public key`

#### b) Exécuter le script SQL

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez-collez le contenu de `supabase/schema.sql`
3. Exécutez le script

#### c) Activer Realtime

1. Allez dans **Database > Replication**
2. Activez la réplication pour la table `tracks`

### 4. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 🎮 Utilisation

### Interface Hôte (`/host`)

1. **Créer une session** : Donnez un nom à votre soirée
2. **Partager le QR Code** : Les invités le scannent pour accéder
3. **Gérer les suggestions** :
   - Colonne gauche : Suggestions en attente
   - Colonne droite : Playlist active
   - Boutons **Valider** / **Refuser**
4. **Terminer la session** : Clôture l'accès invités

### Interface Invité (`/guest/[sessionId]`)

1. **Scanner le QR Code** de l'hôte
2. **Entrer son prénom**
3. **Rechercher des morceaux**
4. **Cliquer sur "Suggérer"**
5. Attendre la validation de l'hôte

---

## 🔥 Fonctionnalités Clés

### ✅ Implémentées

- [x] Authentification anonyme (MVP)
- [x] Création/suppression de sessions
- [x] Génération QR Code dynamique
- [x] Recherche musicale (données mockées)
- [x] Système de suggestions avec statuts (pending/approved/rejected)
- [x] **Realtime Supabase** : Synchronisation instantanée
- [x] Animation "Hop" lors des validations
- [x] Design Dark Mode avec accents néon (Violet/Cyan)
- [x] Responsive Mobile-First
- [x] Row Level Security (RLS)

### 🚧 À Améliorer (Post-MVP)

- [ ] Intégration Spotify Web Playback SDK
- [ ] Authentification complète (Email/OAuth)
- [ ] Lecteur audio intégré
- [ ] Historique des morceaux joués
- [ ] Vote des invités (système de likes)
- [ ] Blacklist de morceaux
- [ ] Analytics de la soirée

---

## 🎨 Design System

### Couleurs

- **Dark BG** : `#0A0A0F`
- **Dark Card** : `#1A1A24`
- **Neon Violet** : `#9D4EDD`
- **Neon Cyan** : `#00D9FF`

### Animations

- `pulse-neon` : Effet de pulsation lumineux
- `slide-in` : Apparition latérale des cards

### Composants Réutilisables

- `.btn-neon` : Bouton avec effet néon
- `.neon-glow-violet` : Ombre néon violette
- `.neon-glow-cyan` : Ombre néon cyan

---

## 🔐 Sécurité (RLS)

### Politiques appliquées

| Table      | Politique     | Description                            |
| ---------- | ------------- | -------------------------------------- |
| `sessions` | Host own      | L'hôte contrôle ses sessions           |
| `sessions` | Public read   | Lecture publique des sessions actives  |
| `tracks`   | Host own      | L'hôte gère les tracks de ses sessions |
| `tracks`   | Public read   | Lecture publique des tracks actives    |
| `tracks`   | Anyone insert | Insertion libre (status=pending)       |

---

## 🧪 Tests Recommandés

### Scénario 1 : Flow complet

1. Ouvrir `/host` dans le navigateur 1
2. Créer une session "Test Soirée"
3. Ouvrir `/guest/[sessionId]` dans le navigateur 2 (ou mobile)
4. Suggérer un morceau depuis Guest
5. Vérifier l'apparition **en temps réel** dans Host
6. Valider la suggestion
7. Vérifier le passage dans la playlist active

### Scénario 2 : Multi-invités

1. Ouvrir plusieurs onglets Guest
2. Suggérer depuis chaque onglet
3. Vérifier la cohérence du Realtime

---

## 📱 PWA (Progressive Web App)

Le fichier `manifest.json` permet l'installation sur mobile :

- Ajouter à l'écran d'accueil iOS/Android
- Mode standalone (plein écran)
- Icônes personnalisées

> ⚠️ **Note** : Ajoutez vos propres icônes `icon-192.png` et `icon-512.png` dans `/public/`

---

## 🐛 Debugging

### Problèmes courants

**1. "Erreur Supabase"**

- Vérifiez les variables d'environnement (`.env.local`)
- Confirmez l'exécution du script SQL
- Vérifiez les policies RLS

**2. "Realtime ne fonctionne pas"**

- Activez Realtime dans Database > Replication
- Vérifiez la console du navigateur

**3. "QR Code ne s'affiche pas"**

- Installez `qrcode.react` : `npm install qrcode.react`

---

## 🚢 Déploiement

### Recommandation : Vercel

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel

# 3. Configurer les variables d'environnement dans Vercel Dashboard
```

### Variables à configurer sur Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🤝 Contribution

Ce projet est un MVP éducatif. Pour contribuer :

1. Forkez le repo
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez (`git commit -m 'Add AmazingFeature'`)
4. Pushez (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📄 Licence

MIT © 2026 - Projet éducatif

---

## 🙏 Crédits

- Inspiré des apps de DJ collaboratif (Festify, JQBX)
- Design Néon : Tendance Synthwave/Cyberpunk
- API Spotify : [Spotify for Developers](https://developer.spotify.com/)

---

## 📧 Support

Pour toute question :

- Ouvrez une Issue sur GitHub
- Consultez la [documentation Supabase](https://supabase.com/docs)
- Rejoignez la [communauté Next.js](https://nextjs.org/discord)

---

**✨ Fait avec passion pour la musique et le code ✨**
