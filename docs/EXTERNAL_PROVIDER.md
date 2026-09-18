# Tashqi Instagram provider

Standart yo‘l — Meta rasmiy API. Qo‘shimcha HTTPS provider faqat server muhitida yoqiladi.

`.env.local`:

```
OPTIONAL_INSTAGRAM_PROVIDER_URL=https://your-provider.example/api
OPTIONAL_INSTAGRAM_PROVIDER_API_KEY=...
```

- URL faqat `https://` bo‘lishi shart.
- Kalit `Authorization: Bearer` sarlavhasi bilan yuboriladi.
- Ikkalasi ham bo‘sh bo‘lsa, UI da tashqi provider o‘chiq qoladi.

Provider o‘z shartnomasi, kvota va ma’lumot siyosatiga ega. Uni yoqish Meta App Review o‘rnini bosmaydi; faqat o‘zingiz ishonadigan server uchun mo‘ljallangan.
