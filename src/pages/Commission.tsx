import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Save } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import type { CommissionSummary, CommissionDetail } from "../../shared/types"

export default function Commission() {
  const {
    commissionSummaries, commissionSettings, commissionDetails,
    loading, fetchCommissionSummaries, fetchCommissionSettings,
    fetchCommissionDetails, updateCommissionSettings,
  } = useAppStore()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [s2Price, setS2Price] = useState("")
  const [s3Price, setS3Price] = useState("")

  useEffect(() => {
    fetchCommissionSettings()
    fetchCommissionSummaries(year, month)
  }, [year, month, fetchCommissionSettings, fetchCommissionSummaries])

  useEffect(() => {
    if (commissionSettings.length > 0) {
      const s2 = commissionSettings.find((s) => s.subject === 2)
      const s3 = commissionSettings.find((s) => s.subject === 3)
      if (s2) setS2Price(String(s2.unit_price))
      if (s3) setS3Price(String(s3.unit_price))
    }
  }, [commissionSettings])

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
    </div>
  )
}
