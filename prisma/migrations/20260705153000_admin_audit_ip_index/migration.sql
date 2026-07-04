-- Index for cross-instance admin login rate limiting by IP hash.
CREATE INDEX "admin_auth_audit_logs_ip_hash_created_at_idx" ON "admin_auth_audit_logs"("ip_hash", "created_at");
