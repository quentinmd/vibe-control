# 👥 Guide d'Implémentation : Multi-hôtes / Co-modération (Pro)

## ✅ Phase 2A Complétée

Vous avez maintenant implémenté la fonctionnalité de **co-modération collaborative** réservée aux abonnés Pro.

---

## 📦 Fonctionnalités Implémentées

### 1. **Système de Co-hôtes**

- Table `session_hosts` pour gérer les relations many-to-many
- Deux rôles : `owner` (propriétaire) et `moderator` (co-modérateur)
- Migration automatique des données existantes

### 2. **Permissions & RLS**

- Les owners peuvent ajouter/retirer des modérateurs
- Les modérateurs peuvent approuver/rejeter les suggestions
- Seul l'owner peut terminer ou modifier la session
- Policies Supabase pour sécuriser l'accès

### 3. **API Complète**

- `GET /api/sessions/co-hosts?sessionId=xxx` - Lister les co-hôtes
- `POST /api/sessions/co-hosts` - Ajouter un co-hôte
- `DELETE /api/sessions/co-hosts` - Retirer un co-hôte

### 4. **Interface Utilisateur**

- Composant `CoHostsManager` dans la page `/host`
- Formulaire d'invitation par email
- Liste des co-modérateurs avec badges de rôle
- Bouton de retrait pour l'owner

### 5. **Vérifications**

- Réservé aux abonnés **Pro uniquement**
- Message de mise à niveau pour les autres tiers
- Vérification des permissions à chaque action

---

## 🚀 Déploiement

### Étape 1 : Appliquer la migration SQL (OBLIGATOIRE)

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **VibeControl**
3. Allez dans **SQL Editor** (icône `</>`)
4. Créez une nouvelle requête
5. Copiez le contenu de [supabase/add-multi-hosts.sql](supabase/add-multi-hosts.sql)
6. **Exécutez** (Run / `Ctrl+Enter`)
7. Vérifiez qu'il n'y a pas d'erreurs

**Ce script :**

- Crée la table `session_hosts`
- Migre les données existantes (`sessions.host_id` → `session_hosts`)
- Crée les policies RLS pour sécuriser l'accès
- Ajoute des fonctions helper (`get_user_session_role`, `is_session_owner`)
- Crée un trigger pour auto-créer l'owner
- Crée une vue `sessions_with_cohosts`

### Étape 2 : Vérifier la migration

```sql
-- Vérifier que la table existe
SELECT * FROM session_hosts LIMIT 5;

-- Vérifier que les owners ont été migrés
SELECT COUNT(*) as owner_count
FROM session_hosts
WHERE role = 'owner';

-- Vérifier une fonction
SELECT get_user_session_role('session-id', 'user-id');
```

### Étape 3 : Tester localement

```bash
npm run dev
```

**Tests à effectuer :**

1. **Créer une session** en tant qu'utilisateur Pro
2. **Vérifier** que le composant Co-modérateurs s'affiche
3. **Inviter un co-hôte** par email (email doit exister dans la BDD)
4. **Se connecter** avec le compte co-hôte
5. **Vérifier** qu'il voit la session dans `/host`
6. **Tester la modération** : approuver/rejeter des tracks
7. **Retirer le co-hôte** depuis le compte owner
8. **Vérifier** que le co-hôte n'a plus accès

### Étape 4 : Test avec utilisateur non-Pro

1. Créer une session avec un compte Free ou Premium
2. Vérifier que le message "Passer à Pro" s'affiche
3. Vérifier qu'on ne peut pas ajouter de co-hôtes

### Étape 5 : Déployer

```bash
git add .
git commit -m "feat: Multi-hôtes et co-modération (Phase 2A)"
git push
```

Vercel déploiera automatiquement.

---

## 📁 Fichiers Créés

```
✅ supabase/add-multi-hosts.sql           # Migration BDD
✅ app/api/sessions/co-hosts/route.ts     # API endpoints
✅ lib/coHosts.ts                         # Service client
✅ components/CoHostsManager.tsx          # UI co-modérateurs
✅ app/host/page.tsx (modifié)            # Intégration UI
```

---

## 🔧 Architecture Technique

### Base de Données

**Table `session_hosts`**

```sql
id               UUID PRIMARY KEY
session_id       UUID → sessions(id)
user_id          UUID → auth.users(id)
role             VARCHAR(20) ('owner' | 'moderator')
added_at         TIMESTAMP
added_by         UUID → auth.users(id)
UNIQUE(session_id, user_id)
```

**Indexes**

- `idx_session_hosts_session` sur `session_id`
- `idx_session_hosts_user` sur `user_id`
- `idx_session_hosts_composite` sur `(session_id, user_id)`

