# 🚀 Phase 2 : Multi-hôtes OU Spotify

## Vue d'Ensemble

Vous avez complété la **Phase 1** (Analytics & Historique). Il est temps de choisir votre prochaine fonctionnalité majeure.

---

## Option A : Multi-hôtes / Co-modération (Pro) 👥

### Description

Permettre à plusieurs personnes de modérer une même session simultanément. Idéal pour les événements professionnels, festivals, ou grandes soirées.

### Fonctionnalités

- **Invitation de co-hôtes** par email
- **Rôles** : Owner (créateur) et Moderator (co-hôte)
- **Permissions** : Les modérateurs peuvent approuver/rejeter mais pas supprimer la session
- **Modération collaborative** : Plusieurs personnes voient et modèrent les mêmes tracks en temps réel
- **Gestion des co-hôtes** : L'owner peut ajouter/retirer des modérateurs

### Architecture Technique

#### 1. Modification du schéma BDD

```sql
-- Nouvelle table many-to-many
CREATE TABLE session_hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'moderator' CHECK (role IN ('owner', 'moderator')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(session_id, user_id)
);

-- Index
CREATE INDEX idx_session_hosts_session ON session_hosts(session_id);
CREATE INDEX idx_session_hosts_user ON session_hosts(user_id);

-- Migrer les données existantes (sessions.host_id → session_hosts)
INSERT INTO session_hosts (session_id, user_id, role)
SELECT id, host_id, 'owner'
FROM sessions;
```

#### 2. Mise à jour RLS Policies

```sql
-- Politique pour les co-hôtes
CREATE POLICY "Co-hosts can manage tracks"
ON tracks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM session_hosts
    WHERE session_hosts.session_id = tracks.session_id
    AND session_hosts.user_id = auth.uid()
  )
);

CREATE POLICY "Co-hosts can read session"
ON sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_hosts
    WHERE session_hosts.session_id = sessions.id
    AND session_hosts.user_id = auth.uid()
  )
);
```

#### 3. UI dans HostDashboard

Ajouter une section "Co-modérateurs" :

```tsx
<div className="bg-white rounded-xl p-6 mb-6">
  <h3 className="text-lg font-bold mb-4">Co-modérateurs</h3>

  {/* Formulaire d'invitation */}
  <div className="flex gap-2 mb-4">
    <input
      type="email"
      placeholder="Email du co-modérateur"
      className="flex-1 input"
    />
    <button className="btn-primary">Inviter</button>
  </div>

  {/* Liste des co-hôtes */}
  <div className="space-y-2">
    {coHosts.map((host) => (
      <div
        key={host.id}
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div>
          <p className="font-semibold">{host.email}</p>
          <p className="text-sm text-gray-600">
            {host.role === "owner" ? "Propriétaire" : "Modérateur"}
          </p>
        </div>
        {host.role !== "owner" && (
          <button className="text-red-600 hover:text-red-700">Retirer</button>
        )}
      </div>
    ))}
  </div>
</div>
```

#### 4. API Endpoints

Créer `/app/api/sessions/co-hosts/route.ts` :

**POST** - Ajouter un co-hôte

```typescript
{
  "sessionId": "uuid",
  "email": "cohote@example.com"
}
```

**DELETE** - Retirer un co-hôte

```typescript
{
  "sessionId": "uuid",
  "userId": "uuid"
}
```

**GET** - Lister les co-hôtes d'une session

```typescript
// GET /api/sessions/co-hosts?sessionId=xxx
```

#### 5. Notifications (bonus)

- Email d'invitation avec lien direct vers la session
- Notification temps réel quand ajouté comme co-hôte
- Badge "Nouveau co-hôte ajouté" dans l'interface

### Complexité

- **Backend :** ⭐⭐⭐ (migration BDD, RLS policies)
- **Frontend :** ⭐⭐ (UI relativement simple)
- **Testing :** ⭐⭐⭐ (tester avec plusieurs comptes)

### Durée estimée

**5-7 jours** (1 semaine)

### Avantages

✅ Fonctionnalité différenciante pour Plan Pro  
✅ Cas d'usage clair (événements pros, festivals)  
✅ Infrastructure relativement simple  
✅ Pas de dépendance externe (API)

### Inconvénients

❌ Nécessite refonte du modèle de données  
❌ Testing complexe (multi-utilisateurs)  
❌ Gestion des permissions à bien penser

---

## Option B : Intégration Spotify (Premium) 🎵

### Description

Remplacer/compléter YouTube par Spotify pour la recherche et la lecture de musique. Offrir une meilleure qualité audio et un catalogue plus large.

### Fonctionnalités

