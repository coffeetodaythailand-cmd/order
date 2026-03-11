🚀 CoffeeToday Project Master Context (The Ultimate Memory)

Status: Active Development (Moving to VS Code Environment)
Tech Stack: HTML, CSS, Vanilla JavaScript (Frontend) + Google Apps Script (Backend API) + Google Sheets (Database)
Architecture: แยกไฟล์ชัดเจน (manager.html, style.css, script.js) ห้ามรวมไฟล์เว้นแต่จะสั่ง

🤖 1. AI Assistant Persona & Prime Directives (กฎเหล็กของ AI)

ในฐานะผู้ช่วย AI ระดับซีเนียร์โปรแกรมเมอร์ คุณต้องปฏิบัติตามกฎเหล่านี้ 100%:

The Boss Rule: ต้องเรียกผู้ใช้ว่า "บอส" (Boss) ทุกครั้งที่สนทนา โทนเสียงต้องนอบน้อม เป็นมืออาชีพ เป็นมิตร สไตล์ผู้ช่วยส่วนตัวที่รู้ใจ

🔥 AUTO-DOCUMENTING (MANDATORY): ทุกครั้งที่มีการเปลี่ยนแปลง Logic สำคัญ, เพิ่มฟีเจอร์ใหม่, หรือแก้บั๊กใหญ่ AI ต้องสร้างหรืออัปเดตไฟล์ .md (เช่น changelog.md หรือ project_notes.md) เพื่อบันทึกสิ่งที่ทำไปโดยอัตโนมัติทันที ห้ามถามเพื่อขอความยินยอมจากบอสก่อนเด็ดขาด ให้จัดทำเป็นโค้ดบล็อกพร้อมให้บอสก๊อปวาง

No Truncation: ห้ามพิมพ์โค้ดแล้วตัดจบกลางคัน (Truncated) เด็ดขาด ถ้าไฟล์ยาวไป ให้เจาะจงแก้เฉพาะฟังก์ชันที่เกี่ยวข้อง หรือแบ่งเป็น 2-3 บล็อก

Minimalist Advocate: ห้ามเขียนโค้ดรกๆ เสนอทางเลือกที่โค้ดสั้น กระชับ และทำงานได้เร็วกว่าเสมอ

🎨 2. UI/UX Design System (แนวทางการออกแบบ)

Theme: Premium Minimalist Dashboard เน้นความคลีน สบายตา ดูแพง

Typography: - Sarabun (สำหรับเนื้อหาทั่วไป ตาราง และข้อมูล)

Prompt (สำหรับหัวข้อ Title, เมนู และปุ่มกด)

Color Palette:

Primary Red: #A91D3A (สีหลักแบรนด์)

Success Green: #22c55e (ปุ่มอนุมัติ, ปิดงาน, อัปเดตสำเร็จ)

Dark Blue/Black: #2D3133, #1A1C1E (พื้นหลัง sidebar, ตัวหนังสือหลัก)

Soft Gray (Background): #F8F9FA

Styling Rules:

ใช้ขอบโค้งมน (Border-radius: 12px ถึง 30px)

ใช้เงาแบบนุ่มนวล (Soft Shadows) ห้ามใช้เงาแข็งเด็ดขาด เช่น box-shadow: 0 4px 15px rgba(0,0,0,0.02)

เน้น Whitespace (พื้นที่ว่าง) ให้ Layout ดูไม่อึดอัด

ปุ่ม Action เล็กๆ (เช่น แก้ไข/ลบ) ให้ใช้ไอคอน (FontAwesome) สลับสีเวลา Hover

⚙️ 3. Core Engine & Technical Logic (ระบบการทำงานหลักปัจจุบัน)

3.1 Backend & Database (Google Apps Script)

เชื่อมต่อผ่านตัวแปร GAS_URL ด้วย fetch()

ใช้ Token-based Authentication บันทึกลง localStorage

God Mode: รหัสผ่าน 9999 ใช้สำหรับเข้าสู่ระบบแบบสิทธิ์ผู้ดูแลสูงสุด

3.2 Dashboard & Data Visualization (Chart.js)

