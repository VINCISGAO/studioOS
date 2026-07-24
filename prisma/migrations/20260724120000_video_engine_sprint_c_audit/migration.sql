-- Sprint C: Video Engine audit tables (ADD ONLY)

CREATE TABLE "generation_job_events" (
    "id" TEXT NOT NULL,
    "generation_job_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "from_status" "GenerationStatus",
    "to_status" "GenerationStatus",
    "progress" INTEGER,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_job_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generation_job_attempts" (
    "id" TEXT NOT NULL,
    "generation_job_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_task_id" TEXT,
    "status" TEXT NOT NULL,
    "error_code" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "generation_job_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_routing_decisions" (
    "id" TEXT NOT NULL,
    "generation_job_id" TEXT NOT NULL,
    "requested_model" TEXT NOT NULL,
    "resolved_provider" TEXT,
    "resolved_model" TEXT,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_routing_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_prompt_versions" (
    "id" TEXT NOT NULL,
    "generation_job_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "provider_prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_prompt_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "generation_job_events_generation_job_id_created_at_idx" ON "generation_job_events"("generation_job_id", "created_at");

CREATE UNIQUE INDEX "generation_job_attempts_generation_job_id_attempt_number_key" ON "generation_job_attempts"("generation_job_id", "attempt_number");

CREATE INDEX "generation_job_attempts_provider_task_id_idx" ON "generation_job_attempts"("provider_task_id");

CREATE UNIQUE INDEX "video_routing_decisions_generation_job_id_key" ON "video_routing_decisions"("generation_job_id");

CREATE UNIQUE INDEX "video_prompt_versions_generation_job_id_version_key" ON "video_prompt_versions"("generation_job_id", "version");

CREATE INDEX "generation_jobs_provider_task_id_idx" ON "generation_jobs"("provider_task_id");

ALTER TABLE "generation_job_events" ADD CONSTRAINT "generation_job_events_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generation_job_attempts" ADD CONSTRAINT "generation_job_attempts_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_routing_decisions" ADD CONSTRAINT "video_routing_decisions_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_prompt_versions" ADD CONSTRAINT "video_prompt_versions_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
