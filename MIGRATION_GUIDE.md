# 🚀 คู่มือการย้ายเครื่อง (Migration Guide)

## 📦 สิ่งที่ต้องเตรียมในเครื่องใหม่
1.  **VS Code:** [ดาวน์โหลดที่นี่](https://code.visualstudio.com/)
2.  **Git:** [ดาวน์โหลดที่นี่](https://git-scm.com/downloads) (ติดตั้งแล้วกด Next ยาวๆ ได้เลย)

---

## 📥 วิธีดึงข้อมูล (Clone)

เปิด **Terminal** หรือ **PowerShell** ในโฟลเดอร์ที่ต้องการเก็บงาน แล้วรันคำสั่ง:

### 1. ดึงความจำ AI (สำคัญ!) 🧠
```bash
git clone https://github.com/bellybabor0123-debug/Ai-BuH.git
```
*วิธีใช้: เปิดไฟล์ `Ai-BuH/MEMORY.md` แล้วก๊อปปี้ข้อความทั้งหมดมาแปะให้ AI*

### 2. ดึงโปรเจคกาแฟ ☕
```bash
# เปลี่ยน URL เป็นของบอสเองนะครับ
git clone https://github.com/USER/REPO_NAME.git
```

---

## ⚡ เริ่มงานต่อ
1. เปิด VS Code
2. ไปที่เมนู **File > Open Folder**
3. เลือกโฟลเดอร์โปรเจคที่เพิ่งดึงมา
4. กด **Go Live** เพื่อรันหน้าเว็บทดสอบได้เลย!

## ❓ Troubleshooting (ปัญหาที่พบบ่อย)
### ❌ Error: "git : The term 'git' is not recognized..."
**สาเหตุ:** เครื่องใหม่ยังไม่ได้ติดตั้งโปรแกรม Git ครับ
**วิธีแก้:**
1. โหลด Git ที่ [git-scm.com](https://git-scm.com/downloads)
2. ติดตั้ง (กด Next ยาวๆ)
3. **ปิด VS Code แล้วเปิดใหม่** (สำคัญมาก) แล้วลองพิมพ์คำสั่งเดิมอีกครั้ง