/**
 * ==========================================================================
 * ⚙️ System Application Logic - Nitro Core Engine
 * เวอร์ชั่น: High-Precision Drag & Drop System + Branch Stock Update
 * ==========================================================================
 */

// --- 1. Global Variables & State Management ---
let bcObj = null; 
let pcObj = null; 
let scObj = null;
let lastAnalyticsData = null;
let allOrders = [];

// Pagination State
let pgNum = 1;
let pgLim = 8;
let apAllOrders = []; 
let apPgNum = 1;
let apPgLim = 5; 

// Menu Management State
let menuObj = {};
let editTargetId = null;
let currentCat = null;
let menuPgNum = 1;
let menuPgLim = 10; 

// System State
let pendingApproveId = "";
let currentDeepSearchQuery = ""; 
let syncIntervalId = null; // 🛡️ ป้องกัน Interval ซ้อนกัน

// Drag & Drop State
let dragCatIndex = null;
let dragItemIndex = null;
let isUnsaved = false;

const GAS_URL = "https://script.google.com/macros/s/AKfycbwiFMRKwx__Gj2tTPgOsd4qe8BXKxgv78P7gMEsL9PejXbHkjRHFrO8kyOXahCbtt81/exec";
const TOKEN_KEY = "coffee_today_admin_token";

/**
 * ==========================================================================
 * ⚙️ Utilities
 * ==========================================================================
 */

function showAlert(msg) {
  const msgEl = document.getElementById('systemAlertMsg');
  const modalEl = document.getElementById('systemAlertModal');
  if (msgEl && modalEl) {
    msgEl.innerText = msg;
    modalEl.style.display = 'flex';
  } else {
    console.error("Alert modal elements not found. Falling back to native alert.");
    alert(msg);
  }
}
window.showAlert = showAlert;

function showToast(message) {
  const toastElement = document.createElement('div');
  toastElement.innerText = message;

  const designStyle = "position:fixed; bottom:35px; left:50%; transform:translateX(-50%); background:rgba(34, 197, 94, 0.95); backdrop-filter:blur(5px); color:white; padding:18px 45px; border-radius:60px; z-index:10000; box-shadow:0 15px 35px rgba(0,0,0,0.2); font-family:'Prompt'; font-weight:700; font-size:15px; pointer-events:none; animation: toastSlideIn 3.2s forwards;";

  toastElement.style = designStyle;
  document.body.appendChild(toastElement);

  setTimeout(function() {
    toastElement.remove();
  }, 3200);
}

function closeM(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function formatPackedTime(packedTimeValue) {
  if (!packedTimeValue || packedTimeValue === "-" || packedTimeValue === "") {
    return "-";
  }
  
  if (typeof packedTimeValue === 'string' && packedTimeValue.includes('T') && packedTimeValue.includes('Z')) {
    const dateObject = new Date(packedTimeValue);
    const dd = ("0" + dateObject.getDate()).slice(-2);
    const mm = ("0" + (dateObject.getMonth() + 1)).slice(-2);
    const yyyy = dateObject.getFullYear() + 543;
    const hours = ("0" + dateObject.getHours()).slice(-2);
    const minutes = ("0" + dateObject.getMinutes()).slice(-2);
    return `${dd}/${mm}/${yyyy} ${hours}:${minutes}`;
  }
  
  return packedTimeValue;
}

// --- 2. System Initialization ---

document.addEventListener('DOMContentLoaded', function() {
  const savedToken = localStorage.getItem(TOKEN_KEY);
  
  if (savedToken) {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    initApp(savedToken);
    switchPage('dashboard'); // Default page
  } else {
    document.getElementById('passInput').focus();
  }
});

/** ✅ ฟังก์ชันล็อคอินเข้าสู่ระบบ */
function handleLogin() { 
  
  const lBtn = document.getElementById('loginBtn');
  const pInput = document.getElementById('passInput');
  
  if (pInput.value.length < 4) {
    return showAlert("กรุณากรอกรหัสผ่านให้ครบ 4 หลัก");
  }
  
  lBtn.disabled = true; 
  lBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> เข้าถึงระบบ...';

  fetch(GAS_URL + '?action=verifyLogin&pass=' + pInput.value)
    .then(function(res) { 
      return res.json(); 
    })
    .then(function(res) {
      
      if(res.status === 'success') {
        
        localStorage.setItem(TOKEN_KEY, res.token);
        document.getElementById('login-overlay').style.opacity = '0';
        
        setTimeout(function() {
          document.getElementById('login-overlay').style.display = 'none';
          document.getElementById('main-app').style.display = 'block';
          initApp(res.token);
          switchPage('dashboard');
        }, 400);
        
      } else {
        
        showAlert(res.message);
        lBtn.disabled = false;
        lBtn.innerHTML = '<i class="fas fa-key"></i> UNLOCK SYSTEM';
        pInput.value = '';
        pInput.focus();
        
      }
    })
    .catch(function(err) {
      console.error("Login Error:", err);
      showAlert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      lBtn.disabled = false;
      lBtn.innerHTML = '<i class="fas fa-key"></i> UNLOCK SYSTEM';
      
    });
}

function handleLogout() {
  
  if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
    localStorage.removeItem(TOKEN_KEY);
    location.reload();
  }
  
}

function initApp(token) { 
  loadDashboardData(false, token);
  loadApproveList(token);
  
  // 🛡️ Clear existing interval before starting new one (Memory Leak Protection)
  if (syncIntervalId) clearInterval(syncIntervalId);
  
  syncIntervalId = setInterval(function() {
    // 🛡️ เช็คว่ามีหน้าต่างเด้ง (Modal) เปิดค้างไว้ หรือกำลังลากเมนูอยู่หรือไม่
    const isBusy = ['receiptModal', 'confirmModal', 'cM', 'pM', 'delConfirmModal', 'editCatModal', 'systemAlertModal', 'managerConfirmModal'].some(function(id) {
      const el = document.getElementById(id);
      return el && el.style.display === 'flex';
    });

    if (isBusy || dragCatIndex !== null || dragItemIndex !== null || isUnsaved) {
      // console.log("System Sync Skipped: User is working or has unsaved changes."); // Commented out for production
      return; 
    }

    loadDashboardData(false, token, currentDeepSearchQuery);
    loadApproveList(token);
  }, 180000);
}

/** ✅ ฟังก์ชันย่อ/ขยาย Sidebar */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  if (sidebar && mainContent) {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
  }
}

/**
 * ✅ ฟังก์ชันสลับหน้า (Page Switcher)
 * จัดการการแสดงผล Section และ Active Menu
 */
function switchPage(pageName) {
  // 1. Hide all sections
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => {
    sec.style.display = 'none';
  });

  // 2. Show target section
  const target = document.getElementById(pageName + '-page');
  if (target) {
    target.style.display = 'block';
    
    // 🚀 Re-render logic to ensure data visibility
    if (pageName === 'dashboard' && lastAnalyticsData) {
      setTimeout(() => renderCharts(lastAnalyticsData), 50);
    } else if (pageName === 'orders') {
      renderTable();
    }
  }

  // 3. Update Sidebar Active State
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick').includes(pageName)) {
      item.classList.add('active');
    }
  });
}

/**
 * ✅ ฟังก์ชันดึงข้อมูล Dashboard (ประมวลผลกราฟด้วยเวลา Local)
 * 💡 อัปเดต: เพิ่มการแงะข้อมูลสต็อกตามสาขา
 */
