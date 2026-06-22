import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Circle, Plus, Check, Trash2, AlertTriangle, X } from "lucide-react"
import { useAppStore } from "@/store"
import { cn, formatHours } from "@/lib/utils"
import { StatusBadge } from "./students/StudentModals"
import { WEAKNESS_ITEMS, type WeaknessItem } from "../../shared/types"

const subjectSteps = [
  { num: 1, label: "科目一" },
  { num: 2, label: "科目二" },
  { num: 3, label: "科目三" },
  { num: 4, label: "科目四" },
]

function getSubjectStatus(current: number, stepNum: number, studentStatus: string): "done" | "current" | "pending" {
  if (studentStatus === "completed") return "done"
  if (stepNum < current) return "done"
  if (stepNum === current) return "current"
  return "pending"
}

function WeaknessRadarChart({
  stats,
  items,
  maxLevel = 5,
}: {
  stats: Record<string, { level: number; count: number }>
  items: { key: string; label: string }[]
  maxLevel?: number
}) {
  const size = 220
  const center = size / 2
  const maxRadius = 75
  const displayItems = items.length > 0 ? items : WEAKNESS_ITEMS
  const levels = Math.max(maxLevel, 5)
  const angleStep = (2 * Math.PI) / displayItems.length
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    const radius = (value / levels) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const getLabelPoint = (index: number) => {
    const angle = startAngle + index * angleStep
    const radius = maxRadius + 20
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const dataPoints = displayItems.map((item, i) => getPoint(i, stats[item.key]?.level || 0))
  const pathD = dataPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") + " Z"

  return (
    <svg width={size} height={size} className="mx-auto">
      {Array.from({ length: levels }).map((_, i) => {
        const r = ((i + 1) / levels) * maxRadius
        const points = displayItems.map((_, idx) => {
          const angle = startAngle + idx * angleStep
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
        }).join(" ")
        return (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="1"
          />
        )
      })}

      {displayItems.map((_, i) => {
        const angle = startAngle + i * angleStep
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + maxRadius * Math.cos(angle)}
            y2={center + maxRadius * Math.sin(angle)}
            stroke="#e4e4e7"
            strokeWidth="1"
          />
        )
      })}

      <path
        d={pathD}
        fill="rgba(244, 63, 94, 0.2)"
        stroke="#f43f5e"
        strokeWidth="2"
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f43f5e" />
      ))}

      {displayItems.map((item, i) => {
        const pos = getLabelPoint(i)
        return (
          <text
            key={item.key}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-zinc-600 font-medium"
          >
            {item.label}
          </text>
        )
      })}
    </svg>
  )
}

function ProgressBar({ completed, required }: { completed: number; required: number }) {
  const pct = required > 0 ? (completed / required) * 100 : 0
  const color = pct >= 80 ? "bg-teal-600" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-600">学时进度</span>
        <span className="text-zinc-900 font-medium">{formatHours(completed)}/{formatHours(required)}小时</span>
      </div>
      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

const examStatusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "待审核", cls: "bg-zinc-100 text-zinc-600" },
  approved: { label: "已批准", cls: "bg-blue-100 text-blue-700" },
  rejected: { label: "已拒绝", cls: "bg-red-100 text-red-700" },
  passed: { label: "已通过", cls: "bg-green-100 text-green-700" },
  failed: { label: "未通过", cls: "bg-red-100 text-red-700" },
}

