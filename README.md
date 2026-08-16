# HealthTrack — statik HTML/CSS/JS versiyasi

Bu asl **Django** loyihasining (server, ma'lumotlar bazasi, autentifikatsiya)
to'liq **statik HTML + CSS + JavaScript** ko'rinishidagi muqobili. Dizayn,
matnlar va barcha funksiyalar (odatlar, dorilar, shifokor navbatlari,
mashg'ulotlar, favqulodda yordam, profil) bir xil ishlaydi — faqat server
o'rniga barcha ma'lumotlar brauzeringizning **localStorage**'ida saqlanadi.

## Qanday ishga tushirish
Hech qanday o'rnatish yoki server kerak emas:
1. Ushbu papkani (barcha fayllar bilan) biror joyga oching.
2. `index.html` faylini brauzerda oching (yoki oddiy statik hosting'ga
   yuklang — Netlify, GitHub Pages, cPanel va h.k.).

> Eslatma: fayllarni to'g'ridan-to'g'ri `file://` orqali ochsangiz ham
> ishlaydi, chunki hech qanday server so'rovi (fetch/AJAX) ishlatilmagan.

## Fayl tuzilishi
```
index.html                 → kirish holatiga qarab yo'naltiradi
login.html                 → tizimga kirish
signup.html                → ro'yxatdan o'tish
setup.html                 → odat qo'shish (suv/uyqu/mashg'ulot)
dashboard.html              → "Bugun" — asosiy sahifa
weekly.html                 → bitta odat bo'yicha haftalik hisobot (Chart.js)
change_habit.html           → odatlarni boshqarish/o'chirish
medications.html             / medication_form.html   → dorilar
appointments.html            / appointment_form.html  → shifokor navbatlari
emergency.html               → favqulodda yordam raqamlari va kontaktlar
workouts.html                → mashg'ulotlar jurnali
profile.html                 → profil va statistikalar
password_change.html         / password_change_done.html → parolni almashtirish

css/style.css                → asl dizayn (Bio-Glass tema) — o'zgarishsiz
js/bg3d.js, js/tilt.js       → 3D fon va tilt effektlari — o'zgarishsiz
js/app.js                    → umumiy: localStorage, autentifikatsiya, nav
js/habits.js                 → odatlar mantig'i (streak, o'simlik bosqichi va h.k.)
js/care.js                   → dorilar, navbatlar, kontaktlar, mashg'ulotlar, profil
```

## Muhim eslatma
Bu — **faqat frontend** (client-side) demo/loyihadir. Login/parol va barcha
ma'lumotlar faqat sizning brauzeringizda (localStorage) saqlanadi:
- Boshqa qurilma yoki brauzerdan kirganda ma'lumotlar ko'rinmaydi.
- Brauzer keshi/localStorage tozalansa, barcha ma'lumotlar yo'qoladi.
- Parollar shifrlanmagan holda saqlanadi — bu **real production loyiha
  uchun emas**, faqat ko'rinish/funksionallikni namoyish qilish uchun mos.

Agar kelajakda haqiqiy ko'p foydalanuvchili, xavfsiz backend kerak bo'lsa,
asl Django loyihasidan foydalanish tavsiya etiladi.
