# 🔧 Guide de Dépannage - Lecteur YouTube

## 🎯 Problème : Rectangle noir, pas de musique

Si le lecteur YouTube affiche un rectangle noir sans musique, suivez ces étapes :

---

## ✅ Étape 1 : Ouvrir la Console Développeur

**Sur Chrome/Edge/Brave** :
- Appuyez sur `F12` ou `Cmd+Option+J` (Mac)
- Onglet "Console"

**Sur Safari** :
- Safari > Préférences > Avancées > Cocher "Afficher le menu Développement"
- Développement > Afficher la Console JavaScript

**Sur Firefox** :
- `F12` ou `Cmd+Option+K` (Mac)
- Onglet "Console"

---

## 📋 Étape 2 : Vérifier les Logs

Une fois la console ouverte, **validez une suggestion** et observez les messages :

### ✅ Logs Normaux (fonctionnement correct)

```
🎬 Initialisation YouTube IFrame API...
📥 Script YouTube IFrame API ajouté au DOM
✅ YouTube IFrame API prête !
🎬 Création du lecteur YouTube...
✅ YouTube Player prêt et opérationnel !
🔍 Début chargement vidéo pour: Daft Punk - Get Lucky
📡 Recherche YouTube: Daft Punk Get Lucky official audio
✅ VideoId trouvé: 5NV6Rdv1a3I
▶️ Chargement et lecture...
🎵 État YouTube: Video cued
▶️ Tentative de lecture automatique...
🎵 État YouTube: Lecture
```

### ❌ Erreurs Possibles

#### Erreur A : API YouTube ne charge pas
```
🎬 Initialisation YouTube IFrame API...
(rien après)
```

**Solution** : 
- Vérifiez votre connexion Internet
- Désactivez les bloqueurs de pub (uBlock, AdBlock)
- Testez dans un onglet privé/incognito

#### Erreur B : Player ne se crée pas
```
✅ YouTube IFrame API prête !
⚠️ Ref du player non disponible
```

**Solution** :
- Rafraîchissez la page (`Cmd+R` ou `F5`)
- Videz le cache (`Cmd+Shift+R` ou `Ctrl+Shift+R`)

#### Erreur C : Recherche échoue
```
📡 Recherche YouTube: ...
❌ VideoId non trouvé pour: ...
```

**Solution** :
- L'API Invidious est temporairement down
- Utilisez le **bouton manuel "Ouvrir sur YouTube"** qui devrait apparaître

#### Erreur D : CORS / Fetch failed
```
Failed to load resource: net::ERR_FAILED
Access-Control-Allow-Origin
```

**Solution** :
- L'API route Next.js n'est pas accessible
- Sur Vercel, vérifiez que le déploiement est complet
- En local, vérifiez que `npm run dev` tourne bien

---

## 🧪 Étape 3 : Tests de Diagnostic

### Test 1 : API YouTube fonctionne-t-elle ?

Ouvrez la console et tapez :
```javascript
window.YT
```

**Résultat attendu** : Un objet JavaScript (pas `undefined`)  
**Si undefined** : L'API YouTube n'a pas chargé → Bloqueur de pub ou problème réseau

### Test 2 : Le player existe-t-il ?

```javascript
document.getElementById('youtube-player-...')
```

**Résultat attendu** : Un élément `<div>`  
**Si null** : Le composant ne s'est pas monté correctement

### Test 3 : L'API route fonctionne-t-elle ?

```javascript
fetch('/api/youtube-search?q=test').then(r => r.json()).then(console.log)
```

**Résultat attendu** : `{ videoId: "...", title: "...", ... }`  
**Si erreur 503** : Toutes les instances Invidious sont down → Utilisez le bouton manuel

---

## 🎛️ Étape 4 : Messages dans l'Interface

Le lecteur affiche maintenant des **indicateurs d'état** :

### 🟡 "Lecteur YouTube en cours d'initialisation..."
- **État** : L'API YouTube est chargée mais le player n'est pas encore créé
- **Action** : Attendez 2-3 secondes
- **Si bloqué** : Rafraîchissez la page

### 🟢 "✅ Lecteur prêt • Ouvrez la console pour voir les logs"
- **État** : Tout fonctionne ! Le player est opérationnel
- **Si pas de son** : Vérifiez que vous avez validé une suggestion

### 🔵 Spinner "Recherche de la vidéo..."
- **État** : Recherche du videoId sur YouTube en cours
- **Normal** : 2-5 secondes
- **Si bloqué >10s** : L'API Invidious est probablement down

### 🔴 Message d'erreur rouge
- **État** : Impossible de trouver la vidéo automatiquement
- **Action** : Cliquez sur **"Ouvrir sur YouTube"** pour lancer manuellement

---

## 🔊 Étape 5 : Problèmes Audio Spécifiques

### Problème : La vidéo se charge mais pas de son