function loadDashboardData(smooth, token, searchQ) { 
  
  const currentToken = token || localStorage.getItem(TOKEN_KEY);
  currentDeepSearchQuery = searchQ || "";

  if(smooth) {
    document.querySelectorAll('.card').forEach(function(c) { 
      c.classList.add('loading-pulse'); 
    });
  }
  
  const sDateValue = document.getElementById('sDate').value;
  const eDateValue = document.getElementById('eDate').value;
  const searchEncoded = encodeURIComponent(currentDeepSearchQuery);
  const v = new Date().getTime(); // 🚀 Cache Buster: สร้างเลขสุ่มตามเวลา

  const fetchUrl = GAS_URL + 
                   '?action=managerGetData' + 
                   '&token=' + currentToken + 
                   '&s=' + sDateValue + 
                   '&e=' + eDateValue + 
                   '&q=' + searchEncoded +
                   '&v=' + v; // 🛡️ แนบเลขเวลาไปหลอก Browser ไม่ให้จำ Cache

  fetch(fetchUrl)
    .then(function(res) { 
      return res.json(); 
    })
    .then(function(d) {
      
      if(d.status === 'success') {
        
        allOrders = d.analytics.history;
        renderTable();
        
        // ==========================================
        // การคำนวณกราฟแบบ Local Time & Branch Stock
        // ==========================================
        let finalChartData = d.analytics.charts;
        
        if (!sDateValue && !eDateValue && currentDeepSearchQuery === "") {
           
           let branchSum = {};
           let productSum = {};
           let stockSum = {}; // เก็บข้อมูล [สาขา] สินค้า
           
           // ตั้งเป้าเป็นเที่ยงคืนของเครื่องคุณเบลล์ปัจจุบัน
           let todayMidnight = new Date();
           todayMidnight.setHours(0, 0, 0, 0);
           
           allOrders.forEach(function(ord) {
              
              let dtStr = ord.date; 
              let dtParts = dtStr.split(' ')[0].split('/');
              let timeParts = dtStr.split(' ')[1].split(':');
              
              let orderDateObj = new Date(dtParts[2], dtParts[1]-1, dtParts[0], timeParts[0], timeParts[1]);
              
              // ถ้ายอดเกิดหลังเที่ยงคืนวันนี้ ให้นับเข้ากราฟวงกลมและแท่งขายดี
              if (orderDateObj >= todayMidnight) { 
                 
                 let bNameStr = ord.branch || "อื่นๆ";
                 branchSum[bNameStr] = (branchSum[bNameStr] || 0) + 1;
                 
                 let iStr = ord.items || "";
                 iStr.split('\n').forEach(function(lineStr) {
                    
                    // 🛡️ ระบบสกัดคำสุดฉลาด (V17 Smart Regex) ไม่กลัววงเล็บซ้อนหรือเว้นวรรคผิด
                    let itemMatch = lineStr.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
                    if (itemMatch) {
                       let nameOnlyStr = itemMatch[1].trim();
                       let stockStr = itemMatch[2];
                       let qtyStr = itemMatch[3];
                       
                       let qtyVal = parseFloat(qtyStr.match(/[\d.]+/)?.[0] || 0);
                       productSum[nameOnlyStr] = (productSum[nameOnlyStr] || 0) + qtyVal;
                       
                       let stockNumReg = stockStr.match(/[\d.]+/);
                       if (stockNumReg) {
                          let numVal = parseFloat(stockNumReg[0]);
                          let branchKeyStr = "[" + bNameStr + "] " + nameOnlyStr;
                          if(stockSum[branchKeyStr] === undefined) {
                             stockSum[branchKeyStr] = numVal;
                          }
                       }
                    }
                 });
              }
           });
           
           let topSorted = Object.entries(productSum).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 10);
           let stockSorted = Object.entries(stockSum).sort(function(a, b) { return a[1] - b[1]; });
           
           let finalBLabels = Object.keys(branchSum);
           let finalBVals = [];
           finalBLabels.forEach(function(k) { finalBVals.push(branchSum[k]); });
           
           finalChartData = {
             pL: topSorted.map(function(i) { return i[0]; }),
             pV: topSorted.map(function(i) { return i[1]; }),
             bL: finalBLabels,
             bV: finalBVals,
             sStacked: d.analytics.charts.sStacked // 👈 สั่งให้มันหยิบข้อมูลกราฟแยกสี (Nitro Stacked) จากหลังบ้านมาใช้งานด้วย!
           };
        }
        
        lastAnalyticsData = finalChartData;
        renderCharts(finalChartData); 
        // ==========================================

        renderMenuAccordion(d.menu); 
        
        const timeNow = new Date();
        document.getElementById('lastUpd').innerText = "Last Sync: " + timeNow.toLocaleTimeString();
        
        const btnDeepSearch = document.getElementById('deepSearchBtn');
        const btnClearSearch = document.getElementById('clearSearchBtn');
        
        if (currentDeepSearchQuery !== "") {
          
          btnDeepSearch.style.display = "none";
          btnClearSearch.style.display = "inline-flex";
          
        } else {
          
          btnDeepSearch.style.display = "inline-flex";
          btnClearSearch.style.display = "none";
          
        }

        if(btnDeepSearch) {
          btnDeepSearch.innerHTML = '<i class="fas fa-database"></i> ค้นหาลึกจากฐานข้อมูล';
          btnDeepSearch.disabled = false;
        }
        
      } else if (d.status === 'expired') {
        
        handleLogout();
        
      }
      
      document.querySelectorAll('.card').forEach(function(c) { 
        c.classList.remove('loading-pulse'); 
      });
      
    })
    .catch(function(err) {
      
      console.error("Dashboard Load Failure:", err);
      document.querySelectorAll('.card').forEach(function(c) { 
        c.classList.remove('loading-pulse'); 
      });
      
    });
}

function executeDeepSearch() {
  
  const queryValue = document.getElementById('orderSearch').value.trim();
  
  if (queryValue === "") {
    return showToast("กรุณาระบุคำค้นหา (เลขบิล, ชื่อ หรือเบอร์โทร)");
  }
  
  document.getElementById('sDate').value = "";
  document.getElementById('eDate').value = "";
  
  const btn = document.getElementById('deepSearchBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเจาะข้อมูล...';
  btn.disabled = true;
  
  loadDashboardData(true, null, queryValue);
}

function clearDeepSearch() {
  
  document.getElementById('orderSearch').value = "";
  loadDashboardData(true, null, ""); 
  
}

function applyDateFilter() {
  
  // When a filter is applied, ensure the deep search query is cleared from the UI
  document.getElementById('orderSearch').value = "";
  loadDashboardData(true, null, ""); 
  
}

/** ✅ ฟังก์ชันตั้งค่าวันที่แบบด่วน (วันนี้, 3 วัน, 7 วัน...) */
function setQuickDateFilter(days, element) {
  const sDateField = document.getElementById('sDate');
  const eDateField = document.getElementById('eDate');

  const today = new Date();
  const startDate = new Date();

  // Helper to format date to YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  eDateField.value = formatDate(today);

  if (days === 0) { // Special case for "Today"
    startDate.setDate(today.getDate());
  } else { // For "Last X days", we go back X-1 days from today
    startDate.setDate(today.getDate() - (days - 1));
  }
  
  sDateField.value = formatDate(startDate);

  // Update active button style
  clearQuickFilterActive();
  if (element) {
    element.classList.add('active');
  }

  // Automatically apply the filter
  applyDateFilter();
}

/** ✅ ฟังก์ชันเคลียร์ปุ่ม Quick Filter เมื่อมีการเลือกวันที่ด้วยตัวเอง */
function clearQuickFilterActive() {
  document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
}

/** ✅ ฟังก์ชันโหลดและแบ่งหน้า Approve Queue (V17 Master) */
function loadApproveList(token) {
  const currentToken = token || localStorage.getItem(TOKEN_KEY);
  const apiUrl = GAS_URL + '?action=getOrdersByStatus&status=Packed&token=' + currentToken;
  
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      apAllOrders = data || []; // เก็บข้อมูลดิบไว้ในตัวแปร
      renderApproveList(); // สั่งให้วาดหน้าจอ
    });
}

// ฟังก์ชันวาดรายการ (Render) พร้อมระบบตัดหน้า
function renderApproveList() {
  const approveCard = document.getElementById('approveCard');
  const approveList = document.getElementById('approveList');
  
  if(!apAllOrders || apAllOrders.length === 0) { 
    approveCard.style.display = 'none'; 
    return; 
  }
  
  approveCard.style.display = 'block';
  
  // คำนวณหน้ากระดาษ
  const total = apAllOrders.length;
  const maxPages = Math.ceil(total / apPgLim) || 1;
  if (apPgNum > maxPages) apPgNum = maxPages;
  
  const offset = (apPgNum - 1) * apPgLim;
  const pagedData = apAllOrders.slice(offset, offset + apPgLim);
  
  const listItems = pagedData.map(order => {
    let matched = allOrders.find(item => item.id === order.id);
    let pTimeFormatted = formatPackedTime((matched && matched.packedTime) ? matched.packedTime : "-");
    
    return `
      <div class="approve-item">
        <div>
          ${pTimeFormatted !== "-" ? `<div style="font-size:10px; color:#d97706; margin-bottom:5px; font-weight:600;"><i class="fas fa-box-open"></i> ${pTimeFormatted}</div>` : ''}
          <b style="color:var(--red); cursor:pointer; text-decoration:underline; font-size:15px;" onclick="viewOrderDetail('${order.id}')">${order.id}</b>
          <span style="font-size:13px; color:#333;"> - ${order.branch}</span><br>
          <small style="color:#666; font-size:11px;">${order.items.replace(/\n/g, ', ').substring(0, 40)}...</small>
        </div>
        <button class="btn-approve" style="padding: 8px 15px; font-size: 12px; border-radius: 12px;" onclick="approveOrder('${order.id}')">อนุมัติ</button>
      </div>`;
  });
  
  approveList.innerHTML = listItems.join('');
  document.getElementById('apPI').innerText = apPgNum + " / " + maxPages;
}

// ฟังก์ชันควบคุมปุ่ม (Limit, Next, Prev)
function apChangeLimit() { apPgNum = 1; apPgLim = parseInt(document.getElementById('apRowSel').value); renderApproveList(); }
function apNext() { const max = Math.ceil(apAllOrders.length / apPgLim); if(apPgNum < max) { apPgNum++; renderApproveList(); } }
function apPrev() { if(apPgNum > 1) { apPgNum--; renderApproveList(); } }

function approveOrder(id) {
  pendingApproveId = id;
  document.getElementById('confirmOrderId').innerText = id;
  document.getElementById('confirmModal').style.display = 'flex';
}

