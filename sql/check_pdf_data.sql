-- Verificar si los PDFs están guardados en la base de datos
SELECT id, trailer_number, inspection_type, pdf_filename,
       CASE
         WHEN pdf_data IS NOT NULL THEN 'YES'
         ELSE 'NO'
       END as pdf_exists,
       pdf_size_bytes,
       operator_name, guard_name, supervisor_name,
       total_good, total_bad, total_pending
FROM inspections
ORDER BY created_at DESC
LIMIT 20;
