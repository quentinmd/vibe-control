# 🎵 API de Recherche Musicale - Guide

## ✅ Configuration Actuelle : iTunes Search API

Actuellement, **Vibe Control** utilise **iTunes Search API** qui est :

- ✅ **100% Gratuite**
- ✅ **Pas de clé API nécessaire**
- ✅ **Pas de limite stricte**
- ✅ **Déjà configurée et fonctionnelle**

### Tester

1. Lancez `npm run dev`
2. Allez sur `/host`, créez une session
3. Sur `/guest/[sessionId]`, recherchez "The Weeknd" ou "Dua Lipa"
4. Les vrais résultats d'iTunes apparaissent ! 🎉

---

## 🔄 Alternative : YouTube Data API v3 (Optionnel)

Si vous préférez **YouTube** pour avoir accès à plus de contenu :

### Étape 1 : Obtenir une clé API YouTube (Gratuit)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet (ex: "Vibe Control")
3. Activez **"YouTube Data API v3"**
4. Allez dans **"Identifiants"** > **"Créer des identifiants"** > **"Clé API"**
5. Copiez la clé générée

#### Quotas gratuits YouTube :

- **10,000 unités/jour** (largement suffisant)
- 1 recherche = 100 unités
- = **100 recherches gratuites par jour**

### Étape 2 : Configurer dans Vibe Control

Ajoutez dans `.env.local` :

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=votre_cle_api_youtube
```

### Étape 3 : Modifier le code

Dans `lib/musicApi.ts`, décommentez la fonction `searchMusicYouTube()` et modifiez `components/MusicSearch.tsx` :

```typescript
// Remplacer searchMusic par searchMusicYouTube
const results = await searchMusicYouTube(searchQuery);
```

---

## 🎯 Comparaison iTunes vs YouTube

| Critère                 | iTunes                | YouTube                  |
| ----------------------- | --------------------- | ------------------------ |
| **Gratuit**             | ✅ Oui                | ✅ Oui (10k unités/jour) |
| **Clé API**             | ❌ Non nécessaire     | ✅ Nécessaire            |
| **Qualité métadonnées** | ⭐⭐⭐⭐⭐ Excellente | ⭐⭐⭐ Bonne             |
| **Pochettes album**     | ✅ Haute qualité      | ✅ Thumbnails            |
| **Extraits audio**      | ✅ 30 secondes        | ❌ Non                   |
| **Contenu**             | Musique officielle    | Musique + Covers + Live  |
| **Limites**             | Catalogue iTunes      | 10k unités/jour          |

**Recommandation MVP** : Gardez **iTunes** (déjà configuré)

---

## 🚀 Pour la Production

### Option 1 : Spotify Web API (Recommandé)

**Avantages** :

- Métadonnées de qualité professionnelle
- Intégration avec Spotify Web Playback SDK
- Possibilité de jouer les morceaux directement
- Gratuit avec limits raisonnables

**Inconvénients** :

- Nécessite une app Spotify enregistrée
- Authentification OAuth complexe
- Les utilisateurs doivent avoir Spotify Premium pour la lecture

### Option 2 : Deezer API

**Avantages** :

- API gratuite complète
- Pas d'authentification pour la recherche
- Bonne base de données

**Inconvénients** :

- Moins populaire que Spotify
- Qualité des pochettes variable

---

## 📝 Notes Techniques

### iTunes Search API

- **Endpoint** : `https://itunes.apple.com/search`
- **Rate Limit** : ~20 req/sec (non documenté mais permissif)
- **Documentation** : [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)

### YouTube Data API

- **Endpoint** : `https://www.googleapis.com/youtube/v3/search`
- **Rate Limit** : 10,000 unités/jour
- **Coûts par recherche** : 100 unités
- **Documentation** : [YouTube Data API](https://developers.google.com/youtube/v3)

---

## 🆘 Dépannage

### iTunes ne retourne aucun résultat

→ Essayez des termes en anglais (ex: "The Weeknd" plutôt que "Le Weekend")

### YouTube "API key not valid"

→ Vérifiez que vous avez bien activé YouTube Data API v3 dans Google Cloud Console

### CORS Error

→ Normal en développement local, fonctionnera en production (Vercel)

---

**💡 Astuce** : Pour un MVP rapide, **iTunes est parfait**. Migrez vers Spotify/YouTube plus tard si nécessaire !
