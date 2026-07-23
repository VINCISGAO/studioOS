-- Point Canvas music models at Mureka provider (API-backed generation).

UPDATE "ai_models"
SET
  "provider" = 'Mureka',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "generation_type" = 'MUSIC'
  AND "provider" IN ('Suno', 'suno');
