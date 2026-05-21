# Crown Xpress Inspection - Setup Local

## 1. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
API_PORT=3001
```

Para obtener `DATABASE_URL`:
1. Crea cuenta en https://neon.tech
2. Crea un proyecto nuevo
3. Copia el "Connection string" desde el dashboard

## 2. Aplicar Schema

Ejecuta los archivos SQL en orden contra Neon:

```bash
# Opción A: usando psql
psql $DATABASE_URL -f db/schema.sql
psql $DATABASE_URL -f db/seeds.sql

# Opción B: pega el contenido en SQL Editor de Neon
```

## 3. Iniciar desarrollo

```bash
npm install
npm run dev
```

Esto inicia:
- Frontend Vite en http://localhost:5173
- API Express en http://localhost:3001

## 4. Usuarios de prueba

| Usuario | Contraseña | Rol | Yarda |
|---|---|---|---|
| guardia01 | 1234 | Guardia | Yard A - Laredo |
| guardia02 | 1234 | Guardia | Yard A - Laredo |
| guardia03 | 1234 | Guardia | Yard B - El Paso |
| inspector01 | 1234 | Inspector | Yard A - Laredo |
| auditor01 | 1234 | Auditor | Todas las yardas |
| admin | admin | Admin | Todo |

## 5. Funcionalidades por rol

### Guardia / Inspector
- ✅ Crear nueva inspección
- ✅ Ver "Mi Historial" (solo sus propias inspecciones)
- ✅ Descargar PDFs
- ✅ Crear reconfirmaciones (correcciones)
- ❌ NO puede editar/borrar inspecciones pasadas

### Auditor
- ✅ Vista Auditor con todas las inspecciones
- ✅ Filtros por yarda, guardia, trailer, fecha, estado
- ✅ Agrupación por yarda/guardia/trailer
- ✅ Ver historial de auditoría completo
- ✅ Firmar como auditor

### Admin
- ✅ Todo lo anterior

## 6. Funcionalidades Nuevas

### Auto-colapso de Puntos
Los puntos completados se colapsan automáticamente para reducir scroll en móvil.
Click para expandir de nuevo si se necesita corregir.

### Reconfirmación
Si un reporte está mal, el guardia puede crear una **reconfirmación**:
1. Ir a "Mi Historial"
2. Expandir la inspección
3. Click "Crear Reconfirmación"
4. Modificar solo los puntos a corregir
5. Indicar razón (mínimo 10 caracteres)
6. Crear → se genera nuevo registro vinculado al original

El original queda marcado como `superseded` pero NO se borra.

### Yardas (Ubicaciones)
Lista predefinida de yardas:
- Yard A - Laredo
- Yard B - El Paso
- Yard C - Dallas
- Yard D - Houston
- Yard E - San Antonio

Se asigna automáticamente según la yarda del usuario.

### Campos Obligatorios (todos marcados con *)
- Trailer Number
- Seal Number
- Lock Number (opcional, "si aplica")
- Driver Name
- Inspection Date (auto-fill con fecha de hoy)
- Location/Yard (dropdown)
- Guard Name (auto-fill con usuario actual, readonly)

## 7. Despliegue Vercel

```bash
vercel
```

Configura la variable `DATABASE_URL` en el dashboard de Vercel.

## 8. Estructura de carpetas

```
.
├── api/                     # Endpoints serverless (Vercel)
│   ├── _lib/
│   │   ├── db.js           # Conexión Neon + audit log helper
│   │   └── handlers.js     # Lógica de los endpoints
│   └── index.js            # Router serverless
├── db/
│   ├── schema.sql          # Schema Postgres
│   └── seeds.sql           # Datos iniciales (yardas, usuarios)
├── src/
│   ├── components/         # Componentes React
│   ├── context/            # AuthContext, LanguageContext, InspectionContext
│   ├── data/               # Puntos de inspección + errores predefinidos
│   ├── i18n/               # Traducciones es/en
│   ├── utils/              # PDF generator, photo validator, API client
│   ├── App.jsx
│   └── main.jsx
├── server.js               # Express server local (mirror de Vercel)
├── vite.config.js
├── package.json
└── SETUP.md
```
