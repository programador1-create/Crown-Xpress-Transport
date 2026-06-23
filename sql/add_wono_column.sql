-- Add wono column to inspections table (work order number from TPR)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS wono VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_inspections_wono ON inspections(wono);
