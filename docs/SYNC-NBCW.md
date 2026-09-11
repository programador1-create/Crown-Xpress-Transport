# Sincronización NBCW → PostgreSQL

## Resumen

El script `sync-nbcw.js` sincroniza los movimientos TPR desde SQL Server (NBCW GPSActivity, on-premise) hacia PostgreSQL (IONOS). Esto permite que la API en Vercel consulte los movimientos sin conectarse directamente a SQL Server.

## Flujo

```
SQL Server NBCW (192.168.5.13:1433)
  │
  │ SELECT * FROM tpr (GPSActivity)
  ↓
Sync Script (Node.js en PC on-premise)
  │
  │ 1. Lee todos los registros de tpr
  │ 2. Filtra por TPR_SYNC_DAYS días hacia atrás
  │ 3. Normaliza fecha a YYYY-MM-DD
  │ 4. Genera sql_id (MD5 hash estable)
  │ 5. DELETE FROM tpr (en PostgreSQL)
  │ 6. INSERT en lotes de 1000
  ↓
PostgreSQL IONOS (db.crown-xpress-transport.app:443)
  │
  │ Tabla tpr con columnas originales de SQL Server
  │ + sql_id (hash MD5 de wono|truckid|fecha|fromd|tod|timearrv)
  │ + synced_at (timestamp)
  ↓
API /api/tpr (Vercel)
  │
  │ Lee tpr, cruza con inspections
  │ Filtra los ya inspeccionados por sql_id exacto
  ↓
Frontend muestra pendientes
```

## sql_id

El `sql_id` es un hash MD5 estable generado desde:

```
wono|truckid|fecha|fromd|tod|timearrv
```

- Es **estable** — el mismo movimiento siempre genera el mismo sql_id
- Es **único** — identifica un movimiento específico
- Permite que un movimiento inspeccionado no reaparezca
- Un movimiento nuevo con diferente sql_id sí aparece como pendiente

## Configuración

### PC On-Premise (`scripts/.env` o `sync-standalone/.env`)

```env
# SQL Server NBCW (origen)
SQLSERVER_HOST=192.168.5.13
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=GPSActivity
SQLSERVER_USER=ccentral
SQLSERVER_PASSWORD=<password>
# SQLSERVER_INSTANCE=BKUPEXEC  # Opcional si se usa puerto

# PostgreSQL IONOS (destino)
DATABASE_URL=postgresql://crown:<password>@db.crown-xpress-transport.app:443/crownxpress?sslmode=require

# Días de historial a sincronizar
TPR_SYNC_DAYS=30

# Formato de fecha de SQL Server
SQLSERVER_DATE_FORMAT=MDY
```

### Dependencias

```bash
npm install mssql pg dotenv
```

## Ejecución

### Manual

```bash
cd C:\Users\Administrator\NBCW-Sync\sync-standalone
node sync-nbcw.js
```

### Automática (Windows Task Scheduler)

1. Abrir Task Scheduler
2. Crear tarea básica
3. Programa: `C:\Users\Administrator\NBCW-Sync\sync-standalone\run-sync.bat`
4. Recurrencia: cada 1 minuto
5. El `.bat` ejecuta `node sync-nbcw.js`

### run-sync.bat

```bat
@echo off
setlocal
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
node sync-nbcw.js
if %ERRORLEVEL% NEQ 0 (
    echo Error en sincronizacion. Revisa logs\sync.log
    exit /b %ERRORLEVEL%
)
echo Sincronizacion completada exitosamente
endlocal
```

## Logs

- **Ubicación:** `logs/sync.log` (se sobrescribe cada ejecución)
- **Formato:** `[ISO timestamp] mensaje`
- **Incluye:** Conexión, registros leídos, insertados, errores

## Esquema de Tabla tpr (PostgreSQL)

```sql
CREATE TABLE tpr (
  id SERIAL PRIMARY KEY,
  sql_id VARCHAR(50),        -- Hash MD5 estable
  drvcode VARCHAR(50),       -- Código del conductor
  wono VARCHAR(50),          -- Work order
  blno VARCHAR(50),          -- Bill of lading
  fecha VARCHAR(12),         -- Fecha (YYYY-MM-DD normalizado)
  fromd VARCHAR(50),         -- Origen (código)
  fromcity VARCHAR(100),     -- Origen (ciudad)
  fromedo VARCHAR(50),       -- Origen (estado)
  tod VARCHAR(50),            -- Destino (código)
  tocity VARCHAR(100),        -- Destino (ciudad)
  toedo VARCHAR(50),         -- Destino (estado)
  tipmov VARCHAR(50),        -- Tipo de movimiento
  status VARCHAR(50),        -- Status
  el VARCHAR(50),            -- Equipo (L=cargado, E=vacío)
  eqpcode VARCHAR(100),      -- Código de equipo
  deldate VARCHAR(12),       -- Fecha de entrega
  cstmer VARCHAR(100),       -- Cliente
  timearrv VARCHAR(20),      -- Hora de llegada
  timedepar VARCHAR(20),     -- Hora de salida
  oper VARCHAR(50),          -- Operador
  truckid VARCHAR(50),       -- ID del tractor
  seal VARCHAR(50),           -- Sello
  instruc1 TEXT,              -- Instrucciones 1
  instruc2 TEXT,              -- Instrucciones 2
  amount VARCHAR(10),        -- Monto
  tablecode VARCHAR(50),     -- Código de tabla
  trxcode VARCHAR(50),       -- Código de transacción
  synced_at TIMESTAMP DEFAULT NOW()
);
```

## Notas Importantes

- La tabla `tpr` se **borra y reescribe** completa en cada sincronización (DELETE + INSERT)
- Se usa transacción (BEGIN/COMMIT) para rollback en caso de error
- Los nombres de columnas son los **originales de SQL Server** (drvcode, wono, etc.)
- La API hace `SELECT drvcode AS driver_code` para renombrar al exponer
- El formato de `fecha` es **YYYY-MM-DD** (normalizado por el sync script)
- `TPR_SYNC_DAYS=9999` sincroniza todo el historial disponible
