-- Mettre ton compte en Premium gratuitement pour tester

-- Option 1 : Si tu connais ton email
UPDATE profiles 
SET subscription_tier = 'premium'
WHERE email = 'TON_EMAIL@example.com';

-- Option 2 : Mettre TOUS les comptes en premium (pour test)
UPDATE profiles 
SET subscription_tier = 'premium';

-- Option 3 : Mettre un compte spécifique en Pro
UPDATE profiles 
SET subscription_tier = 'pro'
WHERE email = 'TON_EMAIL@example.com';

-- Vérifier les changements
SELECT 
  email,
  subscription_tier,
  stripe_customer_id
FROM profiles
ORDER BY created_at DESC;
