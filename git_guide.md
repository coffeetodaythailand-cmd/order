# 🐙 CoffeeToday Git Command Guide
คู่มือคำสั่ง Git สำหรับบอส (Sync งานข้ามเครื่อง)

## 📥 1. ดึงงานล่าสุดลงเครื่อง (Pull)
ใช้เมื่อเครื่องอื่นมีการแก้ไข แล้วเราต้องการอัปเดตเครื่องนี้ให้เหมือนกัน
```bash
git pull origin main
```

## 📤 2. อัปงานขึ้น Cloud (Push)
ใช้เมื่อแก้โค้ดที่เครื่องนี้เสร็จ แล้วต้องการเซฟขึ้น Git
```bash
git add .
git commit -m "Boss updated code: รายละเอียดการแก้..."
git push origin main
```

## ⚠️ 3. ถ้าเกิด Conflict (ไฟล์ชนกัน)
ถ้าดึงแล้วมันฟ้องว่าไฟล์ชนกัน ให้ทำตามนี้:
1. ระบบจะบอกว่าไฟล์ไหนชน (เป็นสีแดงใน VS Code)
2. เข้าไปแก้ไฟล์นั้น (เลือก Accept Current หรือ Incoming)
3. พิมพ์ `git add .` + `git commit` อีกรอบเพื่อจบงาน

---
*Note: คำสั่งนี้ใช้สำหรับ Terminal ใน VS Code หรือ Git Bash*
*Author: Gemini Code Assist*