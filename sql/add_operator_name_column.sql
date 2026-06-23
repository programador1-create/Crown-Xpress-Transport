-- Add operator_name column to inspections table if it doesn't exist
-- This fixes the database schema mismatch with the deployed Vercel database

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'operator_name'
    ) THEN
        ALTER TABLE inspections ADD COLUMN operator_name VARCHAR(120);
    END IF;
END $$;