function executeApproveOrder() {
  
  closeM('confirmModal'); 
  
  if(!pendingApproveId) {
    return;
  }
  
  const token = localStorage.getItem(TOKEN_KEY);
  const updateUrl = GAS_URL + '?action=setOrderStatus&id=' + pendingApproveId + '&status=Success&token=' + token;
  
  fetch(updateUrl)
    .then(function(res) { 
      return res.json(); 
    })
    .then(function(res) {
      
      if(res.status === 'success') {
        
        loadApproveList(token); 
        loadDashboardData(false, token, currentDeepSearchQuery); 
        showToast("✅ ยืนยันการจัดส่งออเดอร์สำเร็จ!");
        
      } else {
        
        showAlert("ไม่สามารถยืนยันสถานะได้");
        
      }
    });
}

function renderTable() {
  
  const searchInput = document.getElementById('orderSearch');
  const queryLower = searchInput.value.trim().toLowerCase();
  
  let filteredOrders = allOrders.filter(function(order) {
    
    if(queryLower === "") {
      return true;
    }
    
    const fullId = order.id.toLowerCase();
    const numOnlyId = order.id.replace(/\D/g, ''); 
    const shortId = parseInt(numOnlyId).toString(); 
    
    const customerName = order.customer.toLowerCase();
    const branchName = order.branch ? order.branch.toLowerCase() : "";
    const phoneNum = order.phone ? order.phone.toString() : "";
    
    const isIdMatch = (fullId.indexOf(queryLower) !== -1);
    const isNumMatch = (numOnlyId.indexOf(queryLower) !== -1);
    const isShortIdMatch = (shortId === queryLower);
    const isCustomerMatch = (customerName.indexOf(queryLower) !== -1);
    const isPhoneMatch = (phoneNum.indexOf(queryLower) !== -1);
    const isBranchMatch = (branchName.indexOf(queryLower) !== -1);
    
    return isIdMatch || isNumMatch || isShortIdMatch || isCustomerMatch || isPhoneMatch || isBranchMatch;
  });

  const totalCount = filteredOrders.length;
  const offset = (pgNum - 1) * pgLim;
  const pagedData = filteredOrders.slice(offset, offset + pgLim);
  
  let rowsHtml = '';
  
  pagedData.forEach(function(item) {
    
    const isPackedStatus = (item.status === 'Packed');
    const isSuccessStatus = (item.status === 'Success');
    
    const pTimeFormatted = formatPackedTime(item.packedTime);
    let timeStampHtml = '';
    
    if ((isPackedStatus || isSuccessStatus) && pTimeFormatted !== "-") {
      timeStampHtml = '<div style="font-size:10px; color:#888; margin-top:8px; background:#f3f4f6; padding:5px 10px; border-radius:12px; display:inline-block; font-weight:600;">';
      timeStampHtml += '<i class="fas fa-box"></i> ' + pTimeFormatted;
      timeStampHtml += '</div>';
    }

    let badgeClass = 'os-pending';
    if (isSuccessStatus) badgeClass = 'os-success';
    else if (isPackedStatus) badgeClass = 'os-packed';

    rowsHtml += '<tr class="' + (isSuccessStatus ? 'row-ready' : '') + '">';
    rowsHtml += '<td>';
    rowsHtml += '<b style="color:var(--red); cursor:pointer; text-decoration:underline; font-size:12px;" onclick="viewOrderDetail(\'' + item.id + '\')">' + item.id + '</b>';
    rowsHtml += '<br>' + timeStampHtml;
    rowsHtml += '</td>';
    rowsHtml += '<td style="color:#666; font-size:11px;">' + item.date + '</td>';
    rowsHtml += '<td><b style="color:#333; font-size:12px;">' + item.branch + '</b></td>';
    rowsHtml += '<td style="font-weight:600; font-size:12px;">' + item.customer + '</td>';
    rowsHtml += '<td style="font-weight:700; color:var(--blue); font-size:12px;">' + (item.phone || '-') + '</td>';
    rowsHtml += '<td style="font-size:11px; color:#555; line-height:1.2;">' + (item.items || '').replace(/\n/g,'<br>') + '</td>';
    rowsHtml += '<td align="center">';
    rowsHtml += '<div style="display:flex; gap:8px; justify-content:center; align-items:center;">';
    
    // ส่วนที่ 1: โชว์ข้อความสถานะ
    rowsHtml += '<div style="text-align:center;">';
    rowsHtml += '<span class="order-status-badge ' + badgeClass + '">' + item.status + '</span>';
    rowsHtml += '</div>';

    // 🚀 ส่วนที่ 2: ปุ่ม God Mode (โชว์เฉพาะรายการที่ยังไม่ Success)
    if (item.status !== 'Success') {
      rowsHtml += '<button onclick="managerCloseOrder(\'' + item.id + '\')" class="action-btn-compact" style="background-color: var(--green); color: white; margin-left: 6px;"><i class="fas fa-check"></i> ปิดงาน</button>';
    }

    // ส่วนที่ 3: ปุ่มปริ้นเตอร์ (ของเดิม)
    // ส่วนที่ 3: ปุ่มปริ้นเตอร์ (ยังคงอยู่เหมือนเดิม)
    rowsHtml += '<button class="page-btn" style="width:28px; height:28px; min-width:28px; border-radius:8px; border:1px solid #EEE;" onclick="printOrder(\'' + encodeURIComponent(JSON.stringify(item)) + '\')">';
    rowsHtml += '<i class="fas fa-print" style="font-size:12px; color:#666;"></i>';
    rowsHtml += '</button>';
    
    rowsHtml += '</div>';
    rowsHtml += '</td>';
    rowsHtml += '</tr>';
  });
  
  const tableBody = document.getElementById('oB');
  if (totalCount === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" align="center" style="padding:100px; color:#BBBBBB; font-style:italic;">ไม่พบข้อมูลออเดอร์ที่คุณกำลังค้นหา...</td></tr>';
  } else {
    tableBody.innerHTML = rowsHtml;
  }
  
  const maxPages = Math.ceil(totalCount / pgLim) || 1;
  const indicator = document.getElementById('pI');
  indicator.innerText = pgNum + " / " + maxPages;
}

function viewOrderDetail(orderId) {
  
  const foundOrder = allOrders.find(function(order) { 
    return order.id === orderId; 
  });
  
  if(!foundOrder) {
    return;
  }
  
  currentViewingOrderId = orderId;

  let rowsList = '';
  const itemListArray = (foundOrder.items || '').split('\n');
  
  itemListArray.forEach(function(itemLine) {
    if(itemLine.trim() !== "") {
      const regexMatch = itemLine.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
      if(regexMatch) {
        rowsList += '<tr>';
        rowsList += '<td style="padding:15px 10px; border-bottom:1px solid #f9f9f9; color:#444;">' + regexMatch[1] + '</td>';
        rowsList += '<td align="center" style="padding:15px 10px; border-bottom:1px solid #f9f9f9; color:#888;">' + regexMatch[2] + '</td>';
        rowsList += '<td align="center" style="padding:15px 10px; border-bottom:1px solid #f9f9f9; font-weight:bold; color:var(--red);">' + regexMatch[3] + '</td>';
        rowsList += '</tr>';
      } else {
        rowsList += '<tr><td colspan="3" style="padding:15px 10px; border-bottom:1px solid #f9f9f9; color:#777; font-size:13px;">' + itemLine + '</td></tr>';
      }
    }
  });

  const formattedPTime = formatPackedTime(foundOrder.packedTime);
  let alertHtml = '';
  
  if ((foundOrder.status === 'Packed' || foundOrder.status === 'Success') && formattedPTime !== "-") {
    alertHtml += '<div style="grid-column: 1 / -1; background-color: #ecfdf5; border: 1.5px dashed #a7f3d0; padding: 15px; border-radius: 15px; text-align: center; margin-top: 10px;">';
    alertHtml += '<span style="font-size: 13px; color: #065f46; font-weight: 700;">';
    alertHtml += '<i class="fas fa-check-circle" style="margin-right:8px;"></i> บรรจุสินค้าเสร็จสมบูรณ์เมื่อ: ' + formattedPTime;
    alertHtml += '</span>';
    alertHtml += '</div>';
  }
  
  const modalContent = '<div class="receipt-info-grid">' +
      '<div><div class="receipt-label">Order ID</div><div class="receipt-value">' + foundOrder.id + '</div></div>' + 
      '<div style="text-align:right;"><div class="receipt-label">Order Date</div><div class="receipt-value">' + foundOrder.date + '</div></div>' +
      '<div><div class="receipt-label">Branch Store</div><div class="receipt-value">' + foundOrder.branch + '</div></div>' +
      '<div style="text-align:right;"><div class="receipt-label">Contact</div><div class="receipt-value">' + (foundOrder.phone || '-') + '</div></div>' +
      alertHtml +
    '</div>' +
    '<table class="receipt-table">' +
      '<thead><tr style="background:#F9FAFB;">' +
      '<th style="border-radius:10px 0 0 10px;">Product Name</th>' +
      '<th style="text-align:center;">In Stock</th>' +
      '<th style="text-align:center; border-radius:0 10px 10px 0;">Qty Ordered</th>' +
      '</tr></thead>' +
      '<tbody>' + rowsList + '</tbody>' +
    '</table>';
    
  const receiptContainer = document.getElementById('receiptBody');
  const printDateElement = document.getElementById('printDate');
  
  receiptContainer.innerHTML = modalContent;
  printDateElement.innerText = new Date().toLocaleString("th-TH");
  
  const modal = document.getElementById('receiptModal');
  modal.style.display = 'flex';
}

