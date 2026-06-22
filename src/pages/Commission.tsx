import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Save, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import type { CommissionSummary, CommissionDetail, WeaknessItemConfig, WeaknessLevelConfig } from "../../shared/types"

export default function Commission() {
  const {
    commissionSummaries, commissionSettings, commissionDetails,
    weaknessItemConfigs, weaknessLevelConfigs,
    loading, fetchCommissionSummaries, fetchCommissionSettings,
    fetchCommissionDetails, updateCommissionSettings,
    fetchWeaknessItemConfigs, fetchWeaknessLevelConfigs,
    addWeaknessItemConfig, updateWeaknessItemConfig, deleteWeaknessItemConfig,
    addWeaknessLevelConfig, updateWeaknessLevelConfig, deleteWeaknessLevelConfig,
  } = useAppStore()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [s2Price, setS2Price] = useState("")
  const [s3Price, setS3Price] = useState("")

  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [newItemKey, setNewItemKey] = useState("")
  const [newItemLabel, setNewItemLabel] = useState("")
  const [newItemSort, setNewItemSort] = useState(0)
  const [editItemLabel, setEditItemLabel] = useState("")
  const [editItemSort, setEditItemSort] = useState(0)

  const [showAddLevel, setShowAddLevel] = useState(false)
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null)
  const [newLevelValue, setNewLevelValue] = useState(1)
  const [newLevelLabel, setNewLevelLabel] = useState("")
  const [newLevelDesc, setNewLevelDesc] = useState("")
  const [editLevelLabel, setEditLevelLabel] = useState("")
  const [editLevelDesc, setEditLevelDesc] = useState("")

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchCommissionSettings()
    fetchCommissionSummaries(year, month)
    fetchWeaknessItemConfigs()
    fetchWeaknessLevelConfigs()
  }, [year, month, fetchCommissionSettings, fetchCommissionSummaries, fetchWeaknessItemConfigs, fetchWeaknessLevelConfigs])

  useEffect(() => {
    if (commissionSettings.length > 0) {
      const s2 = commissionSettings.find((s) => s.subject === 2)
      const s3 = commissionSettings.find((s) => s.subject === 3)
      if (s2) setS2Price(String(s2.unit_price))
      if (s3) setS3Price(String(s3.unit_price))
    }
  }, [commissionSettings])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
  }

  const resetAddItem = () => {
    setShowAddItem(false)
    setNewItemKey("")
    setNewItemLabel("")
    setNewItemSort(0)
  }

  const handleAddItem = async () => {
    if (!newItemKey.trim() || !newItemLabel.trim()) {
      showToast("error", "标识和名称不能为空")
      return
    }
    const ok = await addWeaknessItemConfig({
      key: newItemKey.trim(),
      label: newItemLabel.trim(),
      sort_order: newItemSort,
      enabled: 1,
    })
    if (ok) {
      showToast("success", "添加成功")
      resetAddItem()
    } else {
      showToast("error", "添加失败，标识可能已存在")
    }
  }

  const startEditItem = (item: WeaknessItemConfig) => {
    setEditingItemId(item.id)
    setEditItemLabel(item.label)
    setEditItemSort(item.sort_order)
  }

  const cancelEditItem = () => {
    setEditingItemId(null)
  }

  const handleSaveEditItem = async (id: number) => {
    if (!editItemLabel.trim()) {
      showToast("error", "名称不能为空")
      return
    }
    const ok = await updateWeaknessItemConfig(id, {
      label: editItemLabel.trim(),
      sort_order: editItemSort,
    })
    if (ok) {
      showToast("success", "修改成功")
      setEditingItemId(null)
    } else {
      showToast("error", "修改失败")
    }
  }

  const handleToggleItemEnabled = async (item: WeaknessItemConfig) => {
    const ok = await updateWeaknessItemConfig(item.id, { enabled: item.enabled ? 0 : 1 })
    if (ok) {
      showToast("success", item.enabled ? "已禁用" : "已启用")
    } else {
      showToast("error", "操作失败")
    }
  }

  const handleDeleteItem = async (item: WeaknessItemConfig) => {
    if (!confirm(`确定要删除薄弱项"${item.label}"吗？`)) return
    const ok = await deleteWeaknessItemConfig(item.id)
    if (ok) {
      showToast("success", "删除成功")
    } else {
      showToast("error", "删除失败，该项目可能已被使用")
    }
  }

  const resetAddLevel = () => {
    setShowAddLevel(false)
    setNewLevelValue(1)
    setNewLevelLabel("")
    setNewLevelDesc("")
  }

  const handleAddLevel = async () => {
    if (!newLevelLabel.trim()) {
      showToast("error", "等级名称不能为空")
      return
    }
    const ok = await addWeaknessLevelConfig({
      level: newLevelValue,
      label: newLevelLabel.trim(),
      description: newLevelDesc.trim() || null,
      enabled: 1,
    })
    if (ok) {
      showToast("success", "添加成功")
      resetAddLevel()
    } else {
      showToast("error", "添加失败，等级值可能已存在")
    }
  }

  const startEditLevel = (level: WeaknessLevelConfig) => {
    setEditingLevelId(level.id)
    setEditLevelLabel(level.label)
    setEditLevelDesc(level.description || "")
  }

  const cancelEditLevel = () => {
    setEditingLevelId(null)
  }

  const handleSaveEditLevel = async (id: number) => {
    if (!editLevelLabel.trim()) {
      showToast("error", "等级名称不能为空")
      return
    }
    const ok = await updateWeaknessLevelConfig(id, {
      label: editLevelLabel.trim(),
      description: editLevelDesc.trim() || null,
    })
    if (ok) {
      showToast("success", "修改成功")
      setEditingLevelId(null)
    } else {
      showToast("error", "修改失败")
    }
  }

  const handleToggleLevelEnabled = async (level: WeaknessLevelConfig) => {
    const ok = await updateWeaknessLevelConfig(level.id, { enabled: level.enabled ? 0 : 1 })
    if (ok) {
      showToast("success", level.enabled ? "已禁用" : "已启用")
    } else {
      showToast("error", "操作失败")
    }
  }

  const handleDeleteLevel = async (level: WeaknessLevelConfig) => {
    if (!confirm(`确定要删除等级"L${level.level} ${level.label}"吗？`)) return
    const ok = await deleteWeaknessLevelConfig(level.id)
    if (ok) {
      showToast("success", "删除成功")
    } else {
      showToast("error", "删除失败，该等级可能已被使用")
    }
  }

  const toggleExpand = (instructorId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(instructorId)) {
        next.delete(instructorId)
      } else {
        next.add(instructorId)
        fetchCommissionDetails(instructorId, year, month)
      }
      return next
    })
  }

  const handleSaveSettings = async () => {
    const ok = await updateCommissionSettings({
      subject2_price: Number(s2Price),
      subject3_price: Number(s3Price),
    })
    if (ok) {
      fetchCommissionSummaries(year, month)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [year - 2, year - 1, year, year + 1, year + 2]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {years.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {months.map((m) => <option key={m} value={m}>{m}月</option>)}
        </select>
      </div>

      {loading.commissions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-6 w-24 bg-zinc-200 rounded mb-4" />
              <div className="h-10 w-32 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      ) : commissionSummaries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-zinc-400">暂无提成数据</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commissionSummaries.map((cs: CommissionSummary) => {
            const isExpanded = expandedIds.has(cs.instructor_id)
            const details: CommissionDetail[] = commissionDetails[cs.instructor_id] || []
            return (
              <div key={cs.instructor_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-zinc-50 transition-colors"
                  onClick={() => toggleExpand(cs.instructor_id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-zinc-900">{cs.instructor_name}</h3>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-500">
                    <div className="flex justify-between">
                      <span>科目二通过 {cs.subject2_passed}人</span>
                      <span className="text-zinc-900">¥{cs.subject2_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>科目三通过 {cs.subject3_passed}人</span>
                      <span className="text-zinc-900">¥{cs.subject3_amount}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">合计提成</span>
                    <span className="text-xl font-bold text-teal-700">¥{cs.total_amount}</span>
                  </div>
                </div>
                {isExpanded && details.length > 0 && (
                  <div className="border-t border-zinc-100 px-6 py-3 bg-zinc-50/50">
                    <div className="space-y-2">
                      {details.map((d: CommissionDetail, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-700">{d.student_name}</span>
                          <span className="text-zinc-500">科目{d.subject} · {d.exam_date}</span>
                          <span className="text-zinc-900 font-medium">¥{d.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">提成设置</h2>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-6">
            <div>
              <label className="block text-sm text-zinc-600 mb-1">科目二单价（元）</label>
              <input
                type="number" value={s2Price} onChange={(e) => setS2Price(e.target.value)}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 mb-1">科目三单价（元）</label>
              <input
                type="number" value={s3Price} onChange={(e) => setS3Price(e.target.value)}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">薄弱项配置</h2>
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            添加项目
          </button>
        </div>
        <div className="p-6">
          {showAddItem && (
            <div className="mb-4 p-4 bg-zinc-50 rounded-xl">
              <p className="text-sm font-medium text-zinc-700 mb-3">新增薄弱项</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">项目标识（英文）</label>
                  <input
                    type="text"
                    value={newItemKey}
                    onChange={(e) => setNewItemKey(e.target.value)}
                    placeholder="例如：daoku"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">项目名称</label>
                  <input
                    type="text"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    placeholder="例如：倒车入库"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">排序</label>
                  <input
                    type="number"
                    value={newItemSort}
                    onChange={(e) => setNewItemSort(Number(e.target.value))}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors font-medium"
                >
                  确认添加
                </button>
                <button
                  onClick={resetAddItem}
                  className="px-4 py-2 text-zinc-600 text-sm rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {weaknessItemConfigs.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">暂无配置</p>
            ) : (
              weaknessItemConfigs.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    item.enabled
                      ? "bg-white border-zinc-200"
                      : "bg-zinc-50 border-zinc-100 opacity-60"
                  )}
                >
                  {editingItemId === item.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">项目名称</label>
                        <input
                          type="text"
                          value={editItemLabel}
                          onChange={(e) => setEditItemLabel(e.target.value)}
                          className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">排序</label>
                        <input
                          type="number"
                          value={editItemSort}
                          onChange={(e) => setEditItemSort(Number(e.target.value))}
                          className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEditItem(item.id)}
                          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditItem}
                          className="p-2 text-zinc-500 rounded-lg hover:bg-zinc-100 transition-colors"
                          title="取消"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.enabled ? '#0d9488' : '#d4d4d8' }} />
                        <div>
                          <p className={cn("text-sm font-medium", item.enabled ? "text-zinc-900" : "text-zinc-400")}>
                            {item.label}
                          </p>
                          <p className="text-xs text-zinc-400">标识: {item.key} · 排序: {item.sort_order}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleItemEnabled(item)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            item.enabled
                              ? "text-teal-600 hover:bg-teal-50"
                              : "text-zinc-400 hover:bg-zinc-100"
                          )}
                          title={item.enabled ? "点击禁用" : "点击启用"}
                        >
                          {item.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => startEditItem(item)}
                          className="p-2 text-zinc-500 rounded-lg hover:bg-zinc-100 transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">薄弱等级配置</h2>
          <button
            onClick={() => setShowAddLevel(!showAddLevel)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg hover:bg-rose-600 transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            添加等级
          </button>
        </div>
        <div className="p-6">
          {showAddLevel && (
            <div className="mb-4 p-4 bg-zinc-50 rounded-xl">
              <p className="text-sm font-medium text-zinc-700 mb-3">新增薄弱等级</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">等级值（1-10）</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newLevelValue}
                    onChange={(e) => setNewLevelValue(Number(e.target.value))}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">等级名称</label>
                  <input
                    type="text"
                    value={newLevelLabel}
                    onChange={(e) => setNewLevelLabel(e.target.value)}
                    placeholder="例如：轻微"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">等级描述</label>
                  <input
                    type="text"
                    value={newLevelDesc}
                    onChange={(e) => setNewLevelDesc(e.target.value)}
                    placeholder="可选，描述该等级的含义"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddLevel}
                  className="px-4 py-2 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600 transition-colors font-medium"
                >
                  确认添加
                </button>
                <button
                  onClick={resetAddLevel}
                  className="px-4 py-2 text-zinc-600 text-sm rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {weaknessLevelConfigs.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">暂无配置</p>
            ) : (
              weaknessLevelConfigs.map((level) => (
                <div
                  key={level.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    level.enabled
                      ? "bg-white border-zinc-200"
                      : "bg-zinc-50 border-zinc-100 opacity-60"
                  )}
                >
                  {editingLevelId === level.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">等级名称</label>
                        <input
                          type="text"
                          value={editLevelLabel}
                          onChange={(e) => setEditLevelLabel(e.target.value)}
                          className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">等级描述</label>
                        <input
                          type="text"
                          value={editLevelDesc}
                          onChange={(e) => setEditLevelDesc(e.target.value)}
                          className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEditLevel(level.id)}
                          className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditLevel}
                          className="p-2 text-zinc-500 rounded-lg hover:bg-zinc-100 transition-colors"
                          title="取消"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                            level.enabled ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-400"
                          )}
                        >
                          L{level.level}
                        </div>
                        <div>
                          <p className={cn("text-sm font-medium", level.enabled ? "text-zinc-900" : "text-zinc-400")}>
                            {level.label}
                          </p>
                          {level.description && (
                            <p className="text-xs text-zinc-400">{level.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleLevelEnabled(level)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            level.enabled
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-zinc-400 hover:bg-zinc-100"
                          )}
                          title={level.enabled ? "点击禁用" : "点击启用"}
                        >
                          {level.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => startEditLevel(level)}
                          className="p-2 text-zinc-500 rounded-lg hover:bg-zinc-100 transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLevel(level)}
                          className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
