import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats', (_req: Request, res: Response): void => {
  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const currentYear = String(new Date().getFullYear())

  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM student WHERE status = 'training'").get() as { count: number }

  const todaySchedules = db.prepare('SELECT COUNT(*) as count FROM schedule WHERE schedule_date = ?').get(today) as { count: number }

  const pendingExams = db.prepare("SELECT COUNT(*) as count FROM exam_appointment WHERE status = 'pending'").get() as { count: number }

  const monthCommission = db.prepare(`
    SELECT COALESCE(SUM(
      CASE
        WHEN ea.subject = 2 THEN i.commission_rate_subject2
        WHEN ea.subject = 3 THEN i.commission_rate_subject3
      END
    ), 0) as total
    FROM exam_appointment ea
    JOIN student s ON ea.student_id = s.id
    JOIN instructor i ON s.instructor_id = i.id
    WHERE ea.status = 'passed'
      AND strftime('%Y', ea.exam_date) = ?
      AND strftime('%m', ea.exam_date) = ?
  `).get(currentYear, currentMonth) as { total: number }

  res.json({
    success: true,
    data: {
      total_students: totalStudents.count,
      today_schedules: todaySchedules.count,
      pending_exams: pendingExams.count,
      month_commission: monthCommission.total,
    },
  })
})

router.get('/recent-checkins', (_req: Request, res: Response): void => {
  const rows = db.prepare(`
    SELECT ci.*, s.name as student_name, i.name as instructor_name, v.plate_number as vehicle_plate
    FROM check_in ci
    LEFT JOIN student s ON ci.student_id = s.id
    LEFT JOIN instructor i ON ci.instructor_id = i.id
    LEFT JOIN vehicle v ON ci.vehicle_id = v.id
    ORDER BY ci.check_in_time DESC
    LIMIT 10
  `).all()

  res.json({ success: true, data: rows })
})

function getHoursWarning(_req: Request, res: Response): void {
  const rows = db.prepare(`
    SELECT
      s.id as student_id,
      s.name as student_name,
      s.current_subject,
      CASE
        WHEN s.current_subject = 2 THEN s.completed_hours_subject2
        ELSE s.completed_hours_subject3
      END as completed_hours,
      CASE
        WHEN s.current_subject = 2 THEN s.required_hours_subject2
        ELSE s.required_hours_subject3
      END as required_hours,
      CASE
        WHEN s.current_subject = 2 THEN s.required_hours_subject2 - s.completed_hours_subject2
        ELSE s.required_hours_subject3 - s.completed_hours_subject3
      END as shortage
    FROM student s
    WHERE s.status = 'training'
      AND (
        (s.current_subject = 2 AND s.completed_hours_subject2 < s.required_hours_subject2)
        OR
        (s.current_subject = 3 AND s.completed_hours_subject3 < s.required_hours_subject3)
      )
    ORDER BY shortage DESC
  `).all()

  res.json({ success: true, data: rows })
}

router.get('/hours-warning', getHoursWarning)
router.get('/hours-warnings', getHoursWarning)

export default router
