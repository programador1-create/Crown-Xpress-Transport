# Crown Xpress Inspection - Setup Local

## 1. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BLOB_READ_WRITE_TOKEN=<vercel_blob_token>
BLOB_STORE_ID=<vercel_blob_store_id>
API_PORT=3001
```

## 2. Aplicar Schema

Ejecuta los archivos SQL en orden contra PostgreSQL:

```bash
psql $DATABASE_URL -f db/schema.sql
psql $DATABASE_URL -f db/seeds.sql
```

Para crear usuarios de produccion:

```bash
psql $DATABASE_URL -f db/create_users.sql
```

## 3. Iniciar desarrollo

```bash
npm install
npm run dev
```

Esto inicia:
- Frontend Vite en http://localhost:5173
- API Express en http://localhost:3001 (ejecutar por separado: `node server.js`)

## 4. Sincronizacion NBCW

El script `scripts/sync-nbcw-to-neon.js` sincroniza los movimientos TPR
desde SQL Server (NBCW GPSActivity) hacia PostgreSQL.

### Configuracion

Crea `scripts/.env`:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SQLSERVER_HOST=192.168.5.13
SQLSERVER_DATABASE=GPSActivity
SQLSERVER_USER=ccentral
SQLSERVER_PASSWORD=<password>
SQLSERVER_INSTANCE=BKUPEXEC
TPR_SYNC_DAYS=30
```

### Ejecutar

```bash
cd scripts
node sync-nbcw-to-neon.js
```

### Automatizar (Windows Task Scheduler)

Usa `scripts/run-sync.bat` o `scripts/sync-nbcw-to-neon.ps1` en Task Scheduler
con recurrencia de 1 minuto.

### Version standalone

`scripts/sync-standalone/` es una copia independiente para ejecutar en la
PC on-premise sin necesidad del repositorio completo.

## 5. Usuarios de prueba (seeds)

| Usuario | Rol | Yarda |
|---|---|---|
| guardia01 | Guardia | CXT6 |
| guardia02 | Guardia | CXT6 |
| supervisor01 | Supervisor | CXT6 |
| admin | Admin | Todas |

## 6. Funcionalidades por rol

### Guardia / Inspector
- Crear nueva inspeccion (20 puntos)
- Ver "Mi Historial" (solo sus inspecciones)
- Descargar PDFs
- Crear reconfirmaciones

### Supervisor
- Vista Supervisor (inspecciones de su yarda)
- Aprobar/rechazar inspecciones
- Firmar como supervisor

### Admin
- Todo lo anterior
- Metricas
- Gestion de usuarios
- Gestion de yardas
- Ver todas las inspecciones

## 7. Despliegue Vercel

```bash
vercel
```

Configura las variables de entorno en el dashboard de Vercel:
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`

## 8. PWA / Offline

La app es una PWA con soporte offline:
- Service Worker precachea el app shell
- IndexedDB guarda inspecciones pendientes
- Sync automatico al recuperar conexion
- El guardia debe cargar TPR mientras tiene internet antes de ir offline
