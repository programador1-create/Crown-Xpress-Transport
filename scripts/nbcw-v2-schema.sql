-- ============================================================
-- NBCW V2 Schema - Preparado para sistema real
-- NO CONECTAR AUN - Solo preparacion
-- Base de datos: gpsactivity
-- ============================================================

-- Crear base de datos (ejecutar como superuser)
-- CREATE DATABASE gpsactivity;
-- \c gpsactivity;

-- ============================================================
-- 1. TABLA PRINCIPAL: tpr (Transporte y Rutas)
--    Estructura identica al sistema NBCW real
-- ============================================================
CREATE TABLE IF NOT EXISTS tpr (
    id SERIAL PRIMARY KEY,
    drvcode VARCHAR(6),
    wono VARCHAR(8) NOT NULL,
    blno VARCHAR(5),
    fecha VARCHAR(12),
    fromd VARCHAR(9),
    fromcity VARCHAR(15),
    fromedo VARCHAR(5),
    tod VARCHAR(9),
    tocity VARCHAR(15),
    toedo VARCHAR(5),
    tipmov VARCHAR(1),
    status VARCHAR(10),
    el VARCHAR(1),
    eqpcode VARCHAR(18),
    deldate VARCHAR(12),
    cstmer VARCHAR(9),
    timearrv VARCHAR(5),
    timedepar VARCHAR(5),
    oper VARCHAR(20),
    ustimein VARCHAR(5),
    ustimeout VARCHAR(5),
    mxmxcstin VARCHAR(5),
    mxuscstin VARCHAR(5),
    mxtimeout VARCHAR(5),
    truckid VARCHAR(18),
    bltime VARCHAR(5),
    tarrfrom VARCHAR(5),
    usrupdd VARCHAR(12),
    usrupdt VARCHAR(5),
    usradd VARCHAR(20),
    usraddd VARCHAR(12),
    usraddt VARCHAR(5),
    instruc1 VARCHAR(50),
    instruc2 VARCHAR(50),
    rl VARCHAR(1),
    amount VARCHAR(10),
    tablecode VARCHAR(7),
    trxcode VARCHAR(3),
    seal VARCHAR(30),
    -- Campos de auditoria V2
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP, -- cuando se sincronizo del sistema real
    source_system VARCHAR(20) DEFAULT 'NBCW'
);

-- ============================================================
-- 2. INDICES (optimizacion para consultas frecuentes)
-- ============================================================

-- Indice para filtro por yarda (fromd) - MUY IMPORTANTE
CREATE INDEX IF NOT EXISTS idx_tpr_fromd ON tpr(fromd);

-- Indice para filtro por fecha
CREATE INDEX IF NOT EXISTS idx_tpr_fecha ON tpr(fecha);

-- Indice para filtro por status (OPEN, CLOSED, etc)
CREATE INDEX IF NOT EXISTS idx_tpr_status ON tpr(status);

-- Indice para filtro por tipo de equipo (L=Loaded, E=Empty)
CREATE INDEX IF NOT EXISTS idx_tpr_el ON tpr(el);

-- Indice para filtro por codigo de equipo
CREATE INDEX IF NOT EXISTS idx_tpr_eqpcode ON tpr(eqpcode);

-- Indice compuesto: yarda + fecha + status (consulta principal de salidas)
CREATE INDEX IF NOT EXISTS idx_tpr_fromd_fecha_status ON tpr(fromd, fecha, status);

-- Indice compuesto: fecha + status (para reportes)
CREATE INDEX IF NOT EXISTS idx_tpr_fecha_status ON tpr(fecha, status);

-- Indice para busqueda por orden de trabajo
CREATE INDEX IF NOT EXISTS idx_tpr_wono ON tpr(wono);

-- Indice para busqueda por conductor
CREATE INDEX IF NOT EXISTS idx_tpr_drvcode ON tpr(drvcode);

