// Inspection types and their applicable points
export const INSPECTION_TYPES = {
  LOADED: {
    id: 'loaded',
    es: 'CARGADO',
    en: 'LOADED',
    description: {
      es: 'Trailer con carga - Requiere sello O candado',
      en: 'Trailer with cargo - Requires seal OR lock'
    },
    requiresSealOrLock: true,
    hasContainer: true,
    applicablePoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  },
  EMPTY: {
    id: 'empty',
    es: 'VACÍO',
    en: 'EMPTY',
    description: {
      es: 'Trailer sin carga - Sin sello ni candado',
      en: 'Empty trailer - No seal or lock'
    },
    requiresSealOrLock: false,
    hasContainer: true,
    applicablePoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] // Todos los 20 puntos
  },
  BOBTAIL: {
    id: 'bobtail',
    es: 'BOTADO',
    en: 'BOBTAIL',
    description: {
      es: 'Solo tractor - Sin trailer ni contenedor',
      en: 'Tractor only - No trailer or container'
    },
    requiresSealOrLock: false,
    hasContainer: false,
    applicablePoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Solo puntos del tractor
  },
  FLATBED: {
    id: 'flatbed',
    es: 'PLATAFORMA',
    en: 'FLATBED',
    description: {
      es: 'Plataforma abierta - Sin paredes ni techo',
      en: 'Open flatbed - No walls or roof'
    },
    requiresSealOrLock: false,
    hasContainer: false,
    applicablePoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 17, 18] // Tractor (1-10) + Chasis (11) + Parte Trasera (12) + Plataforma (14) + Piso Plat. (17) + Patín (18). Excluye: 13, 15, 16 (paredes laterales, frente), 19-20 (refrigeración, limpieza)
  },
  RABON: {
    id: 'rabon',
    es: 'RABÓN',
    en: 'RABON',
    description: {
      es: 'Camión rígido - Tractor y chasis integrados',
      en: 'Rigid truck - Tractor and chassis integrated'
    },
    requiresSealOrLock: false,
    hasContainer: false,
    applicablePoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 17, 18] // Similar a FLATBED: Tractor (1-10) + Chasis (11) + Parte Trasera (12) + Plataforma/Caja (14) + Piso (17) + Patín (18)
  }
}

// Helper to get applicable points for an inspection type
export const getApplicablePoints = (inspectionType) => {
  const type = INSPECTION_TYPES[inspectionType?.toUpperCase()] || INSPECTION_TYPES.LOADED
  return inspectionPoints.filter(p => type.applicablePoints.includes(p.id))
}