// 📄 1. แก้ไขปุ่มเขียว (downloadPDF) - ให้ปลดล็อกปุ่มและจัดหน้าตาตามไฟล์ตัวอย่าง
function downloadPDF() {
  const targetOrder = allOrders.find(function(order) { 
    return order.id === currentViewingOrderId; 
  });
  
  if(!targetOrder) return;

  const btnDownload = document.getElementById('dlBtn');
  const originalText = '<i class="fas fa-file-pdf"></i> ดาวน์โหลดเป็นไฟล์ PDF ';
  btnDownload.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> บีบอัดข้อมูล PDF...';
  btnDownload.disabled = true; // ล็อกปุ่มกันกดซ้อน

  // ✅ ส่วนปลดล็อกปุ่ม: ให้ปุ่มกลับมาใช้งานได้หลังจาก 3 วินาที
  setTimeout(function() {
    btnDownload.innerHTML = originalText;
    btnDownload.disabled = false;
  }, 3000);

  let rowsBuilder = '';
  (targetOrder.items || '').split('\n').forEach(function(rowLine) {
    if(rowLine.trim() !== "") {
      const parts = rowLine.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
      if(parts) {
        // จัดตาราง 3 คอลัมน์ (Product, Last Stock, Qty) ตามตัวอย่าง
        rowsBuilder += '<tr>';
        rowsBuilder += '<td style="padding:15px; border-bottom:1px solid #EEEEEE; font-size:14px;">' + parts[1] + '</td>';
        rowsBuilder += '<td align="center" style="padding:15px; border-bottom:1px solid #EEEEEE; font-size:14px; color:#666;">' + parts[2] + '</td>';
        rowsBuilder += '<td align="center" style="padding:15px; border-bottom:1px solid #EEEEEE; font-size:16px; font-weight:bold; color:#A91D3A;">' + parts[3] + '</td>';
        rowsBuilder += '</tr>';
      }
    }
  });

  const pdfWindow = window.open('', '', 'width=900,height=950');
  if(!pdfWindow) return showAlert("⚠️ กรุณาอนุญาต Pop-up เพื่อโหลดไฟล์ครับ");

  pdfWindow.document.write(`<!DOCTYPE html><html lang="th"><head><style>body{font-family:sans-serif;padding:40px;color:#333;}.main-container{padding:60px;border:2px solid #EEE;border-radius:30px;max-width:700px;margin:0 auto;}.title-main{text-align:center;color:#A91D3A;font-size:32px;font-weight:bold;}.grid-data{display:flex;justify-content:space-between;background:#F9F9F9;padding:25px;border-radius:20px;margin-bottom:30px;}.grid-col-label{font-size:10px;color:#999;text-transform:uppercase;font-weight:bold;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:15px;border-bottom:2px solid #333;font-size:14px;}</style><script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script></head><body>`);
  pdfWindow.document.write('<div id="p-area" class="main-container"><div class="title-main">COFFEETODAY</div><div style="text-align:center;color:#999;margin-bottom:40px;">ORDER CONFIRMATION RECEIPT</div>');
  pdfWindow.document.write('<div class="grid-data"><div><div class="grid-col-label">REFERENCE ID</div><div style="font-weight:bold;">'+targetOrder.id+'</div><div style="height:15px;"></div><div class="grid-col-label">BRANCH STORE</div><div style="font-weight:bold;">'+targetOrder.branch+'</div></div><div style="text-align:right;"><div class="grid-col-label">ISSUE DATE</div><div style="font-weight:bold;">'+targetOrder.date+'</div><div style="height:15px;"></div><div class="grid-col-label">CONTACT PHONE</div><div style="font-weight:bold;">'+(targetOrder.phone || '-')+'</div></div></div>');
  pdfWindow.document.write('<table><thead><tr><th>Product Item</th><th style="text-align:center;">Last Stock</th><th style="text-align:center;">Qty</th></tr></thead><tbody>'+rowsBuilder+'</tbody></table>');
  pdfWindow.document.write('<div style="text-align:center;margin-top:50px;font-size:11px;color:#AAA;border-top:1px dashed #DDD;padding-top:20px;"><p>เอกสารฉบับนี้ใช้สำหรับยืนยันการจัดเตรียมสินค้าของ CoffeeToday เท่านั้น</p></div></div>');
  pdfWindow.document.write('<script>window.onload=()=>{html2pdf().set({margin:10,filename:"Receipt.pdf",html2canvas:{scale:1.5},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).from(document.getElementById("p-area")).save().then(()=>{setTimeout(()=>window.close(),1500)});};<\/script></body></html>');
  pdfWindow.document.close();
}

// 🖨️ 2. แก้ไขปุ่มปริ้นขวาสุด (printOrder) - ให้กดแล้วเด้งใบสั่งงานแบบไม่มีช่องเช็ค

function renderCharts(analyticsData) {
  
  if(bcObj !== null) { bcObj.destroy(); }
  if(pcObj !== null) { pcObj.destroy(); }
  if(scObj !== null) { scObj.destroy(); }
  
  const ctxBar = document.getElementById('bC').getContext('2d');
  const ctxPie = document.getElementById('pC_Chart').getContext('2d');
  const ctxStock = document.getElementById('sC').getContext('2d');

  // 🛡️ Safety Guard: บังคับตัดข้อมูลเหลือแค่ 10 อันดับแรกเสมอ กันกราฟระเบิด
  const safePL = (analyticsData.pL || []).slice(0, 10);
  const safePV = (analyticsData.pV || []).slice(0, 10);

  // วาดกราฟขายดี 10 อันดับ
  bcObj = new Chart(ctxBar, { 
    type: 'bar', 
    data: { 
      labels: safePL, 
      datasets: [{ label: 'ปริมาณการสั่งซื้อ', data: safePV, backgroundColor: 'rgba(169, 29, 58, 0.9)', borderWidth: 0, borderRadius: 12, barPercentage: 0.55, categoryPercentage: 0.85 }] 
    }, 
    options: { maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, title: { display: true, text: 'ปริมาณสั่ง (ชิ้น/แก้ว)', font: { family: 'Prompt', size: 10 } } }, y: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 11 } } } } } 
  });

  // วาดกราฟวงกลม
  pcObj = new Chart(ctxPie, { 
    type: 'doughnut', 
    data: { 
      labels: analyticsData.bL, 
      datasets: [{ data: analyticsData.bV, backgroundColor: ['#2D3133', '#A91D3A', '#3498db', '#95a5a6', '#f1c40f', '#e67e22', '#16a085'], hoverOffset: 15, borderWidth: 4, borderColor: '#FFFFFF' }] 
    }, 
    options: { 
      responsive: true,
      maintainAspectRatio: false, 
      cutout: '82%', 
      plugins: { 
        legend: { 
          position: 'bottom', 
          labels: { 
            boxWidth: 12,
            font: { family: 'Sarabun', size: 10 } 
          } 
        } 
      } 
    } 
  });
  
  // 🚀 เวทมนตร์ลบขีด: เปลี่ยนค่า 0 ให้เป็นความว่างเปล่า (กราฟจะได้ไม่วาดเส้นกวนใจ)
  if (analyticsData.sStacked && analyticsData.sStacked.datasets) {
    analyticsData.sStacked.datasets.forEach(function(ds) {
      ds.data = ds.data.map(function(val) { return val === 0 ? null : val; });
    });
  }

  // 🚀 วาดกราฟวิเคราะห์สต็อก (ปรับขนาดให้สมส่วนตามสั่ง)
  // 🛡️ Safety Check: ป้องกันกรณีไม่มีข้อมูลส่งมา (กัน Error)
  const stackData = analyticsData.sStacked || { labels: [], datasets: [] };
  const branchesList = stackData.labels || [];
  
  const chartDiv = document.getElementById('sC').parentElement;
  chartDiv.style.height = Math.max(300, branchesList.length * 50) + "px"; // 👈 ลดระยะห่างลงเหลือ 50

  scObj = new Chart(ctxStock, {
    type: 'bar',
    data: stackData,
    options: {
      maintainAspectRatio: false,
      indexAxis: 'y', 
      barThickness: 28, // 👈 ลดความหนาแท่งจาก 40 เหลือ 28
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10, family: 'Prompt' } } },
        tooltip: {
          enabled: true,
          mode: 'nearest', 
          intersect: true, 
          backgroundColor: 'rgba(0,0,0,0.9)',
          padding: 15,
          callbacks: {
            label: function(context) {
              if (!context.raw || context.raw <= 0) return null; 
              let labelText = ' ' + context.dataset.label + ': ' + context.raw + ' ชิ้น';
              if (context.raw <= 5) labelText += ' (⚠️ ใกล้หมด!!)'; 
              return labelText;
            }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { color: '#F0F0F0' }, title: { display: true, text: 'สินค้าคงเหลือ (ชิ้น)', font: { size: 10 } } },
        y: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Prompt', size: 12, weight: 'bold' } } }
      }
    }
  });
}

