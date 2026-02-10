-- =============================================
-- FIX : Changer host_id de UUID vers TEXT
-- =============================================
-- Le problème : host_id est de type UUID mais on insère des strings

-- 1. SUPPRIMER la contrainte de clé étrangère (si elle existe)
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS sessions_host_id_fkey;

-- 2. CHANGER le type de la colonne host_id
ALTER TABLE sessions 
ALTER COLUMN host_id TYPE TEXT;

-- 3. Vérifier le changement
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'host_id';

-- Résultat attendu :
-- column_name | data_type
-- host_id     | text

-- =============================================
-- Note : Après cette modification, vous pourrez utiliser
-- n'importe quelle string comme host_id (pas seulement des UUID)
-- =============================================
