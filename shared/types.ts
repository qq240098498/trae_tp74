export interface Instructor {
  id: number
  name: string
  phone: string
  role: 'admin' | 'instructor'
  commission_rate_subject2: number
  commission_rate_subject3: number
}

export interface Student {
  id: number
  name: string
  phone: string
  current_subject: 2 | 3
  status: 'training' | 'exam_scheduled' | 'exam_passed' | 'completed'
  required_hours_subject2: number
  required_hours_subject3: number
  completed_hours_subject2: number
  completed_hours_subject3: number
  instructor_id: number
  instructor_name?: string
  enroll_date: string
}

export interface Vehicle {
  id: number
  plate_number: string
  model: string
  status: 'available' | 'in_use' | 'maintenance'
}

export interface Schedule {
  id: number
  instructor_id: number
  instructor_name?: string
  vehicle_id: number
  vehicle_plate?: string
  schedule_date: string
  time_slot: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

export interface CheckInRecord {
  id: number
  student_id: number
  student_name?: string
  instructor_id: number
  instructor_name?: string
  vehicle_id: number
  vehicle_plate?: string
  schedule_id: number | null
  check_in_time: string
  check_out_time: string | null
  duration_hours: number | null
  subject: 2 | 3
}

export interface ExamAppointment {
  id: number
  student_id: number
  student_name?: string
  subject: 2 | 3
  status: 'pending' | 'approved' | 'rejected' | 'passed' | 'failed'
  exam_date: string | null
  result: 'pass' | 'fail' | null
  created_at: string
}

export interface CommissionSetting {
  id: number
  subject: 2 | 3
  unit_price: number
  updated_at: string
}

export interface CommissionSummary {
  instructor_id: number
  instructor_name: string
  subject2_passed: number
  subject3_passed: number
  subject2_amount: number
  subject3_amount: number
  total_amount: number
}

export interface CommissionDetail {
  student_id: number
  student_name: string
  subject: 2 | 3
  exam_date: string
  unit_price: number
  amount: number
}

export interface DashboardStats {
  total_students: number
  today_schedules: number
  pending_exams: number
  month_commission: number
}

export interface HoursWarning {
  student_id: number
  student_name: string
  current_subject: 2 | 3
  completed_hours: number
  required_hours: number
  shortage: number
}
