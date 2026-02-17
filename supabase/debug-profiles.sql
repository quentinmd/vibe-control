-- Voir tous les utilisateurs et leurs profils

SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  au.confirmed_at,
  p.id as profile_id,
  p.email as profile_email,
  p.subscription_tier,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;

-- Compter les utilisateurs sans profil
SELECT 
  COUNT(*) as users_without_profile
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Créer les profils manquants (EXÉCUTER SI DES USERS SANS PROFILS)
INSERT INTO profiles (id, email, full_name, subscription_tier)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  'free'
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Vérifier à nouveau
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM profiles) as missing_profiles
FROM auth.users;
