-- Verificar puntos de inspección para ID 58
SELECT * FROM inspection_points WHERE inspection_id = 58;

-- Verificar datos de la inspección
SELECT id, trailer_number, inspection_type, status, pdf_filename, pdf_size_bytes 
FROM inspections 
WHERE id = 58;

-- Contar puntos por inspección
SELECT inspection_id, COUNT(*) as point_count 
FROM inspection_points 
GROUP BY inspection_id 
ORDER BY inspection_id;
