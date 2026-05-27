-- Create employees table for user management
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- In production, use bcrypt hashes
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('guard', 'inspector', 'auditor', 'admin')),
  location_id INTEGER,
  location_name VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);

-- Insert default admin user (password: admin)
INSERT INTO employees (username, password_hash, full_name, role, location_id, location_name)
VALUES ('admin', 'admin', 'Admin Crown', 'admin', 1, 'Yard A - Laredo')
ON CONFLICT (username) DO NOTHING;

-- Insert sample users
INSERT INTO employees (username, password_hash, full_name, role, location_id, location_name) VALUES
  ('guardia01', '1234', 'Carlos Mendoza', 'guard', 1, 'Yard A - Laredo'),
  ('guardia02', '1234', 'Luis Hernandez', 'guard', 1, 'Yard A - Laredo'),
  ('guardia03', '1234', 'Miguel Torres', 'guard', 2, 'Yard B - El Paso'),
  ('guardia04', '1234', 'Pedro Ramirez', 'guard', 2, 'Yard B - El Paso'),
  ('guardia05', '1234', 'Juan Lopez', 'guard', 3, 'Yard C - Dallas'),
  ('inspector01', '1234', 'Alberto Vargas', 'inspector', 1, 'Yard A - Laredo'),
  ('inspector02', '1234', 'Daniel Castro', 'inspector', 2, 'Yard B - El Paso'),
  ('auditor01', '1234', 'Roberto Sanchez', 'auditor', 1, 'Yard A - Laredo'),
  ('auditor02', '1234', 'Guillermo Ortiz', 'auditor', 1, 'Yard A - Laredo')
ON CONFLICT (username) DO NOTHING;
