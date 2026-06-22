import { useEffect, useState } from "react"
import { QrCode, LogOut, AlertCircle, Info } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"

export default function CheckIn() {
  const { activeCheckins, checkins, loading, fetchActiveCheckins, fetchCheckins, checkoutCheckin } = useAppStore()
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))
  const [toast, setToast] = useState<{ type: "warning" | "error" | "info"; message: string } | null>(null)

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
                <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{c.student_name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      签到时间: {new Date(c.check_in_time).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckout(c.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    签退
                  </button>
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
    </div>
  )
}
