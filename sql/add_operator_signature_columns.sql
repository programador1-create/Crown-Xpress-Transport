-- Add operator_name and operator_signature columns to inspections table
-- These columns store the operator's name and signature when they sign the inspection

ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS operator_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS operator_signature TEXT;