### RLS Policies

**session_hosts**

- ✅ Hosts peuvent lire les co-hosts de leurs sessions
- ✅ Owners peuvent ajouter des co-hosts
- ✅ Owners peuvent retirer des moderators (pas eux-mêmes)

**sessions**

- ✅ Hosts (owner + moderators) peuvent lire leurs sessions
- ✅ Seulement owners peuvent UPDATE/DELETE

**tracks**

- ✅ Tous les hosts (owner + moderators) peuvent gérer les tracks

### API Endpoints

**GET** `/api/sessions/co-hosts?sessionId=xxx`

```json
{
  "hosts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "Nom Complet",
      "role": "owner",
      "added_at": "2026-02-23T10:00:00Z"
    }
  ],
  "currentUserRole": "owner"
}
```

**POST** `/api/sessions/co-hosts`

```json
{
  "sessionId": "uuid",
  "email": "cohote@example.com"
}
```

**DELETE** `/api/sessions/co-hosts`

```json
{
  "sessionId": "uuid",
  "hostId": "uuid"
}
```

---

## 💡 Utilisation

### Pour les Owners (Propriétaires)

1. **Créer une session** (doit être abonné Pro)
2. Dans la page `/host`, voir le panneau **Co-modérateurs**
3. Entrer l'**email** du co-modérateur (doit avoir un compte)
4. Cliquer sur **Inviter**
5. Le co-modérateur peut maintenant accéder à la session

**Actions disponibles :**

- ✅ Ajouter des co-modérateurs
- ✅ Retirer des co-modérateurs
- ✅ Approuver/rejeter des suggestions
- ✅ Terminer la session
- ✅ Modifier le nom de la session

### Pour les Moderators (Co-modérateurs)

1. **Être invité** par un owner
2. Se connecter et aller sur `/host`
3. La session partagée apparaît automatiquement

**Actions disponibles :**

- ✅ Voir les suggestions en attente
- ✅ Approuver/rejeter des suggestions
- ✅ Voir la playlist active
- ❌ Ne peut pas terminer la session
- ❌ Ne peut pas ajouter/retirer d'autres co-hôtes

### Notifications en Temps Réel

Les modérateurs voient les changements en temps réel grâce à **Supabase Realtime** :

- Nouvelles suggestions
- Approbations/rejets par d'autres modérateurs
- Tracks joués
- Fin de session

---

## 🎯 Cas d'Usage

### 1. Événements Professionnels

- **Plusieurs animateurs** pour gérer une grande soirée
- **Co-organisateurs** pour événements d'entreprise
- **Rotation des modérateurs** pendant l'événement

### 2. Festivals & Concerts

- **Équipe de modération** pour filtrer les suggestions
- **DJ et technicien** partagent le contrôle
- **Backup** si le DJ principal n'est pas disponible

### 3. Bars & Restaurants

- **Équipe du bar** peut modérer à tour de rôle
- **Manager** garde le contrôle principal (owner)
- **Serveurs** peuvent approuver des demandes

---

## 🐛 Troubleshooting

### Erreur : "Table session_hosts does not exist"

**Solution :** Migration SQL non appliquée

```bash
# Allez sur Supabase Dashboard
# SQL Editor > Nouvelle requête
# Copiez supabase/add-multi-hosts.sql
# Exécutez
```

### Erreur : "Fonctionnalité réservée aux abonnés Pro"

**Solution :** L'utilisateur n'est pas Pro

```sql
-- Vérifier le tier
SELECT id, email, subscription_tier
FROM profiles
WHERE email = 'user@example.com';

-- Passer en Pro (SEULEMENT POUR TEST)
UPDATE profiles
SET subscription_tier = 'pro'
WHERE email = 'user@example.com';
```

### Erreur : "Utilisateur non trouvé avec cet email"

**Solution :** L'email n'existe pas dans `profiles`

- Le co-hôte doit d'abord **créer un compte** sur Vibe Control
- Vérifier l'orthographe de l'email

### Erreur : "Seul le propriétaire peut ajouter des co-hôtes"

**Solution :** L'utilisateur actuel n'est pas owner

```sql
-- Vérifier le rôle
SELECT role FROM session_hosts
WHERE session_id = 'session-id'
AND user_id = 'user-id';
```

### Les co-hôtes ne voient pas la session

**Solution :** Vérifier que `loadActiveSession` utilise `session_hosts`

- Le code dans `app/host/page.tsx` doit charger depuis `session_hosts`, pas seulement `sessions.host_id`

### RLS Policy bloque l'accès

