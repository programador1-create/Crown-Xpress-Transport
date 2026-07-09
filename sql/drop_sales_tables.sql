-- ============================================================
-- Crown Xpress Transport - Drop Sales Module Tables
-- ============================================================

-- Drop quote lanes first (has foreign key to quotes)
DROP TABLE IF EXISTS quote_lanes CASCADE;

-- Drop accessorial templates
DROP TABLE IF EXISTS accessorial_templates CASCADE;

-- Drop credit applications
DROP TABLE IF EXISTS credit_applications CASCADE;

-- Drop quotes (main table)
DROP TABLE IF EXISTS quotes CASCADE;

-- Note: Indexes are automatically dropped when tables are dropped with CASCADE
