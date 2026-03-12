# 📝 Engineering Session Logs
> **Date:** 12 March 2026
> **Focus:** Backend Email Logic, Frontend Caching, and Architecture Migration
> **Engineer:** Gemini Code Assist

---

## 1. 🔧 Backend Overhaul (`Code.gs`)
**Objective:** Fix HTML rendering issues and improve email privacy/usability.

### 🛠️ Changes Implemented
- **HTML Entity Repair:** 
  - Fixed corrupted characters (`&lt;`, `&gt;`) back to standard HTML tags (`<`, `>`) across the entire 1,300+ lines of code.
  - Ensured email templates render tables correctly instead of showing raw code.

- **Email Logic & Privacy:**
  - **Function:** `sendOrderEmail` & `buildEmailBody`
  - **Logic:** Implemented conditional rendering `if (isForCustomer)`.
  - **Customer Email:** Shows "ติดต่อแจ้งปัญหาออเดอร์สินค้า 02-375-6953" (Left Aligned).
  - **Shop Email:** Hides the contact footer to reduce clutter.

- **Backup System:**
  - **Function:** `submitOrderBackupOnly`
  - Synced logic with the main email function to ensure consistent formatting when orders are backed up.

---

## 2. ⚡ Frontend Stability Patch (`script.js` & `stock.html`)
**Objective:** Prevent stale data from displaying on mobile browsers (LINE/Facebook).

### 🛠️ Changes Implemented
- **Cache Buster Mechanism:**
  - **Problem:** `fetch()` requests were being cached by browsers, showing old "Pending" lists or "Approve" queues.
  - **Solution:** Appended a dynamic timestamp parameter `&v=${new Date().getTime()}` to all critical GET requests.

- **Affected Functions:**
  - `loadApproveList()` in `script.js`
  - `loadDashboardData()` in `script.js`
  - `refreshTasks()` in `stock.html`
  - `executeDeepSearch()` in `stock.html`

---

## 3. 🧠 Context & Memory Architecture
**Objective:** Decouple AI memory from the specific codebase for portability.

### 🛠️ Actions Taken
- **Migration:** 
  - Created a dedicated private repository `Ai-BuH`.
  - Moved `README.md` (Context) to the new repo as `MEMORY.md`.
  - This allows the "Boss & Engineer" persona to be transferred between machines without carrying project-specific code.
  - **Documentation:** Created `MIGRATION_GUIDE.md` containing step-by-step instructions for cloning and setting up the environment on a new machine.

---

## 📌 System Status
| Component | Status | Notes |
| :--- | :--- | :--- |
| **Frontend** | 🟢 Stable | Cache issues resolved. UI allows manual refresh. |
| **Backend** | 🟢 Active | Email formatting fixed. Logic optimized. |
| **Database** | 🟢 Online | Firebase & Google Sheets syncing correctly. |
| **Memory** | 🟢 Secured | Hosted on Private GitHub (Ai-BuH). |

---

## 4. 🤖 Automation Tools (Real-time Sync)
**Objective:** Eliminate manual git commands to prevent data loss due to fatigue.

### 🛠️ New Tool: `auto-sync.ps1`
- **Function:** PowerShell script that monitors `.md` files (Memory/Logs) for changes.
- **Trigger:** Checks every 30 seconds.
- **Action:** Automatically runs `git add`, `commit`, and `push` in background.
- **Benefit:** "Boss" just needs to Ctrl+S (Save), and the backup happens automatically.

### ⚙️ VS Code Automation (`tasks.json`)
- **Function:** Auto-start the `auto-sync.ps1` script when the project folder is opened.
- **Configuration:** Located in `.vscode/tasks.json` with `runOn: folderOpen`.
- **Status:** User simply needs to "Allow and Run" once upon next restart.

### 🔄 Two-Way Sync Upgrade (Multi-Device Support)
- **Upgrade:** Modified `auto-sync.ps1` to include `git pull --rebase` in the loop.
- **Function:** The bot now checks for updates from the cloud (other machines) *before* checking for local changes.
- **Result:** Enables real-time context synchronization across multiple active devices (Machine A <-> GitHub <-> Machine B).

### 🛡️ Smart Sync Logic Optimization
- **Problem:** Potential merge conflicts if `git pull` runs while local files are dirty (unsaved/uncommitted).
- **Fix:** Updated `auto-sync.ps1` to Commit local changes *first*, then Pull --rebase, then Push.
- **Benefit:** Ensures a clean working directory before interacting with the cloud, reducing sync errors.

### 🔓 Full Project Sync Unlocked
- **Issue:** Auto-sync was previously limited to `*.md` files, causing code changes (`.js`, `.html`) to be ignored.
- **Fix:** Updated `auto-sync.ps1` to track ALL file changes (`git add .`).
- **Result:** Any modification to the project is now automatically pushed to GitHub.

*End of Log.*