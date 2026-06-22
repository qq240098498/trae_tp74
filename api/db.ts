import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'driving_school.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function dateOffset(offsetDays: number, h: number, m: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(h, m, 0, 0)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function dateOnly(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

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

const cleanUp = db.transaction(() => {
  const badNegative = db.prepare("UPDATE check_in SET duration_hours = 0 WHERE duration_hours < 0")
  badNegative.run()

  const badFuture = db.prepare(`
    UPDATE check_in
    SET check_in_time = datetime('now', '-1 hour')
    WHERE datetime(check_in_time) > datetime('now', '+1 day')
    AND check_out_time IS NULL
  `)
  badFuture.run()

  const badNull = db.prepare(`
    UPDATE check_in
    SET duration_hours = CASE
      WHEN check_out_time IS NOT NULL THEN
        MAX(0, ROUND((julianday(check_out_time) - julianday(check_in_time)) * 24 * 10) / 10)
      ELSE NULL
    END
    WHERE check_out_time IS NOT NULL
    AND (duration_hours IS NULL OR duration_hours < 0)
  `)
  badNull.run()
})
try { cleanUp() } catch { /* table may not exist yet */ }

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

    insertStudent.run({ name: '赵小明', phone: '13900001111', current_subject: 2, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 14, completed_hours_subject3: 0, instructor_id: 1, enroll_date: dateOnly(-80) })
    insertStudent.run({ name: '钱小红', phone: '13900002222', current_subject: 2, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 8, completed_hours_subject3: 0, instructor_id: 1, enroll_date: dateOnly(-65) })
    insertStudent.run({ name: '孙小刚', phone: '13900003333', current_subject: 2, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 0, instructor_id: 2, enroll_date: dateOnly(-90) })
    insertStudent.run({ name: '李小芳', phone: '13900004444', current_subject: 3, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 22, instructor_id: 2, enroll_date: dateOnly(-120) })
    insertStudent.run({ name: '周小强', phone: '13900005555', current_subject: 2, status: 'exam_scheduled', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 0, instructor_id: 3, enroll_date: dateOnly(-100) })
    insertStudent.run({ name: '吴小丽', phone: '13900006666', current_subject: 3, status: 'training', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 10, instructor_id: 1, enroll_date: dateOnly(-150) })
    insertStudent.run({ name: '郑小伟', phone: '13900007777', current_subject: 2, status: 'exam_passed', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 6, instructor_id: 3, enroll_date: dateOnly(-165) })
    insertStudent.run({ name: '王小军', phone: '13900008888', current_subject: 3, status: 'completed', required_hours_subject2: 16, required_hours_subject3: 24, completed_hours_subject2: 16, completed_hours_subject3: 24, instructor_id: 2, enroll_date: dateOnly(-200) })

    const timeSlots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00']
    const dates = [dateOnly(-2), dateOnly(-1), dateOnly(0), dateOnly(1), dateOnly(2)]

    for (const date of dates) {
      for (const slot of timeSlots) {
        const instructorId = ((timeSlots.indexOf(slot) + dates.indexOf(date)) % 3) + 1
        const vehicleId = ((timeSlots.indexOf(slot) + dates.indexOf(date)) % 3) + 1
        const status = date < dateOnly(0) ? 'completed' : 'scheduled'
        insertSchedule.run({ instructor_id: instructorId, vehicle_id: vehicleId, schedule_date: date, time_slot: slot, status })
      }
    }

    const checkInData = [
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 1, check_in_time: dateOffset(-2, 8, 0), check_out_time: dateOffset(-2, 10, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 2, instructor_id: 1, vehicle_id: 2, schedule_id: 2, check_in_time: dateOffset(-2, 10, 0), check_out_time: dateOffset(-2, 12, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 3, instructor_id: 2, vehicle_id: 2, schedule_id: 3, check_in_time: dateOffset(-2, 14, 0), check_out_time: dateOffset(-2, 16, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 4, instructor_id: 2, vehicle_id: 1, schedule_id: 4, check_in_time: dateOffset(-2, 16, 0), check_out_time: dateOffset(-2, 18, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 5, check_in_time: dateOffset(-1, 8, 0), check_out_time: dateOffset(-1, 10, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 5, instructor_id: 3, vehicle_id: 3, schedule_id: 6, check_in_time: dateOffset(-1, 10, 0), check_out_time: dateOffset(-1, 12, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 6, instructor_id: 1, vehicle_id: 1, schedule_id: 7, check_in_time: dateOffset(-1, 14, 0), check_out_time: dateOffset(-1, 16, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 7, instructor_id: 3, vehicle_id: 3, schedule_id: 8, check_in_time: dateOffset(-1, 16, 0), check_out_time: dateOffset(-1, 18, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 3, instructor_id: 2, vehicle_id: 2, schedule_id: 9, check_in_time: dateOffset(0, 8, 0), check_out_time: dateOffset(0, 10, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 4, instructor_id: 2, vehicle_id: 1, schedule_id: 10, check_in_time: dateOffset(0, 10, 0), check_out_time: dateOffset(0, 12, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 11, check_in_time: dateOffset(0, 14, 0), check_out_time: dateOffset(0, 16, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 2, instructor_id: 1, vehicle_id: 2, schedule_id: 12, check_in_time: dateOffset(0, 16, 0), check_out_time: null, duration_hours: null, subject: 2 },
      { student_id: 8, instructor_id: 2, vehicle_id: 2, schedule_id: null, check_in_time: dateOffset(-3, 8, 0), check_out_time: dateOffset(-3, 10, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 8, instructor_id: 2, vehicle_id: 1, schedule_id: null, check_in_time: dateOffset(-4, 8, 0), check_out_time: dateOffset(-4, 10, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 7, instructor_id: 3, vehicle_id: 3, schedule_id: null, check_in_time: dateOffset(-5, 14, 0), check_out_time: dateOffset(-5, 16, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 6, instructor_id: 1, vehicle_id: 1, schedule_id: null, check_in_time: dateOffset(-6, 8, 0), check_out_time: dateOffset(-6, 10, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 5, instructor_id: 3, vehicle_id: 3, schedule_id: null, check_in_time: dateOffset(-7, 10, 0), check_out_time: dateOffset(-7, 12, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 4, instructor_id: 2, vehicle_id: 2, schedule_id: null, check_in_time: dateOffset(-8, 14, 0), check_out_time: dateOffset(-8, 16, 0), duration_hours: 2.0, subject: 3 },
      { student_id: 3, instructor_id: 2, vehicle_id: 1, schedule_id: null, check_in_time: dateOffset(-9, 8, 0), check_out_time: dateOffset(-9, 10, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 2, instructor_id: 1, vehicle_id: 2, schedule_id: null, check_in_time: dateOffset(-10, 10, 0), check_out_time: dateOffset(-10, 12, 0), duration_hours: 2.0, subject: 2 },
      { student_id: 1, instructor_id: 1, vehicle_id: 1, schedule_id: 13, check_in_time: dateOffset(0, 8, 0), check_out_time: null, duration_hours: null, subject: 2 },
      { student_id: 6, instructor_id: 1, vehicle_id: 2, schedule_id: 14, check_in_time: dateOffset(0, 10, 0), check_out_time: null, duration_hours: null, subject: 3 },
    ]

    for (const ci of checkInData) {
      insertCheckIn.run(ci)
    }

    insertExam.run({ student_id: 5, subject: 2, status: 'approved', exam_date: dateOnly(3), result: null })
    insertExam.run({ student_id: 7, subject: 2, status: 'passed', exam_date: dateOnly(-12), result: 'pass' })
    insertExam.run({ student_id: 8, subject: 2, status: 'passed', exam_date: dateOnly(-30), result: 'pass' })
    insertExam.run({ student_id: 8, subject: 3, status: 'passed', exam_date: dateOnly(-5), result: 'pass' })
    insertExam.run({ student_id: 7, subject: 3, status: 'pending', exam_date: null, result: null })
    insertExam.run({ student_id: 4, subject: 3, status: 'pending', exam_date: null, result: null })

    insertCommissionSetting.run({ subject: 2, unit_price: 200 })
    insertCommissionSetting.run({ subject: 3, unit_price: 300 })
  })

  seed()
}

export default db
