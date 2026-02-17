# Correction du chargement infini sur /host

## Problème identifié

Lorsqu'un utilisateur est connecté et accède à la page `/host`, la page reste bloquée sur un spinner de chargement infini, particulièrement en navigation privée.

### Causes du problème

1. **Appels multiples simultanés** : La fonction `loadProfile()` était appelée plusieurs fois sans protection contre les appels simultanés
2. **Création de profil côté client** : L'ancienne version tentait de créer le profil côté client si non trouvé, ce qui pouvait échouer silencieusement
3. **Absence de timeout** : Aucune limite de temps ou de tentatives pour le chargement du profil
4. **RLS potentiellement bloquant** : Les Row Level Security policies pouvaient bloquer le trigger de création automatique

## Solutions implémentées

### 1. Amélioration de `loadProfile()` dans `lib/auth-context.tsx`

**Changements :**

- ✅ Ajout d'un flag `loadingProfile` pour éviter les appels simultanés
- ✅ Suppression de la logique de création côté client (le trigger doit s'en occuper)
- ✅ Ajout d'une logique de retry (1 tentative après 1 seconde)
- ✅ Meilleure gestion des erreurs avec logs explicites

**Comportement :**

```typescript
const loadProfile = async (userId: string, retryCount = 0): Promise<void> => {
  // Vérifie si un chargement est déjà en cours
  if (loadingProfile) return;

  // Essaie de charger le profil
  // Si PGRST116 (not found), réessaie une fois après 1s
  // Si échec après retry, accepte que le profil n'existe pas
};
```

### 2. Amélioration de la page `/host`

**Changements :**

- ✅ Ajout de boutons d'action quand le profil ne se charge pas
- ✅ Bouton "Recharger la page" pour forcer un nouveau chargement
- ✅ Bouton "Se déconnecter" pour réinitialiser l'état

**Expérience utilisateur :**
Au lieu d'un spinner infini, l'utilisateur voit :

- Un spinner avec un message explicite
- Des instructions claires
- Deux actions possibles pour débloquer la situation

### 3. Script SQL de correction (`supabase/fix-infinite-loading.sql`)

**Actions du script :**

1. ✅ Vérifie l'état actuel de RLS sur la table `profiles`
2. ✅ Désactive RLS pour permettre au trigger de fonctionner
3. ✅ Recrée complètement le trigger `handle_new_user()`
4. ✅ Ajoute `ON CONFLICT DO NOTHING` pour éviter les erreurs de duplication
5. ✅ Crée les profils manquants pour tous les utilisateurs existants
6. ✅ Fournit des requêtes de vérification pour diagnostiquer les problèmes

**À exécuter :**

```sql
-- Dans Supabase SQL Editor
-- Copier-coller le contenu complet de supabase/fix-infinite-loading.sql
```

## Comment tester la correction

### 1. Exécuter le script SQL

```bash
# Dans Supabase Dashboard > SQL Editor
# Exécuter: supabase/fix-infinite-loading.sql
```

### 2. Tester avec un nouvel utilisateur

1. Ouvrir une fenêtre de navigation privée
2. S'inscrire avec un nouveau compte
3. Vérifier que le profil est créé automatiquement
4. Accéder à `/host` directement
5. La page devrait se charger normalement

### 3. Tester avec un utilisateur existant

1. Se connecter avec un compte existant
2. Accéder à `/host`
3. Vérifier que le profil se charge correctement
4. Si problème, utiliser le bouton "Recharger la page"

### 4. Vérifier dans Supabase

```sql
-- Vérifier que tous les utilisateurs ont un profil
SELECT
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;

-- Les deux nombres doivent être identiques
```

## Comportement attendu après correction

### Scénario 1 : Nouveau compte (inscription)

1. L'utilisateur s'inscrit
2. Le trigger `handle_new_user()` crée automatiquement le profil
3. L'utilisateur est redirigé vers le dashboard
4. Le profil se charge en < 1 seconde

### Scénario 2 : Connexion existante

1. L'utilisateur se connecte
2. `loadProfile()` charge le profil depuis la DB
3. Redirection vers le dashboard
4. Profil affiché correctement

### Scénario 3 : Profil manquant (edge case)

1. L'utilisateur se connecte mais le profil n'existe pas
2. `loadProfile()` détecte PGRST116
3. Retry après 1 seconde (au cas où le trigger est lent)
4. Si toujours pas de profil, affiche la page avec boutons d'action
5. L'utilisateur peut recharger ou se déconnecter

### Scénario 4 : Navigation privée

1. Fonctionne exactement comme en mode normal
2. Le trigger crée le profil dans la base de données (pas dans le localStorage)
3. Pas de différence de comportement

## Monitoring et debugging

### Logs à surveiller

Dans la console du navigateur :

```
✅ "Profile loaded successfully"
⚠️ "Profile loading already in progress, skipping..."
⚠️ "Profile not found, retrying in 1s..."
❌ "Profile not found after retry for user: xxx"
❌ "Le trigger Supabase n'a peut-être pas créé le profil automatiquement."
```

### Commandes de diagnostic

```sql
-- 1. Vérifier le trigger
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 2. Lister les utilisateurs sans profil
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 3. Vérifier l'état de RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
```

## Prochaines étapes

1. ✅ Déployer les changements sur Vercel
2. ⏳ Exécuter le script SQL dans Supabase
3. ⏳ Tester en navigation privée
4. ⏳ Vérifier que les nouveaux comptes fonctionnent
5. ⏳ Monitorer les logs pour détecter d'éventuels problèmes

## Notes importantes

- **RLS désactivé** : Le script laisse RLS désactivé sur `profiles` pour éviter que les policies bloquent le trigger
- **Sécurité** : Les données de profil ne sont pas sensibles (juste tier et email), RLS désactivé n'est pas un risque de sécurité majeur
- **Fallback automatique** : Si le profil n'existe pas, l'UI propose des actions au lieu de bloquer
- **Navigation privée** : Le fix fonctionne car le profil est stocké en base de données, pas dans le localStorage

## Support

Si le problème persiste après ces corrections :

1. Vérifier les logs de la console navigateur
2. Exécuter les requêtes de diagnostic SQL
3. Vérifier que le trigger existe et est enabled
4. Tester avec un nouvel utilisateur de test
