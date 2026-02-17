-- =============================================
-- MIGRATION: Authentification & Abonnements
-- =============================================
-- Cette migration ajoute :
-- 1. Table profiles (profils utilisateurs)
-- 2. Table subscriptions (historique abonnements)
-- 3. Restaure host_id en UUID avec FK vers auth.users
-- 4. Politiques RLS sécurisées

-- =============================================
-- ÉTAPE 1: Créer la table profiles
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- =============================================
-- ÉTAPE 2: Créer la table subscriptions
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres abonnements
CREATE POLICY "Users can read own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- ÉTAPE 3: Fonction pour créer un profil automatiquement
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un profil à chaque nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ÉTAPE 4: Nettoyer les anciennes sessions (IMPORTANT)
-- =============================================
-- ATTENTION: Cette commande supprime toutes les sessions existantes
-- car elles utilisent des host_id TEXT qui ne correspondent pas à de vrais users
-- Décommentez la ligne ci-dessous pour exécuter le nettoyage

TRUNCATE TABLE sessions CASCADE;

-- Alternative: Garder les sessions en créant un utilisateur fictif
-- et en migrant les sessions vers cet utilisateur.
-- Pour cela, vous devrez:
-- 1. Créer un compte utilisateur dans Supabase Auth (via Dashboard ou signup)
-- 2. Remplacer 'YOUR_USER_UUID_HERE' ci-dessous par l'UUID de ce compte
-- 3. Décommenter les lignes suivantes:

-- UPDATE sessions SET host_id = 'YOUR_USER_UUID_HERE' WHERE host_id IS NOT NULL;

-- =============================================
-- ÉTAPE 5: Restaurer host_id en UUID avec FK
-- =============================================
-- ATTENTION: N'exécutez cette étape QUE si:
-- - Vous avez nettoyé les anciennes sessions (TRUNCATE)
-- - OU vous avez migré les sessions vers un vrai UUID utilisateur

-- Supprimer l'ancienne colonne TEXT
ALTER TABLE sessions DROP COLUMN IF EXISTS host_id;

-- Recréer la colonne en UUID avec FK
ALTER TABLE sessions ADD COLUMN host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recréer l'index
CREATE INDEX idx_sessions_host_id_new ON sessions(host_id);

-- =============================================
-- ÉTAPE 6: Mettre à jour les politiques RLS
-- =============================================

-- Supprimer les anciennes politiques permissives
DROP POLICY IF EXISTS "Host can manage own sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read active sessions" ON sessions;
DROP POLICY IF EXISTS "Host can manage tracks in own sessions" ON tracks;
DROP POLICY IF EXISTS "Anyone can read tracks in active sessions" ON tracks;
DROP POLICY IF EXISTS "Anyone can suggest tracks" ON tracks;

-- Nouvelles politiques sécurisées pour sessions
CREATE POLICY "Host can manage own sessions"
ON sessions FOR ALL
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Anyone can read active sessions"
ON sessions FOR SELECT
USING (is_active = true);

-- Nouvelles politiques sécurisées pour tracks
CREATE POLICY "Host can manage tracks in own sessions"
ON tracks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.host_id = auth.uid()
  )
);

CREATE POLICY "Anyone can read tracks in active sessions"
ON tracks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.is_active = true
  )
);

-- Les guests peuvent suggérer des tracks (même non authentifiés)
CREATE POLICY "Anyone can suggest tracks"
ON tracks FOR INSERT
WITH CHECK (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.is_active = true
  )
);

-- =============================================
-- ÉTAPE 7: Fonction helper pour vérifier les limites
-- =============================================
CREATE OR REPLACE FUNCTION get_user_session_limit(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT subscription_tier INTO tier
  FROM profiles
  WHERE id = user_uuid;
  
  CASE tier
    WHEN 'free' THEN RETURN 1;
    WHEN 'premium' THEN RETURN 999999; -- "unlimited"
    WHEN 'pro' THEN RETURN 999999; -- "unlimited"
    ELSE RETURN 1; -- default to free
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ÉTAPE 8: Vue pour statistiques utilisateur
-- =============================================
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id as user_id,
  p.email,
  p.subscription_tier,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN s.is_active THEN s.id END) as active_sessions,
  COUNT(t.id) as total_tracks
FROM profiles p
LEFT JOIN sessions s ON s.host_id = p.id
LEFT JOIN tracks t ON t.session_id = s.id
GROUP BY p.id, p.email, p.subscription_tier;

-- =============================================
-- ÉTAPE 9: Fonction pour mettre à jour updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer aux tables avec updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- NOTES D'EXÉCUTION
-- =============================================
-- Pour exécuter cette migration:
-- 1. Allez dans Supabase Dashboard > SQL Editor
-- 2. IMPORTANT: Choisissez l'une des options suivantes:
--    Option A: Nettoyer toutes les sessions
--      - Décommentez: TRUNCATE TABLE sessions CASCADE;
--    Option B: Migrer vers un utilisateur existant
--      - Créez un compte utilisateur dans Auth
--      - Remplacez 'YOUR_USER_UUID_HERE' par son UUID
--      - Décommentez: UPDATE sessions SET host_id = '...'
-- 3. Exécutez tout le script
-- 4. Vérifiez avec: SELECT * FROM profiles; SELECT * FROM subscriptions;
