import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { date, start_date, end_date } = req.query

  let sql = `
    SELECT s.*, i.name as instructor_name, v.plate_number as vehicle_plate
    FROM schedule s
    LEFT JOIN instructor i ON s.instructor_id = i.id
    LEFT JOIN vehicle v ON s.vehicle_id = v.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (date) {
    sql += ' AND s.schedule_date = ?'
    params.push(date)
  }

  if (start_date) {
    sql += ' AND s.schedule_date >= ?'
    params.push(start_date)
  }

  if (end_date) {
    sql += ' AND s.schedule_date <= ?'
    params.push(end_date)
  }

  sql += ' ORDER BY s.schedule_date ASC, s.time_slot ASC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
  const { instructor_id, vehicle_id, schedule_date, time_slot, status } = req.body

  if (!instructor_id || !vehicle_id || !schedule_date || !time_slot) {
    res.status(400).json({ success: false, error: '教练ID、车辆ID、日期和时段为必填项' })
    return
  }

  const instructorConflict = db.prepare(
    'SELECT id FROM schedule WHERE instructor_id = ? AND schedule_date = ? AND time_slot = ?'
  ).get(instructor_id, schedule_date, time_slot)

  if (instructorConflict) {
    res.status(409).json({ success: false, error: '该教练在此时段已有排班' })
    return
  }

  const vehicleConflict = db.prepare(
    'SELECT id FROM schedule WHERE vehicle_id = ? AND schedule_date = ? AND time_slot = ?'
  ).get(vehicle_id, schedule_date, time_slot)

  if (vehicleConflict) {
    res.status(409).json({ success: false, error: '该车辆在此时段已被占用' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO schedule (instructor_id, vehicle_id, schedule_date, time_slot, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(instructor_id, vehicle_id, schedule_date, time_slot, status ?? 'scheduled')

    const schedule = db.prepare(`
      SELECT s.*, i.name as instructor_name, v.plate_number as vehicle_plate
      FROM schedule s
      LEFT JOIN instructor i ON s.instructor_id = i.id
      LEFT JOIN vehicle v ON s.vehicle_id = v.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: schedule })
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ success: false, error: '排班冲突，该时段已被占用' })
      return
    }
    res.status(500).json({ success: false, error: '创建排班失败' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  const schedule = db.prepare('SELECT * FROM schedule WHERE id = ?').get(req.params.id)

  if (!schedule) {
    res.status(404).json({ success: false, error: '排班记录不存在' })
    return
  }

  db.prepare('DELETE FROM schedule WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

router.get('/vehicles', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM vehicle ORDER BY id ASC').all()
  res.json({ success: true, data: rows })
})

router.post('/vehicles', (req: Request, res: Response): void => {
  const { plate_number, model, status } = req.body

  if (!plate_number || !model) {
    res.status(400).json({ success: false, error: '车牌号和车型为必填项' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO vehicle (plate_number, model, status)
      VALUES (?, ?, ?)
    `).run(plate_number, model, status ?? 'available')

    const vehicle = db.prepare('SELECT * FROM vehicle WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: vehicle })
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(400).json({ success: false, error: '车牌号已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建车辆失败' })
  }
})

export default router
