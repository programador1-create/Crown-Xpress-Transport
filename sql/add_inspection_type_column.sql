-- Add inspection_type column to inspections table
-- Values: LOADED, EMPTY, BOBTAIL, FLATBED
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_type VARCHAR(20) DEFAULT 'LOADED';
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(inspection_type);
