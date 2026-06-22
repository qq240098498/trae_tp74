import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM vehicle ORDER BY id ASC').all()
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
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
