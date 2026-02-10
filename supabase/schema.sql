-- =============================================
-- VIBE CONTROL - SUPABASE DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: sessions
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Ma Session',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_sessions_host_id ON sessions(host_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);

-- =============================================
-- TABLE: tracks (suggestions musicales)
-- =============================================
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  artist VARCHAR(500) NOT NULL,
  album VARCHAR(500),
  cover_url TEXT,
  spotify_id VARCHAR(255),
  suggested_by VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'played')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER,
  played_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_tracks_session_id ON tracks(session_id);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_session_status ON tracks(session_id, status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Activer RLS sur les tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: sessions
-- =============================================

-- L'hôte peut tout faire sur ses propres sessions
CREATE POLICY "Host can manage own sessions"
ON sessions
FOR ALL
USING (auth.uid() = host_id);

-- Tout le monde peut lire les sessions actives (pour les guests)
CREATE POLICY "Anyone can read active sessions"
ON sessions
FOR SELECT
USING (is_active = true);

-- =============================================
-- POLICIES: tracks
-- =============================================

-- L'hôte peut tout faire sur les tracks de ses sessions
CREATE POLICY "Host can manage tracks in own sessions"
ON tracks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = tracks.session_id
    AND sessions.host_id = auth.uid()
  )
);

-- Les guests peuvent lire les tracks des sessions actives
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

-- Les guests peuvent INSERT des suggestions (même non authentifiés)
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

-- =============================================
-- FONCTION: Auto-increment order_index
-- =============================================
CREATE OR REPLACE FUNCTION set_order_index()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.order_index IS NULL THEN
    SELECT COALESCE(MAX(order_index), 0) + 1
    INTO NEW.order_index
    FROM tracks
    WHERE session_id = NEW.session_id
    AND status = 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-incrementer order_index
CREATE TRIGGER trigger_set_order_index
BEFORE INSERT OR UPDATE ON tracks
FOR EACH ROW
EXECUTE FUNCTION set_order_index();

-- =============================================
-- REALTIME: Activer les notifications
-- =============================================
-- Méthode 1 (RECOMMANDÉE) : Via SQL
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;

-- =============================================
-- REALTIME: Activer les notifications
-- =============================================
-- Cette commande active Realtime pour la table tracks
-- Les clients pourront écouter les changements en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;

-- Alternative via Dashboard :
-- Database > Tables > tracks > Toggle "Enable Realtime"

-- =============================================
-- DONNÉES DE TEST (Optionnel)
-- =============================================
-- Décommentez pour insérer des données de test
/*
INSERT INTO sessions (host_id, name) VALUES
('YOUR_USER_UUID', 'Session Test');

INSERT INTO tracks (session_id, title, artist, status) VALUES
('SESSION_UUID', 'Blinding Lights', 'The Weeknd', 'pending'),
('SESSION_UUID', 'Levitating', 'Dua Lipa', 'approved');
*/
