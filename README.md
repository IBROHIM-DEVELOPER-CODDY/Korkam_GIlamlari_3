# Korkam Gilamlari — Kassa (backend bilan)

Bu loyiha Next.js'da yozilgan va ma'lumotlarni **umumiy (shared) Redis bazasida** saqlaydi — ya'ni siz nimadur qo'shsangiz, saytga boshqa qurilmadan kirgan odam ham xuddi shuni ko'radi. Bu localStorage emas, haqiqiy backend.

## 1. Loyihani GitHub'ga yuklash

1. GitHub'da yangi bo'sh repository yarating (masalan `korkam-kassa`).
2. Shu papkadagi barcha fayllarni o'sha repoga yuklang (GitHub Desktop yoki `git push` orqali).

## 2. Vercel'da deploy qilish

1. [vercel.com](https://vercel.com) da hisobingizga kiring → **Add New → Project**.
2. GitHub repongizni tanlang → **Import**. Framework avtomatik "Next.js" deb aniqlanadi, boshqa sozlash shart emas.
3. Hozircha **Deploy** tugmasini bosmang — avval bazani ulash kerak (quyidagi 3-qadam).

## 3. Ma'lumotlar bazasini ulash (Upstash Redis)

Vercel KV endi mavjud emas, o'rniga **Upstash Redis** integratsiyasidan foydalanamiz — bepul va oson:

1. Vercel loyihangiz sahifasida **Storage** bo'limiga o'ting (yoki Vercel Marketplace'dan "Redis" qidiring).
2. **Upstash Redis** ni tanlang → **Install / Create** → loyihangizga ulang.
3. Bu avtomatik ravishda environment o'zgaruvchilarni qo'shadi. Ular odatda `KV_REST_API_URL` / `KV_REST_API_TOKEN` yoki `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` nomlarida bo'ladi — loyihadagi kod ikkalasini ham tekshiradi, shuning uchun qo'shimcha sozlash shart emas.
4. Agar nomlar boshqacha bo'lsa: **Project Settings → Environment Variables** bo'limiga kirib, Upstash dashboardidan REST URL va TOKEN qiymatlarini quyidagi nomlar bilan qo'lda qo'shing:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 4. Deploy qilish

Endi **Deploy** tugmasini bosing. Bir necha daqiqadan so'ng sizga havola beriladi (masalan `korkam-kassa.vercel.app`) — shu havolani telefoningizga saqlab qo'ying yoki ekranga qisqa yo'l (shortcut) sifatida qo'shing.

Birinchi marta ochilganda, dastur avtomatik ravishda oldindan tayyorlangan mahsulotlar ro'yxatini (sizning eski hisob varag'ingizdan olingan) bazaga yozadi. Shundan keyin har qanday o'zgarish — yangi sotuv, Do'konga qo'shilgan mahsulot, tahrirlash, o'chirish — barchasi umumiy bazada saqlanadi va sayt qayerdan ochilishidan qat'i nazar bir xil ma'lumotni ko'rsatadi.

## 5. Kompyuterda mahalliy ishga tushirish (ixtiyoriy)

```bash
npm install
```

`.env.local` faylini yarating va Upstash dashboardidan olingan qiymatlarni kiriting:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Keyin:

```bash
npm run dev
```

va brauzerda `http://localhost:3000` ni oching.

## Eslatmalar

- Narxlar dollarda ($) kiritiladi va ko'rsatiladi.
- **Gilam** turi uchun Do'konga mahsulot qo'shishda "necha dona bor" + o'lchami (eni×bo'yi) kiritiladi, umumiy m² avtomatik hisoblanadi.
- **Darojka** va **Kavrolin** turlari uchun to'g'ridan-to'g'ri "necha metr bor" kiritiladi (kvadrat metr emas).
- Sotuv amalga oshirilganda tanlangan mahsulotning Do'kondagi miqdori avtomatik kamayadi; sotuv o'chirilsa, miqdor qaytariladi.
- Do'konda miqdori 3 tadan kam qolgan mahsulotlar "Kam qoldi", 0 bo'lsa "Tugagan" deb belgilanadi va Panelda alohida ko'rsatiladi.