/** * =========================================================================
 * 🚀 NEW FEATURE: Drag & Drop Configuration
 * =========================================================================
 */
  // 🚀 ระบบ V17: ช่องเลขใหญ่ขึ้น, ลบหายทันที, Modal สวยงาม
let delTarget = null; // เก็บเป้าหมายที่จะลบ
let menuSearchQuery = ""; // สมองกลค้นหาข้ามหมวด

// ✅ 1. จัดการค้นหา (พิมพ์ปุ๊บ ค้นหาปั๊บ)
function handleMenuSearch(val) {
  menuSearchQuery = val.trim().toLowerCase();
  renderMenuAccordion(menuObj);
}

// ✅ 2. ตอนคลิกหมวดหมู่ สั่งให้ล้างช่องค้นหาทิ้ง เพื่อกลับสู่โหมดปกติ
function selectCat(catName) {
  menuSearchQuery = "";
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) searchInput.value = "";
  menuPgNum = 1; // 🚀 รีเซ็ตเลขหน้าเมื่อเปลี่ยนหมวดหมู่
  currentCat = catName;
  renderMenuAccordion(menuObj);
}

// ✅ ตัวช่วยสร้างแถวสินค้า (ย่อขนาดให้เพรียวบางลง)
function buildProductRow(p, idx, catName, isDraggable) {
  const s = p.status || 'Active',
    sClass = (s === 'Active' ? 'status-active' : (s === 'SoldOut' ? 'status-soldout' : 'status-inactive')),
    sText = (s === 'Active' ? 'ปกติ' : (s === 'SoldOut' ? 'ของหมด' : 'ซ่อนอยู่'));
  const dragAttr = isDraggable ? `draggable="true" ondragstart="dragStartItem(event, ${idx})" ondragover="dragOverItem(event, this)" ondragleave="dragLeaveItem(this)" ondrop="dropItem(event, ${idx}, this)"` : '';
  const nameSafe = p.name.replace(/'/g, "\\'");

  return `
    <div class="cat-item" ${dragAttr} style="display:flex; justify-content:space-between; padding:12px 15px; border-bottom:1px solid #F8F9FA; align-items:center; cursor:${isDraggable ? 'grab' : 'default'}; transition: all 0.2s ease;">
      <div style="display:flex; align-items:center; gap:12px;">
        ${isDraggable 
          ? `<i class="fas fa-grip-lines" style="color:#DDD; font-size:13px;"></i><input type="number" value="${idx + 1}" onchange="moveItemManual(${idx}, this.value - 1)" style="width:40px; height:28px; border:1px solid var(--red); border-radius:6px; text-align:center; font-weight:bold; font-size:13px; color:var(--red); background:white;">` 
          : `<div style="background:#f0f0f0; padding:4px 8px; border-radius:6px; font-size:11px; color:#666; font-weight:bold; border:1px solid #e5e7eb;">${catName}</div>`}
        <div>
          <span style="font-weight:600; color:#333; font-size:15px;">${p.name}</span>
          <div style="margin-top:3px;"><span class="status-badge ${sClass}" style="padding:2px 8px; font-size:10px;">${sText}</span></div>
        </div>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <select class="status-select" style="padding:4px; font-size:12px; border-radius:6px;" onchange="toggleItem('${p.rowId}', '${nameSafe}', '${catName}', this.value)">
          <option value="Active" ${s === 'Active' ? 'selected' : ''}>ปกติ</option><option value="SoldOut" ${s === 'SoldOut' ? 'selected' : ''}>ของหมด</option><option value="Inactive" ${s === 'Inactive' ? 'selected' : ''}>ซ่อนไว้</option>
        </select>
        <i class="fas fa-edit" style="color:#CCC; cursor:pointer; font-size:16px;" onclick="openProdModal('${p.rowId}', '${nameSafe}', '${catName}')"></i>
        <i class="fas fa-trash-alt" style="color:#EEE; cursor:pointer; font-size:16px;" onclick="prepareDelete('prod', ${idx}, '${nameSafe}', '${catName}')"></i>
      </div>
    </div>`;
}

// ✅ 4. วาดหน้าจอ (แยกโหมดปกติ กับ โหมดค้นหา)
function renderMenuAccordion(menuData) {
  if (!menuData || !menuData.categories) return;
  menuObj = menuData;
  let chipsHtml = '',
    itemsHtml = '',
    selectHtml = '';

  // 🔍 โหมดค้นหา
  if (menuSearchQuery !== "") {
    document.getElementById('menuPagination').style.display = 'none'; // ซ่อน Paging
    chipsHtml = `<div class="chip active" style="background:var(--dark); color:white; border-color:var(--dark); width:100%; justify-content:center; cursor:default; grid-column: 1 / -1; font-size:14px;"><span style="text-align:center;"><i class="fas fa-search"></i> ผลการค้นหาสำหรับ: "${menuSearchQuery}"</span></div>`;
    menuData.categories.forEach(cat => {
      if (menuData.grouped[cat]) {
        menuData.grouped[cat].forEach((p, originalIdx) => {
          if (p.name.toLowerCase().includes(menuSearchQuery)) {
            itemsHtml += buildProductRow(p, originalIdx, cat, false); // Not draggable
          }
        });
      }
    });
    document.getElementById('catChips').innerHTML = chipsHtml;
    document.getElementById('menuItems').innerHTML = itemsHtml || '<div style="text-align:center; padding:30px; font-size:14px; color:#CCC;">ไม่พบสินค้า...</div>';
    return;
  }

  // 📦 โหมดปกติ
  if (!currentCat && menuData.categories.length > 0) currentCat = menuData.categories[0];
  
  menuData.categories.forEach((cat, idx) => {
    const isSelected = (cat === currentCat ? 'active' : '');
    selectHtml += `<option value="${cat}">${cat}</option>`;
    chipsHtml += `
      <div class="chip ${isSelected}" draggable="true" onclick="selectCat('${cat}')" ondragstart="dragStartCat(event, ${idx})" ondragover="dragOverCat(event, this)" ondragleave="dragLeaveCat(this)" ondrop="dropCat(event, ${idx}, this)" style="cursor:pointer; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-grip-vertical" style="color:#CCC; font-size:13px;"></i>
        <input type="number" value="${idx + 1}" onclick="event.stopPropagation()" onchange="moveCatManual(${idx}, this.value - 1)" style="width:40px; height:26px; padding:0; border:1px solid rgba(0,0,0,0.1); border-radius:6px; text-align:center; font-weight:bold; font-size:13px; background: white; color:var(--red);">
        <span style="flex:1; margin-left:5px; white-space:normal; word-break:break-word;" title="${cat}">${cat} (${menuData.grouped[cat] ? menuData.grouped[cat].length : 0})</span>
        <div style="display:flex; gap:10px; align-items:center;">
          <i class="fas fa-edit" style="font-size:14px; color:#CCC; cursor:pointer;" onclick="event.stopPropagation(); openEditCatModal('${cat}')"></i>
          <i class="fas fa-trash-alt" style="font-size:14px; color:#ffb3b3; cursor:pointer;" onclick="event.stopPropagation(); prepareDelete('cat', '${cat}')"></i>
        </div>
      </div>`;
  });

  const paginationEl = document.getElementById('menuPagination');
  const allItems = (currentCat && menuData.grouped[currentCat]) ? menuData.grouped[currentCat] : [];
  const totalCount = allItems.length;

  if (totalCount > 0) {
    const currentLimit = parseInt(document.getElementById('menuRowSel').value);
    if (menuPgLim !== currentLimit) menuPgLim = currentLimit;

    const maxPages = Math.ceil(totalCount / menuPgLim);
    if (menuPgNum > maxPages) menuPgNum = maxPages;
    const offset = (menuPgNum - 1) * menuPgLim;
    
    const pagedItems = allItems.slice(offset, offset + menuPgLim);

    pagedItems.forEach((p, relativeIdx) => {
      const absoluteIdx = offset + relativeIdx; // 🚀 คำนวณ Index ที่แท้จริงสำหรับ D&D
      itemsHtml += buildProductRow(p, absoluteIdx, currentCat, true);
    });

    // 🚀 แสดง/ซ่อน และอัปเดตตัวควบคุมหน้า
    paginationEl.style.display = 'flex';
    document.getElementById('menuPI').innerText = `${menuPgNum} / ${maxPages}`;

  } else {
    paginationEl.style.display = 'none';
  }
  
  document.getElementById('catChips').innerHTML = chipsHtml;
  // 🚀 อัปเดตเงื่อนไขการแสดงผลข้อความเริ่มต้น
  document.getElementById('menuItems').innerHTML = itemsHtml || (currentCat ? '<div style="text-align:center; padding:30px; font-size:14px; color:#CCC;">หมวดนี้ยังไม่มีสินค้า...</div>' : '<div style="text-align:center; padding:40px; color:#CCC;">กรุณาเลือกหมวดหมู่...</div>');
  document.getElementById('pCatSelect').innerHTML = selectHtml;
}

// ✅ 5. อัปเกรดระบบลบ ให้รู้ว่าลบจากหน้าค้นหา
function prepareDelete(type, target, name, specificCat) {
  if (!name) name = target;
  delTarget = { type, target, name, specificCat }; // เก็บชื่อหมวดที่เจอตอนค้นหาไว้ด้วย
  document.getElementById('delMsg').innerText = `คุณแน่ใจใช่ไหมว่าจะลบ "${name}"?\n(รายการจะหายจากหน้าจอทันที และจะถูกลบถาวรเมื่อกดบันทึกลำดับ)`;
  document.getElementById('confirmDelBtn').onclick = executeDelete;
  document.getElementById('delConfirmModal').style.display = 'flex';
}

function executeDelete() {
  if (delTarget.type === 'cat') {
    const idx = menuObj.categories.indexOf(delTarget.target);
    if (idx > -1) {
      menuObj.categories.splice(idx, 1);
      delete menuObj.grouped[delTarget.target];
      if (currentCat === delTarget.target) currentCat = menuObj.categories[0];
    }
  } else {
    const targetCat = delTarget.specificCat || currentCat; // ลบให้ถูกหมวดแม้จะอยู่หน้าค้นหา
    if (menuObj.grouped[targetCat]) {
       menuObj.grouped[targetCat].splice(delTarget.target, 1);
    }
  }

  closeM('delConfirmModal');
  renderMenuAccordion(menuObj);
  showToast("🗑️ ลบออกจากหน้าจอแล้ว (กดยืนยันปุ่มสีส้มเพื่อเซฟถาวร)");

  isUnsaved = true;
  const saveBtn = document.getElementById('saveOrderBtn');
  if (saveBtn) saveBtn.style.display = 'inline-flex';
}
function moveCatManual(from, to) {
  if (to < 0 || to >= menuObj.categories.length) return renderMenuAccordion(menuObj);
  const item = menuObj.categories.splice(from, 1)[0];
  menuObj.categories.splice(to, 0, item);
  renderMenuAccordion(menuObj);
}

function moveItemManual(from, to) {
  const items = menuObj.grouped[currentCat];
  if (to < 0 || to >= items.length) return renderMenuAccordion(menuObj);
  const item = items.splice(from, 1)[0];
  items.splice(to, 0, item);
  renderMenuAccordion(menuObj);
}

// ✅ 🚀 ระบบลากวางอัจฉริยะ (Nitro Smooth Version)
function dragStartCat(e, i) { 
  dragCatIndex = i; 
  e.dataTransfer.effectAllowed = 'move'; 
  e.target.classList.add('dragging'); 
}

function dragOverCat(e, el) { 
  e.preventDefault(); 
  e.dataTransfer.dropEffect = 'move'; 
  if(el && el.classList) el.classList.add('drag-over'); 
}

function dragLeaveCat(el) { 
  if(el && el.classList) el.classList.remove('drag-over'); 
}

function dropCat(e, target, el) { 
  e.preventDefault(); 
  if(el && el.classList) el.classList.remove('drag-over'); 
  if (dragCatIndex !== null && dragCatIndex !== target) {
    moveCatManual(dragCatIndex, target);
  }
  dragCatIndex = null;
}

function dragStartItem(e, i) { dragItemIndex = i; e.dataTransfer.effectAllowed = 'move'; e.target.classList.add('dragging'); }

// ✅ ฟังก์ชันเมื่อลากไอเท็มมาทับ และเมื่อลากออก
function dragOverItem(e, el) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (el && el.classList) el.classList.add('drag-over');
}

