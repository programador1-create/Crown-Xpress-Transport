# Script para configurar el inicio automático del túnel
# Ejecutar este script una vez para configurar la tarea programada

$ErrorActionPreference = "Stop"

$SCRIPT_PATH = "C:\Users\Eduardo Aispuro\CascadeProjects\Crown-Xpress-Transport\start-tunnel.ps1"
$TASK_NAME = "CrownXpress-SQLProxy-Tunnel"

Write-Host "Configurando inicio automático del túnel..." -ForegroundColor Green

# Verificar que el script existe
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "ERROR: No se encontró el script $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

# Eliminar tarea existente si existe
try {
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Tarea existente eliminada" -ForegroundColor Yellow
} catch {
    # Ignorar si no existe
}

# Crear acción de PowerShell
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$SCRIPT_PATH`""

# Crear trigger: al inicio del sistema
$trigger = New-ScheduledTaskTrigger -AtStartup

# Configurar: ejecutar con el usuario actual, solo cuando esté conectado
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

# Configurar: no detener si está corriendo, permitir iniciar si está detenido
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Registrar la tarea
Register-ScheduledTask `
    -TaskName $TASK_NAME `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Inicia SQL Proxy y Cloudflare Tunnel automáticamente al inicio del sistema" | Out-Null

Write-Host "Tarea programada creada exitosamente: $TASK_NAME" -ForegroundColor Green
Write-Host "El túnel se iniciará automáticamente al reiniciar la PC" -ForegroundColor Green
Write-Host ""
Write-Host "Para probar manualmente:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName `"$TASK_NAME`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para ver el estado:" -ForegroundColor Yellow
Write-Host "  Get-ScheduledTask -TaskName `"$TASK_NAME`"" -ForegroundColor Yellow
