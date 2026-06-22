import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { student_id, instructor_id, vehicle_id, subject, schedule_id } = req.body

  if (!student_id || !instructor_id || !vehicle_id) {
    res.status(400).json({ success: false, error: '学员ID、教练ID和车辆ID为必填项' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO check_in (student_id, instructor_id, vehicle_id, schedule_id, check_in_time, subject)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).run(student_id, instructor_id, vehicle_id, schedule_id ?? null, subject ?? 2)

    const checkIn = db.prepare(`
      SELECT ci.*, s.name as student_name, i.name as instructor_name, v.plate_number as vehicle_plate
      FROM check_in ci
      LEFT JOIN student s ON ci.student_id = s.id
      LEFT JOIN instructor i ON ci.instructor_id = i.id
      LEFT JOIN vehicle v ON ci.vehicle_id = v.id
      WHERE ci.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: checkIn })
  } catch {
    res.status(500).json({ success: false, error: '签到失败' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  const checkIn = db.prepare('SELECT * FROM check_in WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!checkIn) {
    res.status(404).json({ success: false, error: '签到记录不存在' })
    return
  }

  if (checkIn.check_out_time) {
    res.status(400).json({ success: false, error: '该记录已签退' })
    return
  }

  const MIN_HOURS = 0.25
  const MAX_HOURS = 8

  const now = new Date()
  const checkInTime = new Date(String(checkIn.check_in_time))
  const diffMs = now.getTime() - checkInTime.getTime()
  const durationHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10

  if (diffMs <= 0) {
    res.status(400).json({ success: false, error: '签退时间不能早于签到时间，请检查系统时间' })
    return
  }

  if (durationHours > MAX_HOURS) {
    res.status(400).json({ success: false, error: `单次练车时长超过上限${MAX_HOURS}小时，疑似异常打卡，请确认后手动处理` })
    return
  }

  const nowStr = now.toISOString().slice(0, 19).replace('T', ' ')
  const subject = Number(checkIn.subject)

  const finalHours = durationHours < MIN_HOURS ? 0 : durationHours

  db.prepare(`
    UPDATE check_in SET check_out_time = ?, duration_hours = ? WHERE id = ?
  `).run(nowStr, finalHours, req.params.id)

  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(checkIn.student_id) as Record<string, unknown> | undefined

  if (student && finalHours > 0) {
    if (subject === 2) {
      const currentHours = Number(student.completed_hours_subject2)
      db.prepare('UPDATE student SET completed_hours_subject2 = ? WHERE id = ?')
        .run(Math.round((currentHours + finalHours) * 10) / 10, checkIn.student_id)
    } else {
      const currentHours = Number(student.completed_hours_subject3)
      db.prepare('UPDATE student SET completed_hours_subject3 = ? WHERE id = ?')
        .run(Math.round((currentHours + finalHours) * 10) / 10, checkIn.student_id)
    }
  }

  const updated = db.prepare(`
    SELECT ci.*, s.name as student_name, i.name as instructor_name, v.plate_number as vehicle_plate
    FROM check_in ci
    LEFT JOIN student s ON ci.student_id = s.id
    LEFT JOIN instructor i ON ci.instructor_id = i.id
    LEFT JOIN vehicle v ON ci.vehicle_id = v.id
    WHERE ci.id = ?
  `).get(req.params.id)

  res.json({
    success: true,
    data: updated,
    warning: durationHours < MIN_HOURS ? `练车时长不足${MIN_HOURS * 60}分钟，不计入学时` : undefined
  })
})

router.get('/', (req: Request, res: Response): void => {
  const { date, student_id, active, limit } = req.query

  let sql = `
    SELECT ci.*, s.name as student_name, i.name as instructor_name, v.plate_number as vehicle_plate
    FROM check_in ci
    LEFT JOIN student s ON ci.student_id = s.id
    LEFT JOIN instructor i ON ci.instructor_id = i.id
    LEFT JOIN vehicle v ON ci.vehicle_id = v.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (active === 'true') {
    sql += ' AND ci.check_out_time IS NULL'
  }

  if (date) {
    sql += " AND date(ci.check_in_time) = ?"
    params.push(date)
  }

  if (student_id) {
    sql += ' AND ci.student_id = ?'
    params.push(Number(student_id))
  }

  sql += ' ORDER BY ci.check_in_time DESC'

  if (limit) {
    sql += ' LIMIT ?'
    params.push(Number(limit))
  }

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/active', (_req: Request, res: Response): void => {
  const rows = db.prepare(`
    SELECT ci.*, s.name as student_name, i.name as instructor_name, v.plate_number as vehicle_plate
    FROM check_in ci
    LEFT JOIN student s ON ci.student_id = s.id
    LEFT JOIN instructor i ON ci.instructor_id = i.id
    LEFT JOIN vehicle v ON ci.vehicle_id = v.id
    WHERE ci.check_out_time IS NULL
    ORDER BY ci.check_in_time DESC
  `).all()

  res.json({ success: true, data: rows })
})

export default router
