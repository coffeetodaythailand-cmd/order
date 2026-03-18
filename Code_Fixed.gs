/**
 * ============================================================================
 * CoffeeToday System - Master Server Side (Backend)
 * ============================================================================
 * พัฒนาโดย: คุณเบลล์ (Khun Bell)
 * เวอร์ชั่น: Full Nitro Speed + Branch-Wise Inventory Analytics + Email Queue + Error Log
 * แก้ไขล่าสุด: 16 Mar 2026 (Fix doPost Routing & HTML Entities)
 * สถานะ: 🟢 พร้อมใช้งาน (Verified & Optimized)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 📋 1. ส่วนกำหนดค่าคงที่ของระบบ (System Constants)
// ----------------------------------------------------------------------------

// 🏠 บ้านเดิม (Master Data): เก็บเฉพาะหน้าเมนู, การตั้งค่าร้าน, เลข C3
const SS_ID_MASTER = "1FisNhwYEKX7lO-HSMQ6zzcTUALHaGV9a6Wnh02BYXic"; 

// 🏭 บ้านใหม่ (Transaction DB): รับข้อมูลออเดอร์, คิวอีเมล, และ Logs ล้วนๆ
const SS_ID_TRANSACTION = "1QI7uVClQfhePmmMywH2PvW-p5a8LimSgIhaGF9_Jpe4"; 

// ✅ แก้ไขลิงก์โลโก้ให้ดึงไฟล์ Raw จาก GitHub โดยตรงเพื่อให้แสดงผลในอีเมลได้
const LOGO_URL = "https://raw.githubusercontent.com/coffeetodaythailand-cmd/coffeetodayorder/main/emailLogo2025-09-11-03-46-29-029.png";

const CACHE_KEY_MENU = "CLIENT_MENU_DATA_KEY"; 

// ยิงตรงเข้า LINE ส่วนตัวของบอส (Push Message)
const LINE_CHANNEL_TOKEN = "5pU/QCQy6EXpOoSR2KW2eZWw2BHbW0dcbQ6spAwAFJdMIz5UcAx0bNi7OqFLBcBBfjztK5avM8ZkqExZ7vS/1tiNy5yRpe6lM33ve5QILqljLiTV4lYpdvX6tI9kgvokwciNkMqMxNYNCcED1wvWWwdB04t89/1O/w1cDnyilFU="; 
const LINE_USER_ID = "Uf6fb17301ff6eadf2253150a7c4a9a8f"; 

// 🔑 ส่วนจัดการรหัสผ่าน (Access Control)
// แอดมิน (รองรับหลายรหัส) และ พนักงานแพ็กของ (9999)
const ADMIN_PASS = ["1299"];  // เพิ่มรหัสแอดมินอื่นๆ ใน Array นี้ได้เลย

const KITCHEN_PASS = "9999";  

// 🛡️ ส่วนจัดการตั๋วผ่านทาง (Token) สำหรับแยกสิทธิ์เด็ดขาด
// ป้องกันการเข้าถึงข้อมูลข้ามส่วนงาน
const props = PropertiesService.getScriptProperties();
const TOKEN_ADMIN = props.getProperty('TOKEN_ADMIN') || "CT_ADMIN_AUTH_TOKEN_SECRET"; // 🚀 คืนค่ากุญแจสำรอง ป้องกันการโดนดีด
const TOKEN_KITCHEN = props.getProperty('TOKEN_KITCHEN') || "CT_KITCHEN_AUTH_TOKEN_SECRET";

// ----------------------------------------------------------------------------
// 🕵️‍♂️ 1.5 ระบบนักสืบ (Error Logging System) - NEW!
// ----------------------------------------------------------------------------

/**
 * 🎯 ค้นหาแผ่นงานด้วย GID เพื่อป้องกันบั๊กจากการเปลี่ยนชื่อแท็บ (God Mode)
 */
function getSheetByGid(ssId, gid) {
  var ss = SpreadsheetApp.openById(ssId);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() == gid) return sheets[i];
  }
  return null;
}

/**
 * ฟังก์ชันกลางสำหรับบันทึก Error แบบเงียบๆ ลงชีต "Error_Logs"
 * @param {string} functionName - ชื่อฟังก์ชันที่เกิด Error
 * @param {string} errorMessage - ข้อความแจ้งเตือน Error
 * @param {object|string} payloadData - ข้อมูลที่กำลังประมวลผลตอนเกิดเหตุ
 */
function logSystemError(functionName, errorMessage, payloadData) {
  try {
    var logSheet = getSheetByGid(SS_ID_MASTER, 1025799211); // 👈 ค้นหาด้วย GID ของ Error_Logs
    
    // ถ้าหาชีต Error_Logs เจอ ให้บันทึกข้อมูล
    if (logSheet) {
      var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      
      // แปลงข้อมูล payload เป็น String ถ้ามันเป็น Object
      var dataStr = "";
      if (typeof payloadData === 'object') {
        dataStr = JSON.stringify(payloadData);
      } else {
        dataStr = String(payloadData || "");
      }
      
      logSheet.appendRow([
        timeStamp,       // คอลัมน์ A: เวลาที่พัง
        functionName,    // คอลัมน์ B: ชื่อฟังก์ชันที่พัง
        errorMessage,    // คอลัมน์ C: ข้อความ Error
        dataStr          // คอลัมน์ D: ข้อมูลที่ทำให้พัง
      ]);
      
      // 🟢 ส่งแจ้งเตือนเข้า LINE ทันทีผ่าน Messaging API (Fire-and-Forget ไม่ทำให้เว็บค้าง)
      if (LINE_CHANNEL_TOKEN && LINE_USER_ID) {
        var lineMsg = "🚨 System Error Alert 🚨\n" +
                      "📍 จุดที่พัง: " + functionName + "\n" +
                      "❌ สาเหตุ: " + errorMessage;
                      
        var payload = {
          "to": LINE_USER_ID,
          "messages": [{ "type": "text", "text": lineMsg }]
        };
        
        var options = {
          "method": "post",
          "contentType": "application/json",
          "headers": { "Authorization": "Bearer " + LINE_CHANNEL_TOKEN },
          "payload": JSON.stringify(payload),
          "muteHttpExceptions": true // 👈 สั่งให้ส่งแล้วทิ้งเลย ไม่ต้องรอโหลด
        };
        UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
      }
    }
  } catch (e) {
    // ถ้าตัวเก็บ Error พังซะเอง ก็ปล่อยผ่านไปเพื่อไม่ให้ระบบหลักค้าง (Fail-safe)
  }
}


// ----------------------------------------------------------------------------
// 🌐 2. doGet: จุดรับคำสั่งผ่าน URL (GET Requests)
// ----------------------------------------------------------------------------

/**
 * ฟังก์ชันหลักในการประมวลผลคำขอประเภท GET
 * รองรับการดึงข้อมูลเมนู, การล็อกอิน, และการดึงข้อมูล Analytics
 */
