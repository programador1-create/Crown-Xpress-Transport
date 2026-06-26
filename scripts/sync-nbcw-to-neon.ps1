# Script de sincronizacion NBCW (SQL Server) -> Neon (PostgreSQL)
# Corre este script cada 5 minutos con Task Scheduler

# Configuración
$SQLServer = "192.168.5.13"
$SQLInstance = "BKUPEXEC"
$SQLDatabase = "GPSActivity"
$SQLUser = "ccentral"
$SQLPassword = "Roncen810#"
$NeonConnectionString = "postgresql://neondb_owner:npg_hg6eq0tnsrpK@ep-shiny-grass-aq5qzmg9-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$SyncDays = 9999

# Logging
$LogDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $LogDir "sync.log"

function Write-Log {
    param([string]$Message)
    $LogMessage = "[$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "Iniciando sincronizacion tpr..."

try {
    # Conectar a SQL Server
    $SQLConnection = New-Object System.Data.SqlClient.SqlConnection
    $SQLConnection.ConnectionString = "Server=$SQLServer\$SQLInstance;Database=$SQLDatabase;User Id=$SQLUser;Password=$SQLPassword;TrustServerCertificate=True;Encrypt=False;"
    $SQLConnection.Open()
    Write-Log "Conectado a SQL Server NBCW"

    # Leer datos de tpr
    $SQLQuery = @"
        SELECT
            RTRIM(DRVCODE) AS driver_code,
            RTRIM(WONO) AS work_order,
            RTRIM(BLNO) AS bill_of_lading,
            RTRIM(FECHA) AS fecha_raw,
            RTRIM(FROMD) AS from_code,
            RTRIM(FROMCITY) AS from_city,
            RTRIM(FROMEDO) AS from_state,
            RTRIM(TOD) AS to_code,
            RTRIM(TOCITY) AS to_city,
            RTRIM(TOEDO) AS to_state,
            RTRIM(TIPMOV) AS movement_type,
            RTRIM(STATUS) AS status,
            RTRIM(EL) AS equipment_type,
            RTRIM(EQPCODE) AS equipment_code,
            RTRIM(DELDATE) AS deldate_raw,
            RTRIM(CSTMER) AS customer,
            RTRIM(TIMEARRV) AS arrival_time,
            RTRIM(TIMEDEPAR) AS departure_time,
            RTRIM(OPER) AS operator,
            RTRIM(TRUCKID) AS truck_id,
            RTRIM(SEAL) AS seal,
            RTRIM(INSTRUC1) AS instructions_1,
            RTRIM(INSTRUC2) AS instructions_2,
            RTRIM(AMOUNT) AS amount,
            RTRIM(TABLECODE) AS table_code,
            RTRIM(TRXCODE) AS trx_code
        FROM tpr
        ORDER BY FECHA DESC, TIMEARRV DESC
"@

    $SQLCommand = New-Object System.Data.SqlClient.SqlCommand($SQLQuery, $SQLConnection)
    $SQLAdapter = New-Object System.Data.SqlClient.SqlDataAdapter($SQLCommand)
    $DataSet = New-Object System.Data.DataSet
    $SQLAdapter.Fill($DataSet) | Out-Null
    $Rows = $DataSet.Tables[0].Rows
    Write-Log "Leidos $($Rows.Count) registros de SQL Server"

    if ($Rows.Count -eq 0) {
        Write-Log "No hay registros para sincronizar"
        $SQLConnection.Close()
        exit
    }

    # Filtrar por fecha (incluir todos los registros por ahora)
    $CutoffDate = (Get-Date).AddDays(-$SyncDays).ToString("yyyy-MM-dd")
    Write-Log "Filtrando registros desde $CutoffDate (ultimos $SyncDays dias)"

    # Incluir todos los registros por ahora para evitar problemas de formato de fecha
    $FilteredRows = $Rows
    Write-Log "$($FilteredRows.Count) registros dentro del rango de sincronizacion"

    if ($FilteredRows.Count -eq 0) {
        Write-Log "No hay registros dentro del rango para sincronizar"
        $SQLConnection.Close()
        exit
    }

    # Guardar datos en archivo JSON para que Node.js los procese
    Write-Log "Guardando datos en archivo JSON..."
    $JsonData = @()
    
    foreach ($Row in $FilteredRows) {
        $JsonData += [PSCustomObject]@{
            driver_code = $Row.driver_code
            work_order = $Row.work_order
            bill_of_lading = $Row.bill_of_lading
            fecha_raw = $Row.fecha_raw
            from_code = $Row.from_code
            from_city = $Row.from_city
            from_state = $Row.from_state
            to_code = $Row.to_code
            to_city = $Row.to_city
            to_state = $Row.to_state
            movement_type = $Row.movement_type
            status = $Row.status
            equipment_type = $Row.equipment_type
            equipment_code = $Row.equipment_code
            deldate_raw = $Row.deldate_raw
            customer = $Row.customer
            arrival_time = $Row.arrival_time
            departure_time = $Row.departure_time
            operator = $Row.operator
            truck_id = $Row.truck_id
            seal = $Row.seal
            instructions_1 = $Row.instructions_1
            instructions_2 = $Row.instructions_2
            amount = $Row.amount
            table_code = $Row.table_code
            trx_code = $Row.trx_code
        }
    }
    
    $JsonFile = Join-Path $LogDir "tpr-data.json"
    $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($JsonFile, ($JsonData | ConvertTo-Json -Depth 10), $Utf8NoBom)
    Write-Log "Datos guardados en $JsonFile ($($JsonData.Count) registros)"

    $SQLConnection.Close()
    Write-Log "Extraccion de SQL Server completada. Ejecutando insercion a Neon..."
    
    # Ejecutar script Node.js para insertar en Neon
    $NodeResult = node "$PSScriptRoot\sync-to-neon.js" "$JsonFile"
    Write-Log "Resultado de insercion a Neon: $NodeResult"
    Write-Log "Sincronizacion completa"

} catch {
    Write-Log "Error en sincronizacion: $_"
    exit 1
}
