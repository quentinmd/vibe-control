# 🎵 Lecteur YouTube Intégré - Vibe Control

## ✅ Version Actuelle : Lecteur Automatique Complet

Le lecteur YouTube est **maintenant pleinement fonctionnel** avec lecture automatique !

### 🎯 Fonctionnalités Implémentées

✅ **Lecteur iframe YouTube intégré** visible dans le dashboard  
✅ **Auto-play automatique** dès qu'un morceau est validé  
✅ **Recherche automatique** du videoId via Invidious API (gratuit, sans clé)  
✅ **Passage automatique** au morceau suivant quand une vidéo se termine  
✅ **Contrôles fonctionnels** : Play/Pause, Skip, Mute  
✅ **Affichage de la file d'attente** avec les 3 prochains morceaux  
✅ **État de chargement** avec spinner pendant la recherche

---

## 🎬 Comment Ça Fonctionne

### Flow Complet

1. **L'hôte valide une suggestion** → Le morceau passe en "approved"
2. **Le lecteur cherche automatiquement** la vidéo YouTube correspondante
3. **La vidéo se lance automatiquement** dans l'iframe intégré
4. **Quand la vidéo se termine** → Passage automatique au morceau suivant
5. **L'hôte peut contrôler** : pause, reprendre, passer, couper le son

### Exemple Concret

```
Invité suggère : "Daft Punk - Get Lucky"
           ↓
Hôte valide la suggestion
           ↓
Lecteur cherche sur YouTube via Invidious API
           ↓
Trouve le videoId : "5NV6Rdv1a3I"
           ↓
Charge et lance automatiquement dans l'iframe
           ↓
Musique en lecture ! 🎵
           ↓
Vidéo terminée → Passe au morceau suivant
```

---

## 🔧 Architecture Technique

### 1. YouTube IFrame API

**Fichier**: `components/YouTubePlayer.tsx`

```typescript
// Chargement automatique de l'API YouTube
useEffect(() => {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  // ... chargement
}, []);

// Création du lecteur avec auto-play activé
new window.YT.Player(playerRef.current, {
  playerVars: {
    autoplay: 1, // ✅ Lecture automatique
    controls: 1, // Afficher les contrôles
    modestbranding: 1,
    rel: 0,
    fs: 0,
  },
  events: {
    onStateChange: (event) => {
      if (event.data === YT.PlayerState.ENDED) {
        handleTrackEnd(); // Passer au suivant
      }
    },
  },
});
```

### 2. Recherche de VideoId (Sans API Key)

**Fichier**: `lib/youtubeApi.ts`

```typescript
export async function searchYouTubeNoAPI(
  query: string,
): Promise<string | null> {
  // Utilise l'API Invidious (front-end YouTube alternatif)
  const invidiousInstance = "https://invidious.jing.rocks";
  const response = await fetch(
    `${invidiousInstance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
  );

  const data = await response.json();
  return data[0]?.videoId || null;
}
```

**Avantages** :

- ✅ Gratuit (pas de clé API nécessaire)
- ✅ Pas de quota
- ✅ Rapide
- ⚠️ Dépend de l'instance Invidious (peut changer)

### 3. Gestion du Cycle de Vie

```typescript
// Quand le morceau change
useEffect(() => {
  if (!player || !currentTrack) return;

  // Éviter de recharger le même morceau
  if (hasLoadedTrack.current === currentTrack.id) return;

  const loadVideo = async () => {
    setIsLoadingVideo(true);

    // Recherche YouTube
    const searchQuery = `${currentTrack.artist} ${currentTrack.title} official audio`;
    const videoId = await searchYouTubeNoAPI(searchQuery);

    if (videoId) {
      player.loadVideoById(videoId); // ✅ Charge et lance
      hasLoadedTrack.current = currentTrack.id;
    }

    setIsLoadingVideo(false);
  };

  loadVideo();
}, [currentTrack, player]);
```

---

## 🎛️ Contrôles Disponibles

### Interface Utilisateur

Le lecteur affiche :

1. **Info du morceau** :
   - Pochette d'album
   - Titre
   - Artiste
   - Nom de celui qui a suggéré

2. **Lecteur YouTube** :
   - Iframe vidéo intégré (16:9)
   - Spinner de chargement pendant la recherche

3. **Contrôles** :
   - ▶️ Play / ⏸️ Pause
   - ⏭️ Skip (passer au suivant)
   - 🔊 Mute / 🔇 Unmute

4. **File d'attente** :
   - 3 prochains morceaux visibles
   - Ordre de lecture

### Raccourcis Clavier YouTube

Les contrôles YouTube natifs fonctionnent :

- **Espace** : Play/Pause
- **K** : Play/Pause
- **J** : Reculer de 10s
- **L** : Avancer de 10s
- **M** : Mute/Unmute
- **↑/↓** : Volume

---

## 🔄 Alternatives d'API de Recherche

### Option 1 : Invidious (Actuelle - GRATUITE) ✅

```typescript
// Instance publique Invidious
const invidiousInstance = "https://invidious.jing.rocks";
const response = await fetch(
  `${invidiousInstance}/api/v1/search?q=${query}&type=video`,
);
```

**Avantages** : Gratuit, pas de clé  
**Inconvénients** : Dépendance externe

### Option 2 : YouTube Data API v3 (Officielle)

```typescript
// Nécessite NEXT_PUBLIC_YOUTUBE_API_KEY dans .env.local
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&maxResults=1&q=${query}&key=${API_KEY}`,
);
```

