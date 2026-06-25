-- Actualizar equipment_nomenclature para inspecciones existentes

-- Para inspecciones de tipo CONTAINER, reconstruir la nomenclatura del trailer_number
-- Si el trailer_number es solo el número (ej: 184812), necesitamos reconstruir la nomenclatura completa
-- Esto es complejo porque no tenemos el prefijo original. Solo podemos actualizar si ya tiene formato de contenedor.

UPDATE inspections
SET equipment_nomenclature = trailer_number
WHERE inspection_type = 'CONTAINER' 
  AND trailer_number IS NOT NULL 
  AND trailer_number ~ '^[A-Z]{4}-\d{6}-\d$'
  AND (equipment_nomenclature IS NULL OR equipment_nomenclature = '');

-- Para inspecciones de tipo BOX, usar el trailer_number como nomenclatura
UPDATE inspections
SET equipment_nomenclature = trailer_number
WHERE inspection_type = 'BOX' 
  AND trailer_number IS NOT NULL 
  AND (equipment_nomenclature IS NULL OR equipment_nomenclature = '');

-- Para inspecciones de tipo BOBTAIL, usar tractor_number como nomenclatura
UPDATE inspections
SET equipment_nomenclature = tractor_number
WHERE inspection_type = 'BOBTAIL' 
  AND tractor_number IS NOT NULL 
  AND (equipment_nomenclature IS NULL OR equipment_nomenclature = '');

-- Para otras inspecciones, usar trailer_number o tractor_number como nomenclatura
UPDATE inspections
SET equipment_nomenclature = COALESCE(trailer_number, tractor_number)
WHERE equipment_nomenclature IS NULL OR equipment_nomenclature = '';

-- Verificar los cambios
SELECT 
  id, 
  inspection_type, 
  trailer_number, 
  tractor_number, 
  equipment_nomenclature,
  status,
  created_at
FROM inspections 
ORDER BY created_at DESC
LIMIT 20;
