# NBCW Sync Standalone

Carpeta independiente para sincronizar la tabla `tpr` de SQL Server (NBCW) a Neon PostgreSQL. Puedes copiar esta carpeta a cualquier PC con acceso a SQL Server y ejecutarla con el Programador de Tareas de Windows.

## Requisitos

- Windows 10/11 o Windows Server
- Node.js 18+ (descargar de https://nodejs.org/)
- Acceso de red a SQL Server NBCW
- Acceso a internet hacia Neon PostgreSQL

## Instalacion rapida

1. Copia esta carpeta completa al PC de sincronizacion, por ejemplo:
   ```
   C:\NBCW-Sync\
   ```

2. Abre una terminal en la carpeta y ejecuta:
   ```cmd
   npm install
   ```

3. Copia `env.example` a `.env` y completalo con tus datos:
   ```cmd
   copy env.example .env
   ```

4. Edita `.env`:
   ```env
   SQLSERVER_HOST=192.168.5.13
   SQLSERVER_INSTANCE=BKUPEXEC
   SQLSERVER_DATABASE=GPSActivity
   SQLSERVER_USER=sa
   SQLSERVER_PASSWORD=TU_PASSWORD
   DATABASE_URL=postgres://usuario:password@host.neon.tech/neondb?sslmode=require
   SQLSERVER_DATE_FORMAT=MDY
   TPR_SYNC_DAYS=30
   ```

5. Prueba manual:
   ```cmd
   run-sync.bat
   ```

## Idioma del servidor SQL Server (español)

Si el servidor SQL Server o Windows esta en español, las fechas pueden venir en formato `DD/MM/AAAA` en lugar de `MM/DD/AAAA`.

En ese caso, cambia en `.env`:
```env
SQLSERVER_DATE_FORMAT=DMY
```

El script intenta detectar automaticamente meses invalidos, pero esta configuracion asegura la interpretacion correcta.

## Programador de Tareas (Task Scheduler)

Para ejecutar cada minuto automaticamente:

1. Abre `Task Scheduler` (programador de tareas) como Administrador.
2. Crea una tarea basica:
   - **Nombre:** NBCW Sync
   - **Disparador:** Diariamente / cada 1 minuto
   - **Accion:** Iniciar un programa
   - **Programa/script:** `C:\NBCW-Sync\run-sync.bat`
   - **Iniciar en:** `C:\NBCW-Sync`

3. En la pestaña **General**, marca:
   - Ejecutar tanto si el usuario inicio sesion como si no
   - Ejecutar con privilegios mas altos

4. En la pestaña **Configuracion**, desactiva:
   - Detener la tarea si se ejecuta durante mas de X horas (o ponlo alto)

5. Guarda la tarea e ingresa las credenciales del usuario que ejecutara la tarea.

## Logs

Los logs se guardan en `logs/sync-YYYY-MM-DD_HH-MM-SS.log`.

## Archivos

- `sync.js` - Script principal de sincronizacion
- `run-sync.bat` - Archivo para ejecutar manualmente o desde Task Scheduler
- `env.example` - Ejemplo de variables de entorno
- `package.json` - Dependencias de Node.js
- `README.md` - Esta guia

## Solucion de problemas

**Error de conexion a SQL Server:**
- Verifica que el host, instancia y credenciales sean correctos.
- Asegurate de que el puerto TCP de SQL Server este abierto (1433 por defecto, o el puerto de la instancia nombrada).
- Si usas instancia nombrada, confirma que el SQL Server Browser este corriendo o especifica el puerto directamente.

**Error de conexion a Neon:**
- Verifica que `DATABASE_URL` sea correcta.
- Asegurate de que la PC tenga acceso a internet y que el firewall no bloquee el puerto 5432.

**Fechas incorrectas:**
- Prueba cambiar `SQLSERVER_DATE_FORMAT` entre `MDY` y `DMY`.
- Verifica con SQL Server Management Studio cual formato devuelve el campo `FECHA`.

## Nota sobre seguridad

No compartas el archivo `.env` ni subas credenciales a repositorios. Si necesitas versionarlo, usa unicamente `env.example` sin datos reales.
