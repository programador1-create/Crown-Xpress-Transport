import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { method, query } = req
    const { type } = query

    // YARD MANAGEMENT ENDPOINTS
    if (type === 'yards') {
      // GET - List all yards or get specific yard
      if (method === 'GET') {
        const { id } = query
        
        if (id) {
          const [yard] = await sql`
            SELECT * FROM yards 
            WHERE id = ${parseInt(id)} AND is_active = true
          `
          if (!yard) {
            return res.status(404).json({ error: 'Yard not found' })
          }
          return res.status(200).json({ success: true, yard })
        } else {
          const yards = await sql`
            SELECT * FROM yards 
            WHERE is_active = true 
            ORDER BY type, name
          `
          return res.status(200).json({ success: true, data: yards })
        }
      }

      // POST - Create new yard
      if (method === 'POST') {
        const { name, code, type, description, address, capacities } = req.body

        if (!name || !code || !type) {
          return res.status(400).json({ error: 'Name, code, and type are required' })
        }

        const [yard] = await sql`
          INSERT INTO yards (name, code, type, description, address, 
            max_trailers, max_trucks, max_boxes, max_platforms, max_machinery,
            min_trailers, min_trucks, min_boxes, min_platforms, min_machinery)
          VALUES (${name}, ${code}, ${type}, ${description || null}, ${address || null},
            ${capacities?.max_trailers || 0}, ${capacities?.max_trucks || 0}, ${capacities?.max_boxes || 0}, 
            ${capacities?.max_platforms || 0}, ${capacities?.max_machinery || 0},
            ${capacities?.min_trailers || 0}, ${capacities?.min_trucks || 0}, ${capacities?.min_boxes || 0}, 
            ${capacities?.min_platforms || 0}, ${capacities?.min_machinery || 0})
          RETURNING *
        `
        return res.status(201).json({ success: true, yard })
      }

      // PUT - Update yard
      if (method === 'PUT') {
        const { id, ...updates } = req.body
        if (!id) return res.status(400).json({ error: 'Yard ID required' })

        const [yard] = await sql`
          UPDATE yards SET ${sql(updates)}, updated_at = NOW()
          WHERE id = ${parseInt(id)} RETURNING *
        `
        if (!yard) return res.status(404).json({ error: 'Yard not found' })
        return res.status(200).json({ success: true, yard })
      }

      // DELETE - Deactivate yard
      if (method === 'DELETE') {
        const { id } = query
        if (!id) return res.status(400).json({ error: 'Yard ID required' })

        await sql`UPDATE yards SET is_active = false, updated_at = NOW() WHERE id = ${parseInt(id)}`
        return res.status(200).json({ success: true, message: 'Yard deactivated' })
      }
    }

    // YARD ASSIGNMENTS ENDPOINTS
    if (type === 'assignments') {
      // GET - List assignments
      if (method === 'GET') {
        const { employee_id, yard_id } = query
        let query = `
          SELECT ya.*, e.full_name as employee_name, y.name as yard_name, y.type as yard_type
          FROM yard_assignments ya
          JOIN employees e ON ya.employee_id = e.id
          JOIN yards y ON ya.yard_id = y.id
          WHERE ya.is_active = true
        `
        
        if (employee_id) query += ` AND ya.employee_id = ${employee_id}`
        if (yard_id) query += ` AND ya.yard_id = ${yard_id}`
        query += ` ORDER BY ya.assigned_at DESC`
        
        const assignments = await sql(query)
        return res.status(200).json({ success: true, data: assignments })
      }

      // POST - Create assignment
      if (method === 'POST') {
        const { employee_id, yard_id, assigned_by } = req.body
        if (!employee_id || !yard_id) {
          return res.status(400).json({ error: 'Employee ID and Yard ID required' })
        }

        // Deactivate existing assignments
        await sql`UPDATE yard_assignments SET is_active = false WHERE employee_id = ${employee_id} AND is_active = true`

        const [assignment] = await sql`
          INSERT INTO yard_assignments (employee_id, yard_id, assigned_by)
          VALUES (${employee_id}, ${yard_id}, ${assigned_by || null})
          RETURNING *
        `
        return res.status(201).json({ success: true, assignment })
      }

      // DELETE - Deactivate assignment
      if (method === 'DELETE') {
        const { id } = query
        if (!id) return res.status(400).json({ error: 'Assignment ID required' })

        await sql`UPDATE yard_assignments SET is_active = false WHERE id = ${parseInt(id)}`
        return res.status(200).json({ success: true, message: 'Assignment deactivated' })
      }
    }

    // SETUP ENDPOINT
    if (type === 'setup') {
      if (method === 'POST') {
        // Create tables
        await sql`CREATE TABLE IF NOT EXISTS yards (...)` // simplified for brevity
        await sql`CREATE TABLE IF NOT EXISTS yard_assignments (...)`
        
        // Insert initial data
        await sql`INSERT INTO yards (...) VALUES (...) ON CONFLICT DO NOTHING`
        
        return res.status(200).json({ success: true, message: 'Yards setup completed' })
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' })

  } catch (error) {
    console.error('Yard Management API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