function formatDuration(hours: number | null | undefined) {
  if (hours == null) return "-"
  if (hours <= 0) return "0小时"
  return `${hours}小时`
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { studentDetail, studentExams, studentCheckins, studentWeaknesses, loading, fetchStudentDetail, addStudentWeakness, resolveWeakness, deleteWeakness, fetchWeaknessItemConfigs, fetchWeaknessLevelConfigs, weaknessItemConfigs, weaknessLevelConfigs } = useAppStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WeaknessItem | null>(null)
  const [weaknessLevel, setWeaknessLevel] = useState<number | null>(null)
  const [weaknessNote, setWeaknessNote] = useState("")

  useEffect(() => {
    if (id) fetchStudentDetail(Number(id))
    fetchWeaknessItemConfigs()
    fetchWeaknessLevelConfigs()
  }, [id, fetchStudentDetail, fetchWeaknessItemConfigs, fetchWeaknessLevelConfigs])

  const enabledItems = weaknessItemConfigs.filter(i => i.enabled)
  const enabledLevels = weaknessLevelConfigs.filter(l => l.enabled).sort((a, b) => a.level - b.level)
  const fallbackItems = enabledItems.length > 0
    ? enabledItems.map(i => ({ key: i.key, label: i.label }))
    : WEAKNESS_ITEMS
  const defaultLevel = enabledLevels.length > 0 ? enabledLevels[Math.floor(enabledLevels.length / 2)].level : 5
  const maxLevel = enabledLevels.length > 0 ? Math.max(...enabledLevels.map(l => l.level)) : 5

  const getItemLabel = (key: string) => {
    const config = weaknessItemConfigs.find(i => i.key === key)
    if (config) return config.label
    const fallback = WEAKNESS_ITEMS.find(i => i.key === key)
    return fallback?.label || key
  }

  const getLevelLabel = (level: number) => {
    const config = weaknessLevelConfigs.find(l => l.level === level)
    return config?.label || `Lv.${level}`
  }

  const handleAddWeakness = () => {
    if (!id || !selectedItem) return
    addStudentWeakness(Number(id), {
      item: selectedItem,
      level: weaknessLevel ?? defaultLevel,
      note: weaknessNote || null,
    })
    setShowAddModal(false)
    setSelectedItem(null)
    setWeaknessLevel(null)
    setWeaknessNote("")
  }

  useEffect(() => {
    if (showAddModal) {
      setWeaknessLevel(defaultLevel)
    }
  }, [showAddModal, defaultLevel])

  const unresolvedWeaknesses = studentWeaknesses.filter(w => w.resolved === 0)
  const resolvedWeaknesses = studentWeaknesses.filter(w => w.resolved === 1)

  const getWeaknessStats = () => {
    const stats: Record<string, { level: number; count: number }> = {}
    fallbackItems.forEach(item => {
      stats[item.key] = { level: 0, count: 0 }
    })
    unresolvedWeaknesses.forEach(w => {
      if (stats[w.item]) {
        stats[w.item].level = Math.max(stats[w.item].level, w.level)
        stats[w.item].count += 1
      }
    })
    return stats
  }

  if (loading.studentDetail || !studentDetail) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-zinc-200 rounded" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-48 bg-zinc-100 rounded-xl" />
            <div className="col-span-2 h-48 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const s = studentDetail
  const currentSubject = s.current_subject
  const completedHours = currentSubject === 2 ? s.completed_hours_subject2 : s.completed_hours_subject3
  const requiredHours = currentSubject === 2 ? s.required_hours_subject2 : s.required_hours_subject3

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/students")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学员列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">学员信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">姓名</span>
              <span className="text-zinc-900 font-medium">{s.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">电话</span>
              <span className="text-zinc-900">{s.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">教练</span>
              <span className="text-zinc-900">{s.instructor_name || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">报名时间</span>
              <span className="text-zinc-900">{s.enroll_date}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-zinc-500">状态</span>
              <StatusBadge status={s.status} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">学习进度</h2>
            <div className="flex items-center gap-0 mb-6">
              {subjectSteps.map((step, i) => {
                const status = getSubjectStatus(currentSubject, step.num, s.status)
                return (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        status === "done" ? "bg-teal-700 border-teal-700" :
                        status === "current" ? "bg-white border-teal-700" :
                        "bg-white border-zinc-300"
                      )}>
                        {status === "done" ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : status === "current" ? (
                          <Circle className="w-5 h-5 text-teal-700 fill-teal-700" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-300" />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs mt-1.5 font-medium",
                        status === "done" ? "text-teal-700" :
                        status === "current" ? "text-teal-700" :
                        "text-zinc-400"
                      )}>{step.label}</span>
                    </div>
                    {i < subjectSteps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-2",
                        status === "done" ? "bg-teal-700" : "bg-zinc-200"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
            <ProgressBar completed={completedHours} required={requiredHours} />
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-base font-semibold text-zinc-900">考试记录</h2>
            </div>
            {studentExams.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400 text-sm">暂无考试记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">科目</th>
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">考试日期</th>
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {studentExams.map((e) => (
                      <tr key={e.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-3 text-zinc-900">科目{e.subject}</td>
                        <td className="px-6 py-3 text-zinc-600">{e.exam_date || "待定"}</td>
                        <td className="px-6 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", examStatusMap[e.status]?.cls || "bg-zinc-100 text-zinc-600")}>
                            {examStatusMap[e.status]?.label || e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">签到记录</h2>
            </div>
            {studentCheckins.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400 text-sm">暂无签到记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">科目</th>
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">签到时间</th>
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">签退时间</th>
                      <th className="text-left px-6 py-3 text-zinc-500 font-medium">时长</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {studentCheckins.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-3 text-zinc-900">科目{c.subject}</td>
                        <td className="px-6 py-3 text-zinc-600">{new Date(c.check_in_time).toLocaleString("zh-CN")}</td>
                        <td className="px-6 py-3 text-zinc-600">
                          {c.check_out_time ? new Date(c.check_out_time).toLocaleString("zh-CN") : "-"}
                        </td>
                        <td className="px-6 py-3 text-zinc-600">
                          {formatDuration(c.duration_hours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">薄弱项目分析</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg hover:bg-rose-600 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                添加薄弱项
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 mb-3">弱点雷达图</h3>
                  <WeaknessRadarChart stats={getWeaknessStats()} items={fallbackItems} maxLevel={maxLevel} />
                  {unresolvedWeaknesses.length === 0 && (
                    <p className="text-center text-sm text-zinc-400 mt-2">暂无薄弱项目记录</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 mb-3">
                    待加强项目
                    {unresolvedWeaknesses.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-xs rounded-full">
                        {unresolvedWeaknesses.length}项
                      </span>
                    )}
                  </h3>
                  {unresolvedWeaknesses.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 text-sm">暂无待加强项目</div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {unresolvedWeaknesses.map((w) => (
                        <div key={w.id} className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-zinc-900">
                                  {getItemLabel(String(w.item))}
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  严重程度：{getLevelLabel(w.level)} · 标记于 {new Date(w.created_at).toLocaleDateString("zh-CN")}
                                </p>
                                {w.note && (
                                  <p className="text-xs text-zinc-600 mt-1">{w.note}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => resolveWeakness(w.id)}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                title="标记为已解决"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteWeakness(w.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {resolvedWeaknesses.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-100">
                  <h3 className="text-sm font-medium text-zinc-700 mb-3">
                    已解决项目
                    <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-600 text-xs rounded-full">
                      {resolvedWeaknesses.length}项
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {resolvedWeaknesses.map((w) => (
                      <div key={w.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg opacity-70">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-zinc-700 line-through">
                                {getItemLabel(String(w.item))}
                              </p>
                              <p className="text-xs text-zinc-400">
                                解决于 {w.resolved_at ? new Date(w.resolved_at).toLocaleDateString("zh-CN") : "-"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteWeakness(w.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">添加薄弱项目</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">选择薄弱项目</label>
                <div className="grid grid-cols-2 gap-2">
                  {fallbackItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedItem(item.key)}
                      className={cn(
                        "px-4 py-3 text-sm rounded-xl border-2 transition-all",
                        selectedItem === item.key
                          ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  严重程度：<span className="text-rose-600">{weaknessLevel ? getLevelLabel(weaknessLevel) : '-'}</span>
                </label>
                {enabledLevels.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      {enabledLevels.map((lvl) => (
                        <button
                          key={lvl.level}
                          onClick={() => setWeaknessLevel(lvl.level)}
                          className={cn(
                            "flex-1 py-2 text-sm rounded-lg font-medium transition-all",
                            weaknessLevel === lvl.level
                              ? "bg-rose-500 text-white"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          )}
                          title={lvl.description || undefined}
                        >
                          {lvl.level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5">
                      {enabledLevels.map(l => `L${l.level}=${l.label}`).join('，')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => setWeaknessLevel(level)}
                          className={cn(
                            "flex-1 py-2 text-sm rounded-lg font-medium transition-all",
                            weaknessLevel === level
                              ? "bg-rose-500 text-white"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5">1=轻微，5=严重</p>
                  </>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">备注（可选）</label>
                <textarea
                  value={weaknessNote}
                  onChange={(e) => setWeaknessNote(e.target.value)}
                  placeholder="例如：入库角度总是偏左..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddWeakness}
                disabled={!selectedItem}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  selectedItem
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                )}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