-- Indice para busqueda por camion
CREATE INDEX IF NOT EXISTS idx_tpr_truckid ON tpr(truckid);

-- ============================================================
-- 3. VISTAS UTILES
-- ============================================================

-- Vista: Salidas pendientes por yarda (uso principal del modal NBCW)
CREATE OR REPLACE VIEW v_salidas_pendientes AS
SELECT
    t.id,
    TRIM(t.drvcode) AS driver_code,
    TRIM(t.wono) AS work_order,
    TRIM(t.blno) AS bill_of_lading,
    t.fecha AS date,
    TRIM(t.fromd) AS from_code,
    TRIM(t.fromcity) AS from_city,
    TRIM(t.fromedo) AS from_state,
    TRIM(t.tod) AS to_code,
    TRIM(t.tocity) AS to_city,
    TRIM(t.toedo) AS to_state,
    TRIM(t.tipmov) AS movement_type,
    TRIM(t.status) AS status,
    TRIM(t.el) AS equipment_type,
    TRIM(t.eqpcode) AS equipment_code,
    t.deldate AS delivery_date,
    TRIM(t.cstmer) AS customer,
    t.timearrv AS arrival_time,
    t.timedepar AS departure_time,
    TRIM(t.oper) AS operator,
    TRIM(t.truckid) AS truck_id,
    TRIM(t.seal) AS seal,
    TRIM(t.instruc1) AS instructions_1,
    TRIM(t.instruc2) AS instructions_2,
    TRIM(t.amount) AS amount,
    TRIM(t.tablecode) AS table_code,
    TRIM(t.trxcode) AS trx_code,
    t.created_at,
    t.synced_at
FROM tpr t
WHERE TRIM(t.status) = 'OPEN';

-- Vista: Resumen por yarda y fecha
CREATE OR REPLACE VIEW v_resumen_yarda_fecha AS
SELECT
    TRIM(fromd) AS yard_code,
    fecha AS date,
    COUNT(*) AS total_movements,
    COUNT(*) FILTER (WHERE TRIM(el) = 'L') AS loaded_count,
    COUNT(*) FILTER (WHERE TRIM(el) = 'E') AS empty_count,
    COUNT(*) FILTER (WHERE TRIM(eqpcode) LIKE '%Botada%') AS bobtail_count,
    COUNT(*) FILTER (WHERE TRIM(status) = 'OPEN') AS open_count,
    COUNT(*) FILTER (WHERE TRIM(status) = 'CLOSED') AS closed_count
FROM tpr
GROUP BY TRIM(fromd), fecha;

-- ============================================================
-- 4. FUNCIONES ALMACENADAS (para consultas complejas)
-- ============================================================

-- Funcion: Obtener salidas pendientes por yarda
CREATE OR REPLACE FUNCTION get_salidas_pendientes(p_yard_code VARCHAR)
RETURNS TABLE (
    id INTEGER,
    driver_code VARCHAR,
    work_order VARCHAR,
    from_code VARCHAR,
    from_city VARCHAR,
    to_code VARCHAR,
    to_city VARCHAR,
    equipment_type VARCHAR,
    equipment_code VARCHAR,
    status VARCHAR,
    date VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        TRIM(t.drvcode)::VARCHAR,
        TRIM(t.wono)::VARCHAR,
        TRIM(t.fromd)::VARCHAR,
        TRIM(t.fromcity)::VARCHAR,
        TRIM(t.tod)::VARCHAR,
        TRIM(t.tocity)::VARCHAR,
        TRIM(t.el)::VARCHAR,
        TRIM(t.eqpcode)::VARCHAR,
        TRIM(t.status)::VARCHAR,
        t.fecha::VARCHAR
    FROM tpr t
    WHERE TRIM(t.fromd) = UPPER(p_yard_code)
      AND TRIM(t.status) = 'OPEN'
    ORDER BY t.fecha DESC, t.timearrv DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. TABLA DE SINCRONIZACION (para tracking del sync con NBCW real)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'FULL', 'INCREMENTAL', 'MANUAL'
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'FAILED'
    error_message TEXT,
    triggered_by VARCHAR(50) -- 'SCHEDULED', 'MANUAL', 'WEBHOOK'
);

