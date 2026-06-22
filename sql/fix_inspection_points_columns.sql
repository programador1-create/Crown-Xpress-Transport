-- Fix inspection_points table to match actual database structure
-- Add photo column if it doesn't exist, or rename has_photo to photo

DO $$
BEGIN
    -- Check if photo column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspection_points' AND column_name = 'photo'
    ) THEN
        -- If has_photo exists, rename it to photo
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'inspection_points' AND column_name = 'has_photo'
        ) THEN
            ALTER TABLE inspection_points RENAME COLUMN has_photo TO photo;
            RAISE NOTICE 'Renamed has_photo to photo in inspection_points';
        ELSE
            -- If neither exists, add photo column
            ALTER TABLE inspection_points ADD COLUMN photo TEXT;
            RAISE NOTICE 'Added photo column to inspection_points';
        END IF;
    END IF;

    -- Check if point_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspection_points' AND column_name = 'point_id'
    ) THEN
        -- If point_number exists, rename it to point_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'inspection_points' AND column_name = 'point_number'
        ) THEN
            ALTER TABLE inspection_points RENAME COLUMN point_number TO point_id;
            RAISE NOTICE 'Renamed point_number to point_id in inspection_points';
        ELSE
            -- If neither exists, add point_id column
            ALTER TABLE inspection_points ADD COLUMN point_id INT;
            RAISE NOTICE 'Added point_id column to inspection_points';
        END IF;
    END IF;
END $$;
