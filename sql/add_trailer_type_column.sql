-- Add trailer_type column to inspections table (BOX, CONTAINER, FLATBED, RABON, OTHER)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS trailer_type VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_inspections_trailer_type ON inspections(trailer_type);
