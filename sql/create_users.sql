-- =====================================================
-- CREAR USUARIOS EN NEON
-- Ejecutar en el SQL Editor de Neon
-- =====================================================

-- Paso 1: Agregar 'supervisor' al CHECK de roles
-- (Solo ejecutar si da error de constraint al insertar)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
  CHECK (role IN ('operator','guard','inspector','auditor','admin','supervisor'));

-- Paso 2: Insertar usuarios
INSERT INTO employees (username, password_hash, full_name, role, active) VALUES
('ADOLFO',   'AT40658',  'Adolfo',   'guard',      true),
('CRISTIAN', 'CRCN1480', 'Cristian', 'guard',      true),
('JESUS',    'JS9086',   'Jesus',    'guard',      true),
('MARIA',    'ML8047',   'Maria',    'guard',      true),
('RICARDO',  'RR1695',   'Ricardo',  'guard',      true),
('MISAEL',   'MS5487',   'Misael',   'supervisor', true)
ON CONFLICT (username) DO NOTHING;

-- Paso 3: Verificar
SELECT id, username, full_name, role, active FROM employees WHERE username IN ('ADOLFO','CRISTIAN','JESUS','MARIA','RICARDO','MISAEL') ORDER BY id;
