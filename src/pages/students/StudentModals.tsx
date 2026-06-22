import { useState } from "react"
import type { Student } from "../../../shared/types"
import { cn, formatHours, formatShortage } from "@/lib/utils"

const statusMap: Record<Student["status"], { label: string; cls: string }> = {
  training: { label: "在训", cls: "bg-blue-100 text-blue-700" },
  exam_scheduled: { label: "已约考", cls: "bg-amber-100 text-amber-700" },
  exam_passed: { label: "已通过", cls: "bg-green-100 text-green-700" },
  completed: { label: "已完成", cls: "bg-emerald-100 text-emerald-700" },
}

export function StatusBadge({ status }: { status: Student["status"] }) {
  const s = statusMap[status]
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", s.cls)}>{s.label}</span>
}

export function ExamModal({ student, onClose, onConfirm, serverError }: { student: Student; onClose: () => void; onConfirm: () => void; serverError?: string }) {
  const subject = student.current_subject
  const completed = subject === 2 ? student.completed_hours_subject2 : student.completed_hours_subject3
  const required = subject === 2 ? student.required_hours_subject2 : student.required_hours_subject3
  const shortage = required - completed
  const sufficient = shortage <= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">约考确认</h3>
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">学员姓名</span>
            <span className="text-zinc-900 font-medium">{student.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">当前科目</span>
            <span className="text-zinc-900 font-medium">科目{subject}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">完成学时</span>
            <span className="text-zinc-900 font-medium">{formatHours(completed)}/{formatHours(required)}小时</span>
          </div>
        </div>
        {!sufficient && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-center gap-2">
            <span className="text-red-600 text-sm font-medium">学时不足，科目{subject}还需补齐{formatShortage(shortage)}小时</span>
          </div>
        )}
        {sufficient && !serverError && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
            <span className="text-green-700 text-sm font-medium">学时已满足要求，可以约考</span>
          </div>
        )}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
            <span className="text-red-600 text-sm font-medium">{serverError}</span>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">取消</button>
          <button
            onClick={onConfirm}
            disabled={!sufficient}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-colors font-medium",
              sufficient ? "bg-teal-700 text-white hover:bg-teal-800" : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            )}
          >
            确认约考
          </button>
        </div>
      </div>
    </div>
  )
}

export function AddStudentModal({
  instructors,
  onClose,
  onSubmit,
}: {
  instructors: { id: number; name: string }[]
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({ name: "", phone: "", instructor_id: "", current_subject: "2" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: form.name,
      phone: form.phone,
      instructor_id: Number(form.instructor_id),
      current_subject: Number(form.current_subject),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">新增学员</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-600 mb-1">姓名</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">电话</label>
            <input
              type="tel" required value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
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
            <label className="block text-sm text-zinc-600 mb-1">当前科目</label>
            <select
              value={form.current_subject}
              onChange={(e) => setForm((f) => ({ ...f, current_subject: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="2">科目二</option>
              <option value="3">科目三</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">取消</button>
            <button type="submit" className="px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium">确认添加</button>
          </div>
        </form>
      </div>
    </div>
  )
}