**Solution :** Vérifier les policies

```sql
-- Lister les policies sur session_hosts
SELECT * FROM pg_policies
WHERE tablename = 'session_hosts';

-- Tester l'accès
SELECT * FROM session_hosts
WHERE session_id = 'session-id';
-- Si rien ne s'affiche, problème de RLS
```

---

## 📊 Métriques & Analytics

Les co-modérateurs sont comptabilisés dans les statistiques :

- Nombre de co-modérateurs par session
- Historique des invitations
- Actions de modération par co-hôte (futur)

**Vue disponible :**

```sql
SELECT * FROM sessions_with_cohosts
WHERE id = 'session-id';
-- Retourne: moderator_count, total_hosts
```

---

## 🔐 Sécurité

### Vérifications Côté Serveur

- ✅ Authentification obligatoire
- ✅ Vérification du tier Pro
- ✅ Vérification des permissions (owner/moderator)
- ✅ RLS Supabase sur toutes les tables

### Limitations

- ❌ Pas de limite sur le nombre de co-modérateurs (à implémenter si besoin)
- ⚠️ L'owner ne peut pas se retirer lui-même
- ⚠️ Si l'owner supprime son compte, la session reste (sessions.host_id existe toujours)

---

## 🎨 Personnalisation

### Changer le nombre max de co-modérateurs

Dans `app/api/sessions/co-hosts/route.ts` (POST) :

```typescript
// Ajouter une vérification
const { count } = await supabase
  .from("session_hosts")
  .select("*", { count: "exact", head: true })
  .eq("session_id", sessionId)
  .eq("role", "moderator");

if (count >= 5) {
  return NextResponse.json(
    { error: "Maximum 5 co-modérateurs par session" },
    { status: 400 },
  );
}
```

### Ajouter des notifications email

Dans `app/api/sessions/co-hosts/route.ts` (POST) :

```typescript
// Après l'ajout du co-hôte
// TODO: Envoyer email avec Resend, SendGrid, etc.
await sendInvitationEmail({
  to: targetProfile.email,
  sessionName: session.name,
  invitedBy: user.email,
  sessionLink: `${process.env.NEXT_PUBLIC_APP_URL}/host`,
});
```

### Ajouter des statistiques par co-hôte

Créer une table `moderation_actions` :

```sql
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  moderator_id UUID REFERENCES auth.users(id),
  track_id UUID REFERENCES tracks(id),
  action VARCHAR(20), -- 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 Prochaines Étapes

Après avoir déployé Multi-hôtes, vous pouvez :

### **Phase 2B : Intégration Spotify** (recommandé)

- OAuth Spotify
- Recherche Spotify
- Lecteur Spotify Web Playback SDK
- Voir [PHASE-2-ROADMAP.md](PHASE-2-ROADMAP.md)

### **Phase 3 : Fonctionnalités Pro**

- Branding personnalisé
- API publique avec clés
- Webhooks
- Statistiques avancées par co-hôte

### **Phase 4 : Améliorations UX**

- Notifications push
- Emails automatiques
- Mobile app
- Personnalisation QR Code

---

## ✅ Checklist de Déploiement

- [ ] Migration SQL appliquée sur Supabase
- [ ] Table `session_hosts` existe et contient les owners migrés
- [ ] Tester créer session (Pro uniquement)
- [ ] Tester inviter co-hôte (email existant)
- [ ] Tester se connecter en tant que co-hôte
- [ ] Tester modération par co-hôte (approuver/rejeter)
- [ ] Tester retirer co-hôte
- [ ] Tester utilisateur non-Pro (message de mise à niveau)
- [ ] Git commit + push
- [ ] Vérifier déploiement Vercel
- [ ] Tester en production

---

## 🎉 Félicitations !

Vous avez implémenté avec succès **Phase 2A : Multi-hôtes / Co-modération** !

Cette fonctionnalité différencie votre offre Pro et justifie le prix plus élevé. Les événements professionnels et grandes soirées peuvent maintenant bénéficier d'une modération collaborative en temps réel.

**Prochaine étape recommandée :** [Intégration Spotify (Phase 2B)](PHASE-2-ROADMAP.md#option-b--intégration-spotify-premium-)

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Supabase (Dashboard > Logs)
2. Vérifier les logs navigateur (F12 > Console)
3. Consulter ce guide de troubleshooting
4. Vérifier que les migrations sont appliquées

**Fichiers clés :**

- `supabase/add-multi-hosts.sql` - Migration BDD
- `app/api/sessions/co-hosts/route.ts` - API
- `lib/coHosts.ts` - Service client
- `components/CoHostsManager.tsx` - UI
