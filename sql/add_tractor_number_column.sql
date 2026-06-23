-- Add tractor_number column to inspections table
-- Required for cross-filtering BOBTAIL/Botada inspections from TPR
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tractor_number VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_inspections_tractor_number ON inspections(tractor_number);
