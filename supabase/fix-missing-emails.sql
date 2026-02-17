-- Mettre à jour les emails manquants dans profiles

UPDATE profiles 
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- Vérifier le résultat
SELECT 
  COUNT(*) as total_profiles,
  COUNT(email) as profiles_with_email,
  COUNT(*) - COUNT(email) as profiles_without_email
FROM profiles;
