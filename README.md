# RandomPick

Instagram post havolasini kiriting — kommentlarni yuklaydi va bitta bosishda adolatli, tasodifiy g‘olibni tanlaydi. Xohlasangiz, faqat import qilingan obunachilar ro‘yxatidagilar orasidan tanlashni ham talab qilish mumkin. Har bir natija SHA-256 tekshiruv hashi bilan saqlanadi.

## Tez start (lokal demo)

Supabase yoki Meta sozlamasisiz asosiy oqimni sinash:

```bash
npm install
npm run demo
```

Brauzerda oching: [http://localhost:3000/demo](http://localhost:3000/demo)

Demo lokal PGlite bazasini `.local-demo/` ichida ishlatadi va production buildda o‘chadi.

## Production sozlash

1. [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) — hisoblar va ma’lumotlar bazasi
2. [docs/INSTAGRAM_SETUP.md](docs/INSTAGRAM_SETUP.md) — Meta / Instagram kommentlari
3. [docs/EXTERNAL_PROVIDER.md](docs/EXTERNAL_PROVIDER.md) — ixtiyoriy tashqi provider

```bash
cp .env.example .env.local
npm run dev
```

## Skriptlar

| Buyruq | Vazifa |
| --- | --- |
| `npm run demo` | Lokal demo (PGlite + Next.js) |
| `npm run dev` | Oddiy development (Supabase kerak) |
| `npm run test` | Unit testlar |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run build` | Production build |
