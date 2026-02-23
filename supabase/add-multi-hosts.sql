-- =============================================
-- MULTI-HÔTES / CO-MODÉRATION (PRO)
-- =============================================

-- =============================================
-- TABLE: session_hosts (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS session_hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'moderator' CHECK (role IN ('owner', 'moderator')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(session_id, user_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_session_hosts_session ON session_hosts(session_id);
CREATE INDEX IF NOT EXISTS idx_session_hosts_user ON session_hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_session_hosts_composite ON session_hosts(session_id, user_id);

-- =============================================
-- MIGRATION DES DONNÉES EXISTANTES
-- =============================================
-- Migrer les hosts existants de sessions.host_id vers session_hosts
INSERT INTO session_hosts (session_id, user_id, role, added_by)
SELECT id, host_id, 'owner', host_id
FROM sessions
WHERE NOT EXISTS (
  SELECT 1 FROM session_hosts 
  WHERE session_id = sessions.id 
  AND user_id = sessions.host_id
)
ON CONFLICT (session_id, user_id) DO NOTHING;

-- =============================================
-- FONCTIONS HELPER (pour éviter récursion RLS)
-- =============================================

-- Fonction pour vérifier si un utilisateur est host d'une session
-- SECURITY DEFINER permet de contourner RLS lors de la vérification
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

-- Fonction pour vérifier si un utilisateur est owner d'une session
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

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Activer RLS sur la nouvelle table
ALTER TABLE session_hosts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: session_hosts
-- =============================================

-- Les hosts (owner + moderators) peuvent lire les co-hosts de leurs sessions
CREATE POLICY "Hosts can read session hosts"
ON session_hosts
FOR SELECT
USING (
  is_user_session_host(session_id, auth.uid())
);

-- Seulement les owners peuvent ajouter des co-hosts
CREATE POLICY "Owners can add co-hosts"
ON session_hosts
FOR INSERT
WITH CHECK (
  is_user_session_owner(session_id, auth.uid())
);

-- Seulement les owners peuvent retirer des co-hosts (pas eux-mêmes)
CREATE POLICY "Owners can remove co-hosts"
ON session_hosts
FOR DELETE
USING (
  role = 'moderator' AND
  is_user_session_owner(session_id, auth.uid())
);

-- =============================================
-- MISE À JOUR POLICIES EXISTANTES
-- =============================================

-- Remplacer la policy existante pour permettre aux co-hosts de gérer les tracks
DROP POLICY IF EXISTS "Host can manage tracks in own sessions" ON tracks;

CREATE POLICY "Hosts and co-hosts can manage tracks"
ON tracks
FOR ALL
USING (
  is_user_session_host(session_id, auth.uid())
);

-- Remplacer la policy existante pour les sessions
DROP POLICY IF EXISTS "Host can manage own sessions" ON sessions;

CREATE POLICY "Hosts and co-hosts can read their sessions"
ON sessions
FOR SELECT
USING (
  is_user_session_host(id, auth.uid())
);

-- Seulement les owners peuvent UPDATE les sessions (nom, terminer)
CREATE POLICY "Owners can update sessions"
ON sessions
FOR UPDATE
USING (
  is_user_session_owner(id, auth.uid())
);

-- Seulement les owners peuvent DELETE les sessions
CREATE POLICY "Owners can delete sessions"
ON sessions
FOR DELETE
USING (
  is_user_session_owner(id, auth.uid())
);

-- Les utilisateurs authentifiés peuvent INSERT des sessions (création)
CREATE POLICY "Authenticated users can create sessions"
ON sessions
FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- =============================================
-- FONCTION: Obtenir le rôle d'un utilisateur dans une session
-- =============================================

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

-- =============================================
-- FONCTION: Vérifier si un utilisateur est owner
-- =============================================

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

-- =============================================
-- TRIGGER: Créer automatiquement l'owner dans session_hosts
-- =============================================

CREATE OR REPLACE FUNCTION auto_create_session_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insérer automatiquement le créateur comme 'owner' dans session_hosts
  INSERT INTO session_hosts (session_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.host_id, 'owner', NEW.host_id)
  ON CONFLICT (session_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_session_owner ON sessions;
CREATE TRIGGER trigger_auto_create_session_owner
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION auto_create_session_owner();

-- =============================================
-- VUE: Sessions avec informations sur les co-hosts
-- =============================================

CREATE OR REPLACE VIEW sessions_with_cohosts AS
SELECT 
  s.id,
  s.host_id,
  s.name,
  s.created_at,
  s.is_active,
  s.ended_at,
  COUNT(CASE WHEN sh.role = 'moderator' THEN 1 END) as moderator_count,
  COUNT(sh.id) as total_hosts
FROM sessions s
LEFT JOIN session_hosts sh ON s.id = sh.session_id
GROUP BY s.id, s.host_id, s.name, s.created_at, s.is_active, s.ended_at;

-- =============================================
-- NOTES
-- =============================================

-- Pour appliquer cette migration:
-- 1. Copiez ce fichier dans l'éditeur SQL de Supabase
-- 2. Exécutez-le dans votre projet
-- 3. Vérifiez que la table est créée avec: SELECT * FROM session_hosts;
-- 4. Vérifiez que les données existantes ont été migrées

-- Pour tester:
-- SELECT * FROM session_hosts WHERE session_id = 'votre-session-id';
-- SELECT get_user_session_role('session-id', 'user-id');
-- SELECT is_session_owner('session-id', 'user-id');
