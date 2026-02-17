-- Script pour configurer correctement les politiques RLS

-- =============================================
-- 1. PROFILES - Activer RLS avec politiques permissives
-- =============================================

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;

-- Politique : Les utilisateurs authentifiés peuvent lire leur propre profil
CREATE POLICY "authenticated_users_select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Politique : Les utilisateurs authentifiés peuvent mettre à jour leur propre profil
CREATE POLICY "authenticated_users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Politique : Permettre l'insertion pour les nouveaux utilisateurs
CREATE POLICY "authenticated_users_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. SESSIONS - Vérifier et corriger les politiques
-- =============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Host can manage own sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read active sessions" ON sessions;

-- Nouvelles politiques pour sessions
CREATE POLICY "authenticated_users_manage_own_sessions"
ON sessions FOR ALL
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "anyone_can_read_active_sessions"
ON sessions FOR SELECT
USING (is_active = true);

-- =============================================
-- 3. TRACKS - Vérifier et corriger les politiques
-- =============================================

DROP POLICY IF EXISTS "Host can manage tracks in own sessions" ON tracks;
DROP POLICY IF EXISTS "Anyone can read tracks in active sessions" ON tracks;
DROP POLICY IF EXISTS "Anyone can suggest tracks" ON tracks;

-- Host peut gérer les tracks de ses propres sessions
CREATE POLICY "authenticated_users_manage_tracks_in_own_sessions"
ON tracks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.host_id = auth.uid()
  )
);

-- Tout le monde peut lire les tracks des sessions actives
CREATE POLICY "anyone_can_read_tracks_in_active_sessions"
ON tracks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.is_active = true
  )
);

-- Les guests peuvent suggérer des tracks (même non authentifiés)
CREATE POLICY "anyone_can_suggest_tracks"
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
-- 4. SUBSCRIPTIONS - Politiques RLS
-- =============================================

DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;

CREATE POLICY "authenticated_users_read_own_subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
