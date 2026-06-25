-- Verificar firmas en inspecciones
SELECT id, trailer_number, guard_name, guard_signature, guard_signed_at, 
       supervisor_name, supervisor_signature, supervisor_signed_at,
       operator_name, operator_signature, operator_signed_at
FROM inspections 
WHERE id IN (37, 55, 56, 57, 58)
ORDER BY id;
