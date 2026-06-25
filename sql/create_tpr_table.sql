-- Crear tabla tpr en Neon para sincronizacion desde SQL Server NBCW
-- Esta tabla sera consultada por /api/tpr-v2.js

CREATE TABLE IF NOT EXISTS tpr (
  id SERIAL PRIMARY KEY,
  driver_code VARCHAR(50),
  work_order VARCHAR(50),
  bill_of_lading VARCHAR(50),
  fecha_raw VARCHAR(12),
  date DATE,
  from_code VARCHAR(50),
  from_city VARCHAR(100),
  from_state VARCHAR(50),
  to_code VARCHAR(50),
  to_city VARCHAR(100),
  to_state VARCHAR(50),
  movement_type VARCHAR(50),
  status VARCHAR(50),
  equipment_type VARCHAR(50),
  equipment_code VARCHAR(100),
  deldate_raw VARCHAR(12),
  delivery_date DATE,
  customer VARCHAR(100),
  arrival_time VARCHAR(20),
  departure_time VARCHAR(20),
  operator VARCHAR(50),
  truck_id VARCHAR(50),
  seal VARCHAR(50),
  instructions_1 TEXT,
  instructions_2 TEXT,
  amount VARCHAR(10),
  table_code VARCHAR(50),
  trx_code VARCHAR(50),
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices para consultas rapidas
CREATE INDEX IF NOT EXISTS idx_tpr_from_code ON tpr(from_code);
CREATE INDEX IF NOT EXISTS idx_tpr_status ON tpr(status);
CREATE INDEX IF NOT EXISTS idx_tpr_equipment_type ON tpr(equipment_type);
CREATE INDEX IF NOT EXISTS idx_tpr_date ON tpr(date);
CREATE INDEX IF NOT EXISTS idx_tpr_work_order ON tpr(work_order);
CREATE INDEX IF NOT EXISTS idx_tpr_bill_of_lading ON tpr(bill_of_lading);
CREATE INDEX IF NOT EXISTS idx_tpr_truck_id ON tpr(truck_id);
CREATE INDEX IF NOT EXISTS idx_tpr_synced_at ON tpr(synced_at);
