/* =========================================================================
   HealthTrack — static HTML/CSS/JS versiyasi
   Asl Django loyihasining barcha ma'lumotlari brauzerning localStorage'ida
   saqlanadi (server yo'q). Bu fayl umumiy "backend" vazifasini bajaradi:
   foydalanuvchilar, sessiya, va barcha CRUD amallar shu yerda.
   ========================================================================= */

const DB_KEYS = {
  users: "ht_users",
  session: "ht_session",
  profiles: "ht_profiles",
  habits: "ht_habits",
  habitLogs: "ht_habit_logs",
  medications: "ht_medications",
  medicationLogs: "ht_medication_logs",
  appointments: "ht_appointments",
  contacts: "ht_emergency_contacts",
  workouts: "ht_workouts",
  flash: "ht_flash",
  seq: "ht_seq",
};

/* ---------------- low-level storage helpers ---------------- */
function readAll(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function writeAll(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}
function nextId() {
  const seq = parseInt(localStorage.getItem(DB_KEYS.seq) || "0", 10) + 1;
  localStorage.setItem(DB_KEYS.seq, String(seq));
  return seq;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateStrOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dateStrOf(dt);
}
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtWeekday(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return WEEKDAY_ABBR[new Date(y, m - 1, d).getDay()];
}
function fmtDayMonth(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTH_ABBR[m - 1]}`;
}
function fmtDateTimeLocal(iso) {
  // iso like 2026-08-20T14:00
  const dt = new Date(iso);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = MONTH_ABBR[dt.getMonth()];
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return { day, monthTime: `${month}, ${hh}:${mm}`, month, time: `${hh}:${mm}` };
}

/* ---------------- flash messages (bir martalik) ---------------- */
function flash(message) {
  const arr = readAll(DB_KEYS.flash);
  arr.push(message);
  writeAll(DB_KEYS.flash, arr);
}
function renderFlashMessages() {
  const arr = readAll(DB_KEYS.flash);
  if (!arr.length) return;
  const wrap = document.querySelector(".wrap");
  const ul = document.createElement("ul");
  ul.className = "messages";
  arr.forEach((msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    ul.appendChild(li);
  });
  const topbar = document.querySelector(".topbar");
  topbar.insertAdjacentElement("afterend", ul);
  localStorage.removeItem(DB_KEYS.flash);
}

/* ---------------- auth ---------------- */
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEYS.session) || "null");
  } catch (e) {
    return null;
  }
}
function currentUser() {
  const sess = getSession();
  if (!sess) return null;
  return readAll(DB_KEYS.users).find((u) => u.id === sess.userId) || null;
}
function isAuthenticated() {
  return !!currentUser();
}
function requireLogin() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    throw new Error("redirecting to login");
  }
}
function redirectIfAuthed(target) {
  if (isAuthenticated()) {
    window.location.href = target || "dashboard.html";
    throw new Error("redirecting, already authed");
  }
}
function logoutUser() {
  localStorage.removeItem(DB_KEYS.session);
  window.location.href = "login.html";
}

function findUserByUsername(username) {
  return readAll(DB_KEYS.users).find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

function signupUser({ username, password1, password2 }) {
  const errors = [];
  username = (username || "").trim();
  if (!username) errors.push("Foydalanuvchi nomini kiriting.");
  if (username && findUserByUsername(username)) {
    errors.push("Bu foydalanuvchi nomi band. Boshqa nom tanlang.");
  }
  if (!password1 || !password2) {
    errors.push("Parolni kiriting va tasdiqlang.");
  } else {
    if (password1 !== password2) errors.push("Ikkala parol bir xil bo'lishi kerak.");
    if (password1.length < 8) errors.push("Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
    if (username && password1.toLowerCase() === username.toLowerCase()) {
      errors.push("Parol foydalanuvchi nomiga juda o'xshash bo'lmasligi kerak.");
    }
    if (password1 && /^\d+$/.test(password1)) {
      errors.push("Parol faqat raqamlardan iborat bo'la olmaydi.");
    }
  }
  if (errors.length) return { ok: false, errors };

  const users = readAll(DB_KEYS.users);
  const user = {
    id: nextId(),
    username,
    password: password1,
    first_name: "",
    last_name: "",
    email: "",
    date_joined: new Date().toISOString(),
  };
  users.push(user);
  writeAll(DB_KEYS.users, users);

  const profiles = readAll(DB_KEYS.profiles);
  profiles.push({ user_id: user.id, phone: "", bio: "" });
  writeAll(DB_KEYS.profiles, profiles);

  writeAll(DB_KEYS.session, { userId: user.id });
  return { ok: true, user };
}

function loginUser(username, password) {
  const user = findUserByUsername((username || "").trim());
  if (!user || user.password !== password) {
    return { ok: false, error: "Foydalanuvchi nomi yoki parol noto'g'ri." };
  }
  writeAll(DB_KEYS.session, { userId: user.id });
  return { ok: true, user };
}

function changePassword(oldPassword, newPassword1, newPassword2) {
  const user = currentUser();
  const errors = [];
  if (!user || user.password !== oldPassword) {
    errors.push("Eski parol noto'g'ri kiritildi.");
  }
  if (!newPassword1 || !newPassword2) {
    errors.push("Yangi parolni kiriting va tasdiqlang.");
  } else {
    if (newPassword1 !== newPassword2) errors.push("Ikkala yangi parol bir xil bo'lishi kerak.");
    if (newPassword1.length < 8) errors.push("Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
  }
  if (errors.length) return { ok: false, errors };
  const users = readAll(DB_KEYS.users);
  const idx = users.findIndex((u) => u.id === user.id);
  users[idx].password = newPassword1;
  writeAll(DB_KEYS.users, users);
  return { ok: true };
}

/* ---------------- nav bar (base.html muqobili) ---------------- */
function renderNav() {
  const user = currentUser();
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const brandHref = user ? "dashboard.html" : "login.html";
  let linksHtml = "";
  if (user) {
    linksHtml = `
      <a href="dashboard.html">🏠 Bugun</a>
      <a href="workouts.html">🏋️ Mashg'ulotlar</a>
      <a href="medications.html">💊 Dorilar</a>
      <a href="appointments.html">🩺 Shifokor</a>
      <a class="nav-danger" href="emergency.html">🚨 Yordam</a>
      <a href="profile.html">👤 Profil</a>
      <a href="change_habit.html">⚙️ Sozlamalar</a>
      <form class="nav-logout-form" id="logout-form" onsubmit="return false;">
        <button type="submit" class="nav-logout" id="logout-btn">Chiqish</button>
      </form>
    `;
  } else {
    linksHtml = `
      <a href="login.html">Kirish</a>
      <a href="signup.html">Ro'yxatdan o'tish</a>
    `;
  }

  topbar.innerHTML = `
    <a class="brand" href="${brandHref}">
      <span class="brand-icon">🌱</span>
      HealthTrack
    </a>
    <div class="nav-links">${linksHtml}</div>
  `;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Rostdan ham chiqmoqchimisiz?")) {
        logoutUser();
      }
    });
  }
}

/* Har bir sahifada chaqiriladigan umumiy ishga tushirish */
function initPage(opts = {}) {
  renderNav();
  renderFlashMessages();
  if (opts.requireAuth) requireLogin();
  if (opts.guestOnly) redirectIfAuthed(opts.guestOnlyTarget);
}