function doGet(e) {
  
  // ตรวจสอบความถูกต้องของพารามิเตอร์ที่ส่งมา
  if (e && e.parameter && e.parameter.action) {
    try {
      var action = e.parameter.action;
      var data = { status: 'error', message: 'Action not matched' };
    
    // ---------------------------------------------------------
    // คัดกรอง Action: ดึงข้อมูลเมนูสินค้า (หน้า Client)
    // ---------------------------------------------------------
    if (action === 'getClientData') {
      
      data = getClientData();
      
    }
    
    // ---------------------------------------------------------
    // คัดกรอง Action:   ระบบบันทึก Log แบบไม่รอโหลด (Background Audit)
    // ---------------------------------------------------------
    if (action === 'logLogin') {
      return handleLogLogin(e.parameter);
    }

    // ---------------------------------------------------------
    // คัดกรอง Action:  🛡️ ระบบตรวจสอบรหัสผ่าน (verifyLogin)
    // ---------------------------------------------------------
    if (action === 'verifyLogin') {
      
      var pass = e.parameter.pass;
      var roleReq = e.parameter.role; 
      
      // ✅ บันทึก Log ทันทีที่มีการล็อกอิน
      var logRef = "";
      
      if (roleReq === 'manager') {
        logRef = "Login: Manager Page";
      } else {
        logRef = "Login: Packing Page";
      }
      
      var isSuccess = false;
      var roleLabel = "Unknown";
      var userName = "Unknown User";

      // 1. ตรวจสอบจาก Master Pass (รหัสฝังในโค้ด)
      if (ADMIN_PASS.includes(pass)) {
        isSuccess = true; roleLabel = "Manager"; userName = "Master Admin";
        data = { status: 'success', token: TOKEN_ADMIN, role: 'admin', name: userName };
      } else if (pass === KITCHEN_PASS) {
        if (roleReq === 'manager') {
          // ❌ บล็อกกรณีเอารหัสพนักงานมาเข้าหน้าผู้จัดการ
          data = { 
            status: 'error', 
            message: 'ขออภัย รหัสผ่านนี้ไม่มีสิทธิ์เข้าถึงระบบผู้จัดการ' 
          };
        } else {
          isSuccess = true; roleLabel = "Packing"; userName = "Master Kitchen";
          data = { status: 'success', token: TOKEN_KITCHEN, role: 'kitchen', name: userName };
        }
      } else {
        // 2. ตรวจสอบจากฐานข้อมูลพนักงาน (Staff_Access)
        var staffList = getStaffArray();
        var foundStaff = null;
        for (var k = 0; k < staffList.length; k++) {
          if (staffList[k].pin.toString() === pass.toString()) {
            foundStaff = staffList[k]; break;
          }
        }
        
        if (foundStaff) {
          if (foundStaff.status === 'Banned') {
            data = { status: 'error', message: 'รหัสผ่านนี้ถูกระงับสิทธิ์การใช้งาน' };
          } else {
            var sRole = foundStaff.role.toString().toLowerCase().trim();
            if (roleReq === 'manager' && (sRole === 'manager' || sRole === 'admin')) {
              isSuccess = true; roleLabel = "Manager"; userName = foundStaff.name;
              data = { status: 'success', token: TOKEN_ADMIN, role: 'admin', name: userName };
            } else if (roleReq !== 'manager') {
              isSuccess = true; roleLabel = sRole; userName = foundStaff.name;
              data = { status: 'success', token: TOKEN_KITCHEN, role: sRole, name: userName };
            } else {
              data = { status: 'error', message: 'ขออภัย รหัสผ่านนี้ไม่มีสิทธิ์เข้าถึงระบบผู้จัดการ' };
            }
          }
        } else {
          data = { status: 'error', message: 'รหัสผ่านไม่ถูกต้อง' };
        }
      }
      
      // บันทึก Log ทันทีที่มีการล็อกอิน (พร้อมชื่อและสถานะที่แท้จริง)
      verifyPassword(pass, logRef, isSuccess, roleLabel, userName); 
    }

    // ---------------------------------------------------------
    // คัดกรอง Action: ดึงข้อมูลหลังบ้าน (Manager / Analytics)
    // ---------------------------------------------------------
    if (action === 'managerGetData') {
      
      // ตรวจสอบความถูกต้องของ Token ก่อนอนุญาตให้ดึงข้อมูล
      if (e.parameter.token === TOKEN_ADMIN) {
        
        var startDateStr = e.parameter.s;
        var endDateStr = e.parameter.e;
        var queryStr = e.parameter.q;
        
        // รวบรวมข้อมูลทั้งเมนูและสถิติส่งกลับไปพร้อมกัน
        data = { 
          status: 'success', 
          menu: getMenuManagement(), 
          analytics: getManagerAnalytics(startDateStr, endDateStr, queryStr) 
        };
        
      } else {
        
        data = { 
          status: 'expired', 
          message: 'Unauthorized: กรุณาล็อกอินใหม่ด้วยสิทธิ์ผู้จัดการ' 
        };
        
      }
    }

    // ---------------------------------------------------------
    // คัดกรอง Action: ดึงสถานะออเดอร์ (หน้าแพ็กของ / Stock)
    // ---------------------------------------------------------
    if (action === 'getOrdersByStatus') {
      
      var t = e.parameter.token;
      var reqStatus = e.parameter.status;
      var searchQuery = e.parameter.q || ""; 
      
      if (t === TOKEN_ADMIN || t === TOKEN_KITCHEN) {
        
        // ใช้ระบบ Deep Search ค้นหาข้อมูลจากฐานข้อมูล
        data = getOrdersByStatus([reqStatus], searchQuery);
        
      } else {
        
        data = [];
        
      }
      
    }

    // ---------------------------------------------------------
    // คัดกรอง Action: แก้ไขสถานะออเดอร์ (Update Status)
    // ---------------------------------------------------------
    if (action === 'setOrderStatus') {
      
      var t = e.parameter.token;
      var oId = e.parameter.id;
      var oStatus = e.parameter.status;
      
      if (t === TOKEN_ADMIN || t === TOKEN_KITCHEN) {
        
        var success = setOrderStatus(oId, oStatus, t);
        
        data = { 
          status: success ? 'success' : 'error' 
        };
        
      } else {
        
        data = { 
          status: 'error', 
          message: 'Unauthorized' 
        };
        
      }
      
    }

    // ---------------------------------------------------------
    // คัดกรอง Action: จัดการข้อมูลสินค้า (Update Product)
    // ---------------------------------------------------------
    if (action === 'updateProduct') {
      
      var t = e.parameter.token;
      
      if (t === TOKEN_ADMIN) {
        
        data = updateProduct(
          e.parameter.id, 
          e.parameter.name, 
          e.parameter.cat, 
          e.parameter.status
        );
        
      }
      
    }

    // ---------------------------------------------------------
    // คัดกรอง Action: จัดการข้อมูลหมวดหมู่ (Add Category)
    // ---------------------------------------------------------
    if (action === 'addCategory') {
      
      var t = e.parameter.token;
      
      if (t === TOKEN_ADMIN) {
        
        data = addCategory(e.parameter.catName);
        
      }
      
    }
    
    // ---------------------------------------------------------
    // คัดกรอง Action: ดึงข้อมูลพนักงาน (Staff Management)
    // ---------------------------------------------------------
    if (action === 'getStaffList') {
      return getStaffList();
    }

      if (data === undefined || data === null) data = { status: 'error', message: 'Data is null' };

      // ส่งข้อมูลที่ประมวลผลเสร็จแล้วกลับเป็น JSON MimeType
      return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
      
    } catch (err) {
      logSystemError("doGet_API", err.message, e.parameter);
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: "Backend Error: " + err.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // ---------------------------------------------------------
  // 🚨 ทางเข้าห้องลับลานประหาร (Nitro Guard Terminal)
  // ---------------------------------------------------------
  if (e && e.parameter && e.parameter.mode === 'guard') {
    return HtmlService.createHtmlOutputFromFile('Guard')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // 👈 ทลายน้ำแข็ง! บรรทัดนี้ที่ช่วยให้คลิกและพิมพ์ได้
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setTitle('Nitro Guard Terminal');
  }

  // ---------------------------------------------------------
  // 🖼️ ส่วนแสดงผล HTML (Serving User Interface)
  // ---------------------------------------------------------
  var page = 'index';
  
  if (e && e.parameter && e.parameter.page) {
    page = e.parameter.page;
  }
  
  var templateName = 'Index';
  
  if (page === 'manager') {
    templateName = 'Manager';
  }
  
  if (page === 'stock') {
    templateName = 'Stock';
  }

  var t = HtmlService.createTemplateFromFile(templateName);
  t.initialData = JSON.stringify(getMenuManagement()); 
  t.initialStockTasks = "[]";
  
  return t.evaluate()
      .setTitle('CoffeeToday Shop System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ----------------------------------------------------------------------------
// 📝 ฟังก์ชันบันทึกการล็อกอินจาก Firebase (Background Audit Trail)
// ----------------------------------------------------------------------------
function handleLogLogin(params) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return ContentService.createTextOutput(JSON.stringify({ status: 'busy' }));

  try {
    // ย้ายกลับมาบันทึก Login_Logs ในบ้านเดิม (Master) ตามคำสั่งบอส
    var logSheet = getSheetByGid(SS_ID_MASTER, 2020727807); // 👈 ค้นหาด้วย GID ของ Login_Logs
    
    if (logSheet) {
      var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      var uName = params.name ? decodeURIComponent(params.name) : "Unknown User";
      logSheet.appendRow([timeStamp, "Login: " + uName, params.pin || 'N/A', "SUCCESS"]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) { logSystemError("handleLogLogin", e.message, params); } finally { lock.releaseLock(); }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error' })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// 📤 3. doPost: จุดรับข้อมูลขนาดใหญ่ (POST Requests)
// ----------------------------------------------------------------------------

/**
 * ฟังก์ชันหลักสำหรับการรับข้อมูลที่มีโครงสร้างซับซ้อน (JSON Payload)
 */
function doPost(e) {
  
  try {
    
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var result;
    
    // ---------------------------------------------------------
    // รับออเดอร์ใหม่จาก Client (submitOrder)
    // ---------------------------------------------------------
    if (action === 'submitOrder') {
      result = submitOrder(postData.formData);
    } 
    // ---------------------------------------------------------
    // ⚡ เพิ่มใหม่: รับข้อมูล Backup จาก GitHub (submitOrderBackupOnly)
    // ---------------------------------------------------------
    else if (action === 'submitOrderBackupOnly') {
      result = submitOrderBackupOnly(postData.formData, postData.orderId);
    }
    // ---------------------------------------------------------
    // รับข้อมูลการจัดเรียงเมนูแบบลากวาง (reorderMenu)
    // ---------------------------------------------------------
    else if (action === 'reorderMenu') {
      result = updateFullMenuOrder(postData.menuArray, postData.token);
    }
    // ---------------------------------------------------------
    // จัดการข้อมูลพนักงาน (Staff Management)
    // ---------------------------------------------------------
    else if (action === 'saveStaffAction') {
      result = saveStaffAction(postData);
    }
    // ---------------------------------------------------------
    // 🚀 ย้ายระบบจัดการเมนูมาใช้ POST เพื่อความเสถียรขั้นสุด! (ย้ายมาจากข้างบน)
    // ---------------------------------------------------------
    else if (action === 'updateProduct') {
      if (postData.token === TOKEN_ADMIN) {
        result = updateProduct(postData.id, postData.name, postData.cat, postData.status);
      } else { throw new Error("Unauthorized Access"); }
    }
    else if (action === 'addCategory') {
      if (postData.token === TOKEN_ADMIN) {
        result = addCategory(postData.catName);
      } else { throw new Error("Unauthorized Access"); }
    }

    // ส่งผลลัพธ์การบันทึกกลับไปยังฝั่ง Client
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      data: result 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    
    // 🚨 กรณีเกิดข้อผิดพลาดในการประมวลผลข้อมูล POST ให้บันทึกลง Error_Logs
    logSystemError("doPost", err.message, e.postData.contents);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.message 
    })).setMimeType(ContentService.MimeType.JSON);
    
  }
}


// ----------------------------------------------------------------------------
// 🛠️ 4. ฟังก์ชันช่วยเหลือและจัดการแคช (Utilities & Cache)
// ----------------------------------------------------------------------------

/**
 * ล้างข้อมูลเมนูออกจากแคช เพื่อให้โหลดข้อมูลใหม่จาก Google Sheets
 */

// ----------------------------------------------------------------------------
// 👥 15. ระบบจัดการพนักงาน (Staff Management)
// ----------------------------------------------------------------------------

function getStaffArray() {
  var sheet = getSheetByGid(SS_ID_MASTER, 281050887);
  var data = sheet.getDataRange().getValues();
  var staffList = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== "") { 
      staffList.push({ rowId: i + 1, name: data[i][0], pin: data[i][1], role: data[i][2], status: data[i][3] });
    }
  }
  return staffList;
}

function getStaffList() {
  return ContentService.createTextOutput(JSON.stringify({status: "success", data: getStaffArray()})).setMimeType(ContentService.MimeType.JSON);
}

function saveStaffAction(payload) {
  var sheet = getSheetByGid(SS_ID_MASTER, 281050887);
  var action = payload.subAction; 
  if (action === "add") sheet.appendRow([payload.name, payload.pin, payload.role, "Active"]);
  else if (action === "edit") sheet.getRange(payload.rowId, 1, 1, 3).setValues([[payload.name, payload.pin, payload.role]]);
  else if (action === "ban") sheet.getRange(payload.rowId, 4).setValue(payload.newStatus);
  else if (action === "delete") sheet.deleteRow(payload.rowId);
  return getStaffArray(); 
}
function clearMenuCache() {
  try {
    CacheService.getScriptCache().remove(CACHE_KEY_MENU);
  } catch (err) {
    logSystemError("clearMenuCache", err.message);
  }
}

/**
 * ซ่อมแซมและจัดรูปแบบเบอร์โทรศัพท์ (fixPhoneFormat)
 */
function fixPhoneFormat(phoneStr) {
  
  if (!phoneStr) {
    return "-";
  }
  
  var s = phoneStr.toString().trim();
  
  // ตรวจสอบเบอร์มือถือไทย 9 หลัก (กรณีตัด 0 หน้าออก)
  if (s.length === 9) {
    
    if (s.indexOf('8') === 0 || s.indexOf('9') === 0) {
      return "0" + s;
    }
    
  }
  
  return s;
}

/**
 * 📧 ฟังก์ชันสร้างเทมเพลตอีเมล (Global HTML Email Template)
 * นำมารวมกันเพื่อลดความซ้ำซ้อนใน submitOrder และ submitOrderBackupOnly
 */
function buildGlobalEmailTemplate(customerName, orderId, dateStr, rowsHtml, isAdmin, remark) {
  var body = '<div style="font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">';
  body += '<div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">';
  body += '<img src="' + LOGO_URL + '" width="120" style="margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">';
  body += '<h1 style="color: #000000; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Order Confirmation</h1>';
  body += '</div>';
  body += '<div style="padding: 40px;">';
  body += '<p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 0;">เรียน คุณ <strong>' + customerName + '</strong>,</p>';
  body += '<div style="background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 8px; padding: 25px; margin: 30px 0;">';
  body += '<table width="100%" cellspacing="0" cellpadding="0"><tr>';
  body += '<td style="padding-bottom: 10px; color: #999; font-size: 12px; text-transform: uppercase;">Order Number</td>';
  body += '<td style="padding-bottom: 10px; color: #999; font-size: 12px; text-transform: uppercase; text-align: right;">Date & Time</td>';
  body += '</tr><tr>';
  body += '<td style="color: #2D3133; font-size: 20px; font-weight: bold;">' + orderId + '</td>';
  body += '<td style="color: #2D3133; font-size: 14px; text-align: right;">' + dateStr + '</td>';
  body += '</tr></table></div>';
  
  body += '<table width="100%" style="border-collapse: collapse; margin-bottom: 40px;"><thead><tr style="background-color: #f9f9f9;">';
  body += '<th style="padding: 15px 10px; text-align: left; border-bottom: 2px solid #A91D3A; color: #2D3133; font-size: 13px; text-transform: uppercase;">Product Detail</th>';
  if (isAdmin) {
    body += '<th style="padding: 15px 10px; text-align: center; border-bottom: 2px solid #A91D3A; color: #2D3133; font-size: 13px; text-transform: uppercase;">Stock</th>';
  }
  body += '<th style="padding: 15px 10px; text-align: center; border-bottom: 2px solid #A91D3A; color: #2D3133; font-size: 13px; text-transform: uppercase;">QTY</th>';
  body += '</tr></thead><tbody>' + rowsHtml + '</tbody></table>';
  
  if (remark) {
    body += '<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">';
    body += '<p style="margin: 0; color: #b45309; font-size: 14px;"><strong>หมายเหตุ:</strong> ' + remark + '</p>';
    body += '</div>';
  }

  if (!isAdmin) {
    body += '<div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: left;">';
    body += '<p style="margin:0; font-size:12px; color:#888888;">ติดต่อแจ้งปัญหาออเดอร์สินค้า 02-375-6953</p>';
    body += '</div>';
  }
  
  body += '<div style="text-align: center; border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">';
  body += '<p style="color: #ccc; font-size: 11px;">© 2026 CoffeeToday Management System. All Rights Reserved.</p>';
  body += '</div></div></div>';
  return body;
}

// ----------------------------------------------------------------------------
// 🔎 5. ระบบดึงข้อมูลออเดอร์ (Deep Search Order Retrieval)
// ----------------------------------------------------------------------------

/**
 * ดึงรายการออเดอร์ตามสถานะ พร้อมรองรับการค้นหาแบบละเอียดทุกคอลัมน์
 */
function getOrdersByStatus(statusArray, searchQ) {
  
  try {
    var ss = SpreadsheetApp.openById(SS_ID_TRANSACTION);
    var sheet = ss.getSheetByName("Orders");
    var lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return [];
    }
    
    // 🚀 NITRO FIX (OOM Prevention): ดึงเฉพาะ 300 แถวล่าสุดมาประมวลผล ไม่ดึงทั้งชีต
    var numRows = Math.min(lastRow - 1, 300);
    var startRow = lastRow - numRows + 1;
    var recentData = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getDisplayValues();
    
    var filtered = [];
    var queryLower = "";
    
    if (searchQ) {
      queryLower = searchQ.toString().toLowerCase().trim();
    }
    
    for (var i = 0; i < recentData.length; i++) {
      
      var row = recentData[i];
      
      // เตรียมข้อมูลสำหรับการเปรียบเทียบคำค้นหา
      var oIdRaw = row[8] ? row[8].toString().toLowerCase() : "";
      var oIdNum = oIdRaw.replace(/\D/g, '');
      var oIdShort = parseInt(oIdNum).toString();
      
      var cName = row[1] ? row[1].toString().toLowerCase() : "";
      var phoneRaw = row[3] ? row[3].toString().toLowerCase() : "";
      var branchStr = row[4] ? row[4].toString().toLowerCase() : "";
      var currentStatus = row[7];
      
      var isMatch = false;
      
      // 🔎 โหมดค้นหาลึก (Deep Search Strategy)
      if (queryLower !== "") {
        
        var matchId = (oIdRaw.indexOf(queryLower) !== -1);
        var matchNum = (oIdNum.indexOf(queryLower) !== -1);
        var matchShort = (oIdShort === queryLower);
        var matchName = (cName.indexOf(queryLower) !== -1);
        var matchPhone = (phoneRaw.indexOf(queryLower) !== -1);
        var matchBranch = (branchStr.indexOf(queryLower) !== -1);
        
        if (matchId || matchNum || matchShort || matchName || matchPhone || matchBranch) {
          isMatch = true;
        }
        
      } 
      // 📊 โหมดปกติ: กรองตามสถานะที่ระบุ
      else {
        
        if (statusArray.indexOf(currentStatus) !== -1) {
          isMatch = true;
        }
        
      }
      
      // บรรจุข้อมูลที่ผ่านการตรวจสอบลงในรายการผลลัพธ์
      if (isMatch) {
        
        filtered.push({
          id: row[8],
          branch: row[4],
          items: row[5],
        remark: row[6] || "",
          status: row[7],
          phone: fixPhoneFormat(row[3]), 
          time: Utilities.formatDate(new Date(row[0]), "GMT+7", "HH:mm")
        });
        
      }
      
    }
    // ส่งค่ากลับโดยเรียงลำดับใหม่ล่าสุดขึ้นก่อน
    return filtered.reverse();
    
  } catch (err) {
    // 🚨 บันทึก Error
    logSystemError("getOrdersByStatus", err.message, { statusArray: statusArray, searchQ: searchQ });
    return [];
  }
}


