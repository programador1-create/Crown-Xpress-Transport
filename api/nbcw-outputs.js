import { getNbcwSql, getSql } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // Get user info from Authorization header or session
      const authHeader = req.headers.authorization
      let userKey = null
      let yardCode = null
      
      if (authHeader) {
        // Extract user info from token or session
        try {
          const token = authHeader.replace('Bearer ', '')
          const userSql = getSql()
          const [user] = await userSql`
            SELECT e.id, e.username, e.full_name, e.location_id, l.name as location_name
            FROM employees e
            LEFT JOIN locations l ON e.location_id = l.id
            WHERE e.id = ${token} OR e.username = ${token}
          `
          if (user) {
            userKey = user.username
            // Extract yard code from location name (e.g., "Yard 6" -> "CXT6")
            if (user.location_name) {
              // Try to extract yard number and convert to CXT format
              const yardMatch = user.location_name.match(/yard\s*(\d+)/i)
              if (yardMatch) {
                yardCode = `CXT${yardMatch[1]}`
                console.log(`User ${user.username} assigned to ${user.location_name}, extracted yard code: ${yardCode}`)
              }
            }
          }
        } catch (e) {
          console.error('Error getting user info:', e)
        }
      }

      if (!userKey) {
        return res.status(401).json({ error: 'User not identified' })
      }

      // Connect to NBCW database
      console.log('Attempting to connect to NBCW database...')
      const nbcwSql = getNbcwSql()
      console.log('NBCW database connection established')
      
      // Query NBCW outputs for this user
      // Try different possible table names
      let outputs = []
      let tableName = null
      
      try {
        // Try NBCW_OUTPUTS (uppercase)
        tableName = 'tpr'
        outputs = await nbcwSql`
          SELECT 
            DRVCODE as driverCode,
            WONO as workOrderNumber,
            BLNO as billOfLadingNumber,
            FECHA as date,
            FROMD as fromCode,
            FROMCITY as fromCity,
            FROMEDO as fromState,
            TOD as toCode,
            TOCITY as toCity,
            TOEDO as toState,
            TIPMOV as movementType,
            STATUS as status,
            EL as equipmentCode,
            EQPCODE as equipmentTypeCode,
            DELDATE as deliveryDate,
            CSTMER as customer,
            TIMEARRV as arrivalTime,
            TIMEDEPAR as departureTime,
            OPER as operator,
            USTIMEIN as usTimeIn,
            USTIMEOUT as usTimeOut,
            MXMXCSTIN as mxCustomerTimeIn,
            MXUSCSTIN as mxUsCustomerTimeIn,
            MXTIMEOUT as mxTimeOut,
            TRUCKID as truckId,
            BLTIME as billTime,
            TARRFROM as tariffFrom,
            USRUPDD as userUpdateDate,
            USRUPDT as userUpdateTime,
            USRADD as userAdd,
            USRADDD as userAddDate,
            USRADDT as userAddTime,
            INSTRUC1 as instructions1,
            INSTRUC2 as instructions2,
            RL as rlCode,
            AMOUNT as amount,
            TABLECODE as tableCode,
            TRXCODE as transactionCode,
            SEAL as seal
          FROM tpr 
          WHERE ${yardCode ? `FROMD = ${yardCode}` : `DRVCODE = ${userKey} OR OPER = ${userKey}`}
          AND (STATUS = 'PENDING' OR STATUS = 'PENDIENTE')
          ORDER BY FECHA DESC, TIMEARRV DESC
          LIMIT 50
        `
      } catch (e) {
        console.error('Error querying tpr table:', e.message)
        console.error('Full error details:', e)
        console.error('DATABASE_URL_NBCW exists:', !!process.env.DATABASE_URL_NBCW)
        return res.status(500).json({ 
          error: 'Failed to query tpr table in gpsactivity database',
          details: e.message,
          debug: {
            userKey,
            yardCode,
            databaseUrlExists: !!process.env.DATABASE_URL_NBCW,
            errorMessage: e.message
          }
        })
      }
      
      console.log(`Query criteria - User: ${userKey}, Yard: ${yardCode || 'N/A'}, Search by: ${yardCode ? `FROMD = ${yardCode}` : 'DRVCODE/OPER'}, Found: ${outputs.length} outputs`)

      return res.status(200).json({
        success: true,
        outputs: outputs.map(output => ({
          ...output,
          // Format dates and times
          date: output.date ? new Date(output.date).toLocaleDateString() : null,
          deliveryDate: output.deliveryDate ? new Date(output.deliveryDate).toLocaleDateString() : null,
          arrivalTime: output.arrivalTime || '',
          departureTime: output.departureTime || '',
          usTimeIn: output.usTimeIn || '',
          usTimeOut: output.usTimeOut || '',
          mxCustomerTimeIn: output.mxCustomerTimeIn || '',
          mxUsCustomerTimeIn: output.mxUsCustomerTimeIn || '',
          mxTimeOut: output.mxTimeOut || '',
          billTime: output.billTime || '',
          userUpdateDate: output.userUpdateDate ? new Date(output.userUpdateDate).toLocaleDateString() : null,
          userAddDate: output.userAddDate ? new Date(output.userAddDate).toLocaleDateString() : null
        }))
      })
    }

    if (req.method === 'POST') {
      // Create inspection from NBCW output
      const { outputId, inspectionData } = req.body
      
      if (!outputId) {
        return res.status(400).json({ error: 'Output ID is required' })
      }

      // Get the NBCW output details
      const nbcwSql = getNbcwSql()
      let output = null
      
      // Query tpr table directly
      try {
        output = await nbcwSql`SELECT * FROM tpr WHERE id = ${outputId}`
      } catch (e) {
        console.error('Error querying tpr table:', e.message)
        console.error('Full error details:', e)
        console.error('DATABASE_URL_NBCW exists:', !!process.env.DATABASE_URL_NBCW)
        return res.status(500).json({ 
          error: 'Failed to query tpr table in gpsactivity database',
          details: e.message,
          debug: {
            userKey,
            yardCode,
            databaseUrlExists: !!process.env.DATABASE_URL_NBCW,
            errorMessage: e.message
          }
        })
      }
      
      output = output[0] // Get first result

      if (!output) {
        return res.status(404).json({ error: 'NBCW output not found' })
      }

      // Create inspection with auto-filled data
      const sql = getSql()
      const [inspection] = await sql`
        INSERT INTO inspections (
          uuid, trailer_number, container_number, seal_number, lock_number,
          driver_name, driver_code, odometer, location, inspection_date,
          high_security_seal, seal_affixed, created_at, updated_at,
          from_location, to_location, customer, work_order_number, bill_of_lading,
          movement_type, equipment_code, equipment_type, delivery_date,
          arrival_time, departure_time, operator_name, truck_id,
          instructions1, instructions2, status
        ) VALUES (
          ${crypto.randomUUID()},
          ${output.TRUCKID || ''},
          ${output.EL || ''},
          ${output.SEAL || ''},
          ${''},
          ${output.DRVCODE || ''},
          ${output.DRVCODE || ''},
          ${0},
          ${output.FROMCITY || ''},
          ${new Date().toISOString()},
          ${output.SEAL ? 'YES' : 'NO'},
          ${'YES'},
          ${new Date().toISOString()},
          ${new Date().toISOString()},
          ${`${output.FROMCITY}, ${output.FROMEDO}` || ''},
          ${`${output.TOCITY}, ${output.TOEDO}` || ''},
          ${output.CSTMER || ''},
          ${output.WONO || ''},
          ${output.BLNO || ''},
          ${output.TIPMOV || ''},
          ${output.EL || ''},
          ${output.EQPCODE || ''},
          ${output.DELDATE ? new Date(output.DELDATE).toISOString() : null},
          ${output.TIMEARRV || ''},
          ${output.TIMEDEPAR || ''},
          ${output.OPER || ''},
          ${output.TRUCKID || ''},
          ${output.INSTRUC1 || ''},
          ${output.INSTRUC2 || ''},
          ${'pending'}
        )
        RETURNING *
      `

      return res.status(201).json({
        success: true,
        inspection: {
          id: inspection.id,
          uuid: inspection.uuid,
          trailer_number: inspection.trailer_number,
          container_number: inspection.container_number,
          seal_number: inspection.seal_number,
          driver_name: inspection.driver_name,
          from_location: inspection.from_location,
          to_location: inspection.to_location,
          customer: inspection.customer,
          work_order_number: inspection.work_order_number,
          bill_of_lading: inspection.bill_of_lading,
          // Map fields to inspection form
          unitInfo: {
            trailerNumber: inspection.trailer_number,
            containerNumber: inspection.container_number,
            sealNumber: inspection.seal_number,
            lockNumber: inspection.lock_number,
            driverName: inspection.driver_name,
            driverCode: inspection.driver_code,
            odometer: inspection.odometer,
            location: inspection.location,
            inspectionDate: inspection.inspection_date,
            highSecuritySeal: inspection.high_security_seal === 'YES',
            sealAffixed: inspection.seal_affixed === 'YES',
            fromLocation: inspection.from_location,
            toLocation: inspection.to_location,
            customer: inspection.customer,
            workOrderNumber: inspection.work_order_number,
            billOfLading: inspection.bill_of_lading,
            movementType: inspection.movement_type,
            equipmentCode: inspection.equipment_code,
            equipmentType: inspection.equipment_type,
            deliveryDate: inspection.delivery_date,
            arrivalTime: inspection.arrival_time,
            departureTime: inspection.departure_time,
            operatorName: inspection.operator_name,
            truckId: inspection.truck_id,
            instructions1: inspection.instructions1,
            instructions2: inspection.instructions2
          }
        }
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('NBCW Outputs Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
