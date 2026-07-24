-- Seedance video generation supports at most 15 seconds (see seedance-video-request + validation).

UPDATE "ai_models" SET
  "supported_durations" = ARRAY[5,10,15],
  "max_duration_sec" = 15
WHERE "category" = 'VIDEO';
