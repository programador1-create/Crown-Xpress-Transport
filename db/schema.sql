-- ============================================================
-- Crown Xpress Transport · 20 Point Inspection Database Schema
-- Postgres (Neon) · v1.0
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- (Login is not active yet; the table is here for future use.
--  For now we still record who entered/signed by name.)
-- ============================================================
-- ============================================================
-- LOCATIONS (Yardas)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL UNIQUE,
    address         VARCHAR(255),
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(60)  UNIQUE,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(120),
    role            VARCHAR(20)  NOT NULL DEFAULT 'operator'
                    CHECK (role IN ('operator','guard','inspector','auditor','admin')),
    location_id     INT REFERENCES locations(id) ON DELETE SET NULL,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- INSPECTIONS · main record
-- ============================================================
CREATE TABLE IF NOT EXISTS inspections (
    id                  SERIAL PRIMARY KEY,
    inspection_uuid     UUID DEFAULT gen_random_uuid() UNIQUE,
    -- Unit info
    trailer_number      VARCHAR(50),
    seal_number         VARCHAR(50),
    lock_number         VARCHAR(50),
    driver_name         VARCHAR(120),
    odometer            VARCHAR(20),
    location            VARCHAR(120),
    location_id         INT REFERENCES locations(id) ON DELETE SET NULL,
    inspection_date     TIMESTAMPTZ,
    -- Reconfirmation link (if this inspection is a correction of another)
    original_inspection_id  INT REFERENCES inspections(id) ON DELETE SET NULL,
    reconfirmation_reason   TEXT,
    is_reconfirmation       BOOLEAN DEFAULT FALSE,
    high_security_seal  BOOLEAN,
    seal_affixed        BOOLEAN,
    language            VARCHAR(2)  DEFAULT 'es',
    -- Operator (entered the data)
    operator_id         INT REFERENCES users(id) ON DELETE SET NULL,
    operator_name       VARCHAR(120),
    -- Guard (mandatory signature)
    guard_id            INT REFERENCES users(id) ON DELETE SET NULL,
    guard_name          VARCHAR(120),
    guard_signed_at     TIMESTAMPTZ,
    -- Auditor (optional, can sign later)
    auditor_id          INT REFERENCES users(id) ON DELETE SET NULL,
    auditor_name        VARCHAR(120),
    auditor_signed_at   TIMESTAMPTZ,
    -- Status & counters
    status              VARCHAR(20) DEFAULT 'completed'
                        CHECK (status IN ('draft','completed','audited','rejected','reconfirmed','superseded')),
    total_good          INT DEFAULT 0,
    total_bad           INT DEFAULT 0,
    total_pending       INT DEFAULT 0,
    -- PDF (binary stored in DB so it always lives with the record)
    pdf_filename        VARCHAR(200),
    pdf_data            BYTEA,
    pdf_size_bytes      INT,
    -- Forensics
    created_ip          VARCHAR(64),
    created_user_agent  TEXT,
    -- Timestamps
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

-- ============================================================
-- INSPECTION POINTS · 20 rows per inspection
-- ============================================================
CREATE TABLE IF NOT EXISTS inspection_points (
    id              SERIAL PRIMARY KEY,
    inspection_id   INT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    point_number    INT NOT NULL CHECK (point_number BETWEEN 1 AND 20),
    status          VARCHAR(10) CHECK (status IN ('good','bad')),
    issue_id        INT,            -- predefined issue id (1-10)
    issue_text      VARCHAR(500),   -- snapshot of the issue text
    has_photo       BOOLEAN DEFAULT FALSE,
    UNIQUE(inspection_id, point_number)
);

CREATE INDEX IF NOT EXISTS idx_points_inspection ON inspection_points(inspection_id);

-- ============================================================
-- AUDIT LOG · who did what
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id              SERIAL PRIMARY KEY,
    inspection_id   INT REFERENCES inspections(id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(id) ON DELETE SET NULL,
    user_name       VARCHAR(120),
    role            VARCHAR(20),
    action          VARCHAR(50) NOT NULL,
    -- common actions: created, signed_guard, signed_auditor, viewed, downloaded_pdf, rejected
    details         JSONB,
    ip_address      VARCHAR(64),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_inspection ON audit_log(inspection_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created    ON audit_log(created_at DESC);

-- ============================================================
-- HELPER VIEW · quick listing without the heavy PDF blob
-- ============================================================
CREATE OR REPLACE VIEW v_inspections_list AS
SELECT
    id, inspection_uuid,
    trailer_number, seal_number, lock_number, driver_name, location, location_id,
    inspection_date, language, status,
    operator_name, guard_id, guard_name, guard_signed_at,
    auditor_name, auditor_signed_at,
    total_good, total_bad, total_pending,
    pdf_filename, pdf_size_bytes,
    original_inspection_id, is_reconfirmation, reconfirmation_reason,
    created_ip, created_at, updated_at
FROM inspections;

-- ============================================================
-- INSPECTION CHAIN VIEW · group original + reconfirmations
-- ============================================================
CREATE OR REPLACE VIEW v_inspection_chains AS
SELECT
    COALESCE(original_inspection_id, id) AS chain_root_id,
    id, trailer_number, seal_number, guard_name, location,
    status, is_reconfirmation, reconfirmation_reason,
    total_good, total_bad, created_at
FROM inspections
ORDER BY chain_root_id, created_at ASC;
