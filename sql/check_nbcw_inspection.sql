-- Verificar datos de la inspección más reciente (ID 1 según vista supervisor)
SELECT id, trailer_number, tractor_number, container_number, 
       driver_name, seal_number, lock_number, location, inspection_type, 
       inspection_date, total_good, total_bad, total_pending, status,
       operator_name, guard_name, supervisor_name
FROM inspections 
WHERE id = 1
ORDER BY id DESC
LIMIT 1;

-- Verificar puntos de la inspección
SELECT point_id, status, issue_id, issue_text
FROM inspection_points 
WHERE inspection_id = 1
ORDER BY point_id;
