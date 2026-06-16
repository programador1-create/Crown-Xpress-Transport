-- =====================================================
-- SCRIPT SEGURO PARA CAMBIAR "AUDITOR" POR "SUPERVISOR"
-- =====================================================

-- 0. Verificación inicial - mostrar todos los roles existentes
SELECT 'ROLES EXISTENTES ANTES DEL CAMBIO:' as info;
SELECT role, COUNT(*) as count 
FROM employees 
GROUP BY role 
ORDER BY role;

-- 1. Primero, actualizar todos los usuarios con rol 'auditor' a 'supervisor'
-- Esto debe hacerse ANTES de modificar la constraint
UPDATE employees 
SET role = 'supervisor' 
WHERE role = 'auditor';

-- 2. Encontrar y eliminar cualquier CHECK constraint que contenga 'role'
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Buscar constraints que contienen 'role' en el nombre o definición
    FOR constraint_name IN 
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'employees' 
        AND con.contype = 'c'
        AND (con.conname ILIKE '%role%' OR con.consrc ILIKE '%role%')
    LOOP
        EXECUTE 'ALTER TABLE employees DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Eliminada constraint: %', constraint_name;
    END LOOP;
END $$;

-- 3. Crear la nueva constraint con 'supervisor' en lugar de 'auditor'
ALTER TABLE employees 
ADD CONSTRAINT employees_role_check 
CHECK (role IN ('operator','guard','inspector','supervisor','admin'));

-- 4. Actualizar columnas en la tabla inspections
-- Renombrar auditor_name a supervisor_name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'auditor_name'
    ) THEN
        ALTER TABLE inspections RENAME COLUMN auditor_name TO supervisor_name;
    END IF;
END $$;

-- Renombrar auditor_signed_at a supervisor_signed_at
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'auditor_signed_at'
    ) THEN
        ALTER TABLE inspections RENAME COLUMN auditor_signed_at TO supervisor_signed_at;
    END IF;
END $$;

-- Renombrar auditor_id a supervisor_id (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'auditor_id'
    ) THEN
        ALTER TABLE inspections RENAME COLUMN auditor_id TO supervisor_id;
    END IF;
END $$;

-- 5. Actualizar el CHECK constraint de status si incluye 'audited'
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Buscar constraints de status que contengan 'audited'
    FOR constraint_name IN 
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'inspections' 
        AND con.contype = 'c'
        AND con.consrc ILIKE '%audited%'
    LOOP
        EXECUTE 'ALTER TABLE inspections DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Eliminada constraint de status: %', constraint_name;
    END LOOP;
    
    -- Crear nueva constraint si se eliminó alguna
    IF FOUND THEN
        ALTER TABLE inspections 
        ADD CONSTRAINT inspections_status_check 
        CHECK (status IN ('draft','completed','supervised','rejected','reconfirmed','superseded'));
    END IF;
END $$;

-- 6. Actualizar registros con status 'audited' a 'supervised'
UPDATE inspections 
SET status = 'supervised' 
WHERE status = 'audited';

-- 7. Actualizar comentarios de tablas
COMMENT ON TABLE employees IS 'Usuarios del sistema (guardias, inspectores, supervisores, admin)';

-- 8. Verificación final
SELECT 'USUARIOS ACTUALIZADOS A SUPERVISOR:' as info, COUNT(*) as count 
FROM employees 
WHERE role = 'supervisor';

SELECT 'INSPECCIONES CON SUPERVISOR:' as info, COUNT(*) as count 
FROM inspections 
WHERE supervisor_name IS NOT NULL;

SELECT 'ROLES DESPUÉS DEL CAMBIO:' as info;
SELECT role, COUNT(*) as count 
FROM employees 
GROUP BY role 
ORDER BY role;

-- 9. Mostrar usuarios supervisores
SELECT id, username, full_name, role, location_name 
FROM employees 
WHERE role = 'supervisor' 
ORDER BY id;

COMMIT;
