# 🔑 Comment Obtenir une Clé YouTube API (GRATUIT)

## Pourquoi ?

L'API YouTube Data v3 officielle est **plus fiable** que les instances Invidious alternatives. Elle permet de rechercher des vidéos directement depuis YouTube.

**✅ Gratuit** : 10,000 unités/jour = environ **100 recherches de vidéos**  
**✅ Fiable** : API officielle Google  
**✅ Rapide** : 5 minutes de configuration

---

## 📝 Étapes (5 minutes)

### 1. Créer un Projet Google Cloud

1. Allez sur : **https://console.cloud.google.com**
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Sélectionner un projet"** (en haut)
4. Cliquez sur **"NOUVEAU PROJET"**
5. Nom du projet : `Vibe Control` (ou ce que vous voulez)
6. Cliquez sur **"CRÉER"**
7. Attendez 10-20 secondes que le projet se crée

### 2. Activer l'API YouTube Data v3

1. Dans le menu hamburger (☰) à gauche, allez dans :
   - **"API et services"** → **"Bibliothèque"**
2. Cherchez : `YouTube Data API v3`
3. Cliquez dessus
4. Cliquez sur **"ACTIVER"**
5. Attendez que l'activation se termine

### 3. Créer une Clé API

1. Dans le menu à gauche, allez dans :
   - **"API et services"** → **"Identifiants"**
2. En haut, cliquez sur **"+ CRÉER DES IDENTIFIANTS"**
3. Sélectionnez **"Clé API"**
4. Une clé est créée automatiquement : `AIzaSy...` (copiez-la !)
5. ⚠️ **Important** : Cliquez sur **"RESTREINDRE LA CLÉ"** (sécurité)

### 4. Restreindre la Clé (Sécurité)

**Restrictions d'API** :
1. Sélectionnez : **"Restreindre la clé"**
2. Cochez uniquement : **"YouTube Data API v3"**
3. Cliquez sur **"ENREGISTRER"**

**Restrictions d'application** (optionnel mais recommandé) :
1. Sélectionnez : **"Référents HTTP"**
2. Ajoutez :
   ```
   https://votre-site.vercel.app/*
   http://localhost:3000/*
   ```
3. Cliquez sur **"ENREGISTRER"**

---

## 🚀 Configuration dans Vercel

### Ajouter la Variable d'Environnement

1. Allez sur : **https://vercel.com/dashboard**
2. Sélectionnez votre projet **"vibe-control"**
3. Onglet **"Settings"**
4. Menu **"Environment Variables"**
5. Cliquez sur **"Add"**
6. Remplissez :
   ```
   Key:   YOUTUBE_API_KEY
   Value: AIzaSy...votre_clé (celle copiée à l'étape 3)
   ```
7. Cochez : **Production**, **Preview**, **Development**
8. Cliquez sur **"Save"**

### Redéployer

1. Onglet **"Deployments"**
2. Sur le dernier déploiement, cliquez sur **"⋮"** (trois points)
3. Cliquez sur **"Redeploy"**
4. Confirmez

**✅ Terminé !** L'API YouTube officielle va maintenant être utilisée.

---

## 🧪 Tester en Local (Optionnel)

Si vous voulez tester sur votre machine :

```bash
# Dans votre terminal
cd VibeControl

# Créer le fichier .env.local (s'il n'existe pas déjà)
echo "YOUTUBE_API_KEY=AIzaSy...votre_clé" >> .env.local

# Redémarrer le serveur
npm run dev
```

Puis testez sur `http://localhost:3000/host`

---

## 📊 Surveillance du Quota

### Vérifier la Consommation

1. Retournez sur : **https://console.cloud.google.com**
2. Menu hamburger → **"API et services"** → **"Tableau de bord"**
3. Cliquez sur **"YouTube Data API v3"**
4. Vous verrez un graphique des requêtes

### Quota Quotidien

**Gratuit** : 10,000 unités/jour

Une recherche = **100 unités**  
→ **100 recherches maximum par jour**

**Si vous dépassez** :
- L'API retournera une erreur 403
- Le système basculera automatiquement sur Invidious (si disponible)
- Sinon le bouton manuel apparaîtra

### Pour un Usage Intensif

Si vous avez besoin de plus (événements, soirées multiples) :
- Créez plusieurs projets Google Cloud (chacun a son quota)
- Ou activez la facturation (toujours gratuit jusqu'à 1 million d'unités/mois)

---

## 🔒 Sécurité

### ⚠️ Ne Commitez JAMAIS votre Clé API

Le fichier `.env.local` est dans `.gitignore` (déjà configuré).

**Si vous avez accidentellement exposé votre clé** :
1. Google Cloud Console → Identifiants
2. Cliquez sur votre clé → **"SUPPRIMER"**
3. Créez une nouvelle clé

### ✅ Bonnes Pratiques

- ✅ Restrictions d'API activées (uniquement YouTube Data v3)
- ✅ Restrictions de référents activées (uniquement votre domaine)
- ✅ Clé stockée dans variable d'environnement (jamais dans le code)
- ✅ `.env.local` dans `.gitignore`

---

## 🆘 Dépannage

### Erreur : "API key not valid"

**Cause** : La clé n'est pas correctement configurée  
**Solution** :
1. Vérifiez que vous avez bien activé **YouTube Data API v3**
2. Attendez 2-3 minutes que la clé soit active
3. Vérifiez les restrictions (pas trop strictes)

### Erreur : "The request cannot be completed because you have exceeded your quota"

**Cause** : Quota journalier dépassé (10,000 unités)  
**Solution** :
1. Attendez minuit (heure PST/PDT - Californie)
2. Le quota se réinitialise automatiquement
3. En attendant, le système utilisera le bouton manuel

### La Clé Ne Fonctionne Pas sur Vercel

**Solution** :
1. Vérifiez que la variable est bien nommée : `YOUTUBE_API_KEY` (sans `NEXT_PUBLIC_`)
2. Vérifiez qu'elle est cochée pour **Production**
3. Redéployez l'application (menu "Redeploy")
4. Attendez que le build soit terminé

### Comment Savoir si Ça Fonctionne ?

Ouvrez la console (`F12`) et validez un morceau :
- ✅ Vous devriez voir : `🔍 Recherche YouTube officielle...`
- ✅ Puis : `✅ Trouvé via YouTube API: [videoId]`

Si vous voyez : `⚠️ Pas de clé YouTube API` → La clé n'est pas détectée

---

## 💡 Alternative (Sans Clé API)

Si vous ne voulez pas créer de clé API :
- Le système utilisera automatiquement les instances Invidious (gratuit)
- Moins fiable (pueden estar caídas)
- Si elles sont down → Bouton manuel apparaît

**Recommandation** : Créez une clé API (5 minutes, gratuit, plus fiable)

---

## 📚 Documentation Officielle

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Google Cloud Console](https://console.cloud.google.com)
