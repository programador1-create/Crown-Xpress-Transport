-- Add supervisor_name, supervisor_signature, and supervisor_signed_at columns to inspections table
-- These columns store the supervisor's name, signature, and signing timestamp

ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS supervisor_signature TEXT,
ADD COLUMN IF NOT EXISTS supervisor_signed_at TIMESTAMP;
