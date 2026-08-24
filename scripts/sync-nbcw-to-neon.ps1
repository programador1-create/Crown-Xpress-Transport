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
    try {
        Add-Content -Path $LogFile -Value $LogMessage -ErrorAction Stop
    } catch {
        # Si el archivo está bloqueado, solo mostrar en consola
        Write-Host "Warning: No se pudo escribir al log (archivo bloqueado)"
    }
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
    Write-Log "Extraccion de SQL Server completada ($($JsonData.Count) registros). Insertando directamente a Neon..."

    # Insercion directa a Neon via API HTTP nativa (sin dependencia de Node.js/npm)
    $uriMatch = [regex]::Match($NeonConnectionString, '@([^/:]+)')
    $dbHost = $uriMatch.Groups[1].Value
    $httpHost = $dbHost -replace '-pooler', ''
    $NeonHttpEndpoint = "https://$httpHost/sql"

    function Execute-NeonQuery([string]$sqlQuery) {
        $headers = @{
            "Neon-Connection-String" = $NeonConnectionString
            "Content-Type" = "application/json"
        }
        $body = @{ query = $sqlQuery } | ConvertTo-Json
        return Invoke-RestMethod -Uri $NeonHttpEndpoint -Method Post -Headers $headers -Body $body
    }

    function Escape-Sql([string]$val) {
        if ($null -eq $val) { return "NULL" }
        $trimmed = $val.Trim()
        if ($trimmed -eq "") { return "NULL" }
        return "'" + $trimmed.Replace("'", "''") + "'"
    }

    # Asegurar schema correcto de la tabla tpr
    $createTableQuery = @"
    CREATE TABLE IF NOT EXISTS tpr (
        id SERIAL PRIMARY KEY,
        drvcode VARCHAR(50),
        wono VARCHAR(50),
        blno VARCHAR(50),
        fecha VARCHAR(12),
        fromd VARCHAR(50),
        fromcity VARCHAR(100),
        fromedo VARCHAR(50),
        tod VARCHAR(50),
        tocity VARCHAR(100),
        toedo VARCHAR(50),
        tipmov VARCHAR(50),
        status VARCHAR(50),
        el VARCHAR(50),
        eqpcode VARCHAR(100),
        deldate VARCHAR(12),
        cstmer VARCHAR(100),
        timearrv VARCHAR(20),
        timedepar VARCHAR(20),
        oper VARCHAR(50),
        truckid VARCHAR(50),
        seal VARCHAR(50),
        instruc1 TEXT,
        instruc2 TEXT,
        amount VARCHAR(10),
        tablecode VARCHAR(50),
        trxcode VARCHAR(50),
        synced_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
"@
    Execute-NeonQuery $createTableQuery | Out-Null
    Execute-NeonQuery "TRUNCATE TABLE tpr" | Out-Null

    # Insertar en lotes de 100 registros
    $batchSize = 100
    $totalInserted = 0
    $columns = "drvcode, wono, blno, fecha, fromd, fromcity, fromedo, tod, tocity, toedo, tipmov, status, el, eqpcode, deldate, cstmer, timearrv, timedepar, oper, truckid, seal, instruc1, instruc2, amount, tablecode, trxcode, synced_at"

    for ($i = 0; $i -lt $JsonData.Count; $i += $batchSize) {
        $countInBatch = [Math]::Min($batchSize, $JsonData.Count - $i)
        $batch = $JsonData[$i..($i + $countInBatch - 1)]
        $valuesList = @()

        foreach ($row in $batch) {
            $vals = @(
                (Escape-Sql $row.driver_code),
                (Escape-Sql $row.work_order),
                (Escape-Sql $row.bill_of_lading),
                (Escape-Sql $row.fecha_raw),
                (Escape-Sql $row.from_code),
                (Escape-Sql $row.from_city),
                (Escape-Sql $row.from_state),
                (Escape-Sql $row.to_code),
                (Escape-Sql $row.to_city),
                (Escape-Sql $row.to_state),
                (Escape-Sql $row.movement_type),
                (Escape-Sql $row.status),
                (Escape-Sql $row.equipment_type),
                (Escape-Sql $row.equipment_code),
                (Escape-Sql $row.deldate_raw),
                (Escape-Sql $row.customer),
                (Escape-Sql $row.arrival_time),
                (Escape-Sql $row.departure_time),
                (Escape-Sql $row.operator),
                (Escape-Sql $row.truck_id),
                (Escape-Sql $row.seal),
                (Escape-Sql $row.instructions_1),
                (Escape-Sql $row.instructions_2),
                (Escape-Sql $row.amount),
                (Escape-Sql $row.table_code),
                (Escape-Sql $row.trx_code),
                "NOW()"
            ) -join ", "

            $valuesList += "($vals)"
        }

        $insertQuery = "INSERT INTO tpr ($columns) VALUES " + ($valuesList -join ", ")
        Execute-NeonQuery $insertQuery | Out-Null
        $totalInserted += $batch.Count
        Write-Log "Insertados $totalInserted de $($JsonData.Count) registros en Neon..."
    }

    Write-Log "Sincronizacion completa: $totalInserted registros insertados en Neon exitosamente"

} catch {
    Write-Log "Error en sincronizacion: $_"
    exit 1
}
