# 🎯 GUIDE D'INSTALLATION RAPIDE - VIBE CONTROL

## ⚡ Démarrage en 5 Minutes

### 1️⃣ Installer les dépendances

```bash
npm install
```

### 2️⃣ Configurer Supabase

#### A. Créer le projet Supabase

1. Allez sur https://supabase.com
2. Créez un nouveau projet (prenez note du mot de passe DB)
3. Attendez que le projet soit initialisé (~2 min)

#### B. Exécuter le script SQL

1. Dans Supabase Dashboard, allez dans **"SQL Editor"**
2. Créez une nouvelle requête
3. Copiez TOUT le contenu de `supabase/schema.sql`
4. Collez et cliquez sur **"Run"**
5. Vérifiez qu'il n'y a pas d'erreurs (✓ Success)

#### C. Activer Realtime

1. Allez dans **"Database"** > **"Replication"**
2. Cherchez la table `tracks`
3. Activez la case à cocher ✅

#### D. Récupérer les clés

1. Allez dans **"Settings"** > **"API"**
2. Copiez :
   - `Project URL` (ex: https://xxxxx.supabase.co)
   - `anon public` key (sous "Project API keys")

### 3️⃣ Créer le fichier .env.local

Dans la racine du projet, créez `.env.local` et collez :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

> Remplacez avec VOS vraies valeurs !

### 4️⃣ Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:3000

## 🧪 Tester l'Application

### Test Complet (2 navigateurs)

**Navigateur 1 (Hôte) :**

1. Allez sur `http://localhost:3000`
2. Cliquez sur **"Je suis l'Hôte"**
3. Entrez un nom de session (ex: "Ma Soirée")
4. Cliquez sur **"Créer la session"**
5. ✅ Un QR Code et deux colonnes apparaissent

**Navigateur 2 (Invité) :**

1. Copiez l'URL invité affichée sur l'écran Hôte (ex: `http://localhost:3000/guest/abc123...`)
2. Collez dans un nouvel onglet/navigateur
3. Entrez votre prénom (ex: "Alice")
4. Recherchez "Weeknd" ou "Daft Punk"
5. Cliquez sur **"Suggérer"** sur un morceau
6. ✅ Message de succès

**Retour sur Navigateur 1 (Hôte) :**

1. 🔥 La suggestion apparaît **instantanément** dans la colonne "En Attente"
2. Cliquez sur **"Valider"**
3. 🎵 Le morceau passe dans "Playlist Active" avec animation

## ✅ Checklist de Vérification

- [ ] `npm install` sans erreurs
- [ ] Fichier `.env.local` créé avec les bonnes clés
- [ ] Script SQL exécuté dans Supabase (tables créées)
- [ ] Realtime activé sur la table `tracks`
- [ ] `npm run dev` fonctionne
- [ ] Page Hôte accessible (`/host`)
- [ ] QR Code visible
- [ ] Page Guest accessible (`/guest/[id]`)
- [ ] Suggestion envoyée depuis Guest
- [ ] Suggestion reçue en temps réel sur Host
- [ ] Validation fonctionne (passage dans Playlist Active)

## 🚨 Dépannage Express

### Erreur : "Error: Invalid API key"

→ Vérifiez que `.env.local` contient les bonnes clés Supabase

### Erreur : "relation 'sessions' does not exist"

→ Le script SQL n'a pas été exécuté. Retournez dans SQL Editor

### Le Realtime ne marche pas

→ Vérifiez Database > Replication > `tracks` est activé

### Le QR Code ne s'affiche pas

→ Exécutez `npm install qrcode.react`

### Page blanche / Erreur de build

→ Vérifiez qu'il n'y a pas d'erreurs dans la console : `npm run dev`

## 📞 Besoin d'aide ?

1. Consultez le README.md complet
2. Vérifiez la console du navigateur (F12)
3. Vérifiez les logs du terminal
4. Consultez la doc Supabase : https://supabase.com/docs

---

**🎉 Vous êtes prêt ! Lancez votre première soirée Vibe Control !**
