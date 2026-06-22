-- Rename point_id to point_number in inspection_points table
-- This aligns the database with the schema definition

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspection_points' AND column_name = 'point_id'
    ) THEN
        ALTER TABLE inspection_points RENAME COLUMN point_id TO point_number;
        RAISE NOTICE 'Renamed column point_id to point_number in inspection_points';
    ELSE
        RAISE NOTICE 'Column point_id does not exist, skipping rename';
    END IF;
END $$;
