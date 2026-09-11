# Variables de Entorno

## Vercel (Producción y Preview)

Configurar en: Vercel Dashboard → Settings → Environment Variables

| Variable | Descripción | Valor |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL IONOS | `postgresql://crown:<password>@db.crown-xpress-transport.app:443/crownxpress?sslmode=require` |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob Storage (PDFs) | Token de Vercel |
| `BLOB_STORE_ID` | ID del store de Blob | ID de Vercel |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Llave para webhooks de Blob | Llave de Vercel |

### Variables Eliminadas de Vercel

Estas variables ya NO se necesitan en Vercel (solo en el PC on-premise):

- `SQLSERVER_DATABASE`
- `SQLSERVER_USER`
- `SQLSERVER_PASSWORD`
- `SQLSERVER_INSTANCE`
- `TPR_SYNC_DAYS`

## PC On-Premise (Sync Script)

Configurar en: `C:\Users\Administrator\NBCW-Sync\sync-standalone\.env`

```env
# SQL Server NBCW (origen)
SQLSERVER_HOST=192.168.5.13
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=GPSActivity
SQLSERVER_USER=ccentral
SQLSERVER_PASSWORD=<password>

# PostgreSQL IONOS (destino)
DATABASE_URL=postgresql://crown:<password>@db.crown-xpress-transport.app:443/crownxpress?sslmode=require

# Días de historial a sincronizar
TPR_SYNC_DAYS=30

# Formato de fecha de SQL Server: MDY o DMY
SQLSERVER_DATE_FORMAT=MDY
```

## Desarrollo Local (.env en raíz del proyecto)

```env
DATABASE_URL=postgresql://crown:<password>@db.crown-xpress-transport.app:443/crownxpress?sslmode=require
BLOB_READ_WRITE_TOKEN=<vercel_blob_token>
BLOB_STORE_ID=<vercel_blob_store_id>
BLOB_WEBHOOK_PUBLIC_KEY=<vercel_blob_webhook_key>
API_PORT=3001
```

## IONOS VPS (/opt/crown-postgres/.env)

```env
POSTGRES_DB=crownxpress
POSTGRES_USER=crown
POSTGRES_PASSWORD=<password>
```

## Notas de Seguridad

- La password de PostgreSQL apareció en output durante la configuración; **rotar antes de producción**
- Los archivos `.env` están en `.gitignore` y no se commitean
- El acceso SSH al VPS usa clave pública (`id_ed25519`), no password
- La clave privada SSH permanece en el PC local, no en el servidor
