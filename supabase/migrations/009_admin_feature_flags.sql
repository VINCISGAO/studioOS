-- Sprint 15: Feature flags seed (idempotent)
-- Rate limits and monitoring toggles live in DB metadata, not env hard-codes.

INSERT INTO feature_flags (id, key, enabled, metadata, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'security.api_rate_limit',
    true,
    '{"windowMs":60000,"maxRequests":120,"routes":{"/api/v1/auth/login":{"maxRequests":20,"windowMs":60000},"/api/v1/webhooks/stripe":{"maxRequests":200,"windowMs":60000}}}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'monitoring.sentry',
    false,
    '{"sampleRate":0.1,"tracesSampleRate":0.05}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'review.watermark_overlay',
    true,
    '{}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (key) DO NOTHING;