- **Connexion Spotify** via OAuth 2.0
- **Recherche dans Spotify** au lieu de YouTube
- **Lecture via Spotify Web Playback SDK** (nécessite Spotify Premium pour l'hôte)
- **Synchronisation** des playlists
- **Fallback YouTube** si Spotify non disponible

### Architecture Technique

#### 1. Configuration Spotify API

1. Créer une application sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Obtenir Client ID et Client Secret
3. Configurer les Redirect URIs

`.env.local` :

```env
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=xxx
```

#### 2. OAuth Flow

Créer `/app/api/auth/spotify/callback/route.ts` :

```typescript
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  // Échanger le code contre un access_token
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const { access_token, refresh_token } = await response.json();

  // Sauvegarder dans profiles
  await supabase
    .from("profiles")
    .update({
      spotify_tokens: { access_token, refresh_token },
    })
    .eq("id", userId);
}
```

#### 3. Service Spotify

Créer `/lib/spotifyApi.ts` :

```typescript
export async function searchSpotifyTracks(query: string, accessToken: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();

  return data.tracks.items.map((track) => ({
    id: track.id,
    title: track.name,
    artist: track.artists[0].name,
    album: track.album.name,
    cover_url: track.album.images[0]?.url,
    spotify_id: track.id,
    spotify_uri: track.uri,
  }));
}

export async function refreshSpotifyToken(refreshToken: string) {
  // Implémenter le refresh du token
}
```

#### 4. Composant de recherche

Modifier `/components/MusicSearch.tsx` :

```tsx
export default function MusicSearch() {
  const [source, setSource] = useState<"youtube" | "spotify">("youtube");

  return (
    <div>
      {/* Toggle YouTube / Spotify */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSource("youtube")}>YouTube</button>
        <button onClick={() => setSource("spotify")}>Spotify</button>
      </div>

      {/* Recherche */}
      {source === "spotify" ? <SpotifySearch /> : <YouTubeSearch />}
    </div>
  );
}
```

#### 5. Lecteur Spotify

Créer `/components/SpotifyPlayer.tsx` :

**Option Simple :** Liens Spotify (ouvre l'app)

```tsx
<a href={`spotify:track:${trackId}`}>▶️ Ouvrir dans Spotify</a>
```

**Option Avancée :** Spotify Web Playback SDK

```tsx
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  document.body.appendChild(script);

  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "Vibe Control",
      getOAuthToken: (cb) => {
        cb(accessToken);
      },
    });

    player.connect();
  };
}, []);
```

**⚠️ Important :** Le Web Playback SDK nécessite **Spotify Premium** pour l'hôte.

#### 6. Schéma BDD

Ajouter colonnes à `profiles` :

```sql
ALTER TABLE profiles
ADD COLUMN spotify_tokens JSONB,
ADD COLUMN spotify_user_id VARCHAR(255);
```

### Complexité

- **Backend :** ⭐⭐⭐⭐ (OAuth, tokens, refresh)
- **Frontend :** ⭐⭐⭐⭐ (SDK complexe, player)
- **Testing :** ⭐⭐⭐⭐ (besoin compte Spotify Premium)

### Durée estimée

**7-10 jours** (1,5 - 2 semaines)

### Avantages

✅ Meilleure qualité audio  
✅ Catalogue musical officiel et complet  
✅ Fonctionnalité très attendue  
✅ Synchronisation avec playlists Spotify

### Inconvénients

❌ Complexité élevée (OAuth, SDK, tokens)  
❌ Nécessite Spotify Premium pour lecture  
❌ Quotas API à surveiller  
❌ Maintenance des tokens (refresh)  
❌ Fallback YouTube toujours nécessaire

---

## Comparaison

| Critère                  | Multi-hôtes    | Spotify          |
| ------------------------ | -------------- | ---------------- |
| **Complexité**           | ⭐⭐⭐         | ⭐⭐⭐⭐         |
| **Durée**                | 5-7 jours      | 7-10 jours       |
| **Valeur utilisateur**   | 🔥🔥🔥         | 🔥🔥🔥🔥         |
| **Différenciation**      | Pro uniquement | Premium + Pro    |
| **Maintenance**          | Faible         | Moyenne (tokens) |
| **Dépendances externes** | Aucune         | Spotify API      |
| **Testing**              | Complexe       | Très complexe    |

---

## Recommandation

### Pour démarrer rapidement : **Multi-hôtes** 👥

- Plus simple à implémenter
- Valeur immédiate pour Plan Pro
- Pas de dépendance externe
- Cas d'usage clair (événements)

**Planning suggéré :**

- Semaine 1 : Multi-hôtes (Phase 2A)
- Semaine 2-3 : Spotify (Phase 2B)
- Semaine 4 : Tests + polish

### Pour un impact maximal : **Spotify** 🎵

- Fonctionnalité très demandée
- Améliore l'expérience utilisateur
- Se différencie de la concurrence
- Justifie mieux le prix Premium

**⚠️ Mais :** Plus complexe, plus long, nécessite Spotify Premium pour tester

---

## Roadmap Complète Suggérée

### Phase 1 : ✅ TERMINÉ

- Analytics enrichis
- Historique & Archives
- Export/Backup

### Phase 2A : Multi-hôtes (1 semaine)

- Système d'invitation
- Permissions & rôles
- Modération collaborative

### Phase 2B : Spotify (1,5 semaines)

- OAuth Spotify
- Recherche Spotify
- Lecteur Spotify

### Phase 3 : Fonctionnalités Pro (2 semaines)

- Branding personnalisé
- Domaine personnalisé (complexe)
- API publique avec keys

### Phase 4 : Polish & UX (1 semaine)

- Personnalisation QR Code
- Amélioration UI/UX
- Tests utilisateurs
- Corrections bugs

---

## Prochaine Étape

**Décidez quelle option vous voulez implémenter en premier :**

### Je choisis Multi-hôtes 👥

```bash
# Créer une branche
git checkout -b feature/multi-hosts

# Suivre le guide détaillé dans ce document
```

### Je choisis Spotify 🎵

```bash
# Créer une branche
git checkout -b feature/spotify-integration

# Suivre le guide détaillé dans ce document
```

### Je fais les deux 🚀

```bash
# Séquentiellement, commencer par Multi-hôtes
git checkout -b feature/multi-hosts
# Puis après merge :
git checkout -b feature/spotify-integration
```

---

## Support & Ressources

### Multi-hôtes

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Many-to-Many](https://www.postgresql.org/docs/current/tutorial-join.html)

### Spotify

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify OAuth Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)

---

**Quelle option préférez-vous ? Dites-moi pour commencer l'implémentation !** 🚀
