-- =====================================================
-- CROWN XPRESS TRANSPORT - SETUP COMPLETO NUEVA CUENTA NEON
-- Ejecutar todo este script en el SQL Editor de Neon
-- =====================================================

-- =====================================================
-- EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA LOCATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL UNIQUE,
    address         VARCHAR(255),
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO locations (id, name, active) VALUES
(1, 'Yard A - Laredo', true),
(2, 'Yard B - El Paso', true),
(3, 'Yard C - Dallas', true),
(4, 'Yard D - Houston', true),
(5, 'Yard E - San Antonio', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLA EMPLOYEES (USUARIOS)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(60)  UNIQUE,
    password_hash   VARCHAR(255),
    password        VARCHAR(255),
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(120),
    role            VARCHAR(20)  NOT NULL DEFAULT 'operator'
                    CHECK (role IN ('operator','guard','inspector','auditor','admin','supervisor')),
    location_id     INT REFERENCES locations(id) ON DELETE SET NULL,
    location_name   VARCHAR(120),
    active          BOOLEAN DEFAULT TRUE,
    profile_photo   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);

-- =====================================================
-- TABLA OPERATORS
-- =====================================================
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50),
    license_expiry DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operators_employee_number ON operators(employee_number);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);

-- =====================================================
-- TABLA YARDS
-- =====================================================
CREATE TABLE IF NOT EXISTS yards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PHYSICAL', 'VIRTUAL')),
  description TEXT,
  address TEXT,
  max_trailers INTEGER DEFAULT 0,
  max_trucks INTEGER DEFAULT 0,
  max_boxes INTEGER DEFAULT 0,
  max_platforms INTEGER DEFAULT 0,
  max_machinery INTEGER DEFAULT 0,
  min_trailers INTEGER DEFAULT 0,
  min_trucks INTEGER DEFAULT 0,
  min_boxes INTEGER DEFAULT 0,
  min_platforms INTEGER DEFAULT 0,
  min_machinery INTEGER DEFAULT 0,
  current_trailers INTEGER DEFAULT 0,
  current_trucks INTEGER DEFAULT 0,
  current_boxes INTEGER DEFAULT 0,
  current_platforms INTEGER DEFAULT 0,
  current_machinery INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO yards (name, code, type, description, max_trailers, max_trucks, max_boxes, max_platforms, min_trailers, min_trucks, min_boxes, min_platforms) VALUES