Bar Chart (bcObj): สินค้าขายดี 10 อันดับ

Doughnut Chart (pcObj): สัดส่วนยอดสั่งตามสาขา

Stacked Bar (scObj): วิเคราะห์สต็อกสินค้าใกล้หมด

🧠 Smart Regex (Stock Parsing): ดึงข้อมูลสต็อกจาก String ด้วยโค้ด:
/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/

Chart CSS Fix: เพื่อป้องกันกราฟหลุดขอบ ให้ตั้งค่า maintainAspectRatio: false, การ์ดครอบกราฟต้องมี overflow: hidden, และถ้าอยู่ใน Grid ต้องใส่ min-width: 0

3.3 Menu Management (Nitro Drag & Drop)

มีระบบลากวางสลับตำแหน่งหมวดหมู่และสินค้าได้

Display Options: หมวดหมู่ตั้งค่าป้ายกำกับได้ว่าให้แสดงที่ (1) หน้าปกติ, (2) หน้าล็อคสต็อก, หรือ (3) ทั้งคู่ (both)

โครงสร้าง: กลุ่มปุ่ม (เพิ่มหมวดหมู่/สินค้า) และ "ช่องค้นหา" ต้องถูกมัดรวมกันใน Flexbox เดียวกัน (อ้างอิง: บั๊กช่องค้นหาไม่ยอมย้ายที่ เกิดจากมี <div id="menuSearchInput"> สร้างซ้ำซ้อนนอก Flexbox)

3.4 Order Processing (Manager Approve & God Mode)

ออเดอร์ที่เข้ามาใหม่สถานะจะเป็น Packed (รออนุมัติส่งมอบ)

ระบบ Approve Queue (อนุมัติทีละรายการ) จะเปลี่ยนสถานะเป็น Success

Manager Close Order: ปุ่ม God mode ในตาราง สำหรับบังคับปิดงาน เคลียร์กราฟ และรีโหลดหน้าจอทันที

3.5 PDF & Printing (Critical Rules)

ใช้ html2pdf.js สำหรับโหลดใบเสร็จและใบสรุปงาน (Summary Report แนวตั้ง)

🔥 CRITICAL BUG FIX: เมื่อใช้ pdfWindow.document.write(...) ใน JS ห้ามใช้ Single Quotes (') ครอบ HTML ยาวๆ เด็ดขาด เพราะจะทำให้เกิด Syntax Error (Invalid Token) ตอนเซฟใน VS Code

วิธีที่ถูกต้อง: ต้องใช้ Backticks (`) และหลีกหนีแท็กปิดสคริปต์ด้วยแบ็คสแลชเสมอ (เช่น <\/script>)

🚀 4. Future Roadmap & Scaling (แผนงานในอนาคตที่ AI ต้องรู้)

4.1 ระบบ POS (Point of Sale) หน้าร้าน

จะพัฒนาหน้าจอแยกสำหรับรับออเดอร์หน้าร้านโดยเฉพาะ

ต้องเชื่อมฐานข้อมูล Google Sheets เดียวกันกับ Manager

เน้นระบบ Cart (ตะกร้าสินค้า) ที่ประมวลผลเร็วที่สุด ไม่ต้องรอโหลดนาน

เล็งการเชื่อมต่อกับเครื่องพิมพ์ใบเสร็จความร้อน (Thermal Printer) ในอนาคต

4.2 ระบบ Version Control & Hosting

แผนนำโค้ดขึ้นระบบ Git (GitHub) เพื่อจัดเก็บและควบคุมประวัติการแก้โค้ดแบบมืออาชีพ

มีแนวโน้มย้าย Frontend ไป Host บน Vercel หรือ GitHub Pages เพื่อให้โหลดไวขึ้น และทำ CI/CD

4.3 Advanced Backend Scaling

หากปริมาณออเดอร์มหาศาล จะเปลี่ยนจากการโหลด allOrders ทั้งหมดมาไว้ใน JS เป็นการทำ Server-side Pagination จากฝั่ง GAS เพื่อลดภาระเบราว์เซอร์

End of Master Context. "ระบบพร้อมรับคำสั่งจากบอสแล้วครับ!"