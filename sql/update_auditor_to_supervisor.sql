-- =====================================================
-- SCRIPT PARA CAMBIAR "AUDITOR" POR "SUPERVISOR"
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

-- 2. Actualizar el CHECK constraint en la tabla employees
-- Nota: PostgreSQL no permite modificar CHECK constraints directamente,
-- así que necesitamos eliminar y recrear la constraint

-- Primero, eliminar la constraint actual (ajustar el nombre según sea necesario)
DO $$
BEGIN
    -- Buscar y eliminar la constraint si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'employees_role_check'
    ) THEN
        ALTER TABLE employees DROP CONSTRAINT employees_role_check;
    END IF;
    
    -- Crear la nueva constraint con 'supervisor' en lugar de 'auditor'
    ALTER TABLE employees 
    ADD CONSTRAINT employees_role_check 
    CHECK (role IN ('operator','guard','inspector','supervisor','admin'));
END $$;

-- 3. Actualizar columnas en la tabla inspections
-- Renombrar auditor_name a supervisor_name
ALTER TABLE inspections RENAME COLUMN auditor_name TO supervisor_name;

-- Renombrar auditor_signed_at a supervisor_signed_at
ALTER TABLE inspections RENAME COLUMN auditor_signed_at TO supervisor_signed_at;

-- Renombrar auditor_id a supervisor_id (si existe)
-- Nota: Revisar si esta columna existe en el esquema actual
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspections' AND column_name = 'auditor_id'
    ) THEN
        ALTER TABLE inspections RENAME COLUMN auditor_id TO supervisor_id;
    END IF;
END $$;

-- 4. Actualizar el CHECK constraint de status si incluye 'audited'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'inspections_status_check'
    ) THEN
        ALTER TABLE inspections DROP CONSTRAINT inspections_status_check;
        
        ALTER TABLE inspections 
        ADD CONSTRAINT inspections_status_check 
        CHECK (status IN ('draft','completed','supervised','rejected','reconfirmed','superseded'));
    END IF;
END $$;

-- 5. Actualizar registros con status 'audited' a 'supervised'
UPDATE inspections 
SET status = 'supervised' 
WHERE status = 'audited';

-- 6. Actualizar comentarios de tablas
COMMENT ON TABLE employees IS 'Usuarios del sistema (guardias, inspectores, supervisores, admin)';

-- 7. Verificar los cambios
SELECT 'Usuarios actualizados:' as info, COUNT(*) as count 
FROM employees 
WHERE role = 'supervisor';

SELECT 'Inspecciones con supervisor:' as info, COUNT(*) as count 
FROM inspections 
WHERE supervisor_name IS NOT NULL;

-- 8. Mostrar usuarios supervisores
SELECT id, username, full_name, role, location_name 
FROM employees 
WHERE role = 'supervisor' 
ORDER BY id;

COMMIT;
