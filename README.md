# Survey Link System

ระบบจัดการลิงก์ survey ย้ายจาก Google Apps Script มาเป็น Next.js + Supabase

## วิธีติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้ง Supabase

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง project ใหม่
2. เปิด **SQL Editor** → รัน `supabase-setup.sql`
3. ไป **Project Settings → API** → copy URL และ anon key

### 3. ตั้ง environment variables

```bash
cp .env.local.example .env.local
```

แล้วแก้ค่าใน `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Import ข้อมูลจาก Google Sheets

- Export Sheet1 เป็น CSV
- ไป Supabase → **Table Editor → links → Import data**
- Map คอลัมน์: A→name, B→link, C→status

### 5. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Method | Path | แทน Apps Script |
|--------|------|-----------------|
| GET | `/api/links` | `getData()` |
| PATCH | `/api/use` | `markAsUsed(rowNumber)` |
| GET | `/api/status` | `getSystemStatus()` |

## Deploy บน Vercel

```bash
# push ขึ้น GitHub ก่อน แล้ว
vercel --prod
```

ใส่ environment variables เดิมบน Vercel Dashboard ด้วย

## ปิด/เปิดระบบ

ไป Supabase → Table Editor → **config** → แถว SYSTEM → เปลี่ยน value เป็น `OFF` หรือ `ON`