('Yard A - Laredo', 'YDA', 'PHYSICAL', 'Main yard in Laredo, TX', 50, 30, 100, 20, 10, 5, 20, 5),
('Yard B - El Paso', 'YDB', 'PHYSICAL', 'Secondary yard in El Paso, TX', 30, 20, 60, 15, 5, 3, 12, 3),
('Yard C - Dallas', 'YDC', 'PHYSICAL', 'Yard in Dallas, TX', 40, 25, 80, 18, 8, 4, 16, 4),
('Yard D - Houston', 'YDH', 'PHYSICAL', 'Yard in Houston, TX', 35, 22, 70, 16, 6, 3, 14, 3),
('Yard E - San Antonio', 'YDS', 'PHYSICAL', 'Yard in San Antonio, TX', 25, 15, 50, 12, 4, 2, 10, 2),
('Virtual Yard 1', 'VY1', 'VIRTUAL', 'Virtual yard for overflow management', 100, 60, 200, 40, 20, 10, 40, 8),
('Virtual Yard 2', 'VY2', 'VIRTUAL', 'Virtual yard for peak hours', 80, 50, 160, 32, 16, 8, 32, 6)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- TABLA YARD ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS yard_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  yard_id INTEGER NOT NULL REFERENCES yards(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(employee_id, yard_id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yards_type ON yards(type);
CREATE INDEX IF NOT EXISTS idx_yards_active ON yards(is_active);
CREATE INDEX IF NOT EXISTS idx_yard_assignments_employee ON yard_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_yard_assignments_yard ON yard_assignments(yard_id);
CREATE INDEX IF NOT EXISTS idx_yard_assignments_active ON yard_assignments(is_active);

-- =====================================================
-- TABLA INSPECTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS inspections (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT gen_random_uuid() UNIQUE,
    trailer_number      VARCHAR(50),
    seal_number         VARCHAR(50),
    lock_number         VARCHAR(50),
    driver_name         VARCHAR(120),
    odometer            VARCHAR(20),
    location            VARCHAR(120),
    location_id         INT REFERENCES locations(id) ON DELETE SET NULL,
    inspection_date     TIMESTAMPTZ,
    original_inspection_id  INT REFERENCES inspections(id) ON DELETE SET NULL,
    reconfirmation_reason   TEXT,
    is_reconfirmation       BOOLEAN DEFAULT FALSE,
    high_security_seal  BOOLEAN,
    seal_affixed        BOOLEAN,
    language            VARCHAR(2)  DEFAULT 'es',
    operator_id         INT REFERENCES employees(id) ON DELETE SET NULL,
    operator_name       VARCHAR(120),
    operator_signature  TEXT,
    operator_signed_at  TIMESTAMPTZ,
    guard_id            INT REFERENCES employees(id) ON DELETE SET NULL,
    guard_name          VARCHAR(120),
    guard_signature     TEXT,
    guard_signed_at     TIMESTAMPTZ,
    supervisor_name     VARCHAR(120),
    supervisor_signature TEXT,
    supervisor_signed_at TIMESTAMPTZ,
    auditor_id          INT REFERENCES employees(id) ON DELETE SET NULL,
    auditor_name        VARCHAR(120),
    auditor_signed_at   TIMESTAMPTZ,
    status              VARCHAR(20) DEFAULT 'completed'
                        CHECK (status IN ('draft','completed','audited','rejected','reconfirmed','superseded')),
    total_good          INT DEFAULT 0,
    total_bad           INT DEFAULT 0,
    total_pending       INT DEFAULT 0,
    pdf_filename        VARCHAR(200),
    pdf_data            BYTEA,
    pdf_size_bytes      INT,
    created_ip          VARCHAR(64),
    created_user_agent  TEXT,
    equipment_nomenclature VARCHAR(100),
    tractor_number      VARCHAR(50),
    container_number    VARCHAR(50),
    customer_prefix     VARCHAR(20),
    crown_fleet         VARCHAR(50),
    inspection_type     VARCHAR(20) DEFAULT 'LOADED',
    trailer_type        VARCHAR(50),
    wono                VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_created_at  ON inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_trailer     ON inspections(trailer_number);
CREATE INDEX IF NOT EXISTS idx_inspections_status      ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_uuid        ON inspections(inspection_uuid);
CREATE INDEX IF NOT EXISTS idx_inspections_guard       ON inspections(guard_id);
CREATE INDEX IF NOT EXISTS idx_inspections_location    ON inspections(location_id);
CREATE INDEX IF NOT EXISTS idx_inspections_original    ON inspections(original_inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspections_wono        ON inspections(wono);
CREATE INDEX IF NOT EXISTS idx_inspections_tractor     ON inspections(tractor_number);

-- =====================================================
-- TABLA INSPECTION POINTS
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_points (
    id              SERIAL PRIMARY KEY,
    inspection_id   INT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    point_id        INT NOT NULL CHECK (point_id BETWEEN 1 AND 20),
    status          VARCHAR(10) CHECK (status IN ('good','bad')),
    issue_id        INT,
    issue_text      VARCHAR(500),
    has_photo       BOOLEAN DEFAULT FALSE,
    photo           TEXT,
    UNIQUE(inspection_id, point_id)
);

CREATE INDEX IF NOT EXISTS idx_points_inspection ON inspection_points(inspection_id);

-- =====================================================
-- TABLA AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id              SERIAL PRIMARY KEY,
    inspection_id   INT REFERENCES inspections(id) ON DELETE CASCADE,
    user_id         INT REFERENCES employees(id) ON DELETE SET NULL,
    user_name       VARCHAR(120),
    role            VARCHAR(20),
    action          VARCHAR(50) NOT NULL,
    details         JSONB,
    ip_address      VARCHAR(64),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_inspection ON audit_log(inspection_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created    ON audit_log(created_at DESC);

-- =====================================================
-- TABLA TPR (sincronizada desde SQL Server)
-- =====================================================
CREATE TABLE IF NOT EXISTS tpr (
    id SERIAL PRIMARY KEY,
    sql_id VARCHAR(50),
    drvcode VARCHAR(50),
    wono VARCHAR(50),
    blno VARCHAR(50),
    fecha VARCHAR(12),
    fromd VARCHAR(50),
    fromcity VARCHAR(100),
    fromedo VARCHAR(50),
    tod VARCHAR(50),
    tocity VARCHAR(100),
    toedo VARCHAR(50),
    tipmov VARCHAR(50),
    status VARCHAR(50),
    el VARCHAR(50),
    eqpcode VARCHAR(100),
    deldate VARCHAR(12),
    cstmer VARCHAR(100),
    timearrv VARCHAR(20),
    timedepar VARCHAR(20),
    oper VARCHAR(50),
    truckid VARCHAR(50),
    seal VARCHAR(50),
    instruc1 TEXT,
    instruc2 TEXT,
    amount VARCHAR(10),
    tablecode VARCHAR(50),
    trxcode VARCHAR(50),
    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tpr_fromd ON tpr(fromd);
CREATE INDEX IF NOT EXISTS idx_tpr_status ON tpr(status);
CREATE INDEX IF NOT EXISTS idx_tpr_el ON tpr(el);
CREATE INDEX IF NOT EXISTS idx_tpr_fecha ON tpr(fecha);
CREATE INDEX IF NOT EXISTS idx_tpr_wono ON tpr(wono);
CREATE INDEX IF NOT EXISTS idx_tpr_blno ON tpr(blno);
CREATE INDEX IF NOT EXISTS idx_tpr_truckid ON tpr(truckid);
CREATE INDEX IF NOT EXISTS idx_tpr_synced_at ON tpr(synced_at);

-- =====================================================
-- VISTAS
-- =====================================================
CREATE OR REPLACE VIEW v_inspections_list AS
SELECT
    id, uuid,
    trailer_number, seal_number, lock_number, driver_name, location, location_id,
    inspection_date, language, status,
    operator_name, guard_id, guard_name, guard_signed_at,
    auditor_name, auditor_signed_at,
    total_good, total_bad, total_pending,
    pdf_filename, pdf_size_bytes,
    original_inspection_id, is_reconfirmation, reconfirmation_reason,
    created_ip, created_at, updated_at
FROM inspections;

CREATE OR REPLACE VIEW v_inspection_chains AS
SELECT
    COALESCE(original_inspection_id, id) AS chain_root_id,
    id, trailer_number, seal_number, guard_name, location,
    status, is_reconfirmation, reconfirmation_reason,
    total_good, total_bad, created_at
FROM inspections
ORDER BY chain_root_id, created_at ASC;

-- =====================================================
-- USUARIOS INICIALES
-- =====================================================
INSERT INTO employees (id, username, password_hash, full_name, role, location_id, location_name, active) VALUES
(101, 'guardia01', '1234', 'Carlos Mendoza', 'guard', 1, 'Yard A - Laredo', true),
(102, 'guardia02', '1234', 'Luis Hernandez', 'guard', 1, 'Yard A - Laredo', true),
(103, 'guardia03', '1234', 'Miguel Torres', 'guard', 2, 'Yard B - El Paso', true),
(104, 'guardia04', '1234', 'Pedro Ramirez', 'guard', 2, 'Yard B - El Paso', true),
(105, 'guardia05', '1234', 'Juan Lopez', 'guard', 3, 'Yard C - Dallas', true),
(106, 'guardia06', '1234', 'Antonio Garcia', 'guard', 3, 'Yard C - Dallas', true),
(107, 'guardia07', '1234', 'Roberto Diaz', 'guard', 4, 'Yard D - Houston', true),
(108, 'guardia08', '1234', 'Francisco Ruiz', 'guard', 4, 'Yard D - Houston', true),
(109, 'guardia09', '1234', 'Javier Morales', 'guard', 5, 'Yard E - San Antonio', true),
(110, 'guardia10', '1234', 'Ricardo Silva', 'guard', 5, 'Yard E - San Antonio', true),
(201, 'inspector01', '1234', 'Alberto Vargas', 'inspector', 1, 'Yard A - Laredo', true),
(202, 'inspector02', '1234', 'Daniel Castro', 'inspector', 2, 'Yard B - El Paso', true),
(203, 'inspector03', '1234', 'Oscar Mendez', 'inspector', 3, 'Yard C - Dallas', true),
(204, 'inspector04', '1234', 'Sergio Aguilar', 'inspector', 4, 'Yard D - Houston', true),
(205, 'inspector05', '1234', 'Fernando Paredes', 'inspector', 5, 'Yard E - San Antonio', true),
(301, 'auditor01', '1234', 'Roberto Sanchez', 'auditor', 1, 'Yard A - Laredo', true),
(302, 'auditor02', '1234', 'Guillermo Ortiz', 'auditor', 1, 'Yard A - Laredo', true),
(303, 'auditor03', '1234', 'Eduardo Mora', 'auditor', 1, 'Yard A - Laredo', true),
(401, 'admin', 'admin', 'Admin Crown', 'admin', 1, 'Yard A - Laredo', true)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- ASIGNACIONES DE YARDAS
-- =====================================================
INSERT INTO yard_assignments (employee_id, yard_id, assigned_by) VALUES
(101, 1, 401), (102, 1, 401), (103, 2, 401), (104, 2, 401),
(105, 3, 401), (106, 3, 401), (107, 4, 401), (108, 4, 401),
(109, 5, 401), (110, 5, 401)
ON CONFLICT (employee_id, yard_id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'locations' as table_name, COUNT(*) as count FROM locations
UNION ALL SELECT 'employees', COUNT(*) FROM employees
UNION ALL SELECT 'operators', COUNT(*) FROM operators
UNION ALL SELECT 'yards', COUNT(*) FROM yards
UNION ALL SELECT 'yard_assignments', COUNT(*) FROM yard_assignments
UNION ALL SELECT 'inspections', COUNT(*) FROM inspections
UNION ALL SELECT 'inspection_points', COUNT(*) FROM inspection_points
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log
UNION ALL SELECT 'tpr', COUNT(*) FROM tpr;