function dragLeaveItem(el) {
  if (el && el.classList) el.classList.remove('drag-over');
}

function dropItem(e, target, el) {
  e.preventDefault();
  if (el && el.classList) el.classList.remove('drag-over');
  if (dragItemIndex !== null && dragItemIndex !== target) {
    moveItemManual(dragItemIndex, target);
  }
  dragItemIndex = null;
}
// ---------------------------------------------------------
// ✅ saveMenuOrder (เวอร์ชันสมบูรณ์: ส่งป้ายกำกับหน้าสั่งไปบันทึก)
// ---------------------------------------------------------
function saveMenuOrder() {
  const adminToken = localStorage.getItem(TOKEN_KEY);
  const saveBtn = document.getElementById('saveOrderBtn');

  if (!menuObj || !menuObj.categories) return showAlert("ไม่พบข้อมูลเมนูในระบบ");
  
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปเดตฐานข้อมูล...';
  saveBtn.disabled = true;

  let masterPayload = [];

  menuObj.categories.forEach(function(category) {
      const itemsInCat = menuObj.grouped[category];
      // 🕵️‍♂️ ดึงป้ายกำกับมา ถ้าไม่มีให้เป็น both (แสดงทั้งคู่) เป็นค่าเริ่มต้น
      const displayTag = (menuObj.categorySettings && menuObj.categorySettings[category]) ? menuObj.categorySettings[category] : 'both';

      if (itemsInCat && itemsInCat.length > 0) {
          itemsInCat.forEach(function(product) {
              masterPayload.push({
                  cat: category,
                  name: product.name,
                  status: product.status,
                  display: displayTag // ✅ ส่งป้ายกำกับไปด้วย
              });
          });
      } else {
          // กรณีหมวดหมู่ว่างเปล่า
          masterPayload.push({ 
              cat: category, 
              name: "", 
              status: "Active", 
              display: displayTag 
          });
      }
  });

  const postPayload = {
    action: 'reorderMenu',
    token: adminToken,
    menuArray: masterPayload
  };

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(postPayload)
  })
  .then(res => res.json())
  .then(d => {
    if (d.status === 'success') {
      isUnsaved = false; // ปลดล็อคระบบ
      renderMenuAccordion(d.data); 
      showToast("✅ บันทึกลำดับและตั้งค่าหน้าสั่งสำเร็จ!");
    } else {
      showAlert("เกิดข้อผิดพลาด: " + d.message);
    }
    saveBtn.innerHTML = '<i class="fas fa-save"></i> บันทึกลำดับ';
    saveBtn.disabled = false;
  })
  .catch(err => {
    showAlert("เครือข่ายมีปัญหา ไม่สามารถบันทึกข้อมูลได้");
    saveBtn.innerHTML = '<i class="fas fa-save"></i> บันทึกลำดับ';
    saveBtn.disabled = false;
  });
}

function toggleItem(rowId, productName, category, newStatus) { 
  const adminToken = localStorage.getItem(TOKEN_KEY);
  
  // ส่งสถานะใหม่ (Active/SoldOut/Inactive) ไปที่เซิร์ฟเวอร์
  const updateUrl = GAS_URL + 
                    '?action=updateProduct' + 
                    '&id=' + rowId + 
                    '&name=' + encodeURIComponent(productName) + 
                    '&cat=' + encodeURIComponent(category) + 
                    '&status=' + newStatus + 
                    '&token=' + adminToken;

  fetch(updateUrl)
    .then(res => res.json())
    .then(newMenuData => { 
      renderMenuAccordion(newMenuData); 
      showToast("✅ อัปเดตสถานะเป็น: " + newStatus); 
    });
}

function openCatModal() { 
  document.getElementById('cN').value = ''; 
  document.getElementById('cM').style.display = 'flex'; 
  setTimeout(function() { 
    document.getElementById('cN').focus(); 
  }, 300);
}

function saveCat() { 
  
  const categoryNameInput = document.getElementById('cN');
  const finalName = categoryNameInput.value.trim(); 
  
  if (finalName === "") {
    showAlert("กรุณาระบุชื่อหมวดหมู่ที่ต้องการสร้าง");
    return;
  }
  
  closeM('cM'); 
  const adminToken = localStorage.getItem(TOKEN_KEY);
  const saveUrl = GAS_URL + '?action=addCategory&catName=' + encodeURIComponent(finalName) + '&token=' + adminToken;
  
  fetch(saveUrl)
    .then(function(res) { return res.json(); })
    .then(function(newMenuData) { 
      renderMenuAccordion(newMenuData); 
      showToast("✅ สร้างหมวดหมู่ '" + finalName + "' เรียบร้อยแล้ว!"); 
    });
}

function openProdModal(rowId, name, cat) { 
  editTargetId = (rowId || null); 
  document.getElementById('pN').value = (name || ''); 
  document.getElementById('pCatSelect').value = (cat || (menuObj.categories ? menuObj.categories[0] : '')); 
  const modal = document.getElementById('pM');
  modal.style.display = 'flex'; 
  setTimeout(function() { document.getElementById('pN').focus(); }, 300);
}

function saveP() { 
  const pNameInput = document.getElementById('pN'), cNameSelect = document.getElementById('pCatSelect');
  const finalPName = pNameInput.value.trim(), finalCName = cNameSelect.value; 
  if (finalPName === "") return showAlert("กรุณาระบุชื่อสินค้าและขนาดบรรจุให้ชัดเจน");
  closeM('pM'); 
  const adminToken = localStorage.getItem(TOKEN_KEY);
  const updateUrl = `${GAS_URL}?action=updateProduct&id=${editTargetId}&name=${encodeURIComponent(finalPName)}&cat=${encodeURIComponent(finalCName)}&status=Active&token=${adminToken}`;
  fetch(updateUrl)
    .then(function(res) { return res.json(); })
    .then(function(newMenuData) { 
      renderMenuAccordion(newMenuData); 
      showToast("✅ บันทึกข้อมูลสินค้าสำเร็จแล้ว!"); 
    });
}

function changeLimit() { 
  
  const limitSelect = document.getElementById('rowSel');
  pgNum = 1; 
  pgLim = parseInt(limitSelect.value); 
  
  renderTable(); 
}

function next() { 
  
  const totalCount = allOrders.length;
  const totalPages = Math.ceil(totalCount / pgLim);
  
  if(pgNum < totalPages) { 
    pgNum = pgNum + 1; 
    renderTable(); 
  } 
}

// ---------------------------------------------------------
  // ส่วนท้ายของระบบ (ซ่อมแซมโดย Gemini Nitro Engine)
  // ---------------------------------------------------------
  function prev() { 
    if(pgNum > 1) { 
      pgNum = pgNum - 1; 
      renderTable(); 
    } 
  }

  // 🚀 ฟังก์ชันควบคุมหน้าสำหรับรายการสินค้า (Menu Items)
  function menuChangeLimit() { 
    menuPgNum = 1; 
    menuPgLim = parseInt(document.getElementById('menuRowSel').value); 
    renderMenuAccordion(menuObj); 
  }

  function menuNext() { 
    if (!currentCat || !menuObj.grouped[currentCat]) return;
    const totalCount = menuObj.grouped[currentCat].length;
    const totalPages = Math.ceil(totalCount / menuPgLim);
    if(menuPgNum < totalPages) { 
      menuPgNum++; 
      renderMenuAccordion(menuObj); 
    } 
  }

  function menuPrev() { 
    if(menuPgNum > 1) { 
      menuPgNum--; 
      renderMenuAccordion(menuObj); 
    } 
  }

 // 📄 ระบบรายงาน (V14 Portrait Header) - แนวตั้ง, เลขหน้าอยู่มุมขวาบน, หัวตารางครบ, โหลดแล้วปิดเอง
  function downloadSummaryReport() {
    if (!allOrders || allOrders.length === 0) return showAlert("ไม่มีข้อมูลออเดอร์ในระบบ");
    const btn = document.getElementById('summaryBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังจัดหน้ากระดาษแนวตั้ง...';
    btn.disabled = true;

    const sDate = document.getElementById('sDate').value || "เริ่มต้น", eDate = document.getElementById('eDate').value || "ปัจจุบัน";
    
    // 🚀 ความจุสำหรับ "แนวตั้ง" (Portrait) จะใส่แถวได้มากกว่าแนวนอน
    const PAGE_HEIGHT_LIMIT = 50; 
    let pagesHtml = '', currentWeight = 0, pageNum = 1, orderBuffer = [];

    // ฟังก์ชันสร้างหน้ากระดาษทีละแผ่นแบบเป๊ะๆ (1 Block = 1 หน้า A4)
    function buildPhysicalPage(ordersInPage) {
      let tableRows = '';
      ordersInPage.forEach(o => {
        const itemLines = o.items ? o.items.split('\n').filter(l => l.trim() !== '') : ['-'];
        itemLines.forEach((line, idx) => {
          const isFirst = (idx === 0);
          tableRows += `<tr style="page-break-inside:avoid; ${isFirst ? 'border-top: 1px solid #CCC;' : ''}">
            <td style="padding:6px 5px; color:#A91D3A; font-weight:bold; vertical-align:top; width:12%; word-wrap:break-word;">${isFirst ? o.id : ''}</td>
            <td style="padding:6px 5px; color:#666; font-size:10px; vertical-align:top; width:14%; word-wrap:break-word;">${isFirst ? o.date : ''}</td>
            <td style="padding:6px 5px; font-weight:bold; vertical-align:top; width:14%; word-wrap:break-word;">${isFirst ? o.branch : ''}</td>
            <td style="padding:6px 5px; vertical-align:top; width:15%; word-wrap:break-word;">${isFirst ? o.customer : ''}</td>
            <td style="padding:6px 5px; border-top:${isFirst ? 'none' : '1px dashed #EEE'}; vertical-align:top; line-height:1.4; width:35%; word-wrap:break-word;">${line}</td>
            <td style="padding:6px 5px; font-weight:bold; text-align:center; vertical-align:top; font-size:10px; width:10%; word-wrap:break-word;">${isFirst ? o.status : ''}</td>
          </tr>`;
        });
      });

      // ✅ ส่วนหัวกระดาษ (Header) เอาเลขหน้ามาไว้ข้างบนตามที่บอสต้องการ
      let headerHtml = '';
      if (pageNum === 1) {
          headerHtml = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
              <div style="width:50px;"></div>
              <div style="flex:1; text-align:center;">
                <h2 style="margin:0; color:#A91D3A; font-family:'Prompt', sans-serif;">COFFEETODAY - Branch Summary</h2>
                <p style="font-size:13px; color:#666; margin:5px 0;">ช่วงวันที่: ${sDate} - ${eDate}</p>
              </div>
              <div style="width:50px; text-align:right; font-size:12px; color:#666; font-weight:bold; font-family:'Sarabun', sans-serif;">หน้า ${pageNum}</div>
            </div>
          `;
      } else {
          // หัวกระดาษหน้า 2 เป็นต้นไป (ย่อขนาดลง แต่ยังคงเลขหน้าไว้ขวาบน)
          headerHtml = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px; padding-bottom:5px;">
              <div style="font-size:14px; font-weight:bold; color:#A91D3A; font-family:'Prompt', sans-serif;">COFFEETODAY - Summary</div>
              <div style="font-size:12px; color:#666; font-weight:bold; font-family:'Sarabun', sans-serif;">หน้า ${pageNum}</div>
            </div>
          `;
      }

      // สร้างแผ่นกระดาษแนวตั้ง A4 
      pagesHtml += `
        <div class="physical-page" style="position:relative; height:275mm; padding: 10mm; page-break-after:always; box-sizing: border-box; background:#FFF;">
          ${headerHtml}
          <table style="width:100%; border-collapse:collapse; font-size:11px; font-family:'Sarabun', sans-serif; table-layout:fixed;">
            <thead style="background:#F8F9FA;">
              <tr>
                <th style="padding:10px 5px; border-bottom:2px solid #A91D3A; text-align:left; width:12%;">ID</th>
                <th style="padding:10px 5px; border-bottom:2px solid #A91D3A; text-align:left; width:14%;">Date</th>
                <th style="padding:10px 5px; border-bottom:2px solid #A91D3A; text-align:left; width:14%;">Branch</th>
                <th style="padding:10px 5px; border-bottom:2px solid #A91D3A; text-align:left; width:15%;">Customer</th>
                <th style="padding:10px 5px; border-bottom:2px solid #A91D3A; text-align:left; width:35%;">Items</th>
                <th style="padding:10px 5px; border-bottom:2px solid #A91D3A; text-align:center; width:10%;">Status</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>`;
      pageNum++;
    }

    // กระบวนการยัดออเดอร์ลงหน้ากระดาษ
    allOrders.forEach((o, index) => {
      const itemLines = o.items ? o.items.split('\n').filter(l => l.trim() !== '') : ['-'];
      const oWeight = 1.5 + itemLines.length;

      if (currentWeight + oWeight > PAGE_HEIGHT_LIMIT && orderBuffer.length > 0) {
        buildPhysicalPage(orderBuffer);
        orderBuffer = [];
        currentWeight = 0;
      }
      orderBuffer.push(o);
      currentWeight += oWeight;

      if (index === allOrders.length - 1) {
        buildPhysicalPage(orderBuffer);
      }
    });

    const html = `<html><head><meta charset="UTF-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&family=Prompt:wght@600&display=swap');
      body { margin:0; padding:0; background:#FFF; }
      .physical-page { box-sizing: border-box; }
      table { table-layout: fixed; width: 100%; }
      th, td { word-wrap: break-word; }
    </style><script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script></head>
    <body><div id="pdf-content">${pagesHtml}</div><script>window.onload=()=>{
      html2pdf().set({ 
        margin:0, 
        filename:'Branch_Summary_Report.pdf', 
        html2canvas:{scale:1.5, useCORS:true}, 
        jsPDF:{unit:'mm', format:'a4', orientation:'portrait'}, 
        pagebreak:{mode:'css'} 
      }).from(document.getElementById('pdf-content')).save().then(()=>setTimeout(()=>window.close(), 1200));
    };<\/script></body></html>`;

    const win = window.open('', '', 'width=1000,height=900');
    if (!win) { btn.disabled = false; btn.innerHTML = originalText; return showAlert("กรุณาเปิด Pop-up"); }
    win.document.write(html); win.document.close();
    
    // ✅ ปลดล็อกปุ่มให้กดซ้ำได้ทันที
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
  }

  // 🖨️ ฟังก์ชันปริ้น - ปรับหน้าตาให้เหมือน PDF ตัวอย่าง (ไม่มีช่องเช็ค) [cite: 91, 102, 103, 104]
  function printOrder(encodedData) {
    try {
      const item = JSON.parse(decodeURIComponent(encodedData));
      const win = window.open('', '', 'width=850,height=950');
      if(!win) return showAlert("⚠️ กรุณาอนุญาต Pop-up เพื่อทำการปริ้นครับ");

      let rowsHtml = '';
      (item.items || '').split('\n').forEach(line => {
        const match = line.match(/(.+?)\s*\(\s*เหลือ:\s*(.*?)\s*,\s*สั่ง:\s*(.*?)\s*\)/);
        if(match) rowsHtml += '<tr><td style="padding:15px 10px; border-bottom:1px solid #f9f9f9;">'+match[1]+'</td><td align="center" style="padding:15px 10px; border-bottom:1px solid #f9f9f9;">'+match[2]+'</td><td align="center" style="padding:15px 10px; border-bottom:1px solid #f9f9f9; font-weight:bold; color:#A91D3A;">'+match[3]+'</td></tr>';
      });

      // 🚀 ดึงเวลาแพ็คและสร้างกล่องข้อความ
      const pTimeFormatted = formatPackedTime(item.packedTime);
      let packedTag = '';
      if (item.status === 'Packed' || item.status === 'Success') {
        packedTag = '<div style="background:#f0fdf4; border:1px dashed #10b981; padding:15px; border-radius:12px; text-align:center; color:#065f46; margin-bottom:20px;">' +
          '<div style="font-weight:bold; font-size:16px;">✓ ยืนยันการจัดเตรียมพัสดุเรียบร้อย</div>' +
          (pTimeFormatted !== "-" ? '<div style="font-size:13px; margin-top:5px; font-weight:normal;">(เวลาบรรจุ: ' + pTimeFormatted + ')</div>' : '') +
        '</div>';
      }

      win.document.write('<html><head><style>body{font-family:sans-serif;padding:50px;color:#333;}.label{font-size:10px;color:#999;text-transform:uppercase;}.val{font-size:16px;font-weight:bold;margin-bottom:20px;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:12px;background:#F9FAFB;border-bottom:2px solid #333;font-size:13px;}</style></head><body>');
      win.document.write('<div style="text-align:center;margin-bottom:30px;"><h2 style="margin:0;color:#A91D3A;letter-spacing:2px;">COFFEETODAY</h2><div style="font-size:12px;color:#999;">ORDER CONFIRMATION RECEIPT</div></div>');
      win.document.write(packedTag);
      win.document.write('<div style="display:flex;justify-content:space-between;background:#F9F9F9;padding:20px;border-radius:15px;margin-bottom:30px;">');
      win.document.write('<div><div class="label">REFERENCE ID</div><div class="val">' + item.id + '</div><div class="label">BRANCH STORE</div><div class="val">' + item.branch + '</div></div>');
      win.document.write('<div style="text-align:right;"><div class="label">ISSUE DATE</div><div class="val">' + item.date + '</div><div class="label">CONTACT PHONE</div><div class="val">' + (item.phone || '-') + '</div></div>');
      win.document.write('</div>');
      win.document.write('<table><thead><tr><th>Product Item</th><th style="text-align:center;">Last Stock</th><th style="text-align:center;">Qty</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>');
      win.document.write('<div style="text-align:center;margin-top:50px;font-size:11px;color:#AAA;border-top:1px dashed #DDD;padding-top:20px;"><p>เอกสารฉบับนี้ใช้สำหรับยืนยันการจัดเตรียมสินค้าของ CoffeeToday เท่านั้น</p><p>Generated at: ' + new Date().toLocaleString("th-TH") + '</p></div>');
      win.document.write('<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script></body></html>');
      win.document.close();
    } catch (e) { console.error(e); }
  }

// =========================================================================
  // 🚀 NEW FEATURE: God Mode (Manager Approve & Auto-Clear)
  // =========================================================================
  let currentManagerOrderId = ""; 

  function managerCloseOrder(orderId) {
    currentManagerOrderId = orderId;
    document.getElementById('managerConfirmId').innerText = orderId;
    document.getElementById('managerConfirmModal').style.display = 'flex';
  }

  // 🚀 ฟังก์ชันทำงานจริง (เวอร์ชันแก้บั๊กหมุนค้าง)
  // 🚀 ฟังก์ชันทำงานจริง (เวอร์ชันสะอาด 100%)
  function executeManagerClose() {
    const btn = document.getElementById('managerExecBtn');
    const token = localStorage.getItem(TOKEN_KEY); 
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสั่งปิดงาน...';
    btn.disabled = true;

    const finalUrl = `${GAS_URL}?action=setOrderStatus&id=${currentManagerOrderId}&status=Success&token=${token}`;
    
    fetch(finalUrl)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          // ✅ ใช้ Toast แทน Alert เพื่อความหล่อเท่ (หายลาวแน่นอน!)
          showToast('✅ ปิดงานสำเร็จ! เคลียร์กราฟเรียบร้อย'); 
          setTimeout(() => location.reload(), 1500); 
        } else {
          showAlert('❌ สิทธิ์ไม่พอ หรือเกิดข้อผิดพลาด');
          btn.innerHTML = 'ยืนยันปิดงานเลย!';
          btn.disabled = false;
        }
      })
      .catch(err => {
        showAlert('❌ ระบบขัดข้อง: ' + err);
        btn.innerHTML = 'ยืนยันปิดงานเลย!';
        btn.disabled = false;
      });
  }
  // 🚀 ระบบเปลี่ยนชื่อหมวดหมู่แบบรักษาออเดอร์เดิม
let oldCatName = ""; 

// ✅ ฟังก์ชันเปิด Modal แก้ไขหมวดหมู่ (เวอร์ชันคลีน)
window.openEditCatModal = (catName) => {
    oldCatName = catName;
    document.getElementById('editCatInput').value = catName;

    const currentSetting = (menuObj.categorySettings && menuObj.categorySettings[catName]) 
                           ? menuObj.categorySettings[catName] 
                           : 'both';

    // 🎯 สั่งให้ปุ่ม Radio ที่มี value ตรงกับค่าเดิม "ถูกเลือก" (Checked)
    const radioToSelect = document.querySelector(`input[name="catDisplay"][value="${currentSetting}"]`);
    if (radioToSelect) {
        radioToSelect.checked = true;
    }

    document.getElementById('editCatModal').style.display = 'flex';
    setTimeout(() => document.getElementById('editCatInput').focus(), 300);
};

// ✅ ชุดอัปเกรด: บันทึกค่าปุ่ม Radio (แก้บั๊กชื่อฟังก์ชันแล้ว)
window.executeEditCategory = () => {
    const newName = document.getElementById('editCatInput').value.trim();
    const displayType = document.querySelector('input[name="catDisplay"]:checked').value;
    
    // กันแค่กรณีลบชื่อจนว่างเปล่า
    if (newName === "") return closeM('editCatModal'); 

    // ถ้ามีการเปลี่ยนชื่อใหม่ ต้องเช็คว่าชื่อซ้ำไหม
    if (newName !== oldCatName && menuObj.categories.includes(newName)) {
        showAlert("❌ ชื่อหมวดหมู่นี้มีอยู่แล้ว!");
        return;
    }

    const idx = menuObj.categories.indexOf(oldCatName);
    if (idx > -1) {
        menuObj.categories[idx] = newName;
        
        // ถ้ายกเครื่องเปลี่ยนชื่อใหม่ ให้ย้ายข้อมูลสินค้าตามไปด้วย
        if (newName !== oldCatName) {
            menuObj.grouped[newName] = menuObj.grouped[oldCatName];
            delete menuObj.grouped[oldCatName];
        }
        
        // 🛡️ หัวใจหลัก: บันทึกการตั้งค่าหน้าสั่งเสมอ!
        if (!menuObj.categorySettings) menuObj.categorySettings = {};
        menuObj.categorySettings[newName] = displayType;

        // ลบป้ายกำกับชื่อเก่าทิ้ง (กรณีเปลี่ยนชื่อ)
        if (newName !== oldCatName && menuObj.categorySettings[oldCatName]) {
            delete menuObj.categorySettings[oldCatName];
        }

        renderMenuAccordion(menuObj); // 👈 แก้ให้เรียกฟังก์ชันถูกต้องแล้ว!
        closeM('editCatModal');
        isUnsaved = true;
        
        // 🚨 แจ้งเตือนให้บอสกดยืนยันปุ่มสีส้ม
        const saveBtn = document.getElementById('saveOrderBtn'); // 👈 แก้ ID ปุ่มถูกต้องแล้ว!
        if (saveBtn) saveBtn.style.display = 'inline-flex';
    }
};