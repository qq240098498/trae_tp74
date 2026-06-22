import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { subject, keyword, status } = req.query

  let sql = `
    SELECT s.*, i.name as instructor_name
    FROM student s
    LEFT JOIN instructor i ON s.instructor_id = i.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (subject) {
    sql += ' AND s.current_subject = ?'
    params.push(Number(subject))
  }

  if (keyword) {
    sql += ' AND (s.name LIKE ? OR s.phone LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  if (status) {
    sql += ' AND s.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY s.id DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare(`
    SELECT s.*, i.name as instructor_name
    FROM student s
    LEFT JOIN instructor i ON s.instructor_id = i.id
    WHERE s.id = ?
  `).get(req.params.id)

  if (!row) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }

  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, phone, current_subject, status, required_hours_subject2, required_hours_subject3, completed_hours_subject2, completed_hours_subject3, instructor_id, enroll_date } = req.body

  if (!name || !phone || !instructor_id) {
    res.status(400).json({ success: false, error: '姓名、手机号和教练ID为必填项' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO student (name, phone, current_subject, status, required_hours_subject2, required_hours_subject3, completed_hours_subject2, completed_hours_subject3, instructor_id, enroll_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      phone,
      current_subject ?? 2,
      status ?? 'training',
      required_hours_subject2 ?? 16,
      required_hours_subject3 ?? 24,
      completed_hours_subject2 ?? 0,
      completed_hours_subject3 ?? 0,
      instructor_id,
      enroll_date ?? new Date().toISOString().slice(0, 10)
    )

    const student = db.prepare(`
      SELECT s.*, i.name as instructor_name
      FROM student s
      LEFT JOIN instructor i ON s.instructor_id = i.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: student })
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(400).json({ success: false, error: '手机号已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建学员失败' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id)

  if (!student) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }

  const { name, phone, current_subject, status, required_hours_subject2, required_hours_subject3, completed_hours_subject2, completed_hours_subject3, instructor_id, enroll_date } = req.body

  try {
    db.prepare(`
      UPDATE student SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        current_subject = COALESCE(?, current_subject),
        status = COALESCE(?, status),
        required_hours_subject2 = COALESCE(?, required_hours_subject2),
        required_hours_subject3 = COALESCE(?, required_hours_subject3),
        completed_hours_subject2 = COALESCE(?, completed_hours_subject2),
        completed_hours_subject3 = COALESCE(?, completed_hours_subject3),
        instructor_id = COALESCE(?, instructor_id),
        enroll_date = COALESCE(?, enroll_date)
      WHERE id = ?
    `).run(
      name ?? null,
      phone ?? null,
      current_subject ?? null,
      status ?? null,
      required_hours_subject2 ?? null,
      required_hours_subject3 ?? null,
      completed_hours_subject2 ?? null,
      completed_hours_subject3 ?? null,
      instructor_id ?? null,
      enroll_date ?? null,
      req.params.id
    )

    const updated = db.prepare(`
      SELECT s.*, i.name as instructor_name
      FROM student s
      LEFT JOIN instructor i ON s.instructor_id = i.id
      WHERE s.id = ?
    `).get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(400).json({ success: false, error: '手机号已存在' })
      return
    }
    res.status(500).json({ success: false, error: '更新学员失败' })
  }
})

router.get('/:id/exams', (req: Request, res: Response): void => {
  const student = db.prepare('SELECT id FROM student WHERE id = ?').get(req.params.id)
  if (!student) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }
  const rows = db.prepare(`
    SELECT ea.*, s.name as student_name
    FROM exam_appointment ea
    LEFT JOIN student s ON ea.student_id = s.id
    WHERE ea.student_id = ?
    ORDER BY ea.created_at DESC
  `).all(req.params.id)
  res.json({ success: true, data: rows })
})

router.get('/:id/checkins', (req: Request, res: Response): void => {
  const student = db.prepare('SELECT id FROM student WHERE id = ?').get(req.params.id)
  if (!student) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }
  const rows = db.prepare(`
    SELECT ci.*, s.name as student_name, i.name as instructor_name, v.plate_number as vehicle_plate
    FROM check_in ci
    LEFT JOIN student s ON ci.student_id = s.id
    LEFT JOIN instructor i ON ci.instructor_id = i.id
    LEFT JOIN vehicle v ON ci.vehicle_id = v.id
    WHERE ci.student_id = ?
    ORDER BY ci.check_in_time DESC
  `).all(req.params.id)
  res.json({ success: true, data: rows })
})

