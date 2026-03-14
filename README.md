# 🧠 AI MEMORY CONTEXT: CoffeeToday Project

> **Last Updated:** 12 March 2026
> **Status:** 🟢 Ready for Migration (All Systems Go)
> **Role:** Gemini Code Assist (Senior Engineer Persona)

## 🎯 Current Context (บริบทล่าสุด)
เรากำลังพัฒนา Web Application สำหรับระบบสั่งกาแฟ **CoffeeToday** โดยเน้นความเสถียรและการใช้งานจริงหน้าสาขา

### ✅ สิ่งที่ทำเสร็จแล้ว (Done)
1.  **Auto-Refresh System (Robust):** 
    - เปลี่ยนระบบรีเฟรชหน้าจอจากตัวนับถอยหลัง เป็นการเช็ค **Timestamp (เวลาจริง)**
    - แก้ปัญหา Browser แอบหลับ (Throttling) เมื่อเปิดทิ้งไว้นานๆ
    - ตั้งเวลาไว้ที่ **30 นาที** (เช็คทุก 10 วินาที)
2.  **UI Cleanup:** 
    - **ถอดระบบแปลภาษา (Google Translate)** ออกทั้งหมด ตามคำสั่งบอส เพื่อให้หน้าจอคลีนและไม่รก
    - จัดการ Layout หน้าจอทั้ง Desktop และ Mobile ให้สมดุล
3.  **Deployment:**
    - อัปโหลดโค้ดทั้งหมดขึ้น **GitHub** เรียบร้อยแล้ว
    - ไฟล์ HTML หลัก: `odfc.html` (ลูกค้าทั่วไป), `odsc.html` (เช็คสต็อก)
    - ไฟล์ระบบหลังบ้าน: `manager.html` (จัดการ), `stock.html` (ครัว)
4.  **Email System (Backend):**
    - สร้างไฟล์ `Code.gs` เพื่อสำรองโค้ด Google Apps Script
    - **[Completed]** บันทึกไฟล์ `Code.gs` เวอร์ชัน Nitro Speed เรียบร้อย (Cleaned & Fixed)
    - แก้ไขข้อความติดต่อเป็น "ติดต่อแจ้งปัญหาออเดอร์สินค้า 02-375-6953" และจัดชิดซ้าย
5.  **Cache Prevention (Frontend Patch):**
    - แก้ไข `script.js` และ `stock.html` โดยเพิ่มพารามิเตอร์ `&v=[Timestamp]` ใน URL ของ fetch API
    - ป้องกันปัญหา Browser จำค่าเดิม (Cache Stale Data) ทำให้ข้อมูลรายการอนุมัติหรือผลการค้นหาไม่อัปเดต
    - ตรวจสอบ Deep Scan ไม่พบขยะแคชในระบบ
6.  **Architecture Migration:**
    - แยกส่วนความจำ AI ไปเก็บใน Private Repo (`Ai-BuH`) เพื่อความปลอดภัยและย้ายเครื่องง่าย
    - สร้างคู่มือการย้ายเครื่อง (`MIGRATION_GUIDE.md`) และบันทึก Log การทำงาน (`SESSION_LOGS.md`)

### 📂 Documentation
- **Project Notes:** บันทึกการแก้ไขอย่างละเอียดและประวัติแชทอยู่ในไฟล์ `SESSION_LOGS.md` (ใน Repo นี้) หรือ `project_notes.md` (ในเครื่อง)

### ⚙️ Technical Stack
- **Frontend:** HTML5, CSS3 (Modern/Glassmorphism), Vanilla JS
- **Backend/DB:** Firebase Firestore (Realtime Database)
- **API/Backup:** Google Apps Script (เชื่อมออเดอร์ลง Google Sheets)

## 📥 วิธีติดตั้ง / ย้ายเครื่องใหม่ (How to Pull)

### 1. ดึงความจำ AI (สำคัญที่สุด!) 🧠
```bash
git clone https://github.com/bellybabor0123-debug/Ai-BuH.git
```
*เปิดไฟล์ `MEMORY.md` ในโฟลเดอร์นี้ แล้วก๊อปข้อความมาคุยกับผม ผมจะจำได้ทันที*

### 2. ดึงโปรเจคกาแฟ (Source Code) ☕
```bash
# ดึงโปรเจคหลัก (Order System)
git clone https://github.com/coffeetodaythailand-cmd/order.git
```

## 📝 กฎเหล็กของโปรเจค (Rules)
1.  **ห้ามเพิ่มภาษาอื่น:** ไม่เอาระบบแปลภาษา
2.  **ห้ามใช้ Framework หนัก:** ขอเป็น HTML/JS เพียวๆ เพื่อความเร็วและแก้ไขง่าย
3.  **เน้นความจำ:** เวลาย้ายเครื่อง หรือเริ่มคุยใหม่ ให้เช็คไฟล์นี้ก่อนเสมอ

---

*ใช้ไฟล์นี้ในการอัปเดตความจำของ AI เพียงแค่แก้ไขเนื้อหาด้านบนและกด git push*