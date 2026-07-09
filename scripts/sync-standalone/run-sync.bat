@echo off
setlocal

:: Ajusta esta ruta si mueves la carpeta a otro lugar
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Verificar que Node.js este instalado
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado. Descargalo de https://nodejs.org/
    exit /b 1
)

:: Verificar que exista .env
if not exist ".env" (
    echo ERROR: No se encontro el archivo .env. Copia env.example a .env y configuralo.
    exit /b 1
)

:: Ejecutar sincronizacion
node sync.js

if %ERRORLEVEL% NEQ 0 (
    echo Error en sincronizacion. Revisa logs\sync-*.log
    exit /b %ERRORLEVEL%
)

echo Sincronizacion completada exitosamente
endlocal
