# Sincronizacion NBCW -> Neon

Este script copia datos de la tabla `tpr` de SQL Server (NBCW) a una tabla `tpr` en Neon (PostgreSQL), para que Vercel pueda consultar los datos sin depender de túneles.

## Variables de entorno

Crear un archivo `.env` en la carpeta `scripts/` con estas variables:

```env
# SQL Server NBCW
SQLSERVER_HOST=192.168.5.13
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=GPSActivity
SQLSERVER_INSTANCE=BKUPEXEC
SQLSERVER_USER=ccentral
SQLSERVER_PASSWORD=TU_PASSWORD

# Neon PostgreSQL
DATABASE_URL=postgres://usuario:password@host.neon.tech/basedatos?sslmode=require
```

## Uso manual

```bash
npm run sync:nbcw
```

O directamente:

```bash
cd scripts
node sync-nbcw-to-neon.js
```

## Programar con cron (cada 1 minuto)

En Linux/Raspberry Pi:

```bash
crontab -e
```

Agregar esta linea:

```cron
* * * * * cd /ruta/al/proyecto && npm run sync:nbcw >> /ruta/al/proyecto/scripts/sync.log 2>&1
```

## Requisitos

- Node.js instalado
- Dependencias del proyecto instaladas (`npm install`)
- Acceso a SQL Server desde la red donde corre el script
- Acceso a internet para conectar con Neon
