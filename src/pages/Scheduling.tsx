import { useEffect, useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import { ScheduleDrawer, VehicleManager, timeSlots } from "./scheduling/ScheduleDrawer"

const dayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function Scheduling() {
  const { schedules, loading, fetchSchedules, fetchVehicles, fetchInstructors } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDate, setDrawerDate] = useState("")
  const [drawerSlot, setDrawerSlot] = useState("")

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  useEffect(() => {
    fetchVehicles()
    fetchInstructors()
  }, [fetchVehicles, fetchInstructors])

  useEffect(() => {
    const start = formatDate(weekDates[0])
    const end = formatDate(weekDates[6])
    fetchSchedules({ start_date: start, end_date: end })
  }, [weekDates, fetchSchedules])

  const scheduleMap = useMemo(() => {
    const m: Record<string, { instructor_name: string; vehicle_plate: string }> = {}
    for (const s of schedules) {
      const key = `${s.schedule_date}_${s.time_slot}`
      m[key] = { instructor_name: s.instructor_name || "", vehicle_plate: s.vehicle_plate || "" }
    }
    return m
  }, [schedules])

  const prevWeek = () => {
    setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  }
  const nextWeek = () => {
    setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  }

  const handleCellClick = (date: string, slot: string) => {
    setDrawerDate(date)
    setDrawerSlot(slot)
    setDrawerOpen(true)
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <span className="text-sm font-medium text-zinc-700 min-w-[120px] text-center">
            {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
          </span>
          <button onClick={nextWeek} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>
        <input
          type="date"
          value={formatDate(currentDate)}
          onChange={(e) => setCurrentDate(new Date(e.target.value))}
          className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border border-zinc-100 px-3 py-2.5 bg-zinc-50 text-zinc-500 font-medium w-20">时段</th>
                {weekDates.map((d, i) => (
                  <th
                    key={i}
                    className={cn(
                      "border border-zinc-100 px-3 py-2.5 font-medium text-center",
                      isToday(d) ? "bg-teal-50 text-teal-700" : "bg-zinc-50 text-zinc-500"
                    )}
                  >
                    <div>{dayLabels[i]}</div>
                    <div className="text-xs mt-0.5">{d.getMonth() + 1}/{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot}>
                  <td className="border border-zinc-100 px-3 py-2 text-center text-zinc-600 font-medium bg-zinc-50/50">
                    {slot}
                  </td>
                  {weekDates.map((d, i) => {
                    const key = `${formatDate(d)}_${slot}`
                    const scheduled = scheduleMap[key]
                    return (
                      <td
                        key={i}
                        onClick={() => handleCellClick(formatDate(d), slot)}
                        className={cn(
                          "border border-zinc-100 px-3 py-2 cursor-pointer transition-colors min-h-[60px]",
                          scheduled
                            ? "bg-teal-50 hover:bg-teal-100"
                            : "hover:bg-zinc-50"
                        )}
                      >
                        {scheduled ? (
                          <div className="text-xs">
                            <div className="text-teal-700 font-medium">{scheduled.instructor_name}</div>
                            <div className="text-zinc-500 mt-0.5">{scheduled.vehicle_plate}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-300 text-center">+</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <VehicleManager />

      {drawerOpen && (
        <ScheduleDrawer
          date={drawerDate}
          timeSlot={drawerSlot}
          onClose={() => setDrawerOpen(false)}
          onCreated={() => {
            const start = formatDate(weekDates[0])
            const end = formatDate(weekDates[6])
            fetchSchedules({ start_date: start, end_date: end })
          }}
        />
      )}
    </div>
  )
}
