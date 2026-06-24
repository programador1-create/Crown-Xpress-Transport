-- Verificar conteos de puntos en inspecciones
SELECT id, trailer_number, total_good, total_bad, total_pending, status
FROM inspections 
WHERE id IN (37, 55, 56, 57, 58)
ORDER BY id;

-- Verificar conteo real de puntos desde inspection_points
SELECT ip.inspection_id, 
       SUM(CASE WHEN ip.status = 'good' THEN 1 ELSE 0 END) as actual_good,
       SUM(CASE WHEN ip.status = 'bad' THEN 1 ELSE 0 END) as actual_bad,
       SUM(CASE WHEN ip.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
       COUNT(*) as total_points
FROM inspection_points ip
WHERE ip.inspection_id IN (37, 55, 56, 57, 58)
GROUP BY ip.inspection_id
ORDER BY ip.inspection_id;
