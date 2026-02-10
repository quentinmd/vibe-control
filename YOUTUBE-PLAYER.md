# 🎵 Lecteur YouTube Intégré - Guide

## ✅ Ce Qui a Été Ajouté

### 1. Nouveau Composant : `YouTubePlayer.tsx`

Lecteur YouTube intégré dans l'interface Host avec :

- ✅ Affichage du morceau en cours
- ✅ Bouton pour ouvrir sur YouTube
- ✅ File d'attente visible
- ✅ Gestion automatique du passage au suivant
- ✅ Marquage "played" dans la base de données

### 2. Intégration dans `HostDashboard.tsx`

- Zone de lecteur en haut
- Les deux colonnes (En Attente / Playlist Active) en dessous
- Synchronisation automatique avec la playlist

### 3. Service YouTube : `youtubeApi.ts`

Utilitaires pour :

- Recherche YouTube (avec API key optionnelle)
- Construction d'URLs YouTube
- Extraction de videoId

---

## 🎯 Comment Ça Marche

### Flow Complet

1. **Invité suggère un morceau** via `/guest/[sessionId]`
2. **Hôte valide** la suggestion (bouton "Valider")
3. **Le morceau passe dans "Playlist Active"**
4. **Le lecteur YouTube l'affiche** en haut de l'écran
5. **Hôte clique sur le bouton YouTube** 🎵
6. **YouTube s'ouvre** avec la recherche automatique "Artist - Title official"
7. **Quand un morceau est terminé** → Passe automatiquement au suivant

---

## 📱 Version Actuelle (MVP)

### Fonctionnement Simple

- Le lecteur affiche le morceau en cours
- Un bouton **"Ouvrir sur YouTube"** lance la recherche dans un nouvel onglet
- L'hôte lance manuellement la musique sur YouTube

### Pourquoi Cette Approche ?

- ✅ **Aucune clé API nécessaire**
- ✅ **Pas de quota à gérer**
- ✅ **Fonctionne immédiatement**
- ✅ **Pas de problème de copyright**
- ✅ **L'hôte garde le contrôle total**

---

## 🚀 Amélioration Future : Lecteur Automatique

Pour avoir un vrai lecteur intégré (iframe YouTube), vous devrez :

### Option A : YouTube IFrame API (Sans API Key)

**Avantages** :

- Gratuit et sans clé
- Lecture directe dans l'interface

**Inconvénients** :

- Nécessite de chercher manuellement le videoId
- Pas d'API de recherche sans clé
- L'utilisateur doit avoir une bonne connexion

**Implémentation** :
Le code est déjà préparé dans `YouTubePlayer.tsx` (lignes commentées).

### Option B : YouTube Data API v3 (Avec API Key)

**Avantages** :

- Recherche automatique de vidéos
- Meilleure expérience utilisateur
- Métadonnées complètes

**Inconvénients** :

- Nécessite une clé API (gratuite)
- Quota : 10,000 unités/jour = ~100 recherches

**Configuration** :

1. Obtenez une clé API YouTube (voir guide ci-dessous)
2. Ajoutez dans `.env.local` :
   ```env
   NEXT_PUBLIC_YOUTUBE_API_KEY=votre_cle_api
   ```
3. Le code utilisera automatiquement l'API si la clé est présente

---

## 🔑 Obtenir une Clé YouTube API (Gratuit)

### Étape 1 : Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Créez un projet "Vibe Control"
3. Activez "YouTube Data API v3"

### Étape 2 : Créer une Clé

1. Allez dans **APIs & Services > Credentials**
2. Cliquez **Create Credentials > API Key**
3. Copiez la clé générée

### Étape 3 : Sécuriser (Recommandé)

1. Cliquez sur la clé créée
2. **Application restrictions** : HTTP referrers
3. Ajoutez :
   - `https://votre-domaine.vercel.app/*`
   - `http://localhost:3000/*` (pour dev)

### Étape 4 : Configurer Vibe Control

Ajoutez dans `.env.local` :

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSy...
```

Redéployez sur Vercel avec la nouvelle variable d'environnement.

---

## 🎨 Personnalisation

### Changer le Comportement du Lecteur

Dans `components/YouTubePlayer.tsx`, vous pouvez :

1. **Activer le lecteur intégré** (décommentez lignes 89-105)
2. **Activer les contrôles** (supprimez `opacity-50 pointer-events-none`)
3. **Changer l'autoplay** (modifiez `playerVars.autoplay`)

### Modifier la Recherche YouTube

Dans `lib/youtubeApi.ts` :

- `getYouTubeSearchUrl()` : Construire l'URL de recherche
- `searchYouTube()` : Utiliser l'API pour trouver le videoId

---

## 🧪 Tester

```bash
npm run dev
```

### Scénario de Test

1. Allez sur `/host`, créez une session
2. Sur `/guest/[sessionId]`, recherchez "Dua Lipa"
3. Suggérez "Levitating"
4. Sur Host, validez la suggestion
5. ✅ **Le lecteur YouTube apparaît en haut avec le morceau**
6. Cliquez sur le bouton **YouTube** (icône rouge)
7. 🎵 YouTube s'ouvre avec "Dua Lipa Levitating official"

---

## 📊 Comparaison des Options

| Option                      | Gratuit | Setup      | UX         | Contrôle   |
| --------------------------- | ------- | ---------- | ---------- | ---------- |
| **Bouton YouTube** (Actuel) | ✅      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| **IFrame Sans API**         | ✅      | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| **YouTube API**             | ✅      | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| **Spotify** (Désactivé)     | ❌      | ⭐         | ⭐⭐⭐⭐⭐ | ⭐⭐       |

**Recommandation MVP** : Gardez le **bouton YouTube** (simple et efficace)

**Pour Production** : Passez à **YouTube API** avec clé gratuite

---

## 🆘 Dépannage

### Le lecteur n'apparaît pas

→ Vérifiez qu'il y a au moins 1 morceau validé dans "Playlist Active"

### Le bouton YouTube ne fait rien

→ Vérifiez que le popup n'est pas bloqué par le navigateur

### "YouTube API quota exceeded"

→ Vous avez dépassé 10,000 unités/jour (rare). Réessayez demain ou passez au plan payant YouTube.

### Erreur CORS

→ Ajoutez votre domaine Vercel dans les restrictions de la clé API

---

## 📝 Prochaines Étapes

1. ✅ Testez le lecteur actuel (bouton YouTube)
2. ⏭️ Déployez sur Vercel
3. 🔑 (Optionnel) Ajoutez YouTube API key
4. 🎵 (Optionnel) Activez le lecteur intégré

**Le système fonctionne parfaitement SANS clé API grâce au bouton YouTube !** 🎉
