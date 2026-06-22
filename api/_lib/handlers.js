import { getSql, logAudit, getClientIp, readJsonBody } from './db.js'

/** POST /api/inspections — create new inspection */
export async function createInspection(req, res) {
  try {
    const body = await readJsonBody(req)
    const {
      unitInfo = {},
      points = {},
      guardSignature = {},
      auditorSignature = {},
      language = 'es',
      pdfBase64,
      pdfFilename,
      counts = {},
    } = body

    if (!pdfBase64) {
      return res.status(400).json({ error: 'pdfBase64 is required' })
    }
    if (!guardSignature?.name || !guardSignature?.signature) {
      return res.status(400).json({ error: 'Guard signature is required' })
    }

    const sql = getSql()
    const ip = getClientIp(req)
    const ua = req.headers['user-agent'] || null

    // Strip data:... prefix
    const pdfDataB64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '')
    const pdfBuffer = Buffer.from(pdfDataB64, 'base64')

    const inspectionDate = unitInfo.inspectionDate ? new Date(unitInfo.inspectionDate) : new Date()

    // Support both old camelCase (trailerNumber) and new snake_case (trailer_number)
    const ui = unitInfo
    const trailer_number = ui.trailer_number || ui.trailerNumber || null
    const seal_number = ui.seal_number || ui.sealNumber || null
    const lock_number = ui.lock_number || ui.lockNumber || null
    const driver_name = ui.driver_name || ui.driverName || null
    const odometer = ui.odometer || null
    const location = ui.location || null
    const guard_name_field = ui.guard_name || guardSignature.name || null

    const [inspection] = await sql`
      INSERT INTO inspections (
        trailer_number, seal_number, lock_number, driver_name, odometer, location,
        inspection_date, high_security_seal, seal_affixed, language,
        operator_name, guard_name, guard_signed_at,
        auditor_name, auditor_signed_at,
        status, total_good, total_bad, total_pending,
        pdf_filename, pdf_data, pdf_size_bytes,
        created_ip, created_user_agent
      ) VALUES (
        ${trailer_number},
        ${seal_number},
        ${lock_number},
        ${driver_name},
        ${odometer},
        ${location},
        ${inspectionDate},
        ${ui.highSecuritySeal === 'yes' || ui.high_security_seal === true},
        ${ui.sealAffixed === 'yes' || ui.seal_affixed === true},
        ${language},
        ${driver_name},
        ${guard_name_field},
        ${guardSignature.signedAt ? new Date(guardSignature.signedAt) : new Date()},
        ${auditorSignature.name || null},
        ${auditorSignature.signedAt ? new Date(auditorSignature.signedAt) : null},
        ${auditorSignature.signature ? 'audited' : 'completed'},
        ${counts.good || 0},
        ${counts.bad || 0},
        ${counts.pending || 0},
        ${pdfFilename || 'inspection.pdf'},
        ${pdfBuffer},
        ${pdfBuffer.length},
        ${ip},
        ${ua}
      )
      RETURNING id, inspection_uuid, created_at
    `

    // Insert per-point details
    const pointRows = Object.entries(points).map(([id, p]) => ({
      id: parseInt(id, 10),
      status: p.status,
      issueId: p.issueId,
      issueText: p.issueText || null,
      hasPhoto: !!p.photo,
    }))
    for (const pt of pointRows) {
      await sql`
        INSERT INTO inspection_points (inspection_id, point_id, status, issue_id, issue_text, photo)
        VALUES (${inspection.id}, ${pt.id}, ${pt.status}, ${pt.issueId}, ${pt.issueText}, ${pt.photo})
        ON CONFLICT (inspection_id, point_id) DO NOTHING
      `
    }

    // Audit entries
    await logAudit({
      inspectionId: inspection.id, userName: driver_name || 'system',
      role: 'operator', action: 'created',
      details: { trailer: trailer_number, seal: seal_number, lock: lock_number },
      ip, ua,
    })
    await logAudit({
      inspectionId: inspection.id, userName: guardSignature.name,
      role: 'guard', action: 'signed_guard',
      details: { signedAt: guardSignature.signedAt },
      ip, ua,
    })
    if (auditorSignature.signature && auditorSignature.name) {
      await logAudit({
        inspectionId: inspection.id, userName: auditorSignature.name,
        role: 'auditor', action: 'signed_auditor',
        details: { signedAt: auditorSignature.signedAt },
        ip, ua,
      })
    }

    return res.status(201).json({
      success: true,
      id: inspection.id,
      uuid: inspection.inspection_uuid,
      createdAt: inspection.created_at,
      pdfUrl: `/api/inspections/${inspection.id}/pdf`,
    })
  } catch (err) {
    console.error('createInspection error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}

/** GET /api/inspections — list */
export async function listInspections(req, res) {
  try {
    const sql = getSql()
    const url = new URL(req.url, 'http://x')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    const rows = await sql`
      SELECT * FROM inspections
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return res.status(200).json({ data: rows, limit, offset })
  } catch (err) {
    console.error('listInspections error:', err)
    return res.status(500).json({ error: err.message })
  }
}

/** GET /api/inspections/:id */
export async function getInspection(req, res, id) {
  try {
    const sql = getSql()
    const [insp] = await sql`SELECT * FROM inspections WHERE id = ${id} LIMIT 1`
    if (!insp) return res.status(404).json({ error: 'Not found' })

    const points = await sql`
      SELECT point_id, status, issue_id, issue_text, photo
      FROM inspection_points WHERE inspection_id = ${id}
      ORDER BY point_id
    `
    const audits = await sql`
      SELECT id, user_name, role, action, details, ip_address, created_at
      FROM audit_log WHERE inspection_id = ${id}
      ORDER BY created_at ASC
    `
    return res.status(200).json({ inspection: insp, points, audits })
  } catch (err) {
    console.error('getInspection error:', err)
    return res.status(500).json({ error: err.message })
  }
}

/** GET /api/inspections/:id/pdf */
export async function downloadPdf(req, res, id) {
  try {
    const sql = getSql()
    const [row] = await sql`SELECT pdf_filename, pdf_data FROM inspections WHERE id = ${id} LIMIT 1`
    if (!row || !row.pdf_data) return res.status(404).json({ error: 'PDF not found' })

    await logAudit({
      inspectionId: parseInt(id, 10),
      action: 'downloaded_pdf',
      ip: getClientIp(req),
      ua: req.headers['user-agent'] || null,
    })

    const buf = Buffer.isBuffer(row.pdf_data) ? row.pdf_data : Buffer.from(row.pdf_data)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${row.pdf_filename || 'inspection.pdf'}"`)
    res.setHeader('Content-Length', buf.length)
    return res.status(200).end(buf)
  } catch (err) {
    console.error('downloadPdf error:', err)
    return res.status(500).json({ error: err.message })
  }
}

/** POST /api/inspections/:id/sign-auditor — add auditor signature later */
export async function signAuditor(req, res, id) {
  try {
    const body = await readJsonBody(req)
    const { name, signedAt } = body
    if (!name) return res.status(400).json({ error: 'name required' })

    const sql = getSql()
    const ts = signedAt ? new Date(signedAt) : new Date()
    const [row] = await sql`
      UPDATE inspections
      SET auditor_name = ${name}, auditor_signed_at = ${ts}, status = 'audited', updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, auditor_name, auditor_signed_at, status
    `
    if (!row) return res.status(404).json({ error: 'Not found' })

    await logAudit({
      inspectionId: parseInt(id, 10),
      userName: name, role: 'auditor', action: 'signed_auditor',
      details: { signedAt: ts },
      ip: getClientIp(req), ua: req.headers['user-agent'] || null,
    })

    return res.status(200).json({ success: true, ...row })
  } catch (err) {
    console.error('signAuditor error:', err)
    return res.status(500).json({ error: err.message })
  }
}

/** POST /api/inspections/:id/reconfirm — create reconfirmation linked to original */
export async function reconfirmInspection(req, res, originalId) {
  try {
    const body = await readJsonBody(req)
    const {
      reason,
      modifications = [],
      reconfirmed_by,
      reconfirmed_by_name,
    } = body

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Reason (>=10 chars) is required' })
    }
    if (!modifications.length) {
      return res.status(400).json({ error: 'At least one modification required' })
    }

    const sql = getSql()
    const ip = getClientIp(req)
    const ua = req.headers['user-agent'] || null

    // Get original
    const [original] = await sql`SELECT * FROM inspections WHERE id = ${originalId} LIMIT 1`
    if (!original) return res.status(404).json({ error: 'Original inspection not found' })

    // Compute new totals from modifications + original points
    const origPoints = await sql`
      SELECT point_id, status, issue_id, issue_text, photo
      FROM inspection_points WHERE inspection_id = ${originalId}
    `
    const pointsMap = {}
    for (const p of origPoints) pointsMap[p.point_id] = { ...p }
    for (const mod of modifications) {
      pointsMap[mod.pointId] = {
        point_id: mod.pointId,
        status: mod.status,
        issue_id: mod.issueId || null,
        issue_text: mod.issueText || null,
        photo: mod.photo,
      }
    }
    const allPoints = Object.values(pointsMap)
    const total_good = allPoints.filter(p => p.status === 'good').length
    const total_bad = allPoints.filter(p => p.status === 'bad').length
    const total_pending = 20 - total_good - total_bad

    // Insert new inspection (reconfirmation)
    const [newInsp] = await sql`
      INSERT INTO inspections (
        trailer_number, seal_number, lock_number, driver_name, location,
        inspection_date, language,
        operator_name, guard_name, guard_signed_at,
        status, total_good, total_bad, total_pending,
        original_inspection_id, reconfirmation_reason, is_reconfirmation,
        created_ip, created_user_agent
      ) VALUES (
        ${original.trailer_number}, ${original.seal_number}, ${original.lock_number},
        ${original.driver_name}, ${original.location},
        NOW(), ${original.language},
        ${reconfirmed_by_name || original.operator_name},
        ${reconfirmed_by_name || original.guard_name},
        NOW(),
        'reconfirmed', ${total_good}, ${total_bad}, ${total_pending},
        ${originalId}, ${reason}, TRUE,
        ${ip}, ${ua}
      )
      RETURNING id, inspection_uuid, created_at
    `

    // Insert merged points
    for (const pt of allPoints) {
      await sql`
        INSERT INTO inspection_points (inspection_id, point_id, status, issue_id, issue_text, photo)
        VALUES (${newInsp.id}, ${pt.point_id}, ${pt.status}, ${pt.issue_id}, ${pt.issue_text}, ${pt.photo})
        ON CONFLICT (inspection_id, point_id) DO NOTHING
      `
    }

    // Mark original as superseded
    await sql`UPDATE inspections SET status = 'superseded', updated_at = NOW() WHERE id = ${originalId}`

    // Audit logs
    await logAudit({
      inspectionId: newInsp.id,
      userId: reconfirmed_by, userName: reconfirmed_by_name,
      role: 'guard', action: 'reconfirmed',
      details: { original_id: originalId, reason, modified_points: modifications.length },
      ip, ua,
    })
    await logAudit({
      inspectionId: originalId,
      userId: reconfirmed_by, userName: reconfirmed_by_name,
      role: 'guard', action: 'superseded_by',
      details: { new_inspection_id: newInsp.id, reason },
      ip, ua,
    })

    return res.status(201).json({
      success: true,
      id: newInsp.id,
      uuid: newInsp.inspection_uuid,
      original_id: originalId,
      pdfUrl: null,
      modifications: modifications.length,
    })
  } catch (err) {
    console.error('reconfirmInspection error:', err)
    return res.status(500).json({ error: err.message })
  }
}

/** GET /api/inspections/:id/chain — get original + all reconfirmations */
export async function getInspectionChain(req, res, id) {
  try {
    const sql = getSql()
    const chain = await sql`
      WITH RECURSIVE chain AS (
        SELECT * FROM inspections WHERE id = ${id} OR original_inspection_id = ${id}
      )
      SELECT * FROM chain ORDER BY created_at ASC
    `
    return res.status(200).json({ chain })
  } catch (err) {
    console.error('getInspectionChain error:', err)
    return res.status(500).json({ error: err.message })
  }
}

/** GET /api/health */
export async function healthCheck(req, res) {
  try {
    const sql = getSql()
    const [r] = await sql`SELECT NOW() as now, version() as version`
    return res.status(200).json({ ok: true, db: { now: r.now, version: r.version.split(' ').slice(0, 2).join(' ') } })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
