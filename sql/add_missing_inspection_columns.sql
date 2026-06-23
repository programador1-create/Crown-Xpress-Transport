-- Add missing columns to inspections table for Vercel database
-- This script adds all columns that the code expects but may be missing

DO $$
BEGIN
    -- Add operator_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'operator_name'
    ) THEN
        ALTER TABLE inspections ADD COLUMN operator_name VARCHAR(120);
    END IF;

    -- Add total_good if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'total_good'
    ) THEN
        ALTER TABLE inspections ADD COLUMN total_good INT DEFAULT 0;
    END IF;

    -- Add total_bad if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'total_bad'
    ) THEN
        ALTER TABLE inspections ADD COLUMN total_bad INT DEFAULT 0;
    END IF;

    -- Add total_pending if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'total_pending'
    ) THEN
        ALTER TABLE inspections ADD COLUMN total_pending INT DEFAULT 0;
    END IF;

    -- Add original_inspection_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'original_inspection_id'
    ) THEN
        ALTER TABLE inspections ADD COLUMN original_inspection_id INT REFERENCES inspections(id) ON DELETE SET NULL;
    END IF;

    -- Add reconfirmation_reason if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'reconfirmation_reason'
    ) THEN
        ALTER TABLE inspections ADD COLUMN reconfirmation_reason TEXT;
    END IF;

    -- Add is_reconfirmation if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'is_reconfirmation'
    ) THEN
        ALTER TABLE inspections ADD COLUMN is_reconfirmation BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add pdf_data if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'pdf_data'
    ) THEN
        ALTER TABLE inspections ADD COLUMN pdf_data BYTEA;
    END IF;

    -- Add pdf_size_bytes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'pdf_size_bytes'
    ) THEN
        ALTER TABLE inspections ADD COLUMN pdf_size_bytes INT;
    END IF;

    -- Add created_ip if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'created_ip'
    ) THEN
        ALTER TABLE inspections ADD COLUMN created_ip VARCHAR(64);
    END IF;

    -- Add created_user_agent if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'created_user_agent'
    ) THEN
        ALTER TABLE inspections ADD COLUMN created_user_agent TEXT;
    END IF;

    -- Add high_security_seal if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'high_security_seal'
    ) THEN
        ALTER TABLE inspections ADD COLUMN high_security_seal BOOLEAN;
    END IF;

    -- Add seal_affixed if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'seal_affixed'
    ) THEN
        ALTER TABLE inspections ADD COLUMN seal_affixed BOOLEAN;
    END IF;

    -- Add odometer if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'odometer'
    ) THEN
        ALTER TABLE inspections ADD COLUMN odometer VARCHAR(20);
    END IF;

    -- Add location_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE inspections ADD COLUMN location_id INT REFERENCES locations(id) ON DELETE SET NULL;
    END IF;

END $$;
