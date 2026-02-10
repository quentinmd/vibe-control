-- =============================================
-- MISE À JOUR RLS : VERSION SANS AUTH
-- =============================================
-- Exécutez ces commandes dans le SQL Editor de Supabase
-- pour adapter les politiques de sécurité à la version sans auth

-- 1. SUPPRIMER les anciennes politiques
DROP POLICY IF EXISTS "Host can manage own sessions" ON sessions;
DROP POLICY IF EXISTS "Host can manage tracks in own sessions" ON tracks;

-- 2. CRÉER des politiques plus permissives pour le MVP

-- Sessions : Tout le monde peut gérer ses sessions (basé sur host_id string)
CREATE POLICY "Anyone can manage sessions"
ON sessions
FOR ALL
USING (true);

-- Tracks : Tout le monde peut gérer les tracks
CREATE POLICY "Anyone can manage tracks"
ON tracks
FOR ALL
USING (true);

-- Note: Ces politiques sont TRÈS permissives et adaptées au MVP uniquement
-- En production, vous devriez réactiver l'auth Supabase et utiliser les vraies politiques

-- =============================================
-- VÉRIFICATION
-- =============================================
-- Pour vérifier que les politiques sont bien créées :
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('sessions', 'tracks');