// 20 Point Inspection - Bilingual (ES/EN) with specific issues per point
export const inspectionPoints = [
  { 
    id: 1, es: 'Defensa', en: 'Bumper', area: 'tractor',
    keywords: ['bumper', 'defensa', 'front', 'frontal', 'parachoques'],
    issues: [
      { id: 101, es: 'Defensa dañada o abollada', en: 'Damaged or dented bumper' },
      { id: 102, es: 'Defensa suelta o mal fijada', en: 'Loose or poorly secured bumper' },
      { id: 103, es: 'Defensa con óxido o corrosión', en: 'Bumper with rust or corrosion' },
      { id: 104, es: 'Defensa faltante o incompleta', en: 'Missing or incomplete bumper' },
      { id: 199, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 2, es: 'Llantas y Rines (Tractor y Remolque)', en: 'Tires and Rims (Tractor and Trailer)', area: 'both',
    keywords: ['tire', 'llanta', 'rim', 'rin', 'wheel', 'rueda'],
    issues: [
      { id: 201, es: 'Llanta desgastada o lisa', en: 'Worn or bald tire' },
      { id: 202, es: 'Llanta con daño lateral', en: 'Tire with sidewall damage' },
      { id: 203, es: 'Rin dañado o doblado', en: 'Damaged or bent rim' },
      { id: 204, es: 'Presión de aire incorrecta', en: 'Incorrect air pressure' },
      { id: 205, es: 'Tuercas flojas o faltantes', en: 'Loose or missing lug nuts' },
      { id: 299, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 3, es: 'Piso (Tractor)', en: 'Floor (Tractor)', area: 'tractor',
    keywords: ['floor', 'piso', 'cab floor', 'tractor floor', 'alfombra'],
    issues: [
      { id: 301, es: 'Piso sucio o con residuos', en: 'Dirty floor or debris' },
      { id: 302, es: 'Piso dañado o con hoyos', en: 'Damaged floor or holes' },
      { id: 303, es: 'Alfombra rota o faltante', en: 'Torn or missing carpet' },
      { id: 304, es: 'Objetos sueltos en el piso', en: 'Loose objects on floor' },
      { id: 399, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 4, es: 'Tanques de Diesel', en: 'Fuel Tanks', area: 'tractor',
    keywords: ['fuel', 'diesel', 'tank', 'tanque', 'combustible'],
    issues: [
      { id: 401, es: 'Fuga de combustible', en: 'Fuel leak' },
      { id: 402, es: 'Tanque dañado o abollado', en: 'Damaged or dented tank' },
      { id: 403, es: 'Tapa de tanque faltante o dañada', en: 'Missing or damaged fuel cap' },
      { id: 404, es: 'Corrosión en el tanque', en: 'Tank corrosion' },
      { id: 405, es: 'Soportes del tanque dañados', en: 'Damaged tank straps/mounts' },
      { id: 499, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 5, es: 'Compartimentos del interior de la cabina, dormitorio, puertas y compartimentos de herramientas, sección de pasajero y techo', en: 'Cab / Storage areas — Compartments of the cabin interior, sleeper, doors and tool compartments, passenger section and roof', area: 'tractor',
    keywords: ['cab', 'cabina', 'sleeper', 'dormitorio', 'interior', 'compartment', 'storage'],
    issues: [
      { id: 501, es: 'Compartimentos sucios', en: 'Dirty compartments' },
      { id: 502, es: 'Objetos no autorizados encontrados', en: 'Unauthorized objects found' },
      { id: 503, es: 'Daño en puertas o cerraduras', en: 'Door or lock damage' },
      { id: 504, es: 'Techo interior dañado', en: 'Damaged interior roof' },
      { id: 505, es: 'Asientos dañados o sucios', en: 'Damaged or dirty seats' },
      { id: 599, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 6, es: 'Tanques de Aire', en: 'Air Tanks', area: 'tractor',
    keywords: ['air tank', 'tanque de aire', 'air reservoir', 'brake tank'],
    issues: [
      { id: 601, es: 'Fuga de aire detectada', en: 'Air leak detected' },
      { id: 602, es: 'Tanque con corrosión', en: 'Tank with corrosion' },
      { id: 603, es: 'Válvula de drenaje dañada', en: 'Damaged drain valve' },
      { id: 604, es: 'Soportes del tanque dañados', en: 'Damaged tank mounts' },
      { id: 699, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 7, es: 'Chasis y Área de la Quinta Rueda', en: 'Fifth Wheel — Chassis and Fifth Wheel Area', area: 'tractor',
    keywords: ['fifth wheel', 'quinta rueda', 'chassis', 'chasis', 'kingpin'],
    issues: [
      { id: 701, es: 'Quinta rueda con desgaste excesivo', en: 'Fifth wheel with excessive wear' },
      { id: 702, es: 'Falta de lubricación', en: 'Lack of lubrication' },
      { id: 703, es: 'Mecanismo de bloqueo dañado', en: 'Damaged locking mechanism' },
      { id: 704, es: 'Grietas en el chasis', en: 'Chassis cracks' },
      { id: 705, es: 'Tornillos flojos o faltantes', en: 'Loose or missing bolts' },
      { id: 799, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 8, es: 'Ejes de Transmisión', en: 'Drive Shafts', area: 'tractor',
    keywords: ['drive shaft', 'eje', 'transmission', 'transmisión', 'u-joint'],
    issues: [
      { id: 801, es: 'Vibración anormal', en: 'Abnormal vibration' },
      { id: 802, es: 'Crucetas desgastadas', en: 'Worn U-joints' },
      { id: 803, es: 'Fuga de grasa', en: 'Grease leak' },
      { id: 804, es: 'Eje dañado o doblado', en: 'Damaged or bent shaft' },
      { id: 899, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 9, es: 'Escape', en: 'Exhaust', area: 'tractor',
    keywords: ['exhaust', 'escape', 'muffler', 'silenciador', 'pipe', 'tubo'],
    issues: [
      { id: 901, es: 'Fuga de escape', en: 'Exhaust leak' },
      { id: 902, es: 'Tubo de escape dañado', en: 'Damaged exhaust pipe' },
      { id: 903, es: 'Silenciador suelto', en: 'Loose muffler' },
      { id: 904, es: 'Corrosión excesiva', en: 'Excessive corrosion' },
      { id: 999, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 10, es: 'Motor / Caja de la Batería / Caja y Filtros de Aire', en: 'Engine / Battery Box / Air Filter Box', area: 'tractor',
    keywords: ['engine', 'motor', 'battery', 'batería', 'air filter', 'filtro'],
    issues: [
      { id: 1001, es: 'Fuga de aceite en motor', en: 'Engine oil leak' },
      { id: 1002, es: 'Batería dañada o corroída', en: 'Damaged or corroded battery' },
      { id: 1003, es: 'Filtro de aire sucio', en: 'Dirty air filter' },
      { id: 1004, es: 'Cables sueltos o dañados', en: 'Loose or damaged cables' },
      { id: 1005, es: 'Nivel de fluidos bajo', en: 'Low fluid levels' },
      { id: 1099, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 11, es: 'Base del Remolque (Outside / Under Carriage)', en: 'Outside / Under Carriage — Trailer Base', area: 'trailer',
    keywords: ['undercarriage', 'base', 'trailer base', 'underneath', 'debajo'],
    issues: [
      { id: 1101, es: 'Daño estructural en la base', en: 'Structural damage to base' },
      { id: 1102, es: 'Corrosión en vigas', en: 'Beam corrosion' },
      { id: 1103, es: 'Objetos extraños adheridos', en: 'Foreign objects attached' },
      { id: 1104, es: 'Falta de puntos de soldadura', en: 'Missing weld points' },
      { id: 1199, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 12, es: 'Puertas Exteriores e Interiores', en: 'Outside / Inside Doors', area: 'trailer',
    keywords: ['door', 'puerta', 'hinge', 'bisagra', 'seal', 'sello'],
    issues: [
      { id: 1201, es: 'Daño en empaques de puertas', en: 'Door seal damage' },
      { id: 1202, es: 'Bisagras dañadas o flojas', en: 'Damaged or loose hinges' },
      { id: 1203, es: 'Puerta no cierra correctamente', en: 'Door does not close properly' },
      { id: 1204, es: 'Filtración de luz visible', en: 'Visible light leak' },
      { id: 1205, es: 'Cerradura dañada', en: 'Damaged lock' },
      { id: 1299, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 13, es: 'Pared Lateral Derecha', en: 'Right Side Wall', area: 'trailer',
    keywords: ['right wall', 'pared derecha', 'side wall', 'lateral', 'panel'],
    issues: [
      { id: 1301, es: 'Abolladuras o daños en panel', en: 'Dents or panel damage' },
      { id: 1302, es: 'Filtración de luz', en: 'Light leak' },
      { id: 1303, es: 'Corrosión o óxido', en: 'Corrosion or rust' },
      { id: 1304, es: 'Remaches flojos o faltantes', en: 'Loose or missing rivets' },
      { id: 1399, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 14, es: 'Techos Interno y Externo', en: 'Ceiling / Roof — Internal and External', area: 'trailer',
    keywords: ['roof', 'techo', 'ceiling', 'top', 'superior'],
    issues: [
      { id: 1401, es: 'Daño en techo exterior', en: 'External roof damage' },
      { id: 1402, es: 'Filtración de agua', en: 'Water leak' },
      { id: 1403, es: 'Techo interior sucio o dañado', en: 'Dirty or damaged interior ceiling' },
      { id: 1404, es: 'Hoyos o perforaciones', en: 'Holes or perforations' },
      { id: 1499, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 15, es: 'Pared Frontal', en: 'Front Wall', area: 'trailer',
    keywords: ['front wall', 'pared frontal', 'headboard', 'cabecera'],
    issues: [
      { id: 1501, es: 'Daño en pared frontal', en: 'Front wall damage' },
      { id: 1502, es: 'Filtración de luz', en: 'Light leak' },
      { id: 1503, es: 'Remaches flojos', en: 'Loose rivets' },
      { id: 1504, es: 'Suciedad o residuos', en: 'Dirt or debris' },
      { id: 1599, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 16, es: 'Pared Lateral Izquierda', en: 'Left Side Wall', area: 'trailer',
    keywords: ['left wall', 'pared izquierda', 'side wall', 'lateral', 'panel'],
    issues: [
      { id: 1601, es: 'Abolladuras o daños en panel', en: 'Dents or panel damage' },
      { id: 1602, es: 'Filtración de luz', en: 'Light leak' },
      { id: 1603, es: 'Corrosión o óxido', en: 'Corrosion or rust' },
      { id: 1604, es: 'Remaches flojos o faltantes', en: 'Loose or missing rivets' },
      { id: 1699, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 17, es: 'Piso Interior', en: 'Interior Floor', area: 'trailer',
    keywords: ['interior floor', 'piso interior', 'floor', 'piso', 'trailer floor'],
    issues: [
      { id: 1701, es: 'Piso dañado o con hoyos', en: 'Damaged floor or holes' },
      { id: 1702, es: 'Piso sucio o contaminado', en: 'Dirty or contaminated floor' },
      { id: 1703, es: 'Tablas flojas o rotas', en: 'Loose or broken boards' },
      { id: 1704, es: 'Residuos de carga anterior', en: 'Previous cargo residue' },
      { id: 1799, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 18, es: 'Eje o Placa del Patín', en: 'Landing Gear Axle or Plate', area: 'trailer',
    keywords: ['landing gear', 'patín', 'leg', 'pata', 'support'],
    issues: [
      { id: 1801, es: 'Patín dañado o doblado', en: 'Damaged or bent landing gear' },
      { id: 1802, es: 'Manivela difícil de operar', en: 'Crank difficult to operate' },
      { id: 1803, es: 'Falta de lubricación', en: 'Lack of lubrication' },
      { id: 1804, es: 'Placa de soporte dañada', en: 'Damaged support plate' },
      { id: 1899, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 19, es: 'Unidad de Refrigeración', en: 'Refrigeration Unit', area: 'trailer',
    keywords: ['refrigeration', 'refrigeración', 'reefer', 'thermo', 'cooling'],
    issues: [
      { id: 1901, es: 'Unidad no enciende', en: 'Unit does not start' },
      { id: 1902, es: 'Fuga de refrigerante', en: 'Refrigerant leak' },
      { id: 1903, es: 'Ruido anormal', en: 'Abnormal noise' },
      { id: 1904, es: 'Temperatura incorrecta', en: 'Incorrect temperature' },
      { id: 1905, es: 'Daño visible en unidad', en: 'Visible unit damage' },
      { id: 1999, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
  { 
    id: 20, es: 'Limpieza Interior de la Caja / Trailer (Plantas, hierbas, animales, insectos, roedores)', en: 'Trailer Cleanliness (Plants, herbs, animals, insects, rodents)', area: 'trailer',
    keywords: ['cleanliness', 'limpieza', 'clean', 'pest', 'insect', 'rodent', 'contamination'],
    issues: [
      { id: 2001, es: 'Presencia de insectos', en: 'Insect presence' },
      { id: 2002, es: 'Evidencia de roedores', en: 'Rodent evidence' },
      { id: 2003, es: 'Residuos de plantas o hierbas', en: 'Plant or herb residue' },
      { id: 2004, es: 'Telarañas visibles', en: 'Visible cobwebs' },
      { id: 2005, es: 'Contaminación orgánica', en: 'Organic contamination' },
      { id: 2006, es: 'Olores desagradables', en: 'Unpleasant odors' },
      { id: 2099, es: 'OTRO (ESPECIFICAR)', en: 'OTHER (SPECIFY)', isOther: true },
    ]
  },
]

// Helper function to get issues for a specific point
export const getIssuesForPoint = (pointId) => {
  const point = inspectionPoints.find(p => p.id === pointId)
  return point?.issues || []
}

// Legacy errorReports for backward compatibility (deprecated)
export const errorReports = inspectionPoints.flatMap(p => p.issues)
