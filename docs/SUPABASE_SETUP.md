# Supabase sozlash

RandomPick foydalanuvchi hisoblari uchun Supabase Auth, ma’lumotlar uchun esa `DATABASE_URL` (Postgres) ishlatadi. Server yo‘llari bazaga to‘g‘ridan-to‘g‘ri yozadi; brauzer faqat Auth sessionini ushlaydi.

## 1. Loyiha

1. [Supabase](https://supabase.com) da loyiha yarating.
2. Project Settings → API dan URL va anon key oling.
3. Project Settings → Database dan connection string oling (`DATABASE_URL`).

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres
DATABASE_SSL=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Service role kalitini brauzerga chiqarmang. U hozircha ixtiyoriy zaxira; asosiy yozuvlar `DATABASE_URL` orqali ketadi.

## 2. Migratsiya

SQL Editor da `supabase/migrations/202609140001_randompick.sql` ni ishga tushiring. Fayl `auth.users` ga bog‘langan jadvallar, RLS va audit triggerlarini yaratadi.

## 3. Auth

Authentication → Providers → Email ni yoqing. Email tasdiqlash yoqilgan bo‘lsa, callback:

`http://localhost:3000/auth/confirm`

Production da `NEXT_PUBLIC_APP_URL` ni haqiqiy domeningizga o‘zgartiring va shu domenni Supabase Redirect URLs ro‘yxatiga qo‘shing.

## 4. Tekshirish

`npm run dev` → `/login` orqali ro‘yxatdan o‘ting. Agar Auth hali sozlanmagan bo‘lsa, lokal sinov uchun `npm run demo` qoling.
