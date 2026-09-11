-- ============================================================
-- Crown Xpress Transport · Seed Data
-- Ejecutar despues de db/schema.sql
-- ============================================================

-- Yardas (locations)
INSERT INTO locations (id, name, active) VALUES
(1, 'Yard A - Laredo', true),
(2, 'Yard B - El Paso', true),
(3, 'Yard C - Dallas', true),
(4, 'Yard D - Houston', true),
(5, 'Yard E - San Antonio', true)
ON CONFLICT (id) DO NOTHING;

-- Yardas de Crown (tabla yards)
INSERT INTO yards (name, code, type, is_active) VALUES
('YARDA 6 TIJUANA',     'CXT6',  'PHYSICAL', true),
('YARDA 12 EL PASO',     'CXT12', 'PHYSICAL', true),
('YARDA 13 DALLAS',      'CXT13', 'PHYSICAL', true),
('YARDA 17 HOUSTON',     'CXT17', 'PHYSICAL', true),
('YARDA 18 SAN ANTONIO', 'CXT18', 'PHYSICAL', true)
ON CONFLICT (code) DO NOTHING;

-- Usuarios (employees)
-- Nota: En produccion, usar bcrypt para generar hashes reales
-- Ejemplo: password_hash = await bcrypt.hash('password123', 10)
INSERT INTO employees (username, password_hash, full_name, role, location_id, active) VALUES
('guardia01',  '$2b$10$placeholder_hash_1',  'Carlos Mendoza',    'guard',      1, true),
('guardia02',  '$2b$10$placeholder_hash_2',  'Luis Hernandez',    'guard',      1, true),
('guardia03',  '$2b$10$placeholder_hash_3',  'Miguel Torres',     'guard',      2, true),
('guardia04',  '$2b$10$placeholder_hash_4',  'Pedro Ramirez',     'guard',      2, true),
('guardia05',  '$2b$10$placeholder_hash_5',  'Juan Lopez',        'guard',      3, true),
('guardia06',  '$2b$10$placeholder_hash_6',  'Antonio Garcia',    'guard',      3, true),
('guardia07',  '$2b$10$placeholder_hash_7',  'Roberto Diaz',      'guard',      4, true),
('guardia08',  '$2b$10$placeholder_hash_8',  'Francisco Ruiz',    'guard',      4, true),
('guardia09',  '$2b$10$placeholder_hash_9',  'Javier Morales',    'guard',      5, true),
('guardia10',  '$2b$10$placeholder_hash_10', 'Ricardo Silva',     'guard',      5, true),
('inspector01','$2b$10$placeholder_hash_11', 'Alberto Vargas',    'inspector',  1, true),
('inspector02','$2b$10$placeholder_hash_12', 'Daniel Castro',     'inspector',  2, true),
('inspector03','$2b$10$placeholder_hash_13', 'Oscar Mendez',      'inspector',  3, true),
('inspector04','$2b$10$placeholder_hash_14', 'Sergio Aguilar',    'inspector',  4, true),
('inspector05','$2b$10$placeholder_hash_15', 'Fernando Paredes',  'inspector',  5, true),
('auditor01',  '$2b$10$placeholder_hash_16', 'Roberto Sanchez',   'auditor',    1, true),
('auditor02',  '$2b$10$placeholder_hash_17', 'Guillermo Ortiz',   'auditor',    1, true),
('auditor03',  '$2b$10$placeholder_hash_18', 'Eduardo Mora',     'auditor',    1, true),
('admin',      '$2b$10$placeholder_hash_admin','Admin Crown',     'admin',     1, true),
('supervisor01','$2b$10$placeholder_hash_sup', 'Misael Supervisor','supervisor', 1, true)
ON CONFLICT (username) DO NOTHING;

-- Asignaciones de yardas (yard_assignments)
-- Asignar guardias a sus yardas
INSERT INTO yard_assignments (employee_id, yard_id, is_active) VALUES
((SELECT id FROM employees WHERE username = 'guardia01'),  (SELECT id FROM yards WHERE code = 'CXT6'),  true),
((SELECT id FROM employees WHERE username = 'guardia02'),  (SELECT id FROM yards WHERE code = 'CXT6'),  true),
((SELECT id FROM employees WHERE username = 'guardia03'),  (SELECT id FROM yards WHERE code = 'CXT12'), true),
((SELECT id FROM employees WHERE username = 'guardia04'),  (SELECT id FROM yards WHERE code = 'CXT12'), true),
((SELECT id FROM employees WHERE username = 'guardia05'),  (SELECT id FROM yards WHERE code = 'CXT13'), true),
((SELECT id FROM employees WHERE username = 'guardia06'),  (SELECT id FROM yards WHERE code = 'CXT13'), true),
((SELECT id FROM employees WHERE username = 'guardia07'),  (SELECT id FROM yards WHERE code = 'CXT17'), true),
((SELECT id FROM employees WHERE username = 'guardia08'),  (SELECT id FROM yards WHERE code = 'CXT17'), true),
((SELECT id FROM employees WHERE username = 'guardia09'),  (SELECT id FROM yards WHERE code = 'CXT18'), true),
((SELECT id FROM employees WHERE username = 'guardia10'),  (SELECT id FROM yards WHERE code = 'CXT18'), true),
((SELECT id FROM employees WHERE username = 'supervisor01'),(SELECT id FROM yards WHERE code = 'CXT6'),  true)
ON CONFLICT (employee_id, yard_id) DO NOTHING;
