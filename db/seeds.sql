-- Seed data for Crown Xpress Inspection
-- Run after schema.sql

-- Yardas (locations)
INSERT INTO locations (id, name, active) VALUES
(1, 'Yard A - Laredo', true),
(2, 'Yard B - El Paso', true),
(3, 'Yard C - Dallas', true),
(4, 'Yard D - Houston', true),
(5, 'Yard E - San Antonio', true);

-- Usuarios: Guardias
INSERT INTO users (id, username, password_hash, full_name, role, location_id, active) VALUES
(101, 'guardia01', '$2b$10$placeholder_hash_1', 'Carlos Mendoza', 'guard', 1, true),
(102, 'guardia02', '$2b$10$placeholder_hash_2', 'Luis Hernandez', 'guard', 1, true),
(103, 'guardia03', '$2b$10$placeholder_hash_3', 'Miguel Torres', 'guard', 2, true),
(104, 'guardia04', '$2b$10$placeholder_hash_4', 'Pedro Ramirez', 'guard', 2, true),
(105, 'guardia05', '$2b$10$placeholder_hash_5', 'Juan Lopez', 'guard', 3, true),
(106, 'guardia06', '$2b$10$placeholder_hash_6', 'Antonio Garcia', 'guard', 3, true),
(107, 'guardia07', '$2b$10$placeholder_hash_7', 'Roberto Diaz', 'guard', 4, true),
(108, 'guardia08', '$2b$10$placeholder_hash_8', 'Francisco Ruiz', 'guard', 4, true),
(109, 'guardia09', '$2b$10$placeholder_hash_9', 'Javier Morales', 'guard', 5, true),
(110, 'guardia10', '$2b$10$placeholder_hash_10', 'Ricardo Silva', 'guard', 5, true);

-- Usuarios: Inspectores
INSERT INTO users (id, username, password_hash, full_name, role, location_id, active) VALUES
(201, 'inspector01', '$2b$10$placeholder_hash_11', 'Alberto Vargas', 'inspector', 1, true),
(202, 'inspector02', '$2b$10$placeholder_hash_12', 'Daniel Castro', 'inspector', 2, true),
(203, 'inspector03', '$2b$10$placeholder_hash_13', 'Oscar Mendez', 'inspector', 3, true),
(204, 'inspector04', '$2b$10$placeholder_hash_14', 'Sergio Aguilar', 'inspector', 4, true),
(205, 'inspector05', '$2b$10$placeholder_hash_15', 'Fernando Paredes', 'inspector', 5, true);

-- Usuarios: Auditores (pueden ver todas las yardas)
INSERT INTO users (id, username, password_hash, full_name, role, location_id, active) VALUES
(301, 'auditor01', '$2b$10$placeholder_hash_16', 'Roberto Sanchez', 'auditor', 1, true),
(302, 'auditor02', '$2b$10$placeholder_hash_17', 'Guillermo Ortiz', 'auditor', 1, true),
(303, 'auditor03', '$2b$10$placeholder_hash_18', 'Eduardo Mora', 'auditor', 1, true);

-- Usuarios: Admin
INSERT INTO users (id, username, password_hash, full_name, role, location_id, active) VALUES
(401, 'admin', '$2b$10$placeholder_hash_admin', 'Admin Crown', 'admin', 1, true);

-- Nota: En producción, usar bcrypt para generar hashes reales
-- Ejemplo: password_hash = await bcrypt.hash('password123', 10)
