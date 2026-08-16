/* =========================================================================
   Habit domeni — habits/models.py bilan bir xil mantiq
   ========================================================================= */

const HABIT_META = {
  water: {
    label: "Suv ichish",
    icon: "💧",
    unit: "stakan",
    defaultGoal: 8,
    motivation: [
      "Ajoyib boshlanish! Har bir stakan ahamiyatli.",
      "Bugun {done}/{goal} {unit} ichdingiz, yana {left} {unit} qoldi!",
      "Suv — hayot manbai. Davom eting!",
      "Maqsadga juda yaqinsiz, chidamli bo'ling!",
    ],
  },
  sleep: {
    label: "Uyqu",
    icon: "😴",
    unit: "soat",
    defaultGoal: 8,
    motivation: [
      "Sifatli uyqu — sog'lig'ingiz garovi.",
      "Bu kecha {done}/{goal} {unit} uxladingiz, maqsadga {left} {unit} qoldi.",
      "Erta yotish ertangi kuningizga kuch beradi.",
      "Uyqu rejimini saqlash juda muhim, davom eting!",
    ],
  },
  exercise: {
    label: "Mashg'ulot",
    icon: "🏃",
    unit: "daqiqa",
    defaultGoal: 20,
    motivation: [
      "Harakat — salomatlik kaliti. Zo'r ketyapsiz!",
      "Bugun {done}/{goal} {unit} bajardingiz, yana {left} {unit} qoldi!",
      "Har bir daqiqa tanangizga foyda keltiradi.",
      "Maqsadga juda yaqinsiz, to'xtamang!",
    ],
  },
};
const HABIT_TYPE_ORDER = ["water", "sleep", "exercise"];

const PLANT_STAGES = [
  { emoji: "🌰", name: "Urug'", hint: "Bugun birinchi qadamni tashlang!" },
  { emoji: "🌱", name: "Nihol", hint: "Yaxshi boshlandi, davom eting!" },
  { emoji: "🌿", name: "O'simta", hint: "3 kunlik silsila! Zo'r ketyapsiz." },
  { emoji: "🌳", name: "Gullagan daraxt", hint: "Bir haftadan ortiq! Ajoyib intizom." },
  { emoji: "🌸", name: "Gullab-yashnagan bog'", hint: "2 haftadan ortiq silsila — siz ustasiz!" },
];

function availableTypes(userId) {
  const used = new Set(
    readAll(DB_KEYS.habits)
      .filter((h) => h.user_id === userId)
      .map((h) => h.habit_type)
  );
  return HABIT_TYPE_ORDER.filter((t) => !used.has(t));
}

function userHabits(userId) {
  return readAll(DB_KEYS.habits)
    .filter((h) => h.user_id === userId)
    .sort((a, b) => HABIT_TYPE_ORDER.indexOf(a.habit_type) - HABIT_TYPE_ORDER.indexOf(b.habit_type));
}

function habitById(id) {
  return readAll(DB_KEYS.habits).find((h) => h.id === id) || null;
}

function habitByType(userId, habitType) {
  return readAll(DB_KEYS.habits).find((h) => h.user_id === userId && h.habit_type === habitType) || null;
}

function logFor(habitId, dateStr) {
  return readAll(DB_KEYS.habitLogs).find((l) => l.habit_id === habitId && l.date === dateStr) || null;
}

function todayProgress(habit) {
  const log = logFor(habit.id, todayStr());
  return log ? log.amount : 0;
}

function todayPercent(habit) {
  const pct = habit.daily_goal ? Math.floor((todayProgress(habit) / habit.daily_goal) * 100) : 0;
  return Math.min(pct, 100);
}

function isTodayComplete(habit) {
  return todayProgress(habit) >= habit.daily_goal;
}

function currentStreak(habit) {
  let streak = 0;
  let day = todayStr();
  while (true) {
    const log = logFor(habit.id, day);
    if (log && log.amount >= habit.daily_goal) {
      streak += 1;
      day = addDays(day, -1);
    } else {
      break;
    }
  }
  return streak;
}

function plantStage(habit) {
  const streak = currentStreak(habit);
  if (streak === 0) return 0;
  if (streak < 3) return 1;
  if (streak < 7) return 2;
  if (streak < 14) return 3;
  return 4;
}

function plantStageInfo(habit) {
  return PLANT_STAGES[plantStage(habit)];
}

function motivationalMessage(habit) {
  const done = todayProgress(habit);
  const goal = habit.daily_goal;
  const left = Math.max(goal - done, 0);
  const meta = HABIT_META[habit.habit_type] || HABIT_META.water;
  const pool = meta.motivation;
  if (done === 0) return pool[0];
  if (isTodayComplete(habit)) {
    return "Bugungi maqsad bajarildi! Ertaga ham shu zaylda davom eting.";
  }
  const template = pool[1 + Math.floor(Math.random() * (pool.length - 1))];
  return template
    .replace("{done}", done)
    .replace("{goal}", goal)
    .replace("{left}", left)
    .replace(/{unit}/g, meta.unit);
}

function weekLogs(habit, endDateStr) {
  endDateStr = endDateStr || todayStr();
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(endDateStr, -i));
  return days.map((day) => {
    const log = logFor(habit.id, day);
    const amount = log ? log.amount : 0;
    const pct = habit.daily_goal ? Math.floor((amount / habit.daily_goal) * 100) : 0;
    return {
      date: day,
      amount,
      percent: Math.min(pct, 100),
      completed: amount >= habit.daily_goal,
    };
  });
}

function weekCompletionRate(habit) {
  const logs = weekLogs(habit);
  const completed = logs.filter((l) => l.completed).length;
  return logs.length ? Math.floor((completed / logs.length) * 100) : 0;
}

/* ---------------- CRUD ---------------- */
function createHabit(userId, habitType, dailyGoal) {
  const habits = readAll(DB_KEYS.habits);
  const habit = {
    id: nextId(),
    user_id: userId,
    habit_type: habitType,
    daily_goal: dailyGoal,
    created_at: new Date().toISOString(),
  };
  habits.push(habit);
  writeAll(DB_KEYS.habits, habits);
  return habit;
}

function deleteHabit(habitId) {
  writeAll(DB_KEYS.habits, readAll(DB_KEYS.habits).filter((h) => h.id !== habitId));
  writeAll(DB_KEYS.habitLogs, readAll(DB_KEYS.habitLogs).filter((l) => l.habit_id !== habitId));
}

function addHabitProgress(habitId, amount) {
  const logs = readAll(DB_KEYS.habitLogs);
  const today = todayStr();
  let log = logs.find((l) => l.habit_id === habitId && l.date === today);
  if (!log) {
    log = { id: nextId(), habit_id: habitId, date: today, amount: 0 };
    logs.push(log);
  }
  log.amount += amount;
  writeAll(DB_KEYS.habitLogs, logs);
  return log;
}
