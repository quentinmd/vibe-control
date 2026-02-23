-- =============================================
-- FIX: Récursion infinie dans les policies session_hosts
-- =============================================
-- À exécuter SEULEMENT si vous avez déjà appliqué add-multi-hosts.sql
-- et que vous rencontrez l'erreur "infinite recursion detected"
-- ou "Session non trouvée" pour les guests

-- PROBLÈMES CORRIGÉS:
-- 1. Récursion infinie dans les policies RLS de session_hosts
-- 2. Accès bloqué pour les guests (pages /guest/[sessionId])
-- 3. Impossibilité de suggérer des morceaux (erreur 406)

-- 1. Supprimer les anciennes policies qui causent la récursion
DROP POLICY IF EXISTS "Hosts can read session hosts" ON session_hosts;
DROP POLICY IF EXISTS "Owners can add co-hosts" ON session_hosts;
DROP POLICY IF EXISTS "Owners can remove co-hosts" ON session_hosts;
DROP POLICY IF EXISTS "Hosts and co-hosts can manage tracks" ON tracks;
DROP POLICY IF EXISTS "Hosts and co-hosts can read their sessions" ON sessions;
DROP POLICY IF EXISTS "Owners can update sessions" ON sessions;
DROP POLICY IF EXISTS "Owners can delete sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read active sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read tracks in active sessions" ON tracks;
DROP POLICY IF EXISTS "Anyone can suggest tracks" ON tracks;

-- 2. Créer les fonctions helper avec SECURITY DEFINER (contournent RLS)
CREATE OR REPLACE FUNCTION is_user_session_host(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM session_hosts
    WHERE session_id = p_session_id
    AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_user_session_owner(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM session_hosts
    WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND role = 'owner'
  );
$$;

-- 3. Recréer les policies en utilisant les fonctions helper
CREATE POLICY "Hosts can read session hosts"
ON session_hosts
FOR SELECT
USING (
  is_user_session_host(session_id, auth.uid())
);

CREATE POLICY "Owners can add co-hosts"
ON session_hosts
FOR INSERT
WITH CHECK (
  is_user_session_owner(session_id, auth.uid())
);

CREATE POLICY "Owners can remove co-hosts"
ON session_hosts
FOR DELETE
USING (
  role = 'moderator' AND
  is_user_session_owner(session_id, auth.uid())
);

CREATE POLICY "Hosts and co-hosts can manage tracks"
ON tracks
FOR ALL
USING (
  is_user_session_host(session_id, auth.uid())
);

-- Permettre à tout le monde de lire les tracks des sessions actives
CREATE POLICY "Anyone can read tracks in active sessions"
ON tracks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.is_active = true
  )
);

-- Permettre à tout le monde de suggérer des tracks (INSERT uniquement en status pending)
CREATE POLICY "Anyone can suggest tracks"
ON tracks
FOR INSERT
WITH CHECK (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.is_active = true
  )
);

CREATE POLICY "Hosts and co-hosts can read their sessions"
ON sessions
FOR SELECT
USING (
  is_user_session_host(id, auth.uid())
);

-- Permettre à tout le monde de lire les sessions actives (pour les guests)
CREATE POLICY "Anyone can read active sessions"
ON sessions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Owners can update sessions"
ON sessions
FOR UPDATE
USING (
  is_user_session_owner(id, auth.uid())
);

CREATE POLICY "Owners can delete sessions"
ON sessions
FOR DELETE
USING (
  is_user_session_owner(id, auth.uid())
);

-- 4. Vérifier que les fonctions existantes ont aussi SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_user_session_role(p_session_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM session_hosts
  WHERE session_id = p_session_id
  AND user_id = p_user_id;
  
  RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION is_session_owner(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_hosts
    WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND role = 'owner'
  );
END;
$$;

CREATE OR REPLACE FUNCTION auto_create_session_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO session_hosts (session_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.host_id, 'owner', NEW.host_id)
  ON CONFLICT (session_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- =============================================
-- ✅ MIGRATION COMPLÈTE
-- =============================================
-- 
-- Corrections appliquées:
-- ✅ Récursion infinie dans les policies RLS (fonctions SECURITY DEFINER)
-- ✅ Accès public restauré pour les sessions actives (guests)
-- ✅ Permissions de lecture des tracks pour les guests
-- ✅ Permissions d'insertion de suggestions pour les guests
--
-- Testez maintenant:
-- 1. Créer une session en tant que host
-- 2. Accéder à /guest/[sessionId] en tant que non-authentifié
-- 3. Suggérer un morceau
-- 4. Vérifier que la suggestion apparaît dans le dashboard host

