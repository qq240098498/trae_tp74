import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function getCommissionSummary(req: Request, res: Response): void {
  const { month, year } = req.query

  const targetMonth = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0')
  const targetYear = year ? String(year) : String(new Date().getFullYear())

  const rows = db.prepare(`
    SELECT
      i.id as instructor_id,
      i.name as instructor_name,
      i.commission_rate_subject2,
      i.commission_rate_subject3,
      COALESCE(s2.cnt, 0) as subject2_passed,
      COALESCE(s3.cnt, 0) as subject3_passed,
      COALESCE(s2.cnt, 0) * i.commission_rate_subject2 as subject2_amount,
      COALESCE(s3.cnt, 0) * i.commission_rate_subject3 as subject3_amount,
      COALESCE(s2.cnt, 0) * i.commission_rate_subject2 + COALESCE(s3.cnt, 0) * i.commission_rate_subject3 as total_amount
    FROM instructor i
    LEFT JOIN (
      SELECT ea.student_id, s.instructor_id, COUNT(*) as cnt
      FROM exam_appointment ea
      JOIN student s ON ea.student_id = s.id
      WHERE ea.status = 'passed'
        AND strftime('%Y', ea.exam_date) = ?
        AND strftime('%m', ea.exam_date) = ?
      GROUP BY s.instructor_id, ea.subject
      HAVING ea.subject = 2
    ) s2 ON s2.instructor_id = i.id
    LEFT JOIN (
      SELECT ea.student_id, s.instructor_id, COUNT(*) as cnt
      FROM exam_appointment ea
      JOIN student s ON ea.student_id = s.id
      WHERE ea.status = 'passed'
        AND strftime('%Y', ea.exam_date) = ?
        AND strftime('%m', ea.exam_date) = ?
      GROUP BY s.instructor_id, ea.subject
      HAVING ea.subject = 3
    ) s3 ON s3.instructor_id = i.id
    ORDER BY i.id ASC
  `).all(targetYear, targetMonth, targetYear, targetMonth)

  res.json({ success: true, data: rows })
}

router.get('/', getCommissionSummary)
router.get('/summary', getCommissionSummary)

router.get('/settings', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM commission_setting ORDER BY subject ASC').all()
  res.json({ success: true, data: rows })
})

router.put('/settings', (req: Request, res: Response): void => {
  const { subject, unit_price, subject2_price, subject3_price } = req.body

  try {
    if (subject2_price !== undefined || subject3_price !== undefined) {
      if (subject2_price !== undefined) {
        db.prepare(`
          UPDATE commission_setting SET unit_price = ?, updated_at = datetime('now')
          WHERE subject = 2
        `).run(subject2_price)
      }
      if (subject3_price !== undefined) {
        db.prepare(`
          UPDATE commission_setting SET unit_price = ?, updated_at = datetime('now')
          WHERE subject = 3
        `).run(subject3_price)
      }

      db.prepare(`
        UPDATE instructor SET
          commission_rate_subject2 = COALESCE(?, commission_rate_subject2),
          commission_rate_subject3 = COALESCE(?, commission_rate_subject3)
      `).run(subject2_price ?? null, subject3_price ?? null)

      const rows = db.prepare('SELECT * FROM commission_setting ORDER BY subject ASC').all()
      res.json({ success: true, data: rows })
      return
    }

    if (subject === undefined || unit_price === undefined) {
      res.status(400).json({ success: false, error: '科目和单价为必填项' })
      return
    }

    db.prepare(`
      UPDATE commission_setting SET unit_price = ?, updated_at = datetime('now')
      WHERE subject = ?
    `).run(unit_price, subject)

    const setting = db.prepare('SELECT * FROM commission_setting WHERE subject = ?').get(subject)
    res.json({ success: true, data: setting })
  } catch {
    res.status(500).json({ success: false, error: '更新提成设置失败' })
  }
})

function getCommissionDetails(req: Request, res: Response): void {
  const { month, year, instructor_id } = req.query
  const instructorId = instructor_id ?? req.params.instructorId

  const targetMonth = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0')
  const targetYear = year ? String(year) : String(new Date().getFullYear())

  const instructor = db.prepare('SELECT * FROM instructor WHERE id = ?').get(instructorId)

  if (!instructor) {
    res.status(404).json({ success: false, error: '教练不存在' })
    return
  }

  const rows = db.prepare(`
    SELECT
      s.id as student_id,
      s.name as student_name,
      ea.subject,
      ea.exam_date,
      cs.unit_price,
      cs.unit_price as amount
    FROM exam_appointment ea
    JOIN student s ON ea.student_id = s.id
    JOIN commission_setting cs ON cs.subject = ea.subject
    WHERE s.instructor_id = ?
      AND ea.status = 'passed'
      AND strftime('%Y', ea.exam_date) = ?
      AND strftime('%m', ea.exam_date) = ?
    ORDER BY ea.exam_date DESC
  `).all(instructorId, targetYear, targetMonth)

  res.json({ success: true, data: rows })
}

router.get('/details', getCommissionDetails)
router.get('/:instructorId', getCommissionDetails)

export default router