router.post('/:id/exam', (req: Request, res: Response): void => {
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!student) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }

  const { subject, exam_date } = req.body
  const examSubject = subject ?? student.current_subject

  const requiredHours = examSubject === 2
    ? Number(student.required_hours_subject2)
    : Number(student.required_hours_subject3)
  const completedHours = examSubject === 2
    ? Number(student.completed_hours_subject2)
    : Number(student.completed_hours_subject3)

  if (completedHours < requiredHours) {
    const shortage = requiredHours - completedHours
    const subjectName = examSubject === 2 ? '科目二' : '科目三'
    res.status(400).json({ success: false, error: `学时不足，${subjectName}还需补齐${shortage}小时` })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO exam_appointment (student_id, subject, status, exam_date)
      VALUES (?, ?, 'pending', ?)
    `).run(Number(req.params.id), examSubject, exam_date ?? null)

    const appointment = db.prepare(`
      SELECT ea.*, s.name as student_name
      FROM exam_appointment ea
      LEFT JOIN student s ON ea.student_id = s.id
      WHERE ea.id = ?
    `).get(result.lastInsertRowid)

    db.prepare('UPDATE student SET status = ? WHERE id = ?').run('exam_scheduled', Number(req.params.id))

    res.status(201).json({ success: true, data: appointment })
  } catch {
    res.status(500).json({ success: false, error: '创建考试预约失败' })
  }
})

router.get('/:id/weaknesses', (req: Request, res: Response): void => {
  const student = db.prepare('SELECT id FROM student WHERE id = ?').get(req.params.id)
  if (!student) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }
  const rows = db.prepare(`
    SELECT wr.*, s.name as student_name, i.name as instructor_name
    FROM weakness_record wr
    LEFT JOIN student s ON wr.student_id = s.id
    LEFT JOIN instructor i ON wr.instructor_id = i.id
    WHERE wr.student_id = ?
    ORDER BY wr.created_at DESC
  `).all(req.params.id)
  res.json({ success: true, data: rows })
})

router.post('/:id/weaknesses', (req: Request, res: Response): void => {
  const student = db.prepare('SELECT id, instructor_id FROM student WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!student) {
    res.status(404).json({ success: false, error: '学员不存在' })
    return
  }

  const { item, level, note, check_in_id, instructor_id } = req.body

  if (!item) {
    res.status(400).json({ success: false, error: '薄弱项目为必填项' })
    return
  }

  const validItems = ['daoku', 'cefang', 'poqi', 'swan']
  if (!validItems.includes(item)) {
    res.status(400).json({ success: false, error: '无效的薄弱项目' })
    return
  }

  const levelNum = level ? Number(level) : 3
  if (levelNum < 1 || levelNum > 5) {
    res.status(400).json({ success: false, error: '严重程度必须在1-5之间' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO weakness_record (student_id, check_in_id, instructor_id, item, level, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      Number(req.params.id),
      check_in_id ?? null,
      instructor_id ?? student['instructor_id'],
      item,
      levelNum,
      note ?? null
    )

    const record = db.prepare(`
      SELECT wr.*, s.name as student_name, i.name as instructor_name
      FROM weakness_record wr
      LEFT JOIN student s ON wr.student_id = s.id
      LEFT JOIN instructor i ON wr.instructor_id = i.id
      WHERE wr.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: record })
  } catch {
    res.status(500).json({ success: false, error: '添加薄弱项目失败' })
  }
})

router.put('/weaknesses/:id/resolve', (req: Request, res: Response): void => {
  const weakness = db.prepare('SELECT * FROM weakness_record WHERE id = ?').get(req.params.id)
  if (!weakness) {
    res.status(404).json({ success: false, error: '薄弱记录不存在' })
    return
  }

  try {
    db.prepare(`
      UPDATE weakness_record SET resolved = 1, resolved_at = datetime('now') WHERE id = ?
    `).run(req.params.id)

    const updated = db.prepare(`
      SELECT wr.*, s.name as student_name, i.name as instructor_name
      FROM weakness_record wr
      LEFT JOIN student s ON wr.student_id = s.id
      LEFT JOIN instructor i ON wr.instructor_id = i.id
      WHERE wr.id = ?
    `).get(req.params.id)

    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: '更新失败' })
  }
})

router.delete('/weaknesses/:id', (req: Request, res: Response): void => {
  const weakness = db.prepare('SELECT * FROM weakness_record WHERE id = ?').get(req.params.id)
  if (!weakness) {
    res.status(404).json({ success: false, error: '薄弱记录不存在' })
    return
  }

  try {
    db.prepare('DELETE FROM weakness_record WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: '删除失败' })
  }
})

export default router
