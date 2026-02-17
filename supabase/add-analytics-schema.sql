-- =============================================
-- ANALYTICS & HISTORIQUE - SCHEMA ENRICHMENT
-- =============================================

-- Ajouter colonnes manquantes à la table tracks pour analytics
ALTER TABLE tracks 
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- TABLE: session_stats (Statistiques de session)
-- =============================================
CREATE TABLE IF NOT EXISTS session_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  total_tracks_suggested INTEGER DEFAULT 0,
  total_tracks_approved INTEGER DEFAULT 0,
  total_tracks_rejected INTEGER DEFAULT 0,
  total_tracks_played INTEGER DEFAULT 0,
  unique_contributors INTEGER DEFAULT 0,
  avg_approval_time_seconds INTEGER,
  peak_guests INTEGER DEFAULT 0,
  session_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_session_stats_session ON session_stats(session_id);

-- =============================================
-- TABLE: session_guests (Historique des invités)
-- =============================================
CREATE TABLE IF NOT EXISTS session_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  guest_identifier VARCHAR(255), -- Pour éviter les doublons (hash ou email)
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_suggestions INTEGER DEFAULT 0
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_session_guests_session ON session_guests(session_id);
CREATE INDEX IF NOT EXISTS idx_session_guests_identifier ON session_guests(session_id, guest_identifier);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE session_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_guests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: session_stats
-- =============================================

-- L'hôte peut lire les stats de ses propres sessions
CREATE POLICY "Host can read own session stats"
ON session_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_stats.session_id
    AND sessions.host_id = auth.uid()
  )
);

-- =============================================
-- POLICIES: session_guests
-- =============================================

-- L'hôte peut lire les guests de ses propres sessions
CREATE POLICY "Host can read own session guests"
ON session_guests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_guests.session_id
    AND sessions.host_id = auth.uid()
  )
);

-- Tout le monde peut insérer un guest (pour tracking)
CREATE POLICY "Anyone can insert guest"
ON session_guests
FOR INSERT
WITH CHECK (true);

-- =============================================
-- FONCTION: Mettre à jour les stats automatiquement
-- =============================================

-- Fonction trigger pour mettre à jour session_stats
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialiser session_stats si elle n'existe pas
  INSERT INTO session_stats (session_id)
  VALUES (NEW.session_id)
  ON CONFLICT (session_id) DO NOTHING;

  -- Mettre à jour les compteurs
  UPDATE session_stats
  SET 
    total_tracks_suggested = (
      SELECT COUNT(*) FROM tracks WHERE session_id = NEW.session_id
    ),
    total_tracks_approved = (
      SELECT COUNT(*) FROM tracks WHERE session_id = NEW.session_id AND status = 'approved'
    ),
    total_tracks_rejected = (
      SELECT COUNT(*) FROM tracks WHERE session_id = NEW.session_id AND status = 'rejected'
    ),
    total_tracks_played = (
      SELECT COUNT(*) FROM tracks WHERE session_id = NEW.session_id AND status = 'played'
    ),
    unique_contributors = (
      SELECT COUNT(DISTINCT suggested_by) FROM tracks 
      WHERE session_id = NEW.session_id AND suggested_by IS NOT NULL
    ),
    updated_at = NOW()
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur INSERT/UPDATE de tracks
DROP TRIGGER IF EXISTS trigger_update_session_stats ON tracks;
CREATE TRIGGER trigger_update_session_stats
AFTER INSERT OR UPDATE ON tracks
FOR EACH ROW
EXECUTE FUNCTION update_session_stats();

-- =============================================
-- FONCTION: Calculer la durée de session
-- =============================================

CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une session se termine, calculer la durée
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE session_stats
    SET 
      session_duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - (SELECT created_at FROM sessions WHERE id = NEW.id))) / 60,
      updated_at = NOW()
    WHERE session_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur UPDATE de sessions
DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON sessions;
CREATE TRIGGER trigger_calculate_session_duration
AFTER UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION calculate_session_duration();

-- =============================================
-- NOTES
-- =============================================

-- Pour appliquer cette migration:
-- 1. Copiez ce fichier dans l'éditeur SQL de Supabase
-- 2. Exécutez-le dans votre projet
-- 3. Vérifiez que les tables sont créées avec: SELECT * FROM session_stats;
