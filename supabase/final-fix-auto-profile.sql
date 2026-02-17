-- Solution finale : Profils créés automatiquement à chaque inscription

-- =============================================
-- ÉTAPE 1 : Désactiver RLS sur profiles
-- =============================================
-- Le trigger a besoin de pouvoir insérer sans restrictions RLS

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =============================================
-- ÉTAPE 2 : Recréer le trigger qui fonctionne
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la création de l'utilisateur
    RAISE WARNING 'Erreur création profil pour %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ÉTAPE 3 : Créer les profils manquants existants
-- =============================================

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

-- =============================================
-- ÉTAPE 4 : Vérification
-- =============================================

SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM profiles) 
    THEN '✅ Tous les utilisateurs ont un profil'
    ELSE '❌ ' || (COUNT(*) - (SELECT COUNT(*) FROM profiles))::text || ' utilisateurs sans profil'
  END as status
FROM auth.users;

-- Vérifier que le trigger existe
SELECT 
  '✅ Trigger créé : ' || trigger_name as trigger_status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Message de confirmation
SELECT '✅ Configuration terminée ! Les profils seront créés automatiquement à chaque nouvelle inscription.' as message;
