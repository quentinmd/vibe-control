# 📊 Guide d'Implémentation : Analytics & Historique

## ✅ Phase 1 Complétée

Vous avez maintenant implémenté les fonctionnalités suivantes :

### 1. **Analytics Enrichis (Premium/Pro)**

- Tableau de bord analytics avec statistiques détaillées
- Cartes de métriques (sessions, morceaux, taux d'approbation, contributeurs)
- Distribution des statuts des morceaux
- Top 5 morceaux les plus suggérés
- Filtres par période (7j, 30j, 90j)

### 2. **Statistiques en Temps Réel (HostDashboard)**

- Compteurs en direct : en attente, approuvés, rejetés, joués
- Métriques d'engagement de la session
- Taux d'approbation en temps réel
- Contributeurs uniques
- Temps de réponse moyen
- Heure de pointe d'activité

### 3. **Historique & Archives**

- Onglets dans le dashboard : Sessions actives, Archives, Analytics
- Vue détaillée des sessions terminées
- Statistiques complètes par session archivée
- Modale de détails avec métriques

### 4. **Export & Backup**

- Export JSON complet de sessions
- Export CSV pour Excel
- API dédiée `/api/sessions/export`
- Boutons de téléchargement dans l'interface

---

## 🚀 Déploiement

### Étape 1 : Appliquer les migrations SQL

1. Connectez-vous à votre **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet **VibeControl**
3. Allez dans **SQL Editor** (icône `</>` dans la barre latérale)
4. Créez une nouvelle requête et copiez le contenu de :
   ```bash
   supabase/add-analytics-schema.sql
   ```
5. **Exécutez** la requête (bouton "Run" ou `Ctrl/Cmd + Enter`)
6. Vérifiez qu'il n'y a pas d'erreurs dans les logs

**Ce script crée :**

- Colonnes `approved_at` et `rejected_at` dans la table `tracks`
- Table `session_stats` pour les statistiques de session
- Table `session_guests` pour le suivi des invités
- Triggers automatiques pour mettre à jour les stats
- Policies RLS appropriées

### Étape 2 : Vérifier les fichiers créés

Les fichiers suivants ont été ajoutés :

```
✅ supabase/add-analytics-schema.sql        # Migration BDD
✅ lib/analytics.ts                         # Service analytics
✅ components/analytics/AnalyticsDashboard.tsx  # Composant dashboard
✅ app/api/sessions/export/route.ts         # API export
✅ components/HostDashboard.tsx (modifié)   # Stats temps réel
✅ app/dashboard/page.tsx (modifié)         # Onglets + archives
```

### Étape 3 : Installer les dépendances (optionnel)

Pour les graphiques avancés (recommandé pour Phase 2) :

```bash
npm install recharts
```

### Étape 4 : Tester localement

```bash
npm run dev
```

**Tests à effectuer :**

1. **Créer une session** → `/host`
2. **Ajouter des suggestions** via `/guest/[sessionId]`
3. **Approuver/Rejeter** des suggestions
4. **Vérifier les stats temps réel** dans HostDashboard
5. **Terminer la session** (bouton dans l'interface)
6. **Aller au Dashboard** → `/dashboard`
7. **Onglet "Archives"** → Voir la session terminée
8. **Cliquer sur "Détails"** → Voir la modale avec statistiques
9. **Cliquer sur "Export"** → Télécharger le JSON
10. **Onglet "Analytics"** (Premium/Pro uniquement) → Voir le dashboard avancé

### Étape 5 : Déployer sur Vercel

```bash
git add .
git commit -m "feat: Analytics enrichis, historique et export de sessions"
git push
```

Vercel va automatiquement déployer les changements.

---

## 📖 Utilisation

### Pour les utilisateurs Free

- ✅ Voir les sessions actives
- ✅ Voir les archives basiques
- ❌ Analytics avancés (réservé Premium/Pro)

### Pour les utilisateurs Premium/Pro

- ✅ Toutes les fonctionnalités Free
- ✅ **Dashboard Analytics** avec graphiques
- ✅ **Statistiques détaillées** par session
- ✅ **Export complet** des sessions (JSON/CSV)
- ✅ **Métriques d'engagement** en temps réel

### Navigation

**Dashboard Principal** (`/dashboard`)

```
┌─────────────────────────────────────────┐
│  [Sessions actives] [Archives] [Analytics] │
├─────────────────────────────────────────┤
│                                         │
│  Sessions actives :                     │
│  ➜ Ma Super Soirée [Active] [Gérer →]  │
│                                         │
│  Archives :                             │
│  ➜ Afterwork Vendredi              │
│     [Détails] [Export]                  │
│                                         │
│  Analytics (Premium/Pro) :              │
│  ➜ Graphiques et statistiques           │
│                                         │
└─────────────────────────────────────────┘
```

**HostDashboard** (`/host`)

```
┌─────────────────────────────────────────┐
│  🎵 Lecteur YouTube                     │
├─────────────────────────────────────────┤
│  [⏱️ 3 en attente] [✓ 5 approuvés]      │
│  [✗ 2 rejetés]     [▶️ 8 joués]         │
├─────────────────────────────────────────┤
│  📊 Engagement de la Session            │
│  Taux approbation: 71% | 12 contributeurs│
│  Temps réponse: 2.3 min | Pic: 21h     │
├─────────────────────────────────────────┤
│  [En Attente]          [Playlist]       │
│  ...                   ...              │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Limites par Tier (déjà configuré)

Dans `lib/subscription-limits.ts` :

```typescript
premium: {
  hasAnalytics: true,  // Accès analytics
  // ...
}

pro: {
  hasAnalytics: true,  // Accès analytics
  // ...
}
```

### Personnalisation

**Modifier les périodes de filtrage** (AnalyticsDashboard.tsx) :

```typescript
// Ligne ~120
{[7, 30, 90, 365].map((days) => ( // Ajouter 365 pour "1 an"
```

**Changer le nombre de top tracks** (AnalyticsDashboard.tsx) :

```typescript
// Ligne ~48
getTopTracks(user.id, 20), // Passer de 10 à 20
```

---

## 🐛 Troubleshooting

### Erreur : "Table session_stats does not exist"

**Solution :** Vous n'avez pas exécuté la migration SQL

1. Allez sur Supabase Dashboard
2. SQL Editor
3. Exécutez `supabase/add-analytics-schema.sql`

### Les stats ne se mettent pas à jour automatiquement

**Solution :** Les triggers n'ont pas été créés correctement

1. Vérifiez dans Supabase Database > Functions
2. Vous devez voir `update_session_stats()` et `calculate_session_duration()`
3. Si manquants, ré-exécutez la migration

### "Non authentifié" lors de l'export

**Solution :** Problème d'authentification

1. Vérifiez que vous êtes connecté
2. Essayez de vous déconnecter/reconnecter
3. Vérifiez les cookies du navigateur

### L'onglet Analytics n'apparaît pas

**Solution :** Vérifiez votre subscription tier

```sql
-- Dans Supabase SQL Editor
SELECT id, email, subscription_tier FROM profiles WHERE email = 'votre@email.com';
```

Doit retourner `premium` ou `pro`, pas `free`

### Les métriques d'engagement ne s'affichent pas

**Solution :** La fonction `getEngagementMetrics()` retourne `null`

1. Vérifiez qu'il y a des tracks dans la session
2. Les colonnes `approved_at` et `rejected_at` doivent exister
3. Ré-exécutez la migration si nécessaire

---

## 📊 Base de données

### Nouvelles tables

**session_stats**

```sql
session_id              UUID (FK → sessions.id)
total_tracks_suggested  INTEGER
total_tracks_approved   INTEGER
total_tracks_rejected   INTEGER
total_tracks_played     INTEGER
unique_contributors     INTEGER
avg_approval_time_seconds INTEGER
peak_guests            INTEGER
session_duration_minutes INTEGER
```

**session_guests**

```sql
session_id        UUID (FK → sessions.id)
guest_name        VARCHAR(255)
guest_identifier  VARCHAR(255)
joined_at         TIMESTAMP
last_activity     TIMESTAMP
total_suggestions INTEGER
```

### Triggers automatiques

- `trigger_update_session_stats` : Se déclenche à chaque INSERT/UPDATE sur `tracks`
- `trigger_calculate_session_duration` : Calcule la durée quand `is_active` passe à `false`

---

## 📈 Métriques disponibles

### Niveau Session

- Total suggestions, approuvés, rejetés, joués
- Taux d'approbation/rejet (%)
- Contributeurs uniques
- Temps de réponse moyen (minutes)
- Heure de pointe d'activité
- Durée de session (minutes)

### Niveau Utilisateur (agrégé)

- Total sessions (actives + archivées)
- Total morceaux traités
- Moyenne taux d'approbation
- Total contributeurs uniques
- Top morceaux suggérés

---

## 🎯 Prochaines Étapes (Phase 2)

Choisissez entre :

### Option A : Multi-hôtes / Co-modération (Pro)

- Système d'invitation de co-hôtes
- Permissions et rôles
- Modération collaborative en temps réel

**Complexité :** Moyenne  
**Durée estimée :** 5-7 jours  
**Valeur :** 🔥🔥🔥 (Différenciant pour événements pros)

### Option B : Intégration Spotify (Premium)

- OAuth Spotify
- Recherche dans le catalogue Spotify
- Lecture via Spotify Web Playback SDK
- Meilleure qualité audio

**Complexité :** Élevée  
**Durée estimée :** 7-10 jours  
**Valeur :** 🔥🔥🔥🔥 (Très attendu par les utilisateurs)

**Recommandation :** Commencez par **Multi-hôtes** (plus simple, valeur immédiate), puis ajoutez **Spotify** en Phase 3.

---

## 📞 Support

En cas de problème :

1. Vérifiez les logs de la console navigateur
2. Vérifiez les logs Supabase (Dashboard > Logs)
3. Consultez ce guide
4. Vérifiez que toutes les migrations sont appliquées

**Fichiers clés à vérifier en cas de bug :**

- `lib/analytics.ts` → Fonctions de calcul
- `lib/supabase-server.ts` → Client côté serveur
- `supabase/add-analytics-schema.sql` → Structure BDD

---

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée sur Supabase
- [ ] Vérifier que `session_stats` et `session_guests` existent
- [ ] Vérifier que triggers fonctionnent (créer une session de test)
- [ ] Tester créer session → ajouter tracks → voir stats temps réel
- [ ] Tester terminer session → voir dans archives
- [ ] Tester export JSON
- [ ] Tester dashboard analytics (Premium/Pro)
- [ ] Git commit + push
- [ ] Vérifier déploiement Vercel
- [ ] Tester en production

---

🎉 **Félicitations !** Vous avez implémenté avec succès Phase 1 : Analytics Enrichis & Historique !
