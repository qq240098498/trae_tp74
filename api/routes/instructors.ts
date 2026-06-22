import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT id, name, phone, role, commission_rate_subject2, commission_rate_subject3 FROM instructor ORDER BY id ASC').all()
  res.json({ success: true, data: rows })
})

export default router
