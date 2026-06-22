import { useEffect, useState } from "react"
import { QrCode, LogOut, AlertCircle, Info, Flag, X, AlertTriangle, ChevronDown } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import { WEAKNESS_ITEMS, type WeaknessItem } from "../../shared/types"

export default function CheckIn() {
  const { activeCheckins, checkins, loading, fetchActiveCheckins, fetchCheckins, checkoutCheckin, addStudentWeakness, studentWeaknesses, fetchStudentWeaknesses } = useAppStore()
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))
  const [toast, setToast] = useState<{ type: "warning" | "error" | "info" | "success"; message: string } | null>(null)
  const [weaknessModal, setWeaknessModal] = useState<{ checkInId: number; studentId: number; studentName: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<WeaknessItem | null>(null)
  const [weaknessLevel, setWeaknessLevel] = useState(3)
  const [weaknessNote, setWeaknessNote] = useState("")
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null)

  useEffect(() => {
    fetchActiveCheckins()
  }, [fetchActiveCheckins])

  useEffect(() => {
    fetchCheckins({ date: dateFilter })
  }, [dateFilter, fetchCheckins])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleCheckout = async (id: number) => {
    const result = await checkoutCheckin(id)
    if (!result.ok) {
      setToast({ type: "error", message: result.error || "签退失败" })
    } else if (result.warning) {
      setToast({ type: "warning", message: result.warning })
    } else {
      setToast({ type: "info", message: "签退成功，学时已自动计算" })
    }
  }

  const openWeaknessModal = (checkInId: number, studentId: number, studentName: string) => {
    setWeaknessModal({ checkInId, studentId, studentName })
    setSelectedItem(null)
    setWeaknessLevel(3)
    setWeaknessNote("")
    fetchStudentWeaknesses(studentId)
  }

  const toggleExpand = (studentId: number) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null)
    } else {
      setExpandedStudentId(studentId)
      fetchStudentWeaknesses(studentId)
    }
  }

  const closeWeaknessModal = () => {
    setWeaknessModal(null)
  }

  const handleAddWeakness = async () => {
    if (!weaknessModal || !selectedItem) return

    const success = await addStudentWeakness(weaknessModal.studentId, {
      item: selectedItem,
      level: weaknessLevel,
      note: weaknessNote || null,
      check_in_id: weaknessModal.checkInId,
    })

    if (success) {
      setToast({ type: "success", message: "薄弱项目已标记" })
      closeWeaknessModal()
    } else {
      setToast({ type: "error", message: "标记失败，请重试" })
    }
  }

  const unresolvedWeaknesses = studentWeaknesses.filter(w => w.resolved === 0)

  const formatDuration = (hours: number | null | undefined) => {
    if (hours == null) return null
    if (hours <= 0) return "0小时（不计入学时）"
    return `${hours}小时`
  }

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm animate-in fade-in slide-in-from-right",
          toast.type === "warning" && "bg-amber-50 border border-amber-200 text-amber-800",
          toast.type === "error" && "bg-red-50 border border-red-200 text-red-700",
          toast.type === "info" && "bg-teal-50 border border-teal-200 text-teal-700"
        )}>
          {toast.type === "warning" && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.type === "info" && <Info className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-56 h-56 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-4 grid grid-cols-6 grid-rows-6 gap-1 opacity-20">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className={cn(
                  "rounded-sm",
                  Math.random() > 0.4 ? "bg-zinc-800" : "bg-transparent"
                )} />
              ))}
            </div>
            <QrCode className="w-16 h-16 text-teal-700 mb-3 relative z-10" />
            <span className="text-lg font-semibold text-zinc-700 relative z-10">扫码签到</span>
            <span className="text-xs text-zinc-400 mt-1 relative z-10">学员请使用手机扫码签到</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-base font-semibold text-zinc-900">当前签到中</h2>
          </div>
          {activeCheckins.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-400 text-sm">暂无学员签到中</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {activeCheckins.map((c) => (
                <div key={c.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(c.student_id)}
                      className="flex items-center gap-2 text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900">{c.student_name}</p>
                          {expandedStudentId === c.student_id && unresolvedWeaknesses.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-xs rounded-full font-medium">
                              {unresolvedWeaknesses.length}项薄弱
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          签到时间: {new Date(c.check_in_time).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-zinc-400 transition-transform",
                        expandedStudentId === c.student_id && "rotate-180"
                      )} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openWeaknessModal(c.id, c.student_id, c.student_name || "")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs rounded-lg hover:bg-rose-100 transition-colors font-medium"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        标记薄弱项
                      </button>
                      <button
                        onClick={() => handleCheckout(c.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        签退
                      </button>
                    </div>
                  </div>
                  {expandedStudentId === c.student_id && unresolvedWeaknesses.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        待加强项目（建议优先训练）
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {unresolvedWeaknesses.map(w => (
                          <span key={w.id} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                            {WEAKNESS_ITEMS.find(item => item.key === w.item)?.label} · Lv.{w.level}
                          </span>
                        ))}
                      </div>
                      {unresolvedWeaknesses.some(w => w.note) && (
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          {unresolvedWeaknesses.filter(w => w.note).map(w => (
                            <p key={w.id} className="text-xs text-amber-600">
                              · {WEAKNESS_ITEMS.find(item => item.key === w.item)?.label}：{w.note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {expandedStudentId === c.student_id && unresolvedWeaknesses.length === 0 && (
                    <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-center">
                      <p className="text-xs text-zinc-500">暂无薄弱项目记录</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">签到记录</h2>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50">
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">学员</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">教练</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">车辆</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">科目</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">签到时间</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">签退时间</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">时长</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading.checkins ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-3"><div className="h-4 bg-zinc-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : checkins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">暂无签到记录</td>
                </tr>
              ) : (
                checkins.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-3 text-zinc-900 font-medium">{c.student_name}</td>
                    <td className="px-6 py-3 text-zinc-600">{c.instructor_name}</td>
                    <td className="px-6 py-3 text-zinc-600">{c.vehicle_plate}</td>
                    <td className="px-6 py-3 text-zinc-600">科目{c.subject}</td>
                    <td className="px-6 py-3 text-zinc-600">{new Date(c.check_in_time).toLocaleString("zh-CN")}</td>
                    <td className="px-6 py-3 text-zinc-600">
                      {c.check_out_time ? new Date(c.check_out_time).toLocaleString("zh-CN") : "-"}
                    </td>
                    <td className="px-6 py-3">
                      {c.duration_hours != null ? (
                        <span className={cn(
                          c.duration_hours <= 0 ? "text-zinc-400" : "text-zinc-600"
                        )}>{formatDuration(c.duration_hours)}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">进行中</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {weaknessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">标记薄弱项目</h3>
              <button
                onClick={closeWeaknessModal}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm text-zinc-600 mb-2">
                  学员：<span className="font-medium text-zinc-900">{weaknessModal.studentName}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">选择薄弱项目</label>
                <div className="grid grid-cols-2 gap-2">
                  {WEAKNESS_ITEMS.map((item) => (
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
                  严重程度：<span className="text-rose-600">Lv.{weaknessLevel}</span>
                </label>
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
                onClick={closeWeaknessModal}
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
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
