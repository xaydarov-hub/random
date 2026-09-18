# Instagram (Meta) sozlash

Kommentlardan tanlov faqat **o‘zingiz boshqaradigan** Professional (Business/Creator) hisob postlari uchun ishlaydi. Ilova Instagram parolini so‘ramaydi.

## Meta ilovasi

1. [Meta for Developers](https://developers.facebook.com/) da ilova yarating.
2. Instagram API with Instagram Login ni ulang.
3. OAuth Redirect URI:

`http://localhost:3000/api/instagram/oauth/callback`

Production da ham xuddi shu yo‘l, lekin o‘z domeningiz bilan.

4. `.env.local` ga qo‘ying:

```
META_APP_ID=...
META_APP_SECRET=...
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/oauth/callback
TOKEN_ENCRYPTION_KEY=
```

`TOKEN_ENCRYPTION_KEY` — 64 ta hex belgi (32 bayt). Generatsiya:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Kalitni yo‘qotsangiz, mavjud tokenlarni ochib bo‘lmaydi — hisobni qayta ulash kerak.

## Ruxsatlar

Ilova `META_SCOPES` dagi Instagram ruxsatlarini so‘raydi (`lib/instagram/meta-client.ts`). Live rejimga o‘tishdan oldin Meta App Review talablarini bajaring.

## Cheklovlar

- Boshqa odamning postini yuklab bo‘lmaydi.
- Rasmiy API to‘liq obunachi username ro‘yxatini bermaydi. Obunachilik sharti uchun follower CSV import qiling.
- Tokenlar bazada AES-256-GCM bilan saqlanadi.
