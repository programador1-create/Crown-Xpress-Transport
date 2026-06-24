-- Add operator_signed_at column to inspections table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inspections' 
        AND column_name = 'operator_signed_at'
    ) THEN
        ALTER TABLE inspections 
        ADD COLUMN operator_signed_at TIMESTAMP;
        RAISE NOTICE 'Column operator_signed_at added successfully';
    ELSE
        RAISE NOTICE 'Column operator_signed_at already exists';
    END IF;
END $$;
