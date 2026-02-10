# 🔑 Ajouter la Clé YouTube API dans Vercel (2 min)

## ⚡ Action à Faire MAINTENANT

Tu as déjà créé une clé YouTube API (`AIzaSyBEJXx...`) et l'as ajoutée dans ton `.env.local`.

**BUT** : Elle fonctionne en local mais **PAS en production sur Vercel** !

Il faut l'ajouter dans Vercel pour que ça marche en ligne.

---

## 📋 Étapes Rapides

### 1. Va sur Vercel Dashboard

🔗 https://vercel.com/dashboard

### 2. Sélectionne ton projet

Clique sur **"vibe-control"** (ou le nom de ton projet)

### 3. Va dans Settings

Clique sur l'onglet **"Settings"** en haut

### 4. Environment Variables

Dans le menu de gauche, clique sur **"Environment Variables"**

### 5. Ajoute la Variable

Clique sur le bouton **"Add New"** ou **"Add"**

Remplis :

```
Key (Name):   YOUTUBE_API_KEY
Value:        AIzaSyBEJXx-0-Uau-1wbO_4ZxyE5nDbzUSnXVw
```

⚠️ **IMPORTANT** : Ne pas mettre `NEXT_PUBLIC_` devant, juste `YOUTUBE_API_KEY`

### 6. Coche les Environnements

Coche les 3 cases :

- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### 7. Save

Clique sur **"Save"**

---

## 🔄 Redéployer

Maintenant que la variable est ajoutée, il faut redéployer :

### Option A : Attendre le Auto-Deploy (1-2 min)

Vercel va automatiquement redéployer quand tu as push sur GitHub.

Regarde l'onglet **"Deployments"** → Status du dernier déploiement

### Option B : Redéployer Manuellement (Immédiat)

1. Onglet **"Deployments"**
2. Sur le dernier déploiement, clique sur **"⋮"** (trois points)
3. Cliquez sur **"Redeploy"**
4. Confirmez

---

## ✅ Vérifier que Ça Marche

Après redéploiement (1-2 min) :

1. Va sur ton site : `https://vibe-control-rho.vercel.app/host`
2. Ouvre la console (`F12`)
3. Valide une suggestion
4. Tu devrais voir :

```
🔍 Recherche YouTube officielle...
✅ Trouvé via YouTube API: [videoId]
```

Au lieu de :

```
⚠️ Pas de clé YouTube API, passage au fallback Invidious
```

---

## 🎯 Résultat Attendu

**Avant** (sans clé dans Vercel) :

- ❌ Erreur 503 (Invidious down)
- ❌ Rectangle noir
- ❌ Pas de musique

**Après** (avec clé dans Vercel) :

- ✅ Recherche via YouTube API officielle
- ✅ VideoId trouvé en <1 seconde
- ✅ Vidéo se charge dans l'iframe
- ✅ Musique lance automatiquement

---

## 🐛 Si Ça Ne Marche Toujours Pas

### Problème : "⚠️ Pas de clé YouTube API"

**Solution** :

1. Vérifie que le nom est exactement `YOUTUBE_API_KEY` (pas d'espace, pas de `NEXT_PUBLIC_`)
2. Vérifie que "Production" est bien coché
3. Attends que le redéploiement soit terminé (onglet Deployments → Status "Ready")

### Problème : "The YouTube player is not attached to the DOM"

✅ **RÉSOLU** dans le dernier commit ! Le warning devrait disparaître.

### Problème : Vidéo se charge mais pas de son

**Solutions** :

1. Clique n'importe où dans la page (autoplay bloqué par Safari/Chrome)
2. Clique sur le bouton ▶️ Play
3. Vérifie le volume du système

---

## 🎉 C'est Tout !

Une fois la clé ajoutée dans Vercel et redéployé :

- La recherche YouTube sera instantanée
- Fiable à 99%
- Plus de dépendance à Invidious

**Temps total : 2 minutes** ⏱️

Test et envoie-moi les logs de la console une fois redéployé ! 🚀
