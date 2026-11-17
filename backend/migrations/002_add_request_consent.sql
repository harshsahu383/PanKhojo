-- Existing requests are not marked as consented retroactively.
ALTER TABLE service_requests
  ADD COLUMN privacy_consent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN terms_consent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN privacy_policy_version VARCHAR(50) NULL,
  ADD COLUMN terms_version VARCHAR(50) NULL,
  ADD COLUMN consented_at DATETIME(3) NULL;
