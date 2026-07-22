-- Canvas AI model capabilities + generation job model snapshot

ALTER TABLE "ai_models"
  ADD COLUMN IF NOT EXISTS "publicly_available" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "supported_modes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "supported_aspect_ratios" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "supported_durations" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN IF NOT EXISTS "supported_resolutions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "max_output_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "max_reference_images" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "supports_first_frame" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_last_frame" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_audio_input" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_prompt_enhancement" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_seed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_negative_prompt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_instrumental" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_vocal" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_lyrics" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "supports_style_tags" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "min_duration_sec" INTEGER,
  ADD COLUMN IF NOT EXISTS "max_duration_sec" INTEGER;

ALTER TABLE "generation_jobs"
  ADD COLUMN IF NOT EXISTS "ai_model_id" TEXT,
  ADD COLUMN IF NOT EXISTS "model_display_name" TEXT;

CREATE INDEX IF NOT EXISTS "generation_jobs_ai_model_id_idx" ON "generation_jobs"("ai_model_id");

ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_ai_model_id_fkey"
  FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "ai_models" SET
  "publicly_available" = true,
  "supported_modes" = ARRAY['TEXT_TO_VIDEO','IMAGE_TO_VIDEO'],
  "supported_aspect_ratios" = ARRAY['auto','16:9','4:3','1:1','3:4','9:16','21:9'],
  "supported_durations" = ARRAY[5,10,15,20],
  "supported_resolutions" = ARRAY['480p','720p','1080p','4k'],
  "max_output_count" = 1,
  "max_reference_images" = 4,
  "supports_first_frame" = true,
  "supports_last_frame" = true,
  "supports_audio_input" = true,
  "min_duration_sec" = 3,
  "max_duration_sec" = 20
WHERE "category" = 'VIDEO';

UPDATE "ai_models" SET
  "publicly_available" = true,
  "supported_modes" = ARRAY['TEXT_TO_IMAGE','IMAGE_TO_IMAGE'],
  "supported_aspect_ratios" = ARRAY['1:1','3:2','2:3','4:3','3:4','9:16','auto'],
  "supported_resolutions" = ARRAY['1024','1536','2048'],
  "max_output_count" = 4,
  "max_reference_images" = 1,
  "supports_prompt_enhancement" = true,
  "supports_negative_prompt" = true
WHERE "category" = 'IMAGE';

UPDATE "ai_models" SET
  "publicly_available" = true,
  "supported_modes" = ARRAY['SIMPLE','CUSTOM','SOUNDTRACK'],
  "supported_durations" = ARRAY[30,60,120],
  "max_output_count" = 1,
  "supports_instrumental" = true,
  "supports_vocal" = true,
  "supports_lyrics" = true,
  "supports_style_tags" = true,
  "min_duration_sec" = 10,
  "max_duration_sec" = 180
WHERE "category" = 'MUSIC';
