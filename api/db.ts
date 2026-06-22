import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'driving_school.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS instructor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'instructor',
    commission_rate_subject2 REAL NOT NULL DEFAULT 200,
    commission_rate_subject3 REAL NOT NULL DEFAULT 300
);

CREATE TABLE IF NOT EXISTS vehicle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS student (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    current_subject INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'training',
    required_hours_subject2 REAL NOT NULL DEFAULT 16,
    required_hours_subject3 REAL NOT NULL DEFAULT 24,
    completed_hours_subject2 REAL NOT NULL DEFAULT 0,
    completed_hours_subject3 REAL NOT NULL DEFAULT 0,
    instructor_id INTEGER NOT NULL REFERENCES instructor(id),
    enroll_date TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructor_id INTEGER NOT NULL REFERENCES instructor(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicle(id),
    schedule_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    UNIQUE(instructor_id, schedule_date, time_slot),
    UNIQUE(vehicle_id, schedule_date, time_slot)
);

CREATE TABLE IF NOT EXISTS check_in (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES student(id),
    instructor_id INTEGER NOT NULL REFERENCES instructor(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicle(id),
    schedule_id INTEGER REFERENCES schedule(id),
    check_in_time TEXT NOT NULL DEFAULT (datetime('now')),
    check_out_time TEXT,
    duration_hours REAL,
    subject INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS exam_appointment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES student(id),
    subject INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    exam_date TEXT,
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commission_setting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject INTEGER NOT NULL UNIQUE,
    unit_price REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

const countInstructors = db.prepare('SELECT COUNT(*) as count FROM instructor').get() as { count: number }
if (countInstructors.count === 0) {
  const insertInstructor = db.prepare(`
    INSERT INTO instructor (name, phone, password, role, commission_rate_subject2, commission_rate_subject3)
    VALUES (@name, @phone, @password, @role, @commission_rate_subject2, @commission_rate_subject3)
  `)

  const insertVehicle = db.prepare(`
    INSERT INTO vehicle (plate_number, model, status)
    VALUES (@plate_number, @model, @status)
  `)

  const insertStudent = db.prepare(`
    INSERT INTO student (name, phone, current_subject, status, required_hours_subject2, required_hours_subject3, completed_hours_subject2, completed_hours_subject3, instructor_id, enroll_date)
    VALUES (@name, @phone, @current_subject, @status, @required_hours_subject2, @required_hours_subject3, @completed_hours_subject2, @completed_hours_subject3, @instructor_id, @enroll_date)
  `)

  const insertSchedule = db.prepare(`
    INSERT INTO schedule (instructor_id, vehicle_id, schedule_date, time_slot, status)
    VALUES (@instructor_id, @vehicle_id, @schedule_date, @time_slot, @status)
  `)

  const insertCheckIn = db.prepare(`
    INSERT INTO check_in (student_id, instructor_id, vehicle_id, schedule_id, check_in_time, check_out_time, duration_hours, subject)
    VALUES (@student_id, @instructor_id, @vehicle_id, @schedule_id, @check_in_time, @check_out_time, @duration_hours, @subject)
  `)

  const insertExam = db.prepare(`
    INSERT INTO exam_appointment (student_id, subject, status, exam_date, result)
    VALUES (@student_id, @subject, @status, @exam_date, @result)
  `)

  const insertCommissionSetting = db.prepare(`
    INSERT INTO commission_setting (subject, unit_price)
    VALUES (@subject, @unit_price)
  `)

  const seed = db.transaction(() => {
    insertInstructor.run({ name: '王教练', phone: '13800001111', password: 'admin123', role: 'admin', commission_rate_subject2: 200, commission_rate_subject3: 300 })
    insertInstructor.run({ name: '李教练', phone: '13800002222', password: '123456', role: 'instructor', commission_rate_subject2: 200, commission_rate_subject3: 300 })
    insertInstructor.run({ name: '张教练', phone: '13800003333', password: '123456', role: 'instructor', commission_rate_subject2: 200, commission_rate_subject3: 300 })

    insertVehicle.run({ plate_number: '京A12345', model: '大众捷达', status: 'available' })
    insertVehicle.run({ plate_number: '京A23456', model: '丰田卡罗拉', status: 'available' })
    insertVehicle.run({ plate_number: '京A34567', model: '本田思域', status: 'available' })
    insertVehicle.run({ plate_number: '京A45678', model: '大众朗逸', status: 'maintenance' })

    insertStudent.run({ name: '赵小明', phone: '13900001111', current_subject: 2, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 14, completed_hours_subject3: 0, instructor_id: 1, enroll_date: '2026-04-01' })
    insertStudent.run({ name: '钱小红', phone: '13900002222', current_subject: 2, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 8, completed_hours_subject3: 0, instructor_id: 1, enroll_date: '2026-04-15' })
    insertStudent.run({ name: '孙小刚', phone: '13900003333', current_subject: 2, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 0, instructor_id: 2, enroll_date: '2026-03-20' })
    insertStudent.run({ name: '李小芳', phone: '13900004444', current_subject: 3, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 22, instructor_id: 2, enroll_date: '2026-02-10' })
    insertStudent.run({ name: '周小强', phone: '13900005555', current_subject: 2, status: 'exam_scheduled', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 0, instructor_id: 3, enroll_date: '2026-03-01' })
    insertStudent.run({ name: '吴小丽', phone: '13900006666', current_subject: 3, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 10, instructor_id: 1, enroll_date: '2026-01-15' })
    insertStudent.run({ name: '郑小伟', phone: '13900007777', current_subject: 2, status: 'exam_passed', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 6, instructor_id: 3, enroll_date: '2026-01-01' })
    insertStudent.run({ name: '王小军', phone: '13900008888', current_subject: 3, status: 'completed', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 24, instructor_id: 2, enroll_date: '2025-12-01' })

    const timeSlots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00']
    const dates = ['2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24']

    for (const date of dates) {
      for (const slot of timeSlots) {
        const instructorId = ((timeSlots.indexOf(slot) + dates.indexOf(date)) % 3) + 1
        const vehicleId = ((timeSlots.indexOf(slot) + dates.indexOf(date)) % 3) + 1
        const status = date < '2026-06-22' ? 'completed' : 'scheduled'
        insertSchedule.run({ instructor_id: instructorId, vehicle_id: vehicleId, schedule_date: date, time_slot: slot, status })
      }
    }

    const checkInData = [
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 1, check_in_time: '2026-06-20 08:00:00', check_out_time: '2026-06-20 10:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 2, instructor_id: 1, vehicle_id: 2, schedule_id: 2, check_in_time: '2026-06-20 10:00:00', check_out_time: '2026-06-20 12:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 3, instructor_id: 2, vehicle_id: 2, schedule_id: 3, check_in_time: '2026-06-20 14:00:00', check_out_time: '2026-06-20 16:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 4, instructor_id: 2, vehicle_id: 1, schedule_id: 4, check_in_time: '2026-06-20 16:00:00', check_out_time: '2026-06-20 18:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 5, check_in_time: '2026-06-21 08:00:00', check_out_time: '2026-06-21 10:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 5, instructor_id: 3, vehicle_id: 3, schedule_id: 6, check_in_time: '2026-06-21 10:00:00', check_out_time: '2026-06-21 12:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 6, instructor_id: 1, vehicle_id: 1, schedule_id: 7, check_in_time: '2026-06-21 14:00:00', check_out_time: '2026-06-21 16:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 7, instructor_id: 3, vehicle_id: 3, schedule_id: 8, check_in_time: '2026-06-21 16:00:00', check_out_time: '2026-06-21 18:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 3, instructor_id: 2, vehicle_id: 2, schedule_id: 9, check_in_time: '2026-06-22 08:00:00', check_out_time: '2026-06-22 10:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 4, instructor_id: 2, vehicle_id: 1, schedule_id: 10, check_in_time: '2026-06-22 10:00:00', check_out_time: '2026-06-22 12:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 11, check_in_time: '2026-06-22 14:00:00', check_out_time: '2026-06-22 16:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 2, instructor_id: 1, vehicle_id: 2, schedule_id: 12, check_in_time: '2026-06-22 16:00:00', check_out_time: '2026-06-22 18:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 8, instructor_id: 2, vehicle_id: 2, schedule_id: null, check_in_time: '2026-06-19 08:00:00', check_out_time: '2026-06-19 10:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 8, instructor_id: 2, vehicle_id: 1, schedule_id: null, check_in_time: '2026-06-18 08:00:00', check_out_time: '2026-06-18 10:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 7, instructor_id: 3, vehicle_id: 3, schedule_id: null, check_in_time: '2026-06-17 14:00:00', check_out_time: '2026-06-17 16:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 6, instructor_id: 1, vehicle_id: 1, schedule_id: null, check_in_time: '2026-06-16 08:00:00', check_out_time: '2026-06-16 10:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 5, instructor_id: 3, vehicle_id: 3, schedule_id: null, check_in_time: '2026-06-15 10:00:00', check_out_time: '2026-06-15 12:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 4, instructor_id: 2, vehicle_id: 2, schedule_id: null, check_in_time: '2026-06-14 14:00:00', check_out_time: '2026-06-14 16:00:00', duration_hours: 2.0, subject: 3 },
      { student_id: 3, instructor_id: 2, vehicle_id: 1, schedule_id: null, check_in_time: '2026-06-13 08:00:00', check_out_time: '2026-06-13 10:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 2, instructor_id: 1, vehicle_id: 2, schedule_id: null, check_in_time: '2026-06-12 10:00:00', check_out_time: '2026-06-12 12:00:00', duration_hours: 2.0, subject: 2 },
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 13, check_in_time: '2026-06-23 08:00:00', check_out_time: null, duration_hours: null, subject: 2 },
      { student_id: 6, instructor_id: 1, vehicle_id: 2, schedule_id: 14, check_in_time: '2026-06-23 10:00:00', check_out_time: null, duration_hours: null, subject: 3 },
    ]

    for (const ci of checkInData) {
      insertCheckIn.run(ci)
    }

    insertExam.run({ student_id: 5, subject: 2, status: 'approved', exam_date: '2026-06-25', result: null })
    insertExam.run({ student_id: 7, subject: 2, status: 'passed', exam_date: '2026-06-10', result: 'pass' })
    insertExam.run({ student_id: 8, subject: 2, status: 'passed', exam_date: '2026-05-20', result: 'pass' })
    insertExam.run({ student_id: 8, subject: 3, status: 'passed', exam_date: '2026-06-15', result: 'pass' })
    insertExam.run({ student_id: 7, subject: 3, status: 'pending', exam_date: null, result: null })
    insertExam.run({ student_id: 4, subject: 3, status: 'pending', exam_date: null, result: null })

    insertCommissionSetting.run({ subject: 2, unit_price: 200 })
    insertCommissionSetting.run({ subject: 3, unit_price: 300 })
  })

  seed()
}

export default db
