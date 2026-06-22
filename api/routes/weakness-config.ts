import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/items', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM weakness_item_config ORDER BY sort_order ASC, id ASC').all()
  res.json({ success: true, data: rows })
})

router.post('/items', (req: Request, res: Response): void => {
  const { key, label, sort_order, enabled } = req.body

  if (!key || !label) {
    res.status(400).json({ success: false, error: '项目标识和名称为必填项' })
    return
  }

  const exists = db.prepare('SELECT id FROM weakness_item_config WHERE key = ?').get(key)
  if (exists) {
    res.status(400).json({ success: false, error: '该项目标识已存在' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO weakness_item_config (key, label, sort_order, enabled)
      VALUES (?, ?, ?, ?)
    `).run(
      String(key),
      String(label),
      sort_order !== undefined ? Number(sort_order) : 0,
      enabled !== undefined ? Number(enabled) : 1
    )

    const row = db.prepare('SELECT * FROM weakness_item_config WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: row })
  } catch {
    res.status(500).json({ success: false, error: '添加薄弱项配置失败' })
  }
})

router.put('/items/:id', (req: Request, res: Response): void => {
  const item = db.prepare('SELECT * FROM weakness_item_config WHERE id = ?').get(req.params.id)
  if (!item) {
    res.status(404).json({ success: false, error: '配置项不存在' })
    return
  }

  const { key, label, sort_order, enabled } = req.body

  try {
    db.prepare(`
      UPDATE weakness_item_config SET
        key = COALESCE(?, key),
        label = COALESCE(?, label),
        sort_order = COALESCE(?, sort_order),
        enabled = COALESCE(?, enabled)
      WHERE id = ?
    `).run(
      key !== undefined ? String(key) : null,
      label !== undefined ? String(label) : null,
      sort_order !== undefined ? Number(sort_order) : null,
      enabled !== undefined ? Number(enabled) : null,
      Number(req.params.id)
    )

    const updated = db.prepare('SELECT * FROM weakness_item_config WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: '更新薄弱项配置失败' })
  }
})

router.delete('/items/:id', (req: Request, res: Response): void => {
  const item = db.prepare('SELECT * FROM weakness_item_config WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!item) {
    res.status(404).json({ success: false, error: '配置项不存在' })
    return
  }

  const inUse = db.prepare('SELECT COUNT(*) as count FROM weakness_record WHERE item = ?').get(item['key']) as { count: number }
  if (inUse.count > 0) {
    res.status(400).json({ success: false, error: `该项目已被使用（${inUse.count}条记录），无法删除，请先禁用` })
    return
  }

  try {
    db.prepare('DELETE FROM weakness_item_config WHERE id = ?').run(Number(req.params.id))
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: '删除薄弱项配置失败' })
  }
})

router.get('/levels', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM weakness_level_config ORDER BY level ASC').all()
  res.json({ success: true, data: rows })
})

router.post('/levels', (req: Request, res: Response): void => {
  const { level, label, description, enabled } = req.body

  if (level === undefined || !label) {
    res.status(400).json({ success: false, error: '等级值和名称为必填项' })
    return
  }

  const levelNum = Number(level)
  if (levelNum < 1 || levelNum > 10) {
    res.status(400).json({ success: false, error: '等级值必须在1-10之间' })
    return
  }

  const exists = db.prepare('SELECT id FROM weakness_level_config WHERE level = ?').get(levelNum)
  if (exists) {
    res.status(400).json({ success: false, error: '该等级值已存在' })
    return
  }

  try {
    const result = db.prepare(`
      INSERT INTO weakness_level_config (level, label, description, enabled)
      VALUES (?, ?, ?, ?)
    `).run(
      levelNum,
      String(label),
      description !== undefined ? String(description) : null,
      enabled !== undefined ? Number(enabled) : 1
    )

    const row = db.prepare('SELECT * FROM weakness_level_config WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: row })
  } catch {
    res.status(500).json({ success: false, error: '添加等级配置失败' })
  }
})

router.put('/levels/:id', (req: Request, res: Response): void => {
  const level = db.prepare('SELECT * FROM weakness_level_config WHERE id = ?').get(req.params.id)
  if (!level) {
    res.status(404).json({ success: false, error: '配置项不存在' })
    return
  }

  const { label, description, enabled } = req.body

  try {
    db.prepare(`
      UPDATE weakness_level_config SET
        label = COALESCE(?, label),
        description = COALESCE(?, description),
        enabled = COALESCE(?, enabled)
      WHERE id = ?
    `).run(
      label !== undefined ? String(label) : null,
      description !== undefined ? String(description) : null,
      enabled !== undefined ? Number(enabled) : null,
      Number(req.params.id)
    )

    const updated = db.prepare('SELECT * FROM weakness_level_config WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: '更新等级配置失败' })
  }
})

router.delete('/levels/:id', (req: Request, res: Response): void => {
  const level = db.prepare('SELECT * FROM weakness_level_config WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!level) {
    res.status(404).json({ success: false, error: '配置项不存在' })
    return
  }

  const inUse = db.prepare('SELECT COUNT(*) as count FROM weakness_record WHERE level = ?').get(level['level']) as { count: number }
  if (inUse.count > 0) {
    res.status(400).json({ success: false, error: `该等级已被使用（${inUse.count}条记录），无法删除，请先禁用` })
    return
  }

  try {
    db.prepare('DELETE FROM weakness_level_config WHERE id = ?').run(Number(req.params.id))
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: '删除等级配置失败' })
  }
})

export default router