**Causes possibles** :
1. **Volume du système à 0** → Augmentez le volume
2. **Onglet muté dans le navigateur** → Clic droit sur l'onglet > "Réactiver le son"
3. **Bouton Mute activé** → Cliquez sur l'icône 🔊 dans les contrôles
4. **Vidéo YouTube défectueuse** → Passez au morceau suivant (bouton Skip)

### Problème : La vidéo ne démarre pas automatiquement

**C'est normal !** Les navigateurs bloquent l'autoplay par défaut.

**Solution** :
1. Cliquez n'importe où dans la page au premier chargement
2. Cliquez sur le bouton ▶️ Play dans les contrôles
3. La lecture automatique fonctionnera ensuite pour les morceaux suivants

---

## 🌐 Étape 6 : Spécificités par Navigateur

### Chrome / Edge / Brave ✅
- **Le mieux supporté**
- Autoplay fonctionne après une première interaction

### Safari ⚠️
- **Restrictions strictes** sur l'autoplay
- Peut nécessiter un clic manuel à chaque morceau
- Testez en désactivant "Bloquer la lecture automatique" dans Préférences > Sites Web

### Firefox ✅
- Fonctionne bien généralement
- Vérifiez que "Bloquer la lecture automatique de l'audio" est désactivé dans `about:preferences#privacy`

### Mobile (iOS/Android) 📱
- **Restrictions d'autoplay très strictes**
- L'utilisateur DOIT interagir avec la page d'abord
- Sur iOS Safari : Désactivez "Optimiser vidéos" dans Réglages > Safari

---

## 🚨 Solutions d'Urgence

### Solution 1 : Mode Dégradé Manuel
Si rien ne fonctionne, utilisez le **bouton "Ouvrir sur YouTube"** :
1. Validez une suggestion
2. Si erreur → Cliquez sur "Ouvrir sur YouTube"
3. La vidéo s'ouvre dans un nouvel onglet
4. Lancez manuellement

### Solution 2 : Désactiver les Extensions

Testez en **mode incognito/privé** :
- Chrome : `Cmd+Shift+N` (Mac) ou `Ctrl+Shift+N` (Windows)
- Safari : `Cmd+Shift+N`
- Firefox : `Cmd+Shift+P`

Si ça fonctionne en incognito → Une extension bloque le lecteur (AdBlock, Privacy Badger, etc.)

### Solution 3 : Autre Navigateur

Testez avec un autre navigateur pour isoler le problème :
- Chrome ✅ (recommandé)
- Edge ✅
- Firefox ✅
- Safari ⚠️ (peut être capricieux)

---

## 📊 Checklist de Dépannage

Cochez au fur et à mesure :

- [ ] Console ouverte (`F12`)
- [ ] Logs visibles lors de la validation
- [ ] Message "✅ YouTube Player prêt et opérationnel !"
- [ ] Message "✅ VideoId trouvé: ..."
- [ ] Vidéo YouTube visible dans l'iframe (même sans son)
- [ ] Volume du système > 0
- [ ] Onglet non muté
- [ ] Testé en mode incognito
- [ ] Testé dans un autre navigateur
- [ ] Extensions désactivées

---

## 💬 Partager les Logs

Si le problème persiste, **partagez les logs de la console** :

1. Ouvrez la console (`F12`)
2. Validez une suggestion
3. Faites `Cmd+A` (sélectionner tout) dans la console
4. `Cmd+C` (copier)
5. Collez dans un fichier texte ou message

Les logs permettront d'identifier précisément le problème !

---

## 🛠️ Mode Développement Local

Pour tester en local avec tous les logs :

```bash
npm run dev
```

Puis ouvrez `http://localhost:3000/host` et surveillez :
- La console du navigateur
- Le terminal où tourne `npm run dev`

Les logs côté serveur (API route) apparaîtront dans le terminal.

---

## 📞 Problèmes Connus

### 1. Instances Invidious Down ❌
**Symptôme** : Toutes les recherches échouent  
**Détection** : Message "❌ VideoId non trouvé" systématiquement  
**Solution temporaire** : Utiliser le bouton manuel

### 2. Quota YouTube API Dépassé ⚠️
**Symptôme** : Erreur 403 Forbidden  
**Solution** : Patienter 24h ou ajouter une clé API YouTube officielle

### 3. Content Blockers 🚫
**Symptôme** : Rectangle noir, aucun log YouTube  
**Détection** : Erreur "Content blocker prevented frame"  
**Solution** : Désactiver les bloqueurs pour ce site

---

## ✅ Résultat Attendu

Une fois tout configuré correctement :

1. Vous validez une suggestion ✅
2. Logs dans la console : "✅ VideoId trouvé" ✅
3. Iframe YouTube affiche la vidéo ✅
4. La musique démarre (après premier clic dans la page) ✅
5. À la fin → Passe automatiquement au suivant ✅

**Bon DJ set ! 🎧**
