import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./students/StudentModals"

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

function ProgressBar({ completed, required }: { completed: number; required: number }) {
  const pct = required > 0 ? (completed / required) * 100 : 0
  const color = pct >= 80 ? "bg-teal-600" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-600">学时进度</span>
        <span className="text-zinc-900 font-medium">{completed}/{required}小时</span>
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

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { studentDetail, studentExams, studentCheckins, loading, fetchStudentDetail } = useAppStore()

  useEffect(() => {
    if (id) fetchStudentDetail(Number(id))
  }, [id, fetchStudentDetail])

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
            <div className="px-6 py-4 border-b border-zinc-100">
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
                          {c.duration_hours != null ? `${c.duration_hours}小时` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
