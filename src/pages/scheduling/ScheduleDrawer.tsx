import { useState } from "react"
import { X } from "lucide-react"
import { useAppStore } from "@/store"
import type { Schedule } from "../../../shared/types"

const timeSlots = ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00"]

export function ScheduleDrawer({
  date,
  timeSlot,
  onClose,
  onCreated,
}: {
  date: string
  timeSlot: string
  onClose: () => void
  onCreated: () => void
}) {
  const { instructors, vehicles, createSchedule } = useAppStore()
  const [form, setForm] = useState({
    instructor_id: "",
    vehicle_id: "",
    schedule_date: date,
    time_slot: timeSlot,
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const result = await createSchedule({
      instructor_id: Number(form.instructor_id),
      vehicle_id: Number(form.vehicle_id),
      schedule_date: form.schedule_date,
      time_slot: form.time_slot,
    })
    if (result.ok) {
      onCreated()
      onClose()
    } else {
      setError(result.error || "创建失败，可能存在排班冲突")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-black/40 absolute inset-0" />
      <div className="relative w-96 bg-white h-full shadow-xl p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900">创建排班</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-600 mb-1">教练</label>
            <select
              required value={form.instructor_id}
              onChange={(e) => setForm((f) => ({ ...f, instructor_id: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">选择教练</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">车辆</label>
            <select
              required value={form.vehicle_id}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">选择车辆</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate_number} ({v.model})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">日期</label>
            <input
              type="date" required value={form.schedule_date}
              onChange={(e) => setForm((f) => ({ ...f, schedule_date: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">时段</label>
            <select
              value={form.time_slot}
              onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors font-medium"
          >
            创建排班
          </button>
        </form>
      </div>
    </div>
  )
}

export function VehicleManager() {
  const { vehicles, createVehicle } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plate_number: "", model: "" })

  const vehicleStatusMap: Record<string, { label: string; cls: string }> = {
    available: { label: "可用", cls: "bg-green-100 text-green-700" },
    in_use: { label: "使用中", cls: "bg-blue-100 text-blue-700" },
    maintenance: { label: "维修中", cls: "bg-amber-100 text-amber-700" },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await createVehicle(form)
    if (ok) {
      setShowForm(false)
      setForm({ plate_number: "", model: "" })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">车辆管理</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors font-medium"
        >
          添加车辆
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="px-6 py-3 border-b border-zinc-100 flex items-center gap-3">
          <input
            type="text" placeholder="车牌号" required value={form.plate_number}
            onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text" placeholder="车型" required value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button type="submit" className="px-3 py-1.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800">确认</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-zinc-500 text-sm hover:bg-zinc-100 rounded-lg">取消</button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50">
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">车牌号</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">车型</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {vehicles.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-400">暂无车辆</td></tr>
            ) : vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-50">
                <td className="px-6 py-3 text-zinc-900 font-medium">{v.plate_number}</td>
                <td className="px-6 py-3 text-zinc-600">{v.model}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vehicleStatusMap[v.status]?.cls || ""}`}>
                    {vehicleStatusMap[v.status]?.label || v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { timeSlots }
