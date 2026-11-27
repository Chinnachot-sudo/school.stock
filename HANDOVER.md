# Project Handover & Architecture Document
**ระบบบริหารจัดการสต็อกสินค้าและครุภัณฑ์โรงเรียน (School Inventory & Asset Management System)**

---

## 1. ภาพรวมโปรเจกต์ (Project Overview)
ระบบเว็บแอปพลิเคชันสำหรับบริหารจัดการสต็อกพัสดุ (Inventory & Supplies), ครุภัณฑ์โรงเรียน (Asset Management), ระบบเบิกจ่าย/ยืมคืน (Requisitions & Borrowing), ระบบขายหน้าร้าน (POS), ออกใบเสร็จ/ใบแจ้งหนี้ และระบบบันทึกประวัติการทำงาน (Audit Logs)

* **Framework**: Next.js 15 (App Router, React 19, TypeScript)
* **Styling**: Tailwind CSS, Lucide React Icons
* **Database & Auth Backend**: Supabase (PostgreSQL with RLS)
* **Hosting & Deployment**: Vercel (เชื่อมต่อกับ GitHub Repository สาขา `main`)
* **Repository**: `https://github.com/Chinnachot-sudo/school.stock.git`
  * สาขาพัฒนา: `dev`
  * สาขา Production: `main`

---

## 2. สิ่งแวดล้อมและ Environment Variables (`.env.local`)
เมื่อย้ายไปเครื่องใหม่หรือบัญชีใหม่ ให้ตรวจสอบว่าไฟล์ `.env.local` ในโฟลเดอร์รากมีคีย์ต่อไปนี้ครบถ้วน:
```env
NEXT_PUBLIC_SUPABASE_URL=https://wiulvyluvgeeaapbjtvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...
```
*(ห้ามลบหรือเผยแพร่คีย์เหล่านี้ในที่สาธารณะ)*

---

## 3. โครงสร้างฐานข้อมูลหลักบน Supabase
1. **`items`**: ข้อมูลสินค้า/พัสดุสิ้นเปลือง (SKU, ชื่อ, สต็อกปัจจุบัน, จุดสั่งซื้อขั้นต่ำ, ราคา, หน่วยนับ)
2. **`assets`**: ทะเบียนครุภัณฑ์ (Asset Tag, Serial, ชื่อ, หมวดหมู่, สถานที่จัดเก็บ, ผู้ครอบครอง, สถานะ เช่น `AVAILABLE`, `IN_USE`, `ON_LOAN`)
3. **`requisitions`**: ประวัติคำขอเบิก/ยืม (เชื่อมต่อกับ `assets` ผ่าน `asset_id` และ `items` ผ่าน `item_id`)
4. **`transactions`**: ประวัติความเคลื่อนไหวสต็อก (IN, OUT, ADJUST, SALE ฯลฯ)
5. **`receipts` / `invoices`**: ข้อมูลการขาย POS และใบเสร็จ/ใบแจ้งหนี้
6. **`audit_logs`**: บันทึกกิจกรรมการทำงานในระบบทั้งหมด (User, Action, Entity, Changes, Timestamp)
7. **`users`**: ตารางบัญชีผู้ใช้งานระบบและบทบาทสิทธิ์ (Roles/Permissions)

---

## 4. สรุปการปรับปรุงล่าสุด (Latest Updates)
1. **ระบบสร้างคำขอยืมครุภัณฑ์ (My Space > New Request)**:
   - สลับจากเดิมที่ดึงสต็อกสินค้าสิ้นเปลือง (Inventory) มาเป็นการดึงรายการจาก **Asset Management (`assets`)**
   - แก้ไขปัญหา Dropdown หน่วงช้าด้วย **Searchable Combobox** ค้นหาได้ Real-time 0ms แสดงการ์ดครุภัณฑ์และสถานะอย่างชัดเจน
2. **ระบบสแกน QR Code เช็คสต็อก (Pure Stock Check)**:
   - เพิ่ม `StockDetailModal.tsx` สำหรับแสดงยอดคงเหลือและรายละเอียดสินค้าโดยเฉพาะ
   - ตัดปุ่มปรับยอดสต็อก (`+ Restock`, `Issue / Deduct`) ออกทั้งหมดเพื่อป้องกันการกดพลาดขณะเช็คของ
3. **แก้ไขปัญหา Build บน Vercel (`SESSION_SECRET`)**:
   - เพิ่ม fallback secret ป้องกันการ Error ช่วง static page collection และใส่ `export const dynamic = 'force-dynamic'` ใน API Routes

---

## 5. คำแนะนำสำหรับการพัฒนาต่อ (Development Guidelines)
1. **การตรวจสอบ Type และ Build ก่อน Push เสมอ**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
2. **ขั้นตอนการ Deploy ขึ้น Production**:
   ```bash
   # ทำงานบนกิ่ง dev
   git add .
   git commit -m "feat/fix: รายละเอียดที่แก้ไข"
   git push origin dev

   # รวมเข้าสู่ main เพื่อ deploy บน Vercel
   git checkout main
   git merge dev
   git push origin main
   git checkout dev
   ```
3. **API Routes ใน Next.js 15**:
   API Routes ที่มีการอ่าน Session หรือคุยกับฐานข้อมูลแบบ Real-time ควรมี:
   ```ts
   export const dynamic = 'force-dynamic';
   ```
   เพื่อไม่ให้ Next.js พยายาม pre-render ในช่วง build time บน Vercel

---

## 6. ข้อความ Prompt ตัวอย่างสำหรับเริ่มคุยกับ AI บัญชีใหม่
คัดลอกข้อความด้านล่างนี้ไปวางให้ AI บัญชีใหม่เพื่อเริ่มงานต่อได้ทันที:
> *"สวัสดีครับ ผมกำลังพัฒนาโปรเจกต์ระบบสต็อกสินค้าและครุภัณฑ์โรงเรียน (Next.js 15 + Supabase + Tailwind) กรุณาอ่านทำความเข้าใจไฟล์ HANDOVER.md ในโปรเจกต์นี้ เพื่อดูสถาปัตยกรรม โครงสร้างฐานข้อมูล และงานที่ทำค้างไว้ จากนั้นช่วยสรุปความพร้อมก่อนเริ่มงานครับ"*
