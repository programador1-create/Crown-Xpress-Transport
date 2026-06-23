-- Add supervisor_name column to inspections table
-- This column stores the supervisor's name (supervisor_signature and supervisor_signed_at already exist)

ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(255);
