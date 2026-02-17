-- Créer les profils manquants pour tous les utilisateurs existants

-- Désactiver temporairement RLS pour l'insertion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Insérer tous les profils manquants
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
WHERE p.id IS NULL;

-- Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Vérifier que ça a fonctionné
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM profiles) as missing_profiles
FROM auth.users;