**Avantages** : Officiel, fiable  
**Inconvénients** : Quota limité (10,000 unités/jour = ~100 recherches)

**Pour activer** :

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer "YouTube Data API v3"
3. Créer une clé API
4. Ajouter dans `.env.local` :
   ```bash
   NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSy...
   ```
5. Le code détectera automatiquement la clé et l'utilisera

### Option 3 : Autres Instances Invidious

Si `invidious.jing.rocks` est down, utilisez :

- `https://invidious.snopyta.org`
- `https://yewtu.be`
- `https://inv.riverside.rocks`

Liste complète : [https://api.invidious.io/](https://api.invidious.io/)

---

## 📊 Base de Données

### Colonnes Utilisées

Table `tracks` :

```sql
- id (uuid)
- title (text)         -- Titre de la chanson
- artist (text)        -- Artiste
- cover_url (text)     -- Pochette iTunes
- status (text)        -- "pending" → "approved" → "played"
- played_at (timestamp) -- Horodatage quand marqué "played"
- suggested_by (text)  -- Nom de l'invité
```

### Cycle de Vie d'un Morceau

```
pending (invité suggère)
   ↓
approved (hôte valide)
   ↓
played (vidéo terminée)
```

---

## 🐛 Dépannage

### Le lecteur ne charge rien

1. **Vérifier la console** : `console.log("🎵 Chargement vidéo YouTube:", videoId)`
2. **Tester Invidious manuellement** :
   ```
   https://invidious.jing.rocks/api/v1/search?q=daft+punk+get+lucky&type=video
   ```
3. **Si l'instance est down** : Changer dans `lib/youtubeApi.ts` ligne 22

### Les vidéos ne se lancent pas automatiquement

- **Politique des navigateurs** : certains bloquent l'autoplay
- **Solution** : L'utilisateur doit interagir une première fois (clic n'importe où)
- Chrome, Firefox, Safari ont des règles différentes

### Les contrôles ne fonctionnent pas

1. Vérifier que `player` n'est pas `null`
2. Attendre que `isAPIReady === true`
3. Vérifier la console pour les erreurs

### Mauvaise vidéo chargée

- Affiner la recherche : ajouter "official", "audio", "lyrics"
- Utiliser l'API officielle YouTube pour plus de précision
- Stocker manuellement le `videoId` dans la BDD

---

## 🚀 Améliorations Futures

### À Court Terme

- [ ] **Cache des videoId** : Stocker dans `tracks.spotify_id` pour éviter recherches répétées
- [ ] **Fallback intelligent** : Si Invidious down → essayer YouTube API → fallback manuel
- [ ] **Préchargement** : Charger le prochain morceau en avance

### À Moyen Terme

- [ ] **Visualiseur audio** : Afficher un spectrogramme
- [ ] **Paroles synchronisées** : Via Genius API ou Musixmatch
- [ ] **Historique de lecture** : Page dédiée avec stats

### À Long Terme

- [ ] **Support multi-source** : YouTube + Spotify + Deezer
- [ ] **DJ Mode** : Crossfade entre morceaux
- [ ] **Requests payants** : Priorité dans la queue

---

## 📝 Utilisation

### Pour l'Hôte

1. Créer une session sur `/host`
2. Valider des suggestions dans "En Attente"
3. **Le lecteur se lance automatiquement** ✅
4. Utiliser les contrôles si besoin (pause, skip, mute)
5. Surveiller la file d'attente

### Pour les Invités

1. Scanner le QR code ou aller sur `/guest/[sessionId]`
2. Chercher une chanson (iTunes Search API)
3. Suggérer → Attend validation de l'hôte
4. Si validé → **Passera automatiquement sur le lecteur de l'hôte**

---

## 💡 Conseils

### Pour une Expérience Optimale

1. **Écran dédié** : Ouvrir `/host` sur un écran/tablette séparé
2. **Volume** : Connecter des enceintes à l'appareil de l'hôte
3. **Interaction initiale** : Cliquer une fois dans la page pour autoriser l'autoplay
4. **Connexion stable** : Wi-Fi fiable pour éviter les coupures

### Pour les Soirées

- Pré-valider quelques morceaux avant l'arrivée des invités
- Mettre l'écran hôte en affichage public
- Encourager les invités à suggérer tôt dans la soirée

---

## 📦 Fichiers Concernés

```
components/
  └── YouTubePlayer.tsx        # Composant lecteur principal
  └── HostDashboard.tsx         # Intègre le lecteur

lib/
  └── youtubeApi.ts             # Recherche de videoId

supabase/
  └── schema.sql                # Table tracks avec status
```

---

## 🎉 Résultat Final

**Avant** : L'hôte devait manuellement ouvrir YouTube dans un nouvel onglet  
**Maintenant** : Tout se fait automatiquement ! Validation → Lecture → Suivant

**MVP complet fonctionnel !** 🚀
