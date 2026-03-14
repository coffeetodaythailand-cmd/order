# ☕ CoffeeToday - Order & Management System

> **Last Updated:** 14 March 2026
> **Version:** 2.5 (God-Mode Edition & Hybrid Auth)

## 🎯 ภาพรวมระบบ (System Overview)
ระบบรับออเดอร์ บริหารจัดการสต็อก และแผงควบคุมสำหรับร้าน CoffeeToday
ถูกพัฒนาด้วย HTML/JS/CSS แบบไร้รอยต่อ (Vanilla) เพื่อความเร็วสูงสุด และใช้ฐานข้อมูลผสมผสาน (Hybrid Database) ระหว่าง **Google Apps Script (GAS)** และ **Firebase**

### 🚀 ฟีเจอร์ล่าสุด (Latest Features)
- **Unified Order Interface:** ยุบรวมหน้าลูกค้าและพนักงานเป็นไฟล์เดียว `order.html` (แยกโหมดการทำงานด้วย URL Parameter อย่างชาญฉลาด)
- **Hybrid Authentication:** เข้าสู่ระบบ Manager และ KDS ด้วยรหัส PIN 4 หลักผ่าน Firebase (ความเร็ว 0.1 วินาที) พร้อมระบบส่งประวัติการเข้าสู่ระบบไปเก็บที่ Google Sheets แบบเบื้องหลัง (Background Audit)
- **Offline-Resilient KDS:** หน้าจอครัว (KDS) แบบ Kiosk Mode รองรับการรีเฟรชข้อมูลอัตโนมัติและแก้ปัญหาเน็ตหลุดได้เอง (Self-Healing)
- **Future-Proofed:** ป้องกันภัยคุกคาม XSS, ป้องกันปัญหา Memory Leak บน iPad, และป้องกันหน้าเว็บค้างจากการโหลดข้อมูลมหาศาล

---

## 🔗 วิธีเข้าใช้งานระบบ (Access URLs)

### 1. 🛒 หน้าสั่งสินค้าและเช็คสต็อก (`order.html`)
ใช้การต่อท้ายลิ้งก์ (URL Parameter) ในการแยกโหมดการทำงาน:
   - **โหมดลูกค้าทั่วไป:** `https://.../order.html?branch=fc` (หรือเปิด `order.html` เฉยๆ) -> แสดงหมวดหมู่ปกติ ซ่อนหมวดล็อคสต็อก
   - **โหมดพนักงาน/เช็คสต็อก:** `https://.../order.html?branch=sc` -> แสดงหมวดหมู่ที่ล็อคไว้ และ **บังคับให้พนักงานกรอกช่อง "คงเหลือ" เสมอ**

### 2. 📊 แผงควบคุมผู้จัดการ (`manager.html`)
   - **ลิ้งก์:** `https://.../manager.html`
   - **การทำงาน:** เข้าสู่ระบบด้วย PIN 4 หลัก (ค่าเริ่มต้น Master PIN: `9999`) ใช้สำหรับจัดการเมนู ดูรายงานกราฟวิเคราะห์ และบังคับปิดงาน

### 3. 👨‍🍳 หน้าจอแพ็คของ/ห้องครัว (`stock.html`)
   - **ลิ้งก์:** `https://.../stock.html`
   - **การทำงาน:** หน้าจอ Kiosk สำหรับพนักงาน (ใช้บน iPad/Tablet) ระบบจะล็อคอินให้อัตโนมัติ ใช้สำหรับกดยืนยันการเตรียมสินค้าแต่ละออเดอร์

---

## ⚙️ โครงสร้างไฟล์หลัก (Core Architecture)
- `order.html` : หน้าสั่งสินค้า (รองรับทั้งลูกค้าและพนักงานเช็คสต็อก)
- `manager.html` : แผงควบคุม (Dashboard) สำหรับผู้จัดการ (เข้าสู่ระบบด้วย PIN 4 หลัก)
- `stock.html` : หน้าจอ KDS สำหรับห้องครัว (เข้าสู่ระบบอัตโนมัติ/Kiosk Mode)
- `script.js` : สมองกลหลัก (Core Logic Engine) ของระบบหน้าบ้านทั้งหมด
- `style.css` : ระบบจัดการดีไซน์ (Premium Minimalist UI)
- `Code.gs` : โค้ดฝั่งเซิร์ฟเวอร์สำหรับ Google Apps Script (สำรองไว้ดูและอัปเดต)

## 📥 การดึงโปรเจค (Pull Request)
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