// ----------------------------------------------------------------------------
// 🛒 6. ระบบบันทึกการสั่งซื้อ (Order Submission Process - NITRO UPGRADED)
// ----------------------------------------------------------------------------

/**
 * ฟังก์ชันหลักในการบันทึกออเดอร์ลง Google Sheets 
 * 💡 อัปเกรด: ไม่ส่งเมลเองแล้ว แต่จะโยนเข้า Email_Queue แทนเพื่อให้หน้าเว็บวิ่งไว!
 */
function submitOrder(f) {
  
  var ssMaster = SpreadsheetApp.openById(SS_ID_MASTER);
  var ssTrans = SpreadsheetApp.openById(SS_ID_TRANSACTION);
  
  var master = ssMaster.getSheetByName("MasterData");       // ดึงเลข C3 และ Email แอดมินจากบ้านเดิม
  var ordersSheet = ssTrans.getSheetByName("Orders");       // โยนออเดอร์เข้าบ้านใหม่
  var emailQueueSheet = ssTrans.getSheetByName("Email_Queue"); // โยนคิวเข้าบ้านใหม่
  
  try {
    
    // ดึงค่าการตั้งค่าจากแผ่น MasterData
    var adminEmail = master.getRange("B4").getValue();
    // 🛡️ ป้องกันเลขออเดอร์ซ้ำด้วยระบบบัตรคิว (LockService)
    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // รอคิวสูงสุด 10 วินาทีถ้ามีการกดพร้อมกัน
    
    // ดึงค่าการตั้งค่าจากแผ่น MasterData
    var nextIdValue = master.getRange("C3").getValue() || 0;
    var nextId = nextIdValue + 1;
    master.getRange("C3").setValue(nextId);
    
    var idString = ("0000" + nextId).slice(-4);
    var orderId = "ORD-" + idString;
    var timestamp = new Date();
    var rawDataString = JSON.stringify(f);
    
    // แทรกแถวใหม่ที่บรรทัดที่ 2 (บนสุดของข้อมูล)
    ordersSheet.insertRowBefore(2);
    
    // บันทึกข้อมูลออเดอร์ลงในคอลัมน์ต่างๆ
    ordersSheet.getRange(2, 1, 1, 11).setValues([[
      timestamp, 
      f.name, 
      f.email, 
      f.phone, 
      f.branch, 
      f.details, 
      f.remark || "", 
      "Pending", 
      orderId, 
      rawDataString, 
      ""
    ]]);

    SpreadsheetApp.flush(); // บังคับให้ชีตอัปเดตข้อมูลทั้งหมด
    lock.releaseLock(); // 🚀 NITRO FIX: ปล่อยคิวตรงนี้ ป้องกัน row ทับกัน

    // 🛒 สร้างตารางรายการสินค้าสำหรับใส่ในอีเมล
    var itemsArray = f.details.split('\n');
    var tableRowsCust = ""; // สำหรับลูกค้า (ไม่มีสต็อก)
    var tableRowsAdmin = ""; // สำหรับร้าน (มีสต็อก)
    
    itemsArray.forEach(function(line) {
      
      if (line.trim() !== "") {
        
        // แยกข้อมูล ชื่อสินค้า, คงเหลือ, และจำนวนที่สั่ง
        var match = line.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
        
        if (match) {
          
          // 1. แถวสำหรับลูกค้า (Customer)
          tableRowsCust += '<tr>';
          tableRowsCust += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #444; font-size: 14px;">' + match[1] + '</td>';
          tableRowsCust += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #A91D3A; text-align: center; font-weight: bold; font-size: 16px;">' + match[3] + '</td>';
          tableRowsCust += '</tr>';

          // 2. แถวสำหรับร้านค้า (Admin) - มีช่อง Stock
          tableRowsAdmin += '<tr>';
          tableRowsAdmin += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #444; font-size: 14px;">' + match[1] + '</td>';
          tableRowsAdmin += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #888; text-align: center; font-size: 14px;">' + match[2] + '</td>';
          tableRowsAdmin += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #A91D3A; text-align: center; font-weight: bold; font-size: 16px;">' + match[3] + '</td>';
          tableRowsAdmin += '</tr>';
          
        }
      }
    });

    // เตรียมหัวข้อและเนื้อหาอีเมลแบบ HTML (Nitro Template)
    var subject = "Order Confirmation: " + orderId + " - CoffeeToday";
    
    // ฟังก์ชันสร้างเนื้อหา HTML (Reusable)
    function createEmailBody(rows, isAdmin) {
      var body = '<div style="font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">';
      body += '<div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">';
      body += '<img src="' + LOGO_URL + '" width="120" style="margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">';
      body += '<h1 style="color: #000000; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Order Confirmation</h1>';
      body += '</div>';
      body += '<div style="padding: 40px;">';
      body += '<p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 0;">เรียน คุณ <strong>' + f.name + '</strong>,</p>';
      body += '<div style="background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 8px; padding: 25px; margin: 30px 0;">';
      body += '<table width="100%" cellspacing="0" cellpadding="0"><tr>';
      body += '<td style="padding-bottom: 10px; color: #999; font-size: 12px; text-transform: uppercase;">Order Number</td>';
      body += '<td style="padding-bottom: 10px; color: #999; font-size: 12px; text-transform: uppercase; text-align: right;">Date & Time</td>';
      body += '</tr><tr>';
      body += '<td style="color: #2D3133; font-size: 20px; font-weight: bold;">' + orderId + '</td>';
      body += '<td style="color: #2D3133; font-size: 14px; text-align: right;">' + Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm") + '</td>';
      body += '</tr></table></div>';
      
      // ส่วนหัวตาราง (แยกตามสิทธิ์: Admin เห็น Stock, ลูกค้าไม่เห็น)
      body += '<table width="100%" style="border-collapse: collapse; margin-bottom: 40px;"><thead><tr style="background-color: #f9f9f9;">';
      body += '<th style="padding: 15px 10px; text-align: left; border-bottom: 2px solid #A91D3A; color: #2D3133; font-size: 13px; text-transform: uppercase;">Product Detail</th>';
      if (isAdmin) {
        body += '<th style="padding: 15px 10px; text-align: center; border-bottom: 2px solid #A91D3A; color: #2D3133; font-size: 13px; text-transform: uppercase;">Stock</th>';
      }
      body += '<th style="padding: 15px 10px; text-align: center; border-bottom: 2px solid #A91D3A; color: #2D3133; font-size: 13px; text-transform: uppercase;">QTY</th>';
      body += '</tr></thead><tbody>' + rows + '</tbody></table>';
      
      if (f.remark) {
        body += '<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">';
        body += '<p style="margin: 0; color: #b45309; font-size: 14px;"><strong>หมายเหตุ:</strong> ' + f.remark + '</p>';
        body += '</div>';
      }

      // ✅ แก้ไขล่าสุด: ส่วน Footer (ติดต่อร้าน)
      if (!isAdmin) {
        // เฉพาะลูกค้า: โชว์เบอร์ + ชิดซ้าย
        body += '<div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: left;">';
        body += '<p style="margin:0; font-size:12px; color:#888888;">ติดต่อแจ้งปัญหาออเดอร์สินค้า 02-375-6953</p>';
        body += '</div>';
      }
      
      body += '<div style="text-align: center; border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">';
      body += '<p style="color: #ccc; font-size: 11px;">© 2026 CoffeeToday Management System. All Rights Reserved.</p>';
      body += '</div></div></div>';
      return body;
    }

    var htmlBodyCust = createEmailBody(tableRowsCust, false);
    var htmlBodyAdmin = createEmailBody(tableRowsAdmin, true);
      
    // ========================================================================
    // 💡 NEW LOGIC: นำข้อมูลไปฝากคิวแทนการส่งเมล (Email Queue System)
    // ลดเวลาจาก 6 วิ เหลือ 1 วิ! ⚡
    // ========================================================================
    if (emailQueueSheet) {
      var ts = Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm:ss");
      
      // 1. คิวสำหรับ Admin (ส่งหา Admin Email, เนื้อหาเห็น Stock)
      emailQueueSheet.appendRow([
        ts, orderId, adminEmail, "", subject, htmlBodyAdmin, "Pending"
      ]);

      // 2. คิวสำหรับลูกค้า (ส่งหา Customer Email, เนื้อหาไม่เห็น Stock)
      if (f.email) {
        emailQueueSheet.appendRow([
          ts, orderId, "", f.email, subject, htmlBodyCust, "Pending"
        ]);
      }

    } else {
      // 🚨 ถ้าหาแผ่นคิวไม่เจอ ให้แอบล็อกว่าพัง แต่ยังคืนเลขบิลให้ลูกค้าอยู่
      logSystemError("submitOrder", "ไม่พบแผ่นงาน Email_Queue กรุณาสร้างแผ่นงานนี้", orderId);
    }

    // คืนค่า OrderID เพื่อนำไปแสดงผลที่หน้าเว็บ (ทำได้ไวมากเพราะไม่ได้ส่งเมล)
    return orderId;
    
  } catch (err) {
    // 🚨 กรณีเกิดข้อผิดพลาดในการบันทึก
    logSystemError("submitOrder", err.message, f);
    return "Error: " + err.message;
  }
}


// ----------------------------------------------------------------------------
// ✅ 7. ส่วนงานอัปเดตสถานะออเดอร์ (Status Management)
// ----------------------------------------------------------------------------

/**
 * แก้ไขสถานะการทำงานของออเดอร์ และบันทึกเวลาที่ทำงานเสร็จ
 */
/**
 * แก้ไขสถานะการทำงานของออเดอร์ (เวอร์ชัน Nitro Fix - รองรับ Token)
 */
function setOrderStatus(orderId, status, token) {
  
  // 🛡️ ด่านแรก: เช็คกุญแจ (Token) ก่อนเลย ถ้าไม่มีหรือผิด ไม่ให้ทำต่อ (กันค้าง!)
  if (token !== TOKEN_ADMIN && token !== TOKEN_KITCHEN) {
    logSystemError("setOrderStatus", "Unauthorized attempt", { orderId: orderId, token: token });
    return false;
  }

  // 🚀 NITRO FIX: ป้องกันพนักงาน 2 คนกดปิดงานพร้อมกันแล้วบิลพัง
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return false; 

  try {
    var ss = SpreadsheetApp.openById(SS_ID_TRANSACTION);
    var sheet = ss.getSheetByName("Orders");
    var lastRow = sheet.getLastRow();
    
    if (lastRow < 2) return false;
    
    // ค้นหารหัสบิล (OrderID อยู่คอลัมน์ I)
    var data = sheet.getRange(2, 9, lastRow - 1, 1).getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === orderId) {
        var targetRow = i + 2;
        
        // อัปเดตสถานะในคอลัมน์ H
        sheet.getRange(targetRow, 8).setValue(status);
        
        // บันทึกเวลาที่ทำงานเสร็จลงคอลัมน์ K
        if (status === 'Packed' || status === 'Success') {
          var currentTime = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
          sheet.getRange(targetRow, 11).setValue(currentTime);
        }
        
        return true; // ✅ ส่งค่ากลับว่าทำสำเร็จ
      }
    }
    return false;
  } catch (err) {
    logSystemError("setOrderStatus", err.message, { orderId: orderId, status: status });
    return false;
  } finally {
    lock.releaseLock();
  }
}

/**
 * อะแดปเตอร์เชื่อมต่อสำหรับเวอร์ชั่นเก่า
 */
function updateStockStatus(orderId) {
  return setOrderStatus(orderId, 'Packed');
}


// ----------------------------------------------------------------------------
// 🛡️ 8. ระบบความปลอดภัยและบันทึกประวัติ (Security & Logging)
// ----------------------------------------------------------------------------

/**
 * ตรวจสอบรหัสผ่านและบันทึกกิจกรรมลงแผ่น Logs
 */
function verifyPassword(pass, userRef, isSuccess, roleLabel, userName) {
  
  var success = isSuccess || false;
  var roleStr = roleLabel || "Unknown";
  var userStr = userName || "Unknown User";
  
  try {
    var logSheet = getSheetByGid(SS_ID_MASTER, 2020727807); // 👈 ค้นหาด้วย GID ของ Login_Logs
    
    // บันทึกกิจกรรมลงชีต Logs ทันที
    if (logSheet) {
      
      var statusText = success ? "SUCCESS" : "FAIL";
      
      var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      var userLog = userRef + " - " + userStr + " (" + roleStr + ")";
      
      logSheet.appendRow([
        timeStamp,
        userLog, 
        pass,
        statusText
      ]);
      
    }
  } catch (err) {
    // 🚨 บันทึก Error
    logSystemError("verifyPassword", err.message, { userRef: userRef });
  }
  
  return success;
}


// ----------------------------------------------------------------------------
// 🚀 9. ระบบวิเคราะห์และกราฟสต็อกรายสาขา (Manager Analytics Engine - Auto Clear v3)
// ----------------------------------------------------------------------------

function getManagerAnalytics(startDateStr, endDateStr, searchQ) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID_TRANSACTION);
    var sheet = ss.getSheetByName("Orders");
    var data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { history: [], charts: { pL: [], pV: [], bL: [], bV: [], sStacked: { labels: [], datasets: [] } } };
    }

    var branchCounts = {}, productStats = {}, historyData = [], branchMap = {}, allProducts = [];
    var isCustomDate = !!(startDateStr || endDateStr);
    
    var start = startDateStr ? new Date(startDateStr) : new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    if (startDateStr) start.setHours(0,0,0,0);
    var end = endDateStr ? new Date(endDateStr) : new Date();
    end.setHours(23,59,59,999);
    var q = searchQ ? searchQ.toString().toLowerCase().trim() : "";

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      
      var dateVal = new Date(row[0]);
      var status = row[7], orderId = row[8] || "", branch = row[4] || "ไม่ระบุ";
      var includeInTable = false, includeInGraph = false;

      if (q !== "") {
        if (orderId.toLowerCase().includes(q) || row[1].toLowerCase().includes(q) || branch.toLowerCase().includes(q)) {
          includeInTable = true; includeInGraph = true;
        }
      } else {
        var isWithinDate = (dateVal >= start && dateVal <= end);
        var isBacklog = (!isCustomDate && (status === 'Pending' || status === 'Packed'));
        if (isWithinDate) { includeInTable = true; includeInGraph = true; }
        else if (isBacklog) { includeInTable = true; }
      }

      if (includeInGraph) {
        branchCounts[branch] = (branchCounts[branch] || 0) + 1;
        var linesArr = (row[5] || "").split('\n');
        
        linesArr.forEach(function(line) {
          var match = line.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
          if (match) {
            var pName = match[1].trim();
            var stock = parseFloat(match[2].match(/[\d.]+/)?.[0] || 0);
            var qty = parseFloat(match[3].match(/[\d.]+/)?.[0] || 0);
            
            productStats[pName] = (productStats[pName] || 0) + qty;
            
            if (!branchMap[branch]) branchMap[branch] = {};
            
            // ✅ ลอจิกใหม่สุดตึง: "ตัดจบเมื่อกดส่ง (Auto-Clear)"
            if (branchMap[branch][pName] === undefined) {
              // ถ้าสถานะยังเป็น Pending/Packed และของเหลือน้อย ให้โชว์กราฟเตือนบอส!
              if (status !== 'Success' && stock <= 20) {
                branchMap[branch][pName] = stock;
                if (allProducts.indexOf(pName) === -1) allProducts.push(pName);
              } else {
                // ถ้าบอสกดยืนยัน (Success) ไปแล้ว ให้ล็อคค่าเป็น 'cleared' กราฟจะได้ดึงออกไป
                branchMap[branch][pName] = 'cleared'; 
              }
            }
          }
        });
      }

      if (includeInTable) {
        historyData.push({ id: orderId, date: Utilities.formatDate(dateVal, "GMT+7", "dd/MM/yyyy HH:mm"), branch: branch, customer: row[1], phone: fixPhoneFormat(row[3]), items: row[5], status: status, packedTime: row[10] || "-", remark: row[6] || "" });
      }
    }

    // 🚀 ลอจิกปราบวิญญาณ: ลบชื่อสาขาที่เคลียร์ของเสร็จแล้วออกจากแกนกราฟ
    var branches = Object.keys(branchMap).filter(function(b) {
      // เช็คว่าสาขานี้ยังมีสินค้าที่เป็น "ตัวเลข" (ยังไม่เคลียร์) เหลืออยู่ไหม
      return Object.keys(branchMap[b]).some(function(p) {
        return typeof branchMap[b][p] === 'number'; 
      });
    });
    var colors = ['#A91D3A', '#f39c12', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c', '#e74c3c', '#34495e'];
    
    // 🧹 ทำความสะอาดข้อมูลก่อนส่งให้หน้าบ้านวาดกราฟ
    var datasets = allProducts.map(function(p, idx) {
      return { 
        label: p, 
        data: branches.map(function(b) { 
          // ตัวไหนที่บอสส่งของแล้ว ('cleared') ให้แปลงเป็น 0 (หน้าบ้านเราตั้งค่าไว้ว่า 0 จะหายไปเอง)
          return typeof branchMap[b][p] === 'number' ? branchMap[b][p] : 0; 
        }), 
        backgroundColor: colors[idx % colors.length] 
      };
    });

    historyData.sort(function(a,b){ return b.id.localeCompare(a.id); });
    var sortedP = Object.keys(productStats).sort(function(a,b){ return productStats[b]-productStats[a]; });
    
    return {
      history: historyData,
      charts: {
        pL: sortedP.slice(0,10), 
        pV: sortedP.slice(0,10).map(function(k){ return productStats[k]; }),
        bL: Object.keys(branchCounts), 
        bV: Object.keys(branchCounts).map(function(k){ return branchCounts[k]; }),
        sStacked: { labels: branches, datasets: datasets } 
      }
    };
  } catch (err) { 
    logSystemError("getManagerAnalytics", err.message); 
    return { history: [], charts: {} }; 
  }
}


// ----------------------------------------------------------------------------
// 📋 10. ระบบจัดการรายการเมนูและสินค้า (Menu Management Operations)
// ----------------------------------------------------------------------------

/**
 * ดึงรายการเมนูทั้งหมดออกมาแยกตามหมวดหมู่
 */
function getMenuManagement() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID_MASTER);
    var sheet = ss.getSheetByName("Setting");
    if (!sheet) return { grouped: {}, categories: [], categorySettings: {} };
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { grouped: {}, categories: [], categorySettings: {} };

    var cats = [];
    var grouped = {};
    var categorySettings = {}; // 👈 สร้างตัวแปรเก็บการตั้งค่าหน้า

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var c = row[0] ? row[0].toString().trim() : "อื่นๆ";
      
      // 🕵️‍♂️ อ่านค่าป้ายกำกับหน้า จากคอลัมน์ D (index 3)
      var dTag = row[3] ? row[3].toString().trim() : "both";
      
      if (cats.indexOf(c) === -1) {
        cats.push(c);
        categorySettings[c] = dTag; // 👈 เซฟค่าลงในหมวด
      }
      
      if (!grouped[c]) grouped[c] = [];
      if (row[1]) {
        grouped[c].push({ rowId: i + 1, name: row[1], status: row[2] || 'Active', cat: c });
      }
    }
    return { grouped: grouped, categories: cats, categorySettings: categorySettings };
  } catch (err) {
    logSystemError("getMenuManagement", err.message);
    return { grouped: {}, categories: [], categorySettings: {} };
  }
}

/**
 * ดึงรายการสินค้าเฉพาะสถานะ Active ส่งไปให้หน้า Client สั่งซื้อ (พร้อมระบบแคช)
 */
function getClientData() { 
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(CACHE_KEY_MENU);
    if (cached) return JSON.parse(cached);

    var ss = SpreadsheetApp.openById(SS_ID_MASTER);
    var sheet = ss.getSheetByName("Setting");
    var data = sheet.getDataRange().getValues();
    
    if (data.length < 2) return { categories: [], products: {}, categorySettings: {} };
    
    var categories = [];
    var products = {};
    var categorySettings = {}; // 👈 สร้างตัวแปรส่งไปหน้าร้าน

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if ((row[2] === 'Active' || row[2] === 'SoldOut') && row[1] !== '') {
        var cat = row[0] ? row[0].toString().trim() : "อื่นๆ";
        
        // 🕵️‍♂️ อ่านค่าป้ายกำกับหน้า
        var dTag = row[3] ? row[3].toString().trim() : "both"; 
        
        if (categories.indexOf(cat) === -1) {
          categories.push(cat);
          categorySettings[cat] = dTag; // 👈 เตรียมข้อมูล
        }
        
        if (!products[cat]) products[cat] = [];
        products[cat].push({ name: row[1], status: row[2] });
      } 
    }
    
    var result = { categories: categories, products: products, categorySettings: categorySettings };
    cache.put(CACHE_KEY_MENU, JSON.stringify(result), 300); 
    return result;
  } catch (err) {
    logSystemError("getClientData", err.message);
    return { categories: [], products: {}, categorySettings: {} };
  }
}


// ----------------------------------------------------------------------------
// ⚙️ 11. ระบบฐานข้อมูลสินค้าพื้นฐาน (CRUD Operations)
// ----------------------------------------------------------------------------

/**
 * อัปเดตข้อมูลสินค้าเดิม หรือเพิ่มสินค้าใหม่ถ้าไม่มี ID ระบุมา
 */
function updateProduct(id, name, cat, status) {
  
  try {
    var ss = SpreadsheetApp.openById(SS_ID_MASTER);
    var sheet = ss.getSheetByName("Setting");
    var row = parseInt(id);
    
    if (!isNaN(row) && row > 1) { 
      
      // 🛡️ God Mode Fix: ป้องกันหมวดหมู่หายเวลาย้ายสินค้าชิ้นสุดท้าย
      var oldData = sheet.getRange(row, 1, 1, 4).getValues()[0];
      var oldCat = oldData[0];
      var oldDisplay = oldData[3] || "both";
      
      sheet.getRange(row, 1, 1, 3).setValues([[cat, name, status]]); 
      
      if (oldCat !== cat && oldCat !== "") {
        var lastR = sheet.getLastRow();
        if (lastR > 1) {
          var allCats = sheet.getRange(2, 1, lastR - 1, 1).getValues().map(function(r) { return r[0]; });
          if (allCats.indexOf(oldCat) === -1) sheet.appendRow([oldCat, "", "Active", oldDisplay]);
        }
      }
    } else { 
      sheet.appendRow([cat, name, "Active", "both"]);
    }
    
    SpreadsheetApp.flush(); // 🚀 บังคับเขียนให้เสร็จ 100% ก่อนส่งค่ากลับ
    
    clearMenuCache();
    return getMenuManagement();
  } catch (err) {
    logSystemError("updateProduct", err.message, {id: id, name: name});
    return getMenuManagement();
  }
}

/**
 * ลบแถวสินค้าออกจากชีต Setting
 */
function deleteProduct(id) { 
  
  try {
    var ss = SpreadsheetApp.openById(SS_ID_MASTER);
    var sheet = ss.getSheetByName("Setting");
    var row = parseInt(id);
    
    if (!isNaN(row) && row > 1) {
      // 🛡️ God Mode Fix: ป้องกันหมวดหายตอนกดลบสินค้าชิ้นสุดท้ายทิ้ง
      var oldData = sheet.getRange(row, 1, 1, 4).getValues()[0];
      var oldCat = oldData[0];
      var oldDisplay = oldData[3] || "both";
      
      sheet.deleteRow(row);
      
      // ตรวจสอบว่ายังมีหมวดหมู่นี้เหลืออยู่ไหม หลังจากลบไปแล้ว
      var lastR = sheet.getLastRow();
      var categoryStillExists = false;
      if (lastR > 1) {
        var allCats = sheet.getRange(2, 1, lastR - 1, 1).getValues().map(function(r) { return r[0]; });
        categoryStillExists = (allCats.indexOf(oldCat) !== -1);
      }
      
      if (!categoryStillExists && oldCat !== "") {
        sheet.appendRow([oldCat, "", "Active", oldDisplay]);
      }
    }
    
    SpreadsheetApp.flush(); // 🚀 บังคับ Google ให้เขียนแถวใหม่ลงชีตให้เสร็จ 100% ก่อนทำงานต่อ
    
    SpreadsheetApp.flush(); // 🚀 บังคับเขียนหมวดหมู่ทิพย์ลงชีตให้เสร็จ
    clearMenuCache();
    return getMenuManagement();
  } catch (err) {
    logSystemError("deleteProduct", err.message, {id: id});
    return getMenuManagement();
  }
}

/**
 * เพิ่มหมวดหมู่สินค้าใหม่ (เพิ่มเพียงแถวเดียว)
 */
function addCategory(catName) { 
  
  if (!catName) {
    return getMenuManagement();
  }
  
  try {
    var ss = SpreadsheetApp.openById(SS_ID_MASTER);
    var sheet = ss.getSheetByName("Setting");
    
    sheet.appendRow([catName, "", "Active", "both"]);
    
    SpreadsheetApp.flush(); 
    clearMenuCache();
    
    return getMenuManagement(); 
  } catch (err) {
    logSystemError("addCategory", err.message, {catName: catName});
    return getMenuManagement();
  }
}


// ----------------------------------------------------------------------------
// 🚀 12. ระบบจัดการการลากวางขั้นสูง (Full Menu Order Reorder Protocol)
// ----------------------------------------------------------------------------

/**
 * รับอาร์เรย์รายการสินค้าทั้งหมดที่ถูกจัดเรียงใหม่จากหน้า Manager
 * แล้วทำการเขียนทับข้อมูลในชีต Setting ใหม่ทั้งหมดในครั้งเดียว (Batch Update)
 */
function updateFullMenuOrder(menuArray, token) {
  if (token !== TOKEN_ADMIN) {
    logSystemError("updateFullMenuOrder", "Unauthorized Access Attempt");
    throw new Error("Unauthorized Access to Reorder Protocol.");
  }
  if (!menuArray || menuArray.length === 0) return getMenuManagement();
  
  // 🚀 NITRO FIX: ป้องกันแอดมินสองคนกดเซฟเมนูพร้อมกันแล้วข้อมูลพัง (Menu Wipeout Risk)
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error("ระบบกำลังมีการอัปเดตเมนูจากเครื่องอื่น โปรดลองอีกครั้ง");

  try {
    var ss = SpreadsheetApp.openById(SS_ID_MASTER);
    var sheet = ss.getSheetByName("Setting");
    var lastRow = sheet.getLastRow();
    
    // 🧹 1. ล้างข้อมูลสินค้าเดิมทั้งหมด (ขยายเป็น 4 คอลัมน์ A-D)
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    var newValues = [];
    // 📝 2. จัดเตรียมข้อมูลใหม่
    for (var i = 0; i < menuArray.length; i++) {
      var item = menuArray[i];
      // 🕵️‍♂️ ดึงค่า display ที่หน้าบ้านส่งมา ถ้าไม่มีให้เป็น both
      var displayTag = item.display ? item.display : "both"; 
      newValues.push([item.cat, item.name, item.status, displayTag]);
    }
    
    // ⚡ 3. เขียนข้อมูลทับแบบ Batch ลง 4 คอลัมน์
    if (newValues.length > 0) {
      sheet.getRange(2, 1, newValues.length, 4).setValues(newValues);
    }
    
    SpreadsheetApp.flush();
    clearMenuCache();
    return getMenuManagement();
  } catch (err) {
    logSystemError("updateFullMenuOrder", err.message);
    throw new Error("Failed to reorder menu.");
  } finally {
    lock.releaseLock();
  }
}
/**
 * ============================================================================
 * 📨 13. ระบบจัดการคิวอีเมลหลังบ้าน (Email Queue Processor) - NEW!
 * ============================================================================
 * ฟังก์ชันนี้ต้องตั้งค่า Trigger ให้รันอัตโนมัติทุก 1 นาที (Time-driven)
 */
