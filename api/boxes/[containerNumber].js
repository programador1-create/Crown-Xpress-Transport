import { queryTprTable, getAllBoxes } from '../../_lib/sqlserver.js'
import { getSql } from '../../_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const { containerNumber } = req.query

      if (containerNumber) {
        // Query specific container from tpr table
        const tprData = await queryTprTable(containerNumber)

        // Check if this container has been inspected (map tpr columns to inspection columns)
        const sql = getSql()
        const [existingInspection] = await sql`
          SELECT id, status, inspection_date, guard_name
          FROM inspections
          WHERE trailer_number = ${containerNumber}
          OR seal_number = ${containerNumber}
          ORDER BY inspection_date DESC
          LIMIT 1
        `

        // Map tpr data to inspection structure
        const mappedData = tprData.map(record => ({
          // Map tpr columns to inspection structure
          trailer_number: record.BLNO,
          seal_number: record.SEAL,
          driver_name: record.OPER,
          location: record.FROMD || record.TOD,
          operator_id: record.DRVCODE, // Employee number
          wono: record.WONO, // Work order number
          fecha: record.FECHA,
          fromd: record.FROMD,
          fromcity: record.FROMCITY,
          fromedo: record.FROMEDO,
          tod: record.TOD,
          tocity: record.TOCITY,
          toedo: record.TOEDO,
          tipmov: record.TIPMOV,
          status: record.STATUS,
          el: record.EL,
          eqpcode: record.EQPCODE,
          deldate: record.DELDATE,
          cstmer: record.CSTMER,
          timearrv: record.TIMEARRV,
          timedepar: record.TIMEDEPAR,
          oper: record.OPER,
          ustimein: record.USTIMEIN,
          ustimeout: record.USTIMEOUT,
          mxmxcstin: record.MXMXCSTIN,
          mxuscstin: record.MXUSCSTIN,
          mxtimeout: record.MXTIMEOUT,
          truckid: record.TRUCKID,
          bltime: record.BLTIME,
          tarrfrom: record.TARRFROM,
          usrupdd: record.USRUPDD,
          usrupdt: record.USRUPDT,
          usradd: record.USRADD,
          usraddd: record.USRADDD,
          usradt: record.USRADDT,
          instruc1: record.INSTRUC1,
          instruc2: record.INSTRUC2,
          rl: record.RL,
          amount: record.AMOUNT,
          tablecode: record.TABLECODE,
          trxcode: record.TRXCODE,
          // Original tpr data
          tprData: record
        }))

        return res.status(200).json({
          tprData: mappedData,
          alreadyInspected: !!existingInspection,
          inspectionInfo: existingInspection || null
        })
      } else {
        // Get all boxes with optional filters
        const filters = {
          fromd: req.query.fromd,
          tod: req.query.tod,
          status: req.query.status
        }

        const allBoxes = await getAllBoxes(filters)

        // Get all inspected container numbers
        const sql = getSql()
        const inspectedContainers = await sql`
          SELECT DISTINCT trailer_number, seal_number, inspection_date, status
          FROM inspections
          WHERE trailer_number IS NOT NULL
          ORDER BY inspection_date DESC
        `

        // Mark boxes as already inspected (map tpr columns: BLNO->trailer_number, SEAL->seal_number)
        const boxesWithStatus = allBoxes.map(box => {
          const isInspected = inspectedContainers.some(
            insp => insp.trailer_number === box.BLNO ||
                    insp.seal_number === box.SEAL
          )
          return {
            ...box,
            alreadyInspected: isInspected
          }
        })

        return res.status(200).json({
          boxes: boxesWithStatus,
          total: boxesWithStatus.length,
          inspected: boxesWithStatus.filter(b => b.alreadyInspected).length,
          available: boxesWithStatus.filter(b => !b.alreadyInspected).length
        })
      }
    } catch (error) {
      console.error('Error querying boxes:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
