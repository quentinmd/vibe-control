-- =============================================
-- MIGRATION: Spotify OAuth pour hôtes payants
-- =============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_user_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_spotify_user_id
ON profiles(spotify_user_id)
WHERE spotify_user_id IS NOT NULL;
