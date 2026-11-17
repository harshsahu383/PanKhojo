-- Run once against pankhojo_db before starting the updated API.
-- Existing customer records remain unchanged; new requests store only encrypted Aadhaar.
ALTER TABLE service_requests
  ADD COLUMN aadhaar_encrypted TEXT NULL,
  ADD COLUMN aadhaar_last4 CHAR(4) NULL;