-- Indice para consultas de sync
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_completed ON sync_log(completed_at);

-- ============================================================
-- 6. TABLA DE CONFIGURACION DE YARDAS (mapeo NBCW -> Sistema Crown)
-- ============================================================
CREATE TABLE IF NOT EXISTS yard_mapping (
    id SERIAL PRIMARY KEY,
    nbcw_code VARCHAR(10) NOT NULL UNIQUE, -- codigo en NBCW (ej: CXT6, CXT13)
    crown_code VARCHAR(10),               -- codigo en sistema Crown
    yard_name VARCHAR(50),
    city VARCHAR(30),
    state VARCHAR(5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar mapeos iniciales (ejemplos)
INSERT INTO yard_mapping (nbcw_code, crown_code, yard_name, city, state) VALUES
('CXT6', 'CXT6', 'YARD A TIJUANA (FISICA)', 'TIJUANA', 'BCN'),
('CXT12', 'CXT12', 'YARD B EL PASO (FISICA)', 'EL PASO', 'TX'),
('CXT13', 'CXT13', 'YARD C DALLAS (FISICA)', 'DALLAS', 'TX'),
('CXT17', 'CXT17', 'YARD D HOUSTON (FISICA)', 'HOUSTON', 'TX'),
('CXT18', 'CXT18', 'YARD E SAN ANTONIO (FISICA)', 'SAN ANTONIO', 'TX')
ON CONFLICT (nbcw_code) DO NOTHING;

-- ============================================================
-- 7. TRIGGER: Actualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tpr_updated_at ON tpr;
CREATE TRIGGER trigger_tpr_updated_at
    BEFORE UPDATE ON tpr
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. DATOS DE PRUEBA (opcional - para ambiente de desarrollo)
-- ============================================================
-- Descomentar solo si se necesita poblar la tabla para pruebas
-- Los datos reales vendran del sistema NBCW via sync

/*
-- Ejemplo de insercion de datos simulados:
INSERT INTO tpr (drvcode, wono, blno, fecha, fromd, fromcity, fromedo, tod, tocity, toedo, tipmov, status, el, eqpcode, cstmer, timearrv, timedepar, oper, truckid, tablecode, trxcode, seal)
VALUES
('1455', '785237', '2', '6/11/2026', 'CXT6', 'TIJUANA', 'BCN', 'AVERY', 'TIJUANA', 'BCN', 'L', 'OPEN', 'L', 'ABBA-008', 'AVERYLA', '', '', 'JOSE ROSENDO LEAL', '357', 'LOC/TJL', 'MOV', '');
*/

-- ============================================================
-- 9. COMENTARIOS DE DOCUMENTACION
-- ============================================================
COMMENT ON TABLE tpr IS 'Tabla principal de movimientos TPR del sistema NBCW. Sincronizada desde sistema externo.';
COMMENT ON COLUMN tpr.fromd IS 'Codigo de yarda origen. Campo clave para filtrar por yarda asignada.';
COMMENT ON COLUMN tpr.status IS 'Estado del movimiento. OPEN = pendiente, CLOSED = completado.';
COMMENT ON COLUMN tpr.el IS 'Tipo de equipo: L=Loaded (cargado), E=Empty (vacio), " "=Bobtail/botado';
COMMENT ON COLUMN tpr.eqpcode IS 'Nomenclatura del equipo: CXT-####, CXC-####, R###, etc.';
COMMENT ON COLUMN tpr.synced_at IS 'Fecha/hora de la ultima sincronizacion desde NBCW real';

-- ============================================================
-- FIN DEL SCRIPT V2
-- Para ejecutar: psql -U username -d gpsactivity -f scripts/nbcw-v2-schema.sql
-- ============================================================
