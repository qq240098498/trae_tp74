import { create } from "zustand"
import type {
  Student,
  Schedule,
  CheckInRecord,
  ExamAppointment,
  Vehicle,
  Instructor,
  CommissionSetting,
  CommissionSummary,
  CommissionDetail,
  DashboardStats,
  HoursWarning,
} from "../../shared/types"

interface AppState {
  activeTab: string
  setActiveTab: (tab: string) => void

  dashboardStats: DashboardStats | null
  recentCheckins: CheckInRecord[]
  hoursWarnings: HoursWarning[]

  students: Student[]
  studentDetail: Student | null
  studentExams: ExamAppointment[]
  studentCheckins: CheckInRecord[]

  schedules: Schedule[]
  vehicles: Vehicle[]
  instructors: Instructor[]

  checkins: CheckInRecord[]
  activeCheckins: CheckInRecord[]

  commissionSettings: CommissionSetting[]
  commissionSummaries: CommissionSummary[]
  commissionDetails: Record<number, CommissionDetail[]>

  loading: Record<string, boolean>
  errors: Record<string, string | null>

  fetchDashboard: () => Promise<void>
  fetchStudents: (params?: Record<string, string>) => Promise<void>
  fetchStudentDetail: (id: number) => Promise<void>
  fetchSchedules: (params?: Record<string, string>) => Promise<void>
  fetchVehicles: () => Promise<void>
  fetchInstructors: () => Promise<void>
  fetchCheckins: (params?: Record<string, string>) => Promise<void>
  fetchActiveCheckins: () => Promise<void>
  fetchCommissionSettings: () => Promise<void>
  fetchCommissionSummaries: (year: number, month: number) => Promise<void>
  fetchCommissionDetails: (instructorId: number, year: number, month: number) => Promise<void>
  createStudent: (data: Record<string, unknown>) => Promise<boolean>
  scheduleExam: (studentId: number) => Promise<{ ok: boolean; error?: string }>
  createSchedule: (data: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>
  checkoutCheckin: (id: number) => Promise<{ ok: boolean; warning?: string; error?: string }>
  updateCommissionSettings: (data: { subject2_price: number; subject3_price: number }) => Promise<boolean>
  createVehicle: (data: Record<string, unknown>) => Promise<boolean>
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || json.message || `请求失败: ${res.status}`)
  }
  return json.data as T
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: "/",
  setActiveTab: (tab) => set({ activeTab: tab }),

  dashboardStats: null,
  recentCheckins: [],
  hoursWarnings: [],

  students: [],
  studentDetail: null,
  studentExams: [],
  studentCheckins: [],

  schedules: [],
  vehicles: [],
  instructors: [],

  checkins: [],
  activeCheckins: [],

  commissionSettings: [],
  commissionSummaries: [],
  commissionDetails: {},

  loading: {},
  errors: {},

  fetchDashboard: async () => {
    set((s) => ({ loading: { ...s.loading, dashboard: true }, errors: { ...s.errors, dashboard: null } }))
    try {
      const [stats, checkins, warnings] = await Promise.all([
        apiFetch<DashboardStats>("/dashboard/stats"),
        apiFetch<CheckInRecord[]>("/checkins?limit=10"),
        apiFetch<HoursWarning[]>("/dashboard/hours-warnings"),
      ])
      set({ dashboardStats: stats, recentCheckins: checkins, hoursWarnings: warnings })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, dashboard: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, dashboard: false } }))
    }
  },

  fetchStudents: async (params) => {
    set((s) => ({ loading: { ...s.loading, students: true }, errors: { ...s.errors, students: null } }))
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : ""
      const data = await apiFetch<Student[]>(`/students${query}`)
      set({ students: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, students: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, students: false } }))
    }
  },

  fetchStudentDetail: async (id) => {
    set((s) => ({ loading: { ...s.loading, studentDetail: true }, errors: { ...s.errors, studentDetail: null } }))
    try {
      const [student, exams, checkins] = await Promise.all([
        apiFetch<Student>(`/students/${id}`),
        apiFetch<ExamAppointment[]>(`/students/${id}/exams`),
        apiFetch<CheckInRecord[]>(`/students/${id}/checkins`),
      ])
      set({ studentDetail: student, studentExams: exams, studentCheckins: checkins })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, studentDetail: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, studentDetail: false } }))
    }
  },

  fetchSchedules: async (params) => {
    set((s) => ({ loading: { ...s.loading, schedules: true }, errors: { ...s.errors, schedules: null } }))
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : ""
      const data = await apiFetch<Schedule[]>(`/schedules${query}`)
      set({ schedules: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, schedules: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, schedules: false } }))
    }
  },

  fetchVehicles: async () => {
    set((s) => ({ loading: { ...s.loading, vehicles: true }, errors: { ...s.errors, vehicles: null } }))
    try {
      const data = await apiFetch<Vehicle[]>("/vehicles")
      set({ vehicles: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, vehicles: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, vehicles: false } }))
    }
  },

  fetchInstructors: async () => {
    set((s) => ({ loading: { ...s.loading, instructors: true }, errors: { ...s.errors, instructors: null } }))
    try {
      const data = await apiFetch<Instructor[]>("/instructors")
      set({ instructors: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, instructors: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, instructors: false } }))
    }
  },

  fetchCheckins: async (params) => {
    set((s) => ({ loading: { ...s.loading, checkins: true }, errors: { ...s.errors, checkins: null } }))
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : ""
      const data = await apiFetch<CheckInRecord[]>(`/checkins${query}`)
      set({ checkins: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, checkins: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, checkins: false } }))
    }
  },

  fetchActiveCheckins: async () => {
    try {
      const data = await apiFetch<CheckInRecord[]>("/checkins?active=true")
      set({ activeCheckins: data })
    } catch {
      // silent
    }
  },

  fetchCommissionSettings: async () => {
    set((s) => ({ loading: { ...s.loading, commissionSettings: true }, errors: { ...s.errors, commissionSettings: null } }))
    try {
      const data = await apiFetch<CommissionSetting[]>("/commissions/settings")
      set({ commissionSettings: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, commissionSettings: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, commissionSettings: false } }))
    }
  },

  fetchCommissionSummaries: async (year, month) => {
    set((s) => ({ loading: { ...s.loading, commissions: true }, errors: { ...s.errors, commissions: null } }))
    try {
      const data = await apiFetch<CommissionSummary[]>(`/commissions/summary?year=${year}&month=${month}`)
      set({ commissionSummaries: data })
    } catch (e: unknown) {
      set((s) => ({ errors: { ...s.errors, commissions: (e as Error).message } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, commissions: false } }))
    }
  },

  fetchCommissionDetails: async (instructorId, year, month) => {
    try {
      const data = await apiFetch<CommissionDetail[]>(`/commissions/details?instructor_id=${instructorId}&year=${year}&month=${month}`)
      set((s) => ({ commissionDetails: { ...s.commissionDetails, [instructorId]: data } }))
    } catch {
      // silent
    }
  },

  createStudent: async (data) => {
    try {
      await apiFetch("/students", { method: "POST", body: JSON.stringify(data) })
      get().fetchStudents()
      return true
    } catch {
      return false
    }
  },

  scheduleExam: async (studentId) => {
    try {
      await apiFetch(`/students/${studentId}/exam`, { method: "POST" })
      get().fetchStudents()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },

  createSchedule: async (data) => {
    try {
      await apiFetch("/schedules", { method: "POST", body: JSON.stringify(data) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },

  checkoutCheckin: async (id) => {
    try {
      const res = await fetch(`/api/checkins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, error: json.error || json.message || "签退失败" }
      }
      get().fetchActiveCheckins()
      get().fetchCheckins()
      get().fetchDashboard()
      return { ok: true, warning: json.warning }
    } catch (e) {
      return { ok: false, error: (e as Error).message || "签退失败" }
    }
  },

  updateCommissionSettings: async (data) => {
    try {
      await apiFetch("/commissions/settings", { method: "PUT", body: JSON.stringify(data) })
      get().fetchCommissionSettings()
      return true
    } catch {
      return false
    }
  },

  createVehicle: async (data) => {
    try {
      await apiFetch("/vehicles", { method: "POST", body: JSON.stringify(data) })
      get().fetchVehicles()
      return true
    } catch {
      return false
    }
  },
}))
