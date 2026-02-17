-- =============================================
-- FIX: Erreur de politique RLS sur session_stats
-- =============================================
-- Problème: Les triggers ne peuvent pas insérer dans session_stats
-- car les politiques RLS bloquent les insertions des guests
-- Solution: Utiliser SECURITY DEFINER pour exécuter avec les privilèges du propriétaire

-- Fonction trigger pour mettre à jour session_stats
-- SECURITY DEFINER permet d'exécuter avec les privilèges du propriétaire
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Fonction pour calculer la durée de session
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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

-- =============================================
-- INSTRUCTIONS
-- =============================================
-- 1. Connectez-vous à votre tableau de bord Supabase
-- 2. Allez dans SQL Editor
-- 3. Copiez et exécutez ce script
-- 4. Testez en suggérant un morceau en tant que guest
