-- ============================================================================
-- Crown Xpress Transport - Esquema de Base de Datos para SQL Server
-- Generado desde el esquema PostgreSQL de Neon
-- Compatible con SQL Server 2016+
-- ============================================================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CrownXpressTransport')
BEGIN
    CREATE DATABASE CrownXpressTransport;
END
GO

USE CrownXpressTransport;
GO

-- ============================================================================
-- TABLAS
-- ============================================================================

-- Locations (ubicaciones)
IF OBJECT_ID('locations', 'U') IS NULL
BEGIN
    CREATE TABLE locations (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(120) NOT NULL,
        address NVARCHAR(255) NULL,
        active BIT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- Employees (empleados/usuarios)
IF OBJECT_ID('employees', 'U') IS NULL
BEGIN
    CREATE TABLE employees (
        id INT IDENTITY(1,1) NOT NULL,
        username NVARCHAR(60) NULL,
        password_hash NVARCHAR(255) NULL,
        full_name NVARCHAR(120) NOT NULL,
        email NVARCHAR(120) NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'operator',
        location_id INT NULL,
        location_name NVARCHAR(120) NULL,
        active BIT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        profile_photo NVARCHAR(MAX) NULL,
        password NVARCHAR(255) NULL
    );
END
GO

-- Operators (operadores de unidades)
IF OBJECT_ID('operators', 'U') IS NULL
BEGIN
    CREATE TABLE operators (
        id INT IDENTITY(1,1) NOT NULL,
        employee_number NVARCHAR(20) NOT NULL,
        full_name NVARCHAR(100) NOT NULL,
        license_number NVARCHAR(50) NULL,
        license_expiry DATE NULL,
        phone NVARCHAR(20) NULL,
        email NVARCHAR(100) NULL,
        status NVARCHAR(20) NULL DEFAULT 'active',
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- Yards (yardas)
IF OBJECT_ID('yards', 'U') IS NULL
BEGIN
    CREATE TABLE yards (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(20) NOT NULL,
        type NVARCHAR(20) NOT NULL,
        description NVARCHAR(MAX) NULL,
        address NVARCHAR(MAX) NULL,
        max_trailers INT NULL DEFAULT 0,
        max_trucks INT NULL DEFAULT 0,
        max_boxes INT NULL DEFAULT 0,
        max_platforms INT NULL DEFAULT 0,
        max_machinery INT NULL DEFAULT 0,
        min_trailers INT NULL DEFAULT 0,
        min_trucks INT NULL DEFAULT 0,
        min_boxes INT NULL DEFAULT 0,
        min_platforms INT NULL DEFAULT 0,
        min_machinery INT NULL DEFAULT 0,
        current_trailers INT NULL DEFAULT 0,
        current_trucks INT NULL DEFAULT 0,
        current_boxes INT NULL DEFAULT 0,
        current_platforms INT NULL DEFAULT 0,
        current_machinery INT NULL DEFAULT 0,
        is_active BIT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- Yard Assignments (asignaciones de yardas a empleados)
IF OBJECT_ID('yard_assignments', 'U') IS NULL
BEGIN
    CREATE TABLE yard_assignments (
        id INT IDENTITY(1,1) NOT NULL,
        employee_id INT NOT NULL,
        yard_id INT NOT NULL,
        assigned_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        assigned_by INT NULL,
        is_active BIT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- Inspections (inspecciones)
IF OBJECT_ID('inspections', 'U') IS NULL
BEGIN
    CREATE TABLE inspections (
        id INT IDENTITY(1,1) NOT NULL,
        uuid UNIQUEIDENTIFIER NULL DEFAULT NEWSEQUENTIALID(),
        trailer_number NVARCHAR(50) NULL,
        seal_number NVARCHAR(50) NULL,
        lock_number NVARCHAR(50) NULL,
        driver_name NVARCHAR(120) NULL,
        odometer NVARCHAR(20) NULL,
        location NVARCHAR(120) NULL,
        location_id INT NULL,
        inspection_date DATETIMEOFFSET NULL,
        original_inspection_id INT NULL,
        reconfirmation_reason NVARCHAR(MAX) NULL,
        is_reconfirmation BIT NULL DEFAULT 0,
        high_security_seal BIT NULL,
        seal_affixed BIT NULL,
        language NVARCHAR(2) NULL DEFAULT 'es',
        operator_id INT NULL,
        operator_name NVARCHAR(120) NULL,
        operator_signature NVARCHAR(MAX) NULL,
        operator_signed_at DATETIMEOFFSET NULL,
        guard_id INT NULL,
        guard_name NVARCHAR(120) NULL,
        guard_signature NVARCHAR(MAX) NULL,
        guard_signed_at DATETIMEOFFSET NULL,
        supervisor_name NVARCHAR(120) NULL,
        supervisor_signature NVARCHAR(MAX) NULL,
        supervisor_signed_at DATETIMEOFFSET NULL,
        auditor_id INT NULL,
        auditor_name NVARCHAR(120) NULL,
        auditor_signed_at DATETIMEOFFSET NULL,
        status NVARCHAR(20) NULL DEFAULT 'completed',
        total_good INT NULL DEFAULT 0,
        total_bad INT NULL DEFAULT 0,
        total_pending INT NULL DEFAULT 0,
        pdf_filename NVARCHAR(200) NULL,
        pdf_data VARBINARY(MAX) NULL,
        pdf_url NVARCHAR(MAX) NULL,
        pdf_size_bytes INT NULL,
        created_ip NVARCHAR(64) NULL,
        created_user_agent NVARCHAR(MAX) NULL,
        equipment_nomenclature NVARCHAR(100) NULL,
        tractor_number NVARCHAR(50) NULL,
        container_number NVARCHAR(50) NULL,
        customer_prefix NVARCHAR(20) NULL,
        crown_fleet NVARCHAR(50) NULL,
        inspection_type NVARCHAR(20) NULL DEFAULT 'LOADED',
        trailer_type NVARCHAR(50) NULL,
        wono NVARCHAR(100) NULL,
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- Inspection Points (puntos de inspección)
IF OBJECT_ID('inspection_points', 'U') IS NULL
BEGIN
    CREATE TABLE inspection_points (
        id INT IDENTITY(1,1) NOT NULL,
        inspection_id INT NOT NULL,
        point_id INT NOT NULL,
        status NVARCHAR(10) NULL,
        issue_id INT NULL,
        issue_text NVARCHAR(500) NULL,
        has_photo BIT NULL DEFAULT 0,
        photo NVARCHAR(MAX) NULL
    );
END
GO

-- Audit Log (registro de auditoría)
IF OBJECT_ID('audit_log', 'U') IS NULL
BEGIN
    CREATE TABLE audit_log (
        id INT IDENTITY(1,1) NOT NULL,
        inspection_id INT NULL,
        user_id INT NULL,
        user_name NVARCHAR(120) NULL,
        role NVARCHAR(20) NULL,
        action NVARCHAR(50) NOT NULL,
        details NVARCHAR(MAX) NULL,
        ip_address NVARCHAR(64) NULL,
        user_agent NVARCHAR(MAX) NULL,
        created_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- TPR (movimientos de SQL Server / NBCW)
IF OBJECT_ID('tpr', 'U') IS NULL
BEGIN
    CREATE TABLE tpr (
        id INT IDENTITY(1,1) NOT NULL,
        sql_id NVARCHAR(50) NULL,
        drvcode NVARCHAR(50) NULL,
        wono NVARCHAR(50) NULL,
        blno NVARCHAR(50) NULL,
        fecha NVARCHAR(12) NULL,
        fromd NVARCHAR(50) NULL,
        fromcity NVARCHAR(100) NULL,
        fromedo NVARCHAR(50) NULL,
        tod NVARCHAR(50) NULL,
        tocity NVARCHAR(100) NULL,
        toedo NVARCHAR(50) NULL,
        tipmov NVARCHAR(50) NULL,
        status NVARCHAR(50) NULL,
        el NVARCHAR(50) NULL,
        eqpcode NVARCHAR(100) NULL,
        deldate NVARCHAR(12) NULL,
        cstmer NVARCHAR(100) NULL,
        timearrv NVARCHAR(20) NULL,
        timedepar NVARCHAR(20) NULL,
        oper NVARCHAR(50) NULL,
        truckid NVARCHAR(50) NULL,
        seal NVARCHAR(50) NULL,
        instruc1 NVARCHAR(MAX) NULL,
        instruc2 NVARCHAR(MAX) NULL,
        amount NVARCHAR(10) NULL,
        tablecode NVARCHAR(50) NULL,
        trxcode NVARCHAR(50) NULL,
        synced_at DATETIME NULL DEFAULT SYSDATETIME()
    );
END
GO

-- ============================================================================
-- CLAVES PRIMARIAS
-- ============================================================================

ALTER TABLE locations          ADD CONSTRAINT PK_locations          PRIMARY KEY (id);
ALTER TABLE employees         ADD CONSTRAINT PK_employees          PRIMARY KEY (id);
ALTER TABLE operators         ADD CONSTRAINT PK_operators          PRIMARY KEY (id);
ALTER TABLE yards             ADD CONSTRAINT PK_yards              PRIMARY KEY (id);
ALTER TABLE yard_assignments  ADD CONSTRAINT PK_yard_assignments   PRIMARY KEY (id);
ALTER TABLE inspections       ADD CONSTRAINT PK_inspections        PRIMARY KEY (id);
ALTER TABLE inspection_points ADD CONSTRAINT PK_inspection_points  PRIMARY KEY (id);
ALTER TABLE audit_log         ADD CONSTRAINT PK_audit_log          PRIMARY KEY (id);
ALTER TABLE tpr               ADD CONSTRAINT PK_tpr                PRIMARY KEY (id);
GO

-- ============================================================================
-- CLAVES ÚNICAS
-- ============================================================================

ALTER TABLE locations         ADD CONSTRAINT UQ_locations_name        UNIQUE (name);
ALTER TABLE employees        ADD CONSTRAINT UQ_employees_username    UNIQUE (username);
ALTER TABLE operators        ADD CONSTRAINT UQ_operators_emp_number  UNIQUE (employee_number);
ALTER TABLE yards            ADD CONSTRAINT UQ_yards_code            UNIQUE (code);
ALTER TABLE yards            ADD CONSTRAINT UQ_yards_name            UNIQUE (name);
ALTER TABLE yard_assignments ADD CONSTRAINT UQ_yard_assign_emp_yard  UNIQUE (employee_id, yard_id);
ALTER TABLE inspections      ADD CONSTRAINT UQ_inspections_uuid      UNIQUE (uuid);
ALTER TABLE inspection_points ADD CONSTRAINT UQ_points_insp_point    UNIQUE (inspection_id, point_id);
GO

-- ============================================================================
-- CLAVES FORÁNEAS
-- ============================================================================

ALTER TABLE employees
    ADD CONSTRAINT FK_employees_location
    FOREIGN KEY (location_id) REFERENCES locations(id);

ALTER TABLE inspections
    ADD CONSTRAINT FK_inspections_location
    FOREIGN KEY (location_id) REFERENCES locations(id);

ALTER TABLE inspections
    ADD CONSTRAINT FK_inspections_original
    FOREIGN KEY (original_inspection_id) REFERENCES inspections(id);

ALTER TABLE inspections
    ADD CONSTRAINT FK_inspections_operator
    FOREIGN KEY (operator_id) REFERENCES employees(id);

ALTER TABLE inspections
    ADD CONSTRAINT FK_inspections_guard
    FOREIGN KEY (guard_id) REFERENCES employees(id);

ALTER TABLE inspections
    ADD CONSTRAINT FK_inspections_auditor
    FOREIGN KEY (auditor_id) REFERENCES employees(id);

ALTER TABLE inspection_points
    ADD CONSTRAINT FK_points_inspection
    FOREIGN KEY (inspection_id) REFERENCES inspections(id);

ALTER TABLE audit_log
    ADD CONSTRAINT FK_audit_inspection
    FOREIGN KEY (inspection_id) REFERENCES inspections(id);

ALTER TABLE audit_log
    ADD CONSTRAINT FK_audit_user
    FOREIGN KEY (user_id) REFERENCES employees(id);

ALTER TABLE yard_assignments
    ADD CONSTRAINT FK_yard_assign_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE yard_assignments
    ADD CONSTRAINT FK_yard_assign_yard
    FOREIGN KEY (yard_id) REFERENCES yards(id);

ALTER TABLE yard_assignments
    ADD CONSTRAINT FK_yard_assign_by
    FOREIGN KEY (assigned_by) REFERENCES employees(id);
GO

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Inspections
CREATE INDEX IX_inspections_created_at  ON inspections (created_at DESC);
CREATE INDEX IX_inspections_guard        ON inspections (guard_id);
CREATE INDEX IX_inspections_location     ON inspections (location_id);
CREATE INDEX IX_inspections_original     ON inspections (original_inspection_id);
CREATE INDEX IX_inspections_status       ON inspections (status);
CREATE INDEX IX_inspections_tractor      ON inspections (tractor_number);
CREATE INDEX IX_inspections_trailer      ON inspections (trailer_number);
CREATE INDEX IX_inspections_uuid         ON inspections (uuid);
CREATE INDEX IX_inspections_wono          ON inspections (wono);
GO

-- Inspection Points
CREATE INDEX IX_points_inspection       ON inspection_points (inspection_id);
GO

-- Audit Log
CREATE INDEX IX_audit_action             ON audit_log (action);
CREATE INDEX IX_audit_created            ON audit_log (created_at DESC);
CREATE INDEX IX_audit_inspection         ON audit_log (inspection_id);
GO

-- Employees
CREATE INDEX IX_employees_active         ON employees (active);
CREATE INDEX IX_employees_role           ON employees (role);
GO

-- Operators
CREATE INDEX IX_operators_emp_number    ON operators (employee_number);
CREATE INDEX IX_operators_status         ON operators (status);
GO

-- Yards
CREATE INDEX IX_yards_active             ON yards (is_active);
CREATE INDEX IX_yards_type               ON yards (type);
GO

-- Yard Assignments
CREATE INDEX IX_yard_assign_active       ON yard_assignments (is_active);
CREATE INDEX IX_yard_assign_employee     ON yard_assignments (employee_id);
CREATE INDEX IX_yard_assign_yard         ON yard_assignments (yard_id);
GO

-- TPR
CREATE INDEX IX_tpr_blno                 ON tpr (blno);
CREATE INDEX IX_tpr_el                   ON tpr (el);
CREATE INDEX IX_tpr_fecha                ON tpr (fecha);
CREATE INDEX IX_tpr_fromd                ON tpr (fromd);
CREATE INDEX IX_tpr_status               ON tpr (status);
CREATE INDEX IX_tpr_synced_at            ON tpr (synced_at);
CREATE INDEX IX_tpr_truckid              ON tpr (truckid);
CREATE INDEX IX_tpr_wono                  ON tpr (wono);
GO

-- ============================================================================
-- VISTAS
-- ============================================================================

IF OBJECT_ID('v_inspections_list', 'V') IS NOT NULL DROP VIEW v_inspections_list;
GO
CREATE VIEW v_inspections_list AS
SELECT
    id, uuid, trailer_number, seal_number, lock_number, driver_name,
    location, location_id, inspection_date, language, status,
    operator_name, guard_id, guard_name, guard_signed_at,
    auditor_name, auditor_signed_at,
    total_good, total_bad, total_pending,
    pdf_filename, pdf_size_bytes,
    original_inspection_id, is_reconfirmation, reconfirmation_reason,
    created_ip, created_at, updated_at
FROM inspections;
GO

IF OBJECT_ID('v_inspection_chains', 'V') IS NOT NULL DROP VIEW v_inspection_chains;
GO
CREATE VIEW v_inspection_chains AS
SELECT
    COALESCE(original_inspection_id, id) AS chain_root_id,
    id, trailer_number, seal_number, guard_name, location,
    status, is_reconfirmation, reconfirmation_reason,
    total_good, total_bad, created_at
FROM inspections;
GO

-- ============================================================================
-- DATOS INICIALES (SEEDS)
-- ============================================================================

-- Yarda 6 Tijuana (CXT6)
IF NOT EXISTS (SELECT 1 FROM yards WHERE code = 'CXT6')
BEGIN
    INSERT INTO yards (name, code, type, description, is_active)
    VALUES ('YARDA 6 TIJUANA', 'CXT6', 'CROWN', 'Yarda principal Crown Xpress Tijuana', 1);
END
GO

-- Usuario admin por defecto (contraseña: admin123 - cambiar en producción)
IF NOT EXISTS (SELECT 1 FROM employees WHERE username = 'admin')
BEGIN
    INSERT INTO employees (username, password_hash, full_name, role, active)
    VALUES ('admin', 'CHANGE_ME_TO_BCRYPT_HASH', 'Administrador', 'admin', 1);
END
GO

-- ============================================================================
-- NOTAS DE MIGRACIÓN PostgreSQL -> SQL Server
-- ============================================================================
/*
1. Tipos mapeados:
   - serial/IDENTITY -> INT IDENTITY(1,1)
   - text -> NVARCHAR(MAX)
   - varchar(N) -> NVARCHAR(N)
   - bytea -> VARBINARY(MAX)
   - uuid -> UNIQUEIDENTIFIER (NEWSEQUENTIALID en lugar de gen_random_uuid)
   - jsonb -> NVARCHAR(MAX) (SQL Server no tiene JSONB nativo antes de 2022)
   - timestamp with time zone -> DATETIMEOFFSET
   - timestamp without time zone -> DATETIME
   - boolean -> BIT (1/0)

2. gen_random_uuid() -> NEWSEQUENTIALID() (más eficiente que NEWID() para índices)

3. now() / CURRENT_TIMESTAMP -> SYSDATETIMEOFFSET() / SYSDATETIME()

4. Las firmas (signatures) se guardan como texto base64 en NVARCHAR(MAX)
   igual que en PostgreSQL.

5. pdf_data es VARBINARY(MAX) para compatibilidad con PDFs binarios,
   pero en producción los PDFs se guardan en Vercel Blob Storage
   y pdf_url contiene la URL pública.

6. El campo details en audit_log era jsonb en PostgreSQL.
   En SQL Server se guarda como NVARCHAR(MAX) y se usa
   ISJSON() / JSON_VALUE() / JSON_MODIFY() para consultas JSON.

7. No se incluyen triggers ni funciones porque no existen en el esquema actual.
*/