function processEmailQueue() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID_TRANSACTION);
    var queueSheet = ss.getSheetByName("Email_Queue");
    
    if (!queueSheet) return; // ถ้าไม่มีชีตให้จบการทำงาน
    
    var lastRow = queueSheet.getLastRow();
    if (lastRow < 2) return; // ถ้ามีแค่หัวตารางให้จบการทำงาน
    
    // ดึงข้อมูลทั้งหมดในชีต
    // 🛡️ ป้องกันคิวล้น: ดึงตรวจสอบแค่ 50 แถวล่าสุด (ไม่ดึงมาทั้งหมดให้ระบบค้าง)
    var startRow = Math.max(2, lastRow - 50);
    var numRows = lastRow - startRow + 1;
    var data = queueSheet.getRange(startRow, 1, numRows, 7).getValues();
    var sentCount = 0;
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowIndex = i + startRow; // อ้างอิงเลขแถวให้ตรงกับชีตจริง
      
      var status = row[6]; // คอลัมน์ G: Status
      
      // ถ้าสถานะยังเป็น Pending อยู่
      if (status === "Pending") {
        
        var orderId = row[1];       // คอลัมน์ B
        var adminEmail = row[2];    // คอลัมน์ C
        var customerEmail = row[3]; // คอลัมน์ D
        var subject = row[4];       // คอลัมน์ E
        var htmlBody = row[5];      // คอลัมน์ F
        
        try {
          // 📨 ส่งอีเมลหา Admin
          if (adminEmail && adminEmail.toString().indexOf("@") !== -1) {
            GmailApp.sendEmail(adminEmail, subject, "", {htmlBody: htmlBody});
          }
          
          // 📨 ส่งอีเมลหา ลูกค้า
          if (customerEmail && customerEmail.toString().indexOf("@") !== -1) {
            GmailApp.sendEmail(customerEmail, subject, "", {htmlBody: htmlBody});
          }
          
          // อัปเดตสถานะเป็น Sent ถ้ายิงสำเร็จ
          queueSheet.getRange(rowIndex, 7).setValue("Sent");
          sentCount++;
          
          // ป้องกันการส่งอีเมลถี่เกินไปใน 1 รอบ (Limit)
          if (sentCount >= 10) break;
          
        } catch (mailErr) {
          // ถ้าส่งอีเมลพัง (เช่น โควต้าเต็ม) ให้บันทึก Error แล้วเปลี่ยนสถานะเป็น Failed
          queueSheet.getRange(rowIndex, 7).setValue("Failed");
          logSystemError("processEmailQueue", "ส่งอีเมลไม่สำเร็จ: " + mailErr.message, orderId);
        }
        
      }
    }
  } catch (err) {
    logSystemError("processEmailQueue (Master)", err.message, "System Crash");
  }
}

// ----------------------------------------------------------------------------
// 🔥 14. ฟังก์ชันสำรองข้อมูลลง Google Sheets (Background Backup) - NEW!
// ----------------------------------------------------------------------------

/**
 * 🚀 รับข้อมูลจากหน้าเว็บ หลังจาก Firebase บันทึกสำเร็จแล้ว
 * ทำหน้าที่สร้างเลขออเดอร์จริง ORD-XXXX และบันทึกลงชีตเพื่อสำรองข้อมูล
 */
function submitOrderBackupOnly(f, externalOrderId) {
  var ssMaster = SpreadsheetApp.openById(SS_ID_MASTER);
  var ssTrans = SpreadsheetApp.openById(SS_ID_TRANSACTION);
  var orders = ssTrans.getSheetByName("Orders");
  var queue = ssTrans.getSheetByName("Email_Queue");
  var master = ssMaster.getSheetByName("MasterData");
  
  try {
    var timestamp = new Date();
    var orderId = "";
    
    var lock = LockService.getScriptLock();
    
    // 1. ถ้าหน้าบ้านส่งเลขมา (externalOrderId) ให้ใช้เลขนั้นเลย (Sync กับ Firebase)
    if (externalOrderId) {
      orderId = externalOrderId;
      // แอบไปอัปเดต C3ใน MasterData ให้ทันสมัยด้วย เผื่อ Admin มาสั่งเองทีหลัง
      var numOnly = parseInt(orderId.replace(/\D/g, ''));
      if (!isNaN(numOnly)) master.getRange("C3").setValue(numOnly);
    } else {
      // 2. ถ้าไม่มีเลขส่งมา (Legacy Mode) ให้สร้างเองจาก C3
      lock.waitLock(10000);
      var nextId = (master.getRange("C3").getValue() || 0) + 1;
      master.getRange("C3").setValue(nextId);
      orderId = "ORD-" + ("0000" + nextId).slice(-4);
    }
    
    // 2. เขียนข้อมูลลงชีต Orders (ใช้เลขบิลจริง)
    if (orders) {
      orders.insertRowBefore(2);
      orders.getRange(2, 1, 1, 11).setValues([[
        timestamp, f.name, f.email, f.phone, f.branch, 
        f.details, f.remark || "", "Pending", orderId, JSON.stringify(f), ""
      ]]);
    }
  
  SpreadsheetApp.flush();
  if (lock.hasLock()) lock.releaseLock(); // 🚀 GOD MODE FIX: คืนคิวอย่างปลอดภัย 100% ป้องกันบอทค้าง

    // 3. เตรียมตารางสินค้าและเนื้อหาอีเมล (กู้คืน Logic สวยงามดั้งเดิม)
    var itemsArray = f.details.split('\n');
    var rowsCust = "";
    var rowsAdmin = "";

    itemsArray.forEach(function(line) {
      if (line.trim() !== "") {
        var match = line.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
        if (match) {
          // Customer Row
          rowsCust += '<tr>';
          rowsCust += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #444; font-size: 14px;">' + match[1] + '</td>';
          rowsCust += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #A91D3A; text-align: center; font-weight: bold; font-size: 16px;">' + match[3] + '</td>';
          rowsCust += '</tr>';

          // Admin Row (With Stock)
          rowsAdmin += '<tr>';
          rowsAdmin += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #444; font-size: 14px;">' + match[1] + '</td>';
          rowsAdmin += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #888; text-align: center; font-size: 14px;">' + match[2] + '</td>';
          rowsAdmin += '<td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0; color: #A91D3A; text-align: center; font-weight: bold; font-size: 16px;">' + match[3] + '</td>';
          rowsAdmin += '</tr>';
        }
      }
    });

    var adminEmail = master.getRange("B4").getValue();
    var subject = "Order Confirmation: " + orderId + " - CoffeeToday";
    var dateStr = Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm");

    // ใช้ Global Email Template
    var bodyCust = buildGlobalEmailTemplate(f.name, orderId, dateStr, rowsCust, false, f.remark);
    var bodyAdmin = buildGlobalEmailTemplate(f.name, orderId, dateStr, rowsAdmin, true, f.remark);

    // 4. โยนเข้า Email Queue เพื่อให้ Tiger 🐯 ส่งต่อ
    if (queue) {
      var tsStr = Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm:ss");
      // คิว Admin
      queue.appendRow([tsStr, orderId, adminEmail, "", subject, bodyAdmin, "Pending"]);
      // คิวลูกค้า
      if(f.email) {
         queue.appendRow([tsStr, orderId, "", f.email, subject, bodyCust, "Pending"]);
      }
    }

    return orderId; // ส่งเลข ORD-XXXX กลับไปให้หน้าเว็บ
    
  } catch (err) {
    logSystemError("BackupOnlyError", err.message, f);
    return "Error";
  }
}

/**
 * ============================================================================
 * 🏁 End of Code.gs Main Architecture (v.2026 Nitro Speed)
 * ============================================================================
 */