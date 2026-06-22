import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import type { Student } from "../../shared/types"
import { StatusBadge, ExamModal, AddStudentModal } from "./students/StudentModals"

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "training", label: "在训" },
  { value: "exam_scheduled", label: "已约考" },
  { value: "exam_passed", label: "已通过" },
  { value: "completed", label: "已完成" },
]

export default function Students() {
  const navigate = useNavigate()
  const { students, instructors, loading, fetchStudents, fetchInstructors, createStudent, scheduleExam } = useAppStore()

  const [subjectTab, setSubjectTab] = useState<2 | 3>(2)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [examStudent, setExamStudent] = useState<Student | null>(null)
  const [examError, setExamError] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  useEffect(() => {
    const params: Record<string, string> = { subject: String(subjectTab) }
    if (search) params.keyword = search
    if (statusFilter) params.status = statusFilter
    fetchStudents(params)
  }, [subjectTab, search, statusFilter, fetchStudents])

  const handleScheduleExam = async () => {
    if (!examStudent) return
    setExamError("")
    const result = await scheduleExam(examStudent.id)
    if (result.ok) {
      setExamStudent(null)
    } else {
      setExamError(result.error || "约考失败")
    }
  }

  const handleAddStudent = async (data: Record<string, unknown>) => {
    const ok = await createStudent(data)
    if (ok) setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-200">
        {([2, 3] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSubjectTab(s)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              subjectTab === s
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            )}
          >
            科目{s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text" placeholder="搜索学员姓名或电话..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          新增学员
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50">
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">姓名</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">电话</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">教练</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">当前科目</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">已完成学时</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">状态</th>
                <th className="text-left px-6 py-3 text-zinc-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading.students ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-3"><div className="h-4 bg-zinc-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">暂无学员数据</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                    <td className="px-6 py-3 text-zinc-900 font-medium">{s.name}</td>
                    <td className="px-6 py-3 text-zinc-600">{s.phone}</td>
                    <td className="px-6 py-3 text-zinc-600">{s.instructor_name || "-"}</td>
                    <td className="px-6 py-3 text-zinc-600">科目{s.current_subject}</td>
                    <td className="px-6 py-3 text-zinc-600">
                      {s.current_subject === 2
                        ? `${s.completed_hours_subject2}/${s.required_hours_subject2}`
                        : `${s.completed_hours_subject3}/${s.required_hours_subject3}`}
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/students/${s.id}`)}
                          className="text-teal-700 hover:underline text-sm font-medium"
                        >
                          查看详情
                        </button>
                        {s.status === "training" && (
                          <button
                            onClick={() => setExamStudent(s)}
                            className="text-amber-600 hover:underline text-sm font-medium"
                          >
                            约考
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {examStudent && (
        <ExamModal
          student={examStudent}
          onClose={() => { setExamStudent(null); setExamError("") }}
          onConfirm={handleScheduleExam}
          serverError={examError}
        />
      )}
      {showAdd && (
        <AddStudentModal instructors={instructors} onClose={() => setShowAdd(false)} onSubmit={handleAddStudent} />
      )}
    </div>
  )
}
