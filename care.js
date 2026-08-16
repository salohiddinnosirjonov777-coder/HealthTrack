/* =========================================================================
   Care domeni — care/models.py va care/views.py bilan bir xil mantiq
   ========================================================================= */

const EMERGENCY_NUMBERS = [
  { number: "103", label: "Tez tibbiy yordam", icon: "🚑" },
  { number: "101", label: "Yong'in xavfsizligi xizmati", icon: "🚒" },
  { number: "102", label: "Politsiya", icon: "🚓" },
  { number: "112", label: "Yagona qutqaruv xizmati", icon: "🆘" },
  { number: "1050", label: "Ishonch telefoni (psixologik yordam)", icon: "☎️" },
];

const FIRST_AID_TIPS = [
  {
    title: "Yurak xuruji belgilari",
    icon: "❤️",
    text: "Ko'krak qafasida bosim yoki og'riq, nafas qisilishi sezilsa — darhol 103 raqamiga qo'ng'iroq qiling, insonni tinch, yarim o'tirgan holatda joylashtiring va yolg'iz qoldirmang.",
  },
  {
    title: "Kuchli qon ketishi",
    icon: "🩸",
    text: "Toza mato yoki bint bilan yarani bosib turing, jabrlanuvchini yotqizib, jarohatlangan a'zoni yurak sathidan balandroq ushlang va tez yordam chaqiring.",
  },
  {
    title: "Kuyish",
    icon: "🔥",
    text: "Kuygan joyni 10-15 daqiqa sovuq (muzsiz) suv ostida ushlang, pufakchalarni yormang, toza mato bilan yopib shifokorga murojaat qiling.",
  },
  {
    title: "Behushlik",
    icon: "😵",
    text: "Insonni yon tomoniga yotqizing, nafas yo'llari ochiq turishini kuzating, tor kiyimlarini bo'shating va zudlik bilan tez yordam chaqiring.",
  },
  {
    title: "Bo'g'ilish",
    icon: "🫁",
    text: "Agar odam gapira olmasa yoki nafas ololmasa, orqasidan qorin ostiga qisqa va kuchli turtkilar bering (Geymlix usuli) va bir vaqtning o'zida yordam chaqiring.",
  },
];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/* ---------------- Medications ---------------- */
function userMedications(userId) {
  return readAll(DB_KEYS.medications)
    .filter((m) => m.user_id === userId && m.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}
function medicationTimeList(med) {
  return med.times
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .sort();
}
function medicationTodaySchedule(med) {
  const today = todayStr();
  const logs = readAll(DB_KEYS.medicationLogs).filter((l) => l.medication_id === med.id && l.date === today);
  return medicationTimeList(med).map((time) => {
    const log = logs.find((l) => l.time === time);
    return { time, taken: !!(log && log.taken) };
  });
}
function validateMedicationTimes(raw) {
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return { ok: false, error: "Kamida bitta qabul vaqtini kiriting." };
  for (const p of parts) {
    if (!TIME_RE.test(p)) {
      return { ok: false, error: `'${p}' noto'g'ri vaqt formati. SS:DD ko'rinishida yozing, masalan 08:00.` };
    }
  }
  const unique = Array.from(new Set(parts)).sort();
  return { ok: true, value: unique.join(", ") };
}
function addMedication(userId, data) {
  const meds = readAll(DB_KEYS.medications);
  const med = {
    id: nextId(),
    user_id: userId,
    name: data.name,
    dosage: data.dosage || "",
    times: data.times,
    notes: data.notes || "",
    active: true,
    created_at: new Date().toISOString(),
  };
  meds.push(med);
  writeAll(DB_KEYS.medications, meds);
  return med;
}
function deleteMedication(id) {
  writeAll(DB_KEYS.medications, readAll(DB_KEYS.medications).filter((m) => m.id !== id));
  writeAll(DB_KEYS.medicationLogs, readAll(DB_KEYS.medicationLogs).filter((l) => l.medication_id !== id));
}
function toggleMedicationLog(medId, time) {
  const logs = readAll(DB_KEYS.medicationLogs);
  const today = todayStr();
  let log = logs.find((l) => l.medication_id === medId && l.date === today && l.time === time);
  if (!log) {
    log = { id: nextId(), medication_id: medId, date: today, time, taken: false, taken_at: null };
    logs.push(log);
  }
  log.taken = !log.taken;
  log.taken_at = log.taken ? new Date().toISOString() : null;
  writeAll(DB_KEYS.medicationLogs, logs);
}

/* ---------------- Appointments ---------------- */
const APPT_STATUS_LABEL = { scheduled: "Kutilmoqda", done: "Bo'lib o'tdi", cancelled: "Bekor qilindi" };

function userAppointmentsUpcoming(userId) {
  return readAll(DB_KEYS.appointments)
    .filter((a) => a.user_id === userId && a.status === "scheduled")
    .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
}
function userAppointmentsHistory(userId) {
  return readAll(DB_KEYS.appointments)
    .filter((a) => a.user_id === userId && a.status !== "scheduled")
    .sort((a, b) => new Date(b.appointment_at) - new Date(a.appointment_at));
}
function addAppointment(userId, data) {
  const list = readAll(DB_KEYS.appointments);
  const appt = {
    id: nextId(),
    user_id: userId,
    doctor_name: data.doctor_name,
    specialty: data.specialty || "",
    location: data.location || "",
    appointment_at: data.appointment_at,
    notes: data.notes || "",
    status: "scheduled",
    created_at: new Date().toISOString(),
  };
  list.push(appt);
  writeAll(DB_KEYS.appointments, list);
  return appt;
}
function setAppointmentStatus(id, status) {
  const list = readAll(DB_KEYS.appointments);
  const appt = list.find((a) => a.id === id);
  if (appt) {
    appt.status = status;
    writeAll(DB_KEYS.appointments, list);
  }
  return appt;
}
function deleteAppointment(id) {
  writeAll(DB_KEYS.appointments, readAll(DB_KEYS.appointments).filter((a) => a.id !== id));
}

/* ---------------- Emergency contacts ---------------- */
function userContacts(userId) {
  return readAll(DB_KEYS.contacts)
    .filter((c) => c.user_id === userId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
function addContact(userId, data) {
  const list = readAll(DB_KEYS.contacts);
  const contact = { id: nextId(), user_id: userId, name: data.name, relation: data.relation || "", phone: data.phone };
  list.push(contact);
  writeAll(DB_KEYS.contacts, list);
  return contact;
}
function deleteContact(id) {
  writeAll(DB_KEYS.contacts, readAll(DB_KEYS.contacts).filter((c) => c.id !== id));
}

/* ---------------- Workouts ---------------- */
function userWorkoutsAll(userId) {
  return readAll(DB_KEYS.workouts)
    .filter((w) => w.user_id === userId)
    .sort((a, b) => new Date(b.done_at) - new Date(a.done_at));
}
function userWorkoutsToday(userId) {
  const today = todayStr();
  return userWorkoutsAll(userId).filter((w) => w.done_at.slice(0, 10) === today);
}
function addWorkout(userId, data) {
  const list = readAll(DB_KEYS.workouts);
  const workout = {
    id: nextId(),
    user_id: userId,
    name: data.name,
    duration_minutes: data.duration_minutes,
    notes: data.notes || "",
    done_at: new Date().toISOString(),
  };
  list.push(workout);
  writeAll(DB_KEYS.workouts, list);
  return workout;
}
function deleteWorkout(id) {
  writeAll(DB_KEYS.workouts, readAll(DB_KEYS.workouts).filter((w) => w.id !== id));
}

/* ---------------- Profile ---------------- */
function getProfile(userId) {
  const profiles = readAll(DB_KEYS.profiles);
  let p = profiles.find((p) => p.user_id === userId);
  if (!p) {
    p = { user_id: userId, phone: "", bio: "" };
    profiles.push(p);
    writeAll(DB_KEYS.profiles, profiles);
  }
  return p;
}
function updateProfile(userId, userData, profileData) {
  const users = readAll(DB_KEYS.users);
  const u = users.find((u) => u.id === userId);
  u.first_name = userData.first_name || "";
  u.last_name = userData.last_name || "";
  u.email = userData.email || "";
  writeAll(DB_KEYS.users, users);

  const profiles = readAll(DB_KEYS.profiles);
  let p = profiles.find((p) => p.user_id === userId);
  if (!p) {
    p = { user_id: userId };
    profiles.push(p);
  }
  p.phone = profileData.phone || "";
  p.bio = profileData.bio || "";
  writeAll(DB_KEYS.profiles, profiles);
}
function profileStats(userId) {
  const habits = userHabits(userId);
  const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(h)), 0);
  return {
    habit_count: habits.length,
    best_streak: bestStreak,
    workout_count: userWorkoutsAll(userId).length,
    medication_count: userMedications(userId).length,
    upcoming_appointments: userAppointmentsUpcoming(userId).length,
  };
}
