-- Eliminar rol 'inspector' y consolidar en 'supervisor'
-- Los supervisores ahora pueden crear inspecciones y ver su historial
 
-- 1. Actualizar todos los usuarios con rol 'inspector' a 'supervisor'
UPDATE employees 
SET role = 'supervisor' 
WHERE role = 'inspector';
 
-- 2. Eliminar constraint existente
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
 
-- 3. Crear nueva constraint sin 'inspector'
ALTER TABLE employees 
ADD CONSTRAINT employees_role_check 
CHECK (role IN ('operator','guard','supervisor','admin'));
 
-- 4. Verificar cambios
SELECT role, COUNT(*) as count 
FROM employees 
GROUP BY role 
ORDER BY role;