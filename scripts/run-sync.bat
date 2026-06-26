@echo off
cd /d "C:\Users\Eduardo Aispuro\CascadeProjects\Crown-Xpress-Transport"
powershell -ExecutionPolicy Bypass -File scripts\sync-nbcw-to-neon.ps1
if %ERRORLEVEL% NEQ 0 (
    echo Error en sincronizacion
    exit /b %ERRORLEVEL%
)
echo Sincronizacion completada exitosamente
