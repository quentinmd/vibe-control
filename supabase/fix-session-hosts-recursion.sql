-- =============================================
-- FIX: Récursion infinie dans les policies session_hosts
-- =============================================
-- À exécuter SEULEMENT si vous avez déjà appliqué add-multi-hosts.sql
-- et que vous rencontrez l'erreur "infinite recursion detected"

-- 1. Supprimer les anciennes policies qui causent la récursion
DROP POLICY IF EXISTS "Hosts can read session hosts" ON session_hosts;
DROP POLICY IF EXISTS "Owners can add co-hosts" ON session_hosts;
DROP POLICY IF EXISTS "Owners can remove co-hosts" ON session_hosts;
DROP POLICY IF EXISTS "Hosts and co-hosts can manage tracks" ON tracks;
DROP POLICY IF EXISTS "Hosts and co-hosts can read their sessions" ON sessions;
DROP POLICY IF EXISTS "Owners can update sessions" ON sessions;
DROP POLICY IF EXISTS "Owners can delete sessions" ON sessions;

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

CREATE POLICY "Hosts and co-hosts can read their sessions"
ON sessions
FOR SELECT
USING (
  is_user_session_host(id, auth.uid())
);

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

-- Migration complète !
-- Testez maintenant : la récursion infinie devrait être résolue
