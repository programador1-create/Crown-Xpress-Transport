-- Actualizar total_good, total_bad, total_pending en tabla inspections basado en inspection_points
-- Esto corrige el problema de que los conteos aparecen como 0 en la vista de supervisor

UPDATE inspections i
SET 
  total_good = counts.good,
  total_bad = counts.bad,
  total_pending = counts.pending
FROM (
  SELECT 
    ip.inspection_id,
    SUM(CASE WHEN ip.status = 'good' THEN 1 ELSE 0 END) as good,
    SUM(CASE WHEN ip.status = 'bad' THEN 1 ELSE 0 END) as bad,
    SUM(CASE WHEN ip.status = 'pending' THEN 1 ELSE 0 END) as pending
  FROM inspection_points ip
  GROUP BY ip.inspection_id
) counts
WHERE i.id = counts.inspection_id;

-- Verificar los cambios
SELECT id, trailer_number, total_good, total_bad, total_pending, status
FROM inspections 
WHERE id IN (37, 55, 56, 57, 58)
ORDER BY id;
