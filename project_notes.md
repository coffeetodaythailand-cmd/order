# ☕ CoffeeToday Technical Documentation

**Owner:** Boss Bell
**Environment:** VS Code (Local Development)
**Engine:** Gemini Nitro v5
**Last Sync:** Current Session

---

## 🏗️ 1. System Architecture

### Core Files
*   **`manager.html`**: Main Dashboard (SPA). Contains Login Overlay, Sidebar, and 3 Sections (Dashboard, Orders, Menu).
*   **`style.css`**: CSS Variables (`--red`, `--green`, `--dark`), Responsive Media Queries (`max-width: 768px`), and Keyframe Animations.
*   **`script.js`**:
    *   **Auth:** Token-based (`localStorage`).
    *   **API:** Connects to Google Apps Script (`GAS_URL`).
    *   **Logic:** Chart rendering, Order polling, Drag & Drop handling.

---

## 🚀 2. Key Modules

### 2.1 Mobile Patch (Responsive)
*   **Logic:** CSS Media Queries ตรวจจับหน้าจอ `< 768px`.
*   **Sidebar:** `position: fixed`, `left: -100%` (Hidden) -> `left: 0` (Active).
*   **Table:** `display: block` สำหรับ `tr` และ `flex` สำหรับ `td` เพื่อทำ Card View.

### 2.2 God Mode (Manager Actions)
*   **Trigger:** ปุ่ม "ปิดงาน" ในตาราง (แสดงเฉพาะออเดอร์ที่ไม่ใช่ Success).
*   **Function:** `managerCloseOrder(id)` -> Modal Confirm -> `executeManagerClose()`.
*   **Backend Action:** ส่ง `action=setOrderStatus`, `status=Success` ไปที่ GAS.

### 2.3 Printing System
*   **Receipt (Thermal):** ใช้ `window.open` เขียน HTML ใหม่ + `window.print()`.
*   **Summary Report (A4):** ใช้ `html2pdf.js` สร้าง PDF แนวตั้ง.
*   **Rule:** ห้ามใช้ `'` (Single Quote) ครอบ HTML string ใน JS ให้ใช้ Backticks (`` ` ``) เท่านั้น.

### 2.4 Menu Management (Nitro Drag & Drop)
*   **State:** เก็บข้อมูลใน `menuObj`.
*   **Action:** รองรับการลาก `Category` และ `Product`.
*   **Save:** ส่งข้อมูลทั้งหมด (Re-order) กลับไปที่ GAS ผ่าน `action=reorderMenu`.

---

## 🎨 3. Design Tokens
*   **Primary Color:** `#A91D3A` (Red Brand)
*   **Secondary:** `#2D3133` (Dark), `#22c55e` (Success Green)
*   **Font:** `Prompt` (Headings), `Sarabun` (Content)
*   **Border Radius:** `30px` (Cards), `12px` (Buttons)

---

## ⚠️ Critical Rules (Do Not Ignore)
1.  **HTML Injection:** Always use Backticks for large HTML blocks in JS.
2.  **Auto-Document:** Update this file on every major logic change.
3.  **God Mode Security:** Ensure `token` is passed with every sensitive request.

---
*Maintained by AI Assistant*