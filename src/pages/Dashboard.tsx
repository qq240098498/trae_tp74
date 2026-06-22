import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Users, Calendar, FileText, DollarSign, AlertTriangle } from "lucide-react"
import { useAppStore } from "@/store"
import { cn, formatHours, formatShortage } from "@/lib/utils"

const statCards = [
  { key: "total_students" as const, label: "在训学员", icon: Users, gradient: "from-teal-600 to-teal-700" },
  { key: "today_schedules" as const, label: "今日排班", icon: Calendar, gradient: "from-blue-500 to-blue-600" },
  { key: "pending_exams" as const, label: "待约考学员", icon: FileText, gradient: "from-amber-500 to-amber-600" },
  { key: "month_commission" as const, label: "本月提成", icon: DollarSign, gradient: "from-emerald-500 to-emerald-600" },
]

function StatCard({ card, value }: { card: typeof statCards[number]; value: number }) {
  const Icon = card.icon
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br", card.gradient)}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{card.label}</p>
      </div>
    </div>
  )
}

function StatusBadge({ checkoutTime }: { checkoutTime: string | null }) {
  if (checkoutTime) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">签退</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">签到</span>
}

function formatDuration(hours: number | null | undefined) {
  if (hours == null) return "-"
  if (hours <= 0) return "0小时"
  return `${hours}小时`
}

export default function Dashboard() {
  const { dashboardStats, recentCheckins, hoursWarnings, loading, fetchDashboard } = useAppStore()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading.dashboard) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-zinc-200 rounded" />
                  <div className="h-4 w-20 bg-zinc-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.key} card={card} value={dashboardStats?.[card.key] ?? 0} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">最近签到记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50">
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">学员</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">教练</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">签到时间</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">签退时间</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">时长</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentCheckins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">暂无签到记录</td>
                </tr>
              ) : (
                recentCheckins.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-3 text-zinc-900">{r.student_name}</td>
                    <td className="px-6 py-3 text-zinc-600">{r.instructor_name}</td>
                    <td className="px-6 py-3 text-zinc-600">{new Date(r.check_in_time).toLocaleString("zh-CN")}</td>
                    <td className="px-6 py-3 text-zinc-600">
                      {r.check_out_time ? new Date(r.check_out_time).toLocaleString("zh-CN") : "-"}
                    </td>
                    <td className="px-6 py-3 text-zinc-600">
                      {formatDuration(r.duration_hours)}
                    </td>
                    <td className="px-6 py-3"><StatusBadge checkoutTime={r.check_out_time} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hoursWarnings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-base font-semibold text-zinc-900">学时预警</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {hoursWarnings.map((w) => (
              <Link
                key={w.student_id}
                to={`/students/${w.student_id}`}
                className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm text-zinc-900 font-medium">{w.student_name}</span>
                <span className="text-sm text-red-600">
                  科目{w.current_subject}还差{formatShortage(w.shortage)}小时
                </span>
                <span className="ml-auto text-xs text-zinc-400">
                  已完成{formatHours(w.completed_hours)}/{formatHours(w.required_hours)}小时
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
