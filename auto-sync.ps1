# 🧠 AI Memory Auto-Sync Bot (Two-Way Real-time Sync)
# วิธีใช้: คลิกขวาที่ไฟล์นี้ -> "Run with PowerShell" หรือพิมพ์ .\auto-sync.ps1 ใน Terminal

Write-Host "🤖 AI Smart-Sync Started..." -ForegroundColor Cyan
Write-Host "🔄 กำลังเฝ้าดูและซิงค์ข้อมูลทุก 30 วินาที..." -ForegroundColor Gray

while ($true) {
    # 1. 💾 ตรวจสอบและบันทึกการแก้ไขในเครื่อง (Local Commit)
    $status = git status --porcelain
    if ($status) {
        Write-Host "📝 พบการแก้ไขในเครื่อง! กำลังบันทึก..." -ForegroundColor Yellow
        git add .
        git commit -m "🔥 Auto-Sync: Full project update"
    }

    # 2. 📥 ดึงข้อมูลจาก Cloud (Pull/Rebase) 
    # ทำหลังจาก Commit เพื่อลดโอกาสไฟล์ชนกัน (Conflict)
    try {
        $pull = git pull --rebase 2>&1
        if ($pull -match "Updating") {
            Write-Host "⬇️ ได้รับความจำใหม่จากเครื่องอื่น!" -ForegroundColor Cyan
        }
    } catch { }

    # 3. ☁️ ส่งข้อมูลขึ้น Cloud (Push)
    # เช็คว่ามี Commit ที่ยังค้างส่งหรือไม่
    $unpushed = git log origin/main..HEAD --oneline
    if ($unpushed) {
        Write-Host "🚀 กำลังส่งข้อมูลขึ้น Cloud..." -ForegroundColor Green
        git push
        Write-Host "✅ ซิงค์ข้อมูลเรียบร้อย!" -ForegroundColor Green
    }
    
    # พัก 30 วินาที
    Start-Sleep -Seconds 30
}