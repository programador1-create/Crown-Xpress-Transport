# Script para iniciar SQL Proxy y Cloudflare Tunnel automáticamente
# y actualizar Vercel con la nueva URL del túnel

$ErrorActionPreference = "Stop"

# Configuración
$SQLPROXY_DIR = "C:\Users\Eduardo Aispuro\CascadeProjects\Crown-Xpress-Transport\sqlproxy"
$SQLSERVER_PASSWORD = "Roncen810#"
$LOG_FILE = "C:\Users\Eduardo Aispuro\CascadeProjects\Crown-Xpress-Transport\tunnel-log.txt"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $LOG_FILE -Append
    Write-Host "$timestamp - $message"
}

Write-Log "Iniciando script de túnel automático..."

# Detener procesos existentes
Write-Log "Deteniendo procesos existentes..."
try {
    Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*sqlproxy*" } | Stop-Process -Force
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
} catch {
    Write-Log "Error al detener procesos: $_"
}

# Iniciar SQL Proxy
Write-Log "Iniciando SQL Proxy..."
$env:SQLSERVER_PASSWORD = $SQLSERVER_PASSWORD
$proxyProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $SQLPROXY_DIR -PassThru -NoNewWindow
Write-Log "SQL Proxy iniciado con PID $($proxyProcess.Id)"
Start-Sleep -Seconds 3

# Verificar que SQL Proxy esté corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3099/tpr?type=pending" -TimeoutSec 5 -UseBasicParsing
    Write-Log "SQL Proxy respondiendo correctamente"
} catch {
    Write-Log "ERROR: SQL Proxy no respondió. Deteniendo script."
    exit 1
}

# Iniciar Cloudflare Tunnel
Write-Log "Iniciando Cloudflare Tunnel..."
$tunnelProcess = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:3099" -PassThru -NoNewWindow -RedirectStandardOutput $LOG_FILE -RedirectStandardError $LOG_FILE
Write-Log "Cloudflare Tunnel iniciado con PID $($tunnelProcess.Id)"
Start-Sleep -Seconds 10

# Esperar a que el túnel genere la URL
Write-Log "Esperando URL del túnel..."
$timeout = 30
$elapsed = 0
$tunnelUrl = $null

while ($elapsed -lt $timeout) {
    try {
        $logContent = Get-Content $LOG_FILE -Raw
        if ($logContent -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
            $tunnelUrl = $matches[0]
            Write-Log "URL del túnel encontrada: $tunnelUrl"
            break
        }
    } catch {
        # Ignorar errores de lectura del log
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
}

if (-not $tunnelUrl) {
    Write-Log "ERROR: No se pudo obtener la URL del túnel después de $timeout segundos"
    exit 1
}

# Actualizar Vercel
Write-Log "Actualizando SQLPROXY_URL en Vercel..."
try {
    # Eliminar variable existente
    echo "y" | npx vercel env rm SQLPROXY_URL production 2>&1 | Out-Null
    
    # Agregar nueva variable
    echo $tunnelUrl | npx vercel env add SQLPROXY_URL production 2>&1 | Out-Null
    
    Write-Log "Vercel actualizado exitosamente con URL: $tunnelUrl"
} catch {
    Write-Log "ERROR al actualizar Vercel: $_"
    exit 1
}

# Deployar a Vercel
Write-Log "Deployando a Vercel..."
try {
    npx vercel --prod 2>&1 | Out-File -FilePath $LOG_FILE -Append
    Write-Log "Deploy a Vercel completado exitosamente"
} catch {
    Write-Log "ERROR al deployar a Vercel: $_"
    exit 1
}

Write-Log "Script completado exitosamente. Túnel corriendo en: $tunnelUrl"
Write-Log "Procesos activos: SQL Proxy PID $($proxyProcess.Id), Tunnel PID $($tunnelProcess.Id)"
