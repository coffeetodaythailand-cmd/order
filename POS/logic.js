// 🧠 CoffeeToday Logic Center v1.5 - Firebase, Cloudinary, Pagination
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚙️ Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAaKskbSw-NCmmyyrMxIVZhqA_T0QaQIhk",
    authDomain: "coffeetoday-pos.firebaseapp.com",
    projectId: "coffeetoday-pos",
    storageBucket: "coffeetoday-pos.firebasestorage.app",
    appId: "1:567842594200:web:b936ba9babe24447d55fed"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ☁️ Cloudinary Config
const CLOUD_NAME = "dv0eez2as";
const UPLOAD_PRESET = "ml_default";

// GLOBAL STATE
let allProducts = [];
let allCategories = [];
let allAddonGroups = []; // เก็บข้อมูลกลุ่มตัวเลือก
let currentFilteredProducts = [];
let editingProductId = null;
let originalImageUrl = "";
let currentImgPos = { x: 50, y: 50 }; // เก็บตำแหน่งรูปภาพ
let currentPage = 1;
const itemsPerPage = 20; // 🚀 บอสสั่ง: แสดง20 เมนูต่อ1หน้า
let selectedProductIds = new Set(); // เก็บ ID สินค้าที่ถูกเลือก

// 🎨 Inject Premium Button Styles (Pastel Theme)
const style = document.createElement('style');
style.innerHTML = `
    /* ✨ Glowing Bubble Buttons */
    .btn-bubble {
        border: none; border-radius: 50px; padding: 8px 16px;
        font-weight: 600; font-size: 13px; cursor: pointer;
        transition: all 0.3s ease; display: inline-flex;
        align-items: center; justify-content: center; gap: 6px;
        text-decoration: none; line-height: 1.2;
    }
    .btn-bubble:hover {
        transform: translateY(-2px);
    }
    .btn-bubble.icon-only {
        padding: 8px; width: 36px; height: 36px; font-size: 16px;
    }

    /* Main Action Button (Pastel Green) */
    .btn-bubble.primary {
        background: var(--active-cyan);
        color: white;
        box-shadow: 0 5px 15px -3px rgba(168, 213, 186, 0.5), 0 0 20px 0 rgba(168, 213, 186, 0.3);
    }
    .btn-bubble.primary:hover {
        box-shadow: 0 8px 20px -3px rgba(168, 213, 186, 0.6), 0 0 30px 2px rgba(168, 213, 186, 0.4);
    }

    /* Edit Button (Pastel Blue) */
    .btn-bubble.edit {
        background: #e3f2fd; color: #1565c0;
        box-shadow: 0 0 12px 0 rgba(227, 242, 253, 0.9);
    }
    .btn-bubble.edit:hover {
        box-shadow: 0 0 20px 2px rgba(227, 242, 253, 1);
    }

    /* Delete Button (Pastel Pink) */
    .btn-bubble.delete {
        background: #FADADD;
        color: #c62828;
        box-shadow: 0 0 12px 0 rgba(250, 218, 221, 0.9);
    }
    .btn-bubble.delete:hover {
        box-shadow: 0 0 20px 2px rgba(250, 218, 221, 1);
    }

    /* Outline/Cancel Button */
    .btn-bubble.outline { background: transparent; color: #888; border: 1px solid #ddd; }
    .btn-bubble.outline:hover { background: #f9f9f9; border-color: #ccc; }

    /* For larger buttons outside tables */
    .btn-bubble.large { padding: 12px 25px; font-size: 15px; }

    /* Card Styles */
    .addon-card { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #eee; transition: 0.2s; }
    .addon-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); border-color: #A8D5BA; }
    .cat-card { background: #FDFBF7; padding: 15px; border-radius: 15px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.02); transition: all 0.2s ease; }
    .cat-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
    .cat-info { flex: 1; } .cat-name { font-weight: 600; color: #555; font-size: 15px; display: block; }
    .cat-count { font-size: 12px; color: #888; } .cat-actions { display: flex; gap: 8px; }
`;
document.head.appendChild(style);

// ---------------------------------------------------------
// 🛠️ UI FUNCTIONS (Global Window Access)
// ---------------------------------------------------------

window.navTo = (id, el) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    const target = document.getElementById(`page-${id}`);
    if(target) target.classList.add('active');
    
    if(el && el.classList) { el.classList.add('active'); }
};

// 🔔 Custom Modal Logic
window.showConfirm = (title, message, onConfirm) => {
    const modal = document.getElementById('customModal');
    const modalBox = modal.querySelector('.modal-box');
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const iconEl = document.getElementById('modalIcon');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    // Reset Style
    modalBox.className = 'modal-box warning';
    iconEl.innerText = '⚠️';
    
    titleEl.innerText = title;
    descEl.innerText = message;
    
    // Show both buttons for Confirm
    confirmBtn.style.display = 'inline-flex';
    cancelBtn.style.display = 'inline-flex';
    confirmBtn.innerText = 'ยืนยัน';
    
    modal.classList.add('show');

    // Reset Event Listeners
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    
    newConfirm.addEventListener('click', () => {
        modal.classList.remove('show');
        onConfirm();
    });

    cancelBtn.onclick = () => modal.classList.remove('show');
};

// 🔔 Custom Alert Logic (Success/Error)
window.showAlert = (title, message, type = 'success') => {
    const modal = document.getElementById('customModal');
    const modalBox = modal.querySelector('.modal-box');
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const iconEl = document.getElementById('modalIcon');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modalBox.className = `modal-box ${type}`;
    iconEl.innerText = type === 'success' ? '✅' : '❌';
    titleEl.innerText = title;
    descEl.innerText = message;

    // Hide Cancel, Show OK
    cancelBtn.style.display = 'none';
    confirmBtn.style.display = 'inline-flex';
    confirmBtn.innerText = 'ตกลง';

    modal.classList.add('show');
    
    // Simple close on click
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    newConfirm.addEventListener('click', () => modal.classList.remove('show'));
};

// 🎲 Auto SKU Generator
window.autoSku = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    document.getElementById('pSku').value = `SKU-${random}`;
};

// 🖼️ Image Drag & Position Logic
function injectImgControls() {
    const img = document.getElementById('imgPrev');
    if(!img || img.dataset.dragInit) return;

    img.style.cursor = 'grab';
    img.dataset.dragInit = "true";
    
    let isDragging = false;
    let startX, startY;
    let startPos = { x: 50, y: 50 };

    const onDrag = (e) => {
        if (!isDragging) return;
        if(e.cancelable) e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        const sensitivity = 0.4; 
        let newX = startPos.x - (dx * sensitivity);
        let newY = startPos.y - (dy * sensitivity);

        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        currentImgPos = { x: newX, y: newY };
        img.style.objectPosition = `${newX}% ${newY}%`;
    };

    const stopDrag = () => {
        isDragging = false;
        img.style.cursor = 'grab';
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', onDrag);
        window.removeEventListener('touchend', stopDrag);
    };

    const startDrag = (e) => {
        if(e.cancelable) e.preventDefault();
        isDragging = true;
        img.style.cursor = 'grabbing';
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        startPos = { ...currentImgPos };
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', onDrag, { passive: false });
        window.addEventListener('touchend', stopDrag);
    };

    img.addEventListener('mousedown', startDrag);
    img.addEventListener('touchstart', startDrag, { passive: false });
}

// 🖼️ Image Preview Handler
window.handleImg = (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (r) => { 
            const img = document.getElementById('imgPrev');
            img.src = r.target.result; 
            img.style.display = 'block'; 
            document.getElementById('upLabel').style.display = 'none';
            
            // Reset Position
            currentImgPos = { x: 50, y: 50 };
            img.style.objectPosition = "50% 50%";
            injectImgControls();
        };
        reader.readAsDataURL(file);
    }
};

//  Search Functionality (ระบบค้นหา Real-time)
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        currentFilteredProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(term) || 
            (p.category && p.category.toLowerCase().includes(term))
        );
        currentPage = 1; // รีเซ็ตไปหน้า 1 เสมอเมื่อค้นหาใหม่
        renderProductPage(currentFilteredProducts, currentPage);
        setupPagination(currentFilteredProducts, itemsPerPage);
    });
}

// 📂 Category Management Functions
window.addCategory = async () => {
    const input = document.getElementById('catNameInput');
    if(!input || !input.value.trim()) return showAlert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อหมวดหมู่ครับบอส!", "error");
    
    try {
        await addDoc(collection(db, "categories"), {
            name: input.value.trim(),
            createdAt: Date.now()
        });
        input.value = ''; // เคลียร์ช่องกรอก
        showAlert("สำเร็จ", "เพิ่มหมวดหมู่เรียบร้อยแล้วครับ");
    } catch(e) { console.error("Error adding category: ", e); showAlert("ผิดพลาด", "เพิ่มหมวดหมู่ไม่สำเร็จครับ", "error"); }
};

window.deleteCategory = async (id) => {
    showConfirm("ลบหมวดหมู่?", "หากลบแล้วจะไม่สามารถกู้คืนได้ ยืนยันการลบหรือไม่?", async () => {
        try {
            await deleteDoc(doc(db, "categories", id));
        } catch(e) { console.error("Error deleting category: ", e); showAlert("ผิดพลาด", "ลบไม่สำเร็จครับ", "error"); }
    });
};

window.editCategory = (id) => {
    const item = document.getElementById(`cat-item-${id}`);
    const infoDiv = item.querySelector('.cat-info');
    const actionsDiv = item.querySelector('.cat-actions');
    const currentName = infoDiv.querySelector('.cat-name').innerText;

    // Store original content to restore on cancel
    item.dataset.originalInfo = infoDiv.innerHTML;
    item.dataset.originalActions = actionsDiv.innerHTML;

    infoDiv.innerHTML = `<input type="text" id="edit-cat-${id}" class="search-bar" value="${currentName}" style="flex:1;">`;
    actionsDiv.innerHTML = `
        <button class="btn-bubble outline icon-only" onclick="cancelEditCategory('${id}')" title="ยกเลิก">✕</button>
        <button class="btn-bubble primary icon-only" onclick="saveCategoryEdit('${id}')" title="บันทึก">✓</button>
    `;
    
    // Auto Focus & Keyboard Support
    const input = document.getElementById(`edit-cat-${id}`);
    setTimeout(() => input.focus(), 50);
    input.addEventListener('keyup', (e) => {
        if(e.key === 'Enter') saveCategoryEdit(id);
        if(e.key === 'Escape') cancelEditCategory(id);
    });
};

window.saveCategoryEdit = async (id) => {
    const item = document.getElementById(`cat-item-${id}`);
    const newName = item.querySelector('input').value.trim();
    if (newName) await updateDoc(doc(db, "categories", id), { name: newName });
};

window.cancelEditCategory = (id) => {
    const item = document.getElementById(`cat-item-${id}`);
    item.querySelector('.cat-info').innerHTML = item.dataset.originalInfo;
    item.querySelector('.cat-actions').innerHTML = item.dataset.originalActions;
};

// 🛠️ Product Management Functions (Create/Edit/Delete)
window.openCreateProduct = () => {
    editingProductId = null;
    originalImageUrl = "";
    currentImgPos = { x: 50, y: 50 };
    
    document.getElementById('pName').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pSku').value = '';
    document.getElementById('catSelect').value = '';
    document.getElementById('fileIn').value = '';
    
    const img = document.getElementById('imgPrev');
    img.style.display = 'none';
    img.src = '';
    document.getElementById('upLabel').style.display = 'block';
    
    document.getElementById('formTitle').innerText = "สร้างเมนูใหม่";
    document.getElementById('btnSave').innerText = "บันทึกข้อมูล";
    document.getElementById('btnSave').disabled = false;

    renderAddonOptionsInProductForm([]); // โหลดรายการแอดออน
    window.navTo('menu-create');
};

window.saveProduct = async () => {
    const name = document.getElementById('pName').value;
    const price = document.getElementById('pPrice').value;
    const sku = document.getElementById('pSku').value;
    const cat = document.getElementById('catSelect').value;
    const file = document.getElementById('fileIn').files[0];
    const btn = document.getElementById('btnSave');

    // Collect selected addons
    // Logic: ถ้ามีการติ๊ก Item ใดๆ ในกลุ่มนั้น ให้ถือว่าเลือกกลุ่มนั้นแล้ว (เพื่อความง่ายในการจัดการข้อมูล)
    const selectedGroupIds = new Set();
    document.querySelectorAll('.addon-item-cb:checked').forEach(cb => {
        selectedGroupIds.add(cb.dataset.groupId);
    });
    const selectedAddons = Array.from(selectedGroupIds);

    if(!name || (!file && !editingProductId)) return showAlert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อสินค้าและอัปโหลดรูปภาพด้วยครับ", "error");
    
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;

    try {
        let finalImageUrl = originalImageUrl;
        if(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
            const imgData = await res.json();
            if(!imgData.secure_url) throw new Error("Cloudinary Error");
            finalImageUrl = imgData.secure_url;
        }

        const productData = { 
            name, 
            price: Number(price), 
            sku,
            category: cat, 
            imageUrl: finalImageUrl,
            imagePos: currentImgPos,
            addons: selectedAddons
        };

        if(editingProductId) {
            await updateDoc(doc(db, "products", editingProductId), productData);
            showAlert("สำเร็จ", "แก้ไขข้อมูลสินค้าเรียบร้อยแล้วครับ");
        } else {
            productData.createdAt = Date.now();
            productData.status = "Active";
            await addDoc(collection(db, "products"), productData);
            showAlert("สำเร็จ", "สร้างเมนูใหม่เรียบร้อยแล้วครับ");
        }
        window.navTo('menu-list');
        location.reload(); // รีโหลดเพื่อเคลียร์ค่า
    } catch(e) { console.error(e); showAlert("ผิดพลาด", "บันทึกไม่สำเร็จ: " + e.message, "error"); btn.disabled = false; btn.innerText = "บันทึกข้อมูล"; }
};

window.editProduct = async (id) => {
    try {
        const docSnap = await getDoc(doc(db, "products", id));
        if(!docSnap.exists()) return;
        const data = docSnap.data();
        
        editingProductId = id;
        originalImageUrl = data.imageUrl;
        currentImgPos = data.imagePos || { x: 50, y: 50 };
        
        document.getElementById('pName').value = data.name;
        document.getElementById('pPrice').value = data.price;
        document.getElementById('pSku').value = data.sku || '';
        document.getElementById('catSelect').value = data.category;
        
        const img = document.getElementById('imgPrev');
        img.src = data.imageUrl;
        img.style.display = 'block';
        img.style.objectPosition = `${currentImgPos.x}% ${currentImgPos.y}%`;
        document.getElementById('upLabel').style.display = 'none';
        
        injectImgControls(); // Enable drag

        // Render Addons & Check selected
        renderAddonOptionsInProductForm(data.addons || []);

        document.getElementById('formTitle').innerText = "แก้ไขเมนู";
        document.getElementById('btnSave').innerText = "บันทึกการแก้ไข";
        
        window.navTo('menu-create');
    } catch(e) { showAlert("ผิดพลาด", "โหลดข้อมูลไม่สำเร็จ", "error"); }
};

// Helper: Render Addon Checkboxes in Product Form
function renderAddonOptionsInProductForm(selectedIds = []) {
    const container = document.getElementById('productAddonSelection');
    if(!container) return;
    container.innerHTML = '';
    
    if(allAddonGroups.length === 0) {
        container.innerHTML = '<span style="color:#aaa; font-size:13px;">ยังไม่มีกลุ่มตัวเลือก (ไปสร้างที่เมนู "กลุ่มตัวเลือก" ก่อนนะครับ)</span>';
        return;
    }

    allAddonGroups.forEach(g => {
        // เช็คว่ากลุ่มนี้ถูกเลือกไว้หรือไม่
        const isGroupSelected = selectedIds.includes(g.id);
        const reqText = g.isRequired ? '<span style="color:#c62828; font-size:11px; margin-left:5px;">(บังคับ)</span>' : '';
        
        let itemsHtml = '';
        if(g.items && g.items.length > 0) {
            g.items.forEach((item, idx) => {
                // ถ้ากลุ่มถูกเลือก ให้ติ๊กทุกอันไปก่อน (หรือตาม Logic ที่ต้องการ)
                // ในที่นี้เพื่อให้ User เห็นว่าเลือกอะไร ให้ติ๊กถ้ากลุ่มถูกเลือก
                const isItemChecked = isGroupSelected ? 'checked' : '';
                itemsHtml += `
                    <label class="addon-choice ${isItemChecked ? 'selected' : ''}" onclick="this.classList.toggle('selected', this.querySelector('input').checked)">
                        <input type="checkbox" class="addon-item-cb" data-group-id="${g.id}" ${isItemChecked}>
                        <span style="font-size:13px; color:#555;">${item.name}</span>
                    </label>
                `;
            });
        } else {
            itemsHtml = '<div style="font-size:12px; color:#aaa; padding:5px;">ไม่มีรายการย่อย</div>';
        }

        container.innerHTML += `
            <div class="addon-group-box">
                <div class="addon-group-header">
                    <span>${g.name} ${reqText}</span>
                    <span style="font-size:11px; font-weight:400; color:#888;">เลือกรายการด้านล่าง</span>
                </div>
                <div class="addon-item-list">
                    ${itemsHtml}
                </div>
            </div>
        `;
    });
}

window.deleteProd = async (id) => {
    showConfirm("ลบสินค้า?", "คุณต้องการลบสินค้านี้ออกจากระบบใช่หรือไม่?", async () => {
        await deleteDoc(doc(db, "products", id));
    });
};

// 🧩 Add-on Group Management Functions
let editingAddonGroupId = null;

window.openAddonForm = (groupId = null) => {
    const form = document.getElementById('addonFormContainer');
    const title = document.getElementById('addonFormTitle');
    const nameInput = document.getElementById('addonGroupName');
    const requiredInput = document.getElementById('addonRequired');
    const itemsContainer = document.getElementById('addonItemsContainer');
    const linkContainer = document.getElementById('addonProductLinkContainer');
    
    form.style.display = 'block';
    itemsContainer.innerHTML = '';
    linkContainer.innerHTML = '';
    
    // Render Product Checkboxes (เรียงตามชื่อ)
    const sortedProducts = [...allProducts].sort((a,b) => a.name.localeCompare(b.name));
    sortedProducts.forEach(p => {
        linkContainer.innerHTML += `
            <div style="display:flex; align-items:center; padding:8px; border-bottom:1px solid #f5f5f5;">
                <input type="checkbox" class="product-link-cb" value="${p.id}" id="link-${p.id}" style="margin-right:10px; transform:scale(1.2);">
                <label for="link-${p.id}" style="cursor:pointer; flex:1; font-size:14px;">${p.name} <span style="color:#aaa; font-size:12px;">(${p.category})</span></label>
            </div>
        `;
    });

    if(groupId) {
        // Edit Mode
        editingAddonGroupId = groupId;
        title.innerText = "แก้ไขกลุ่มตัวเลือก";
        const group = allAddonGroups.find(g => g.id === groupId);
        if(group) {
            nameInput.value = group.name;
            requiredInput.checked = group.isRequired || false;
            
            // Load Items
            if(group.items) {
                group.items.forEach(item => addAddonItemRow(item));
            }
            
            // Check Linked Products
            if(group.linkedProductIds) {
                group.linkedProductIds.forEach(pid => {
                    const cb = document.getElementById(`link-${pid}`);
                    if(cb) cb.checked = true;
                });
            }
        }
    } else {
        // Create Mode
        editingAddonGroupId = null;
        title.innerText = "สร้างกลุ่มตัวเลือกใหม่";
        nameInput.value = '';
        requiredInput.checked = false;
        addAddonItemRow(); // Add one empty row
    }
};

window.closeAddonForm = () => {
    document.getElementById('addonFormContainer').style.display = 'none';
};

window.addAddonItemRow = (data = null) => {
    const container = document.getElementById('addonItemsContainer');
    const div = document.createElement('div');
    div.className = 'addon-item-row';
    div.innerHTML = `
        <input type="text" class="item-name" placeholder="ชื่อตัวเลือก (เช่น หวานน้อย, เพิ่มวิปครีม)" title="ระบุชื่อตัวเลือกย่อย" value="${data ? data.name : ''}" style="flex:2; padding:8px; border:1px solid #ddd; border-radius:6px;">
        <input type="number" class="item-price" placeholder="+ราคา (0=ฟรี)" title="ราคาที่บวกเพิ่ม (ใส่ 0 หากฟรี)" value="${data ? data.price : 0}" style="width:120px; padding:8px; border:1px solid #ddd; border-radius:6px;">
        <label class="switch" style="transform:scale(0.8); margin:0;" title="เปิด/ปิด การใช้งานตัวเลือกนี้">
            <input type="checkbox" class="item-active" ${!data || data.active ? 'checked' : ''}>
            <span class="slider"></span>
        </label>
        <button onclick="this.parentElement.remove()" title="ลบตัวเลือกนี้" style="background:#ffebee; color:red; border:none; width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">×</button>
    `;
    container.appendChild(div);
};

window.saveAddonGroup = async () => {
    const name = document.getElementById('addonGroupName').value.trim();
    const isRequired = document.getElementById('addonRequired').checked;
    if(!name) return showAlert("ข้อมูลไม่ครบ", "กรุณาใส่ชื่อกลุ่มตัวเลือกครับ", "error");

    // Collect Items
    const items = [];
    document.querySelectorAll('.addon-item-row').forEach(row => {
        const itemName = row.querySelector('.item-name').value.trim();
        const itemPrice = row.querySelector('.item-price').value;
        const itemActive = row.querySelector('.item-active').checked;
        if(itemName) {
            items.push({ name: itemName, price: Number(itemPrice), active: itemActive });
        }
    });

    if(items.length === 0) return showAlert("ข้อมูลไม่ครบ", "กรุณาเพิ่มตัวเลือกอย่างน้อย 1 รายการครับ", "error");

    // Collect Linked Products
    const linkedProductIds = [];
    document.querySelectorAll('.product-link-cb:checked').forEach(cb => {
        linkedProductIds.push(cb.value);
    });

    const groupData = {
        name,
        isRequired,
        items,
        linkedProductIds,
        updatedAt: Date.now()
    };

    try {
        if(editingAddonGroupId) {
            await updateDoc(doc(db, "addonGroups", editingAddonGroupId), groupData);
            showAlert("สำเร็จ", "แก้ไขกลุ่มตัวเลือกเรียบร้อย!");
        } else {
            groupData.createdAt = Date.now();
            await addDoc(collection(db, "addonGroups"), groupData);
            showAlert("สำเร็จ", "สร้างกลุ่มตัวเลือกเรียบร้อย!");
        }
        closeAddonForm();
    } catch(e) { console.error(e); showAlert("ผิดพลาด", "บันทึกไม่สำเร็จ: " + e.message, "error"); }
};

window.deleteAddonGroup = async (id) => {
    showConfirm("ลบกลุ่มตัวเลือก?", "การลบกลุ่มตัวเลือกจะทำให้สินค้าที่ผูกอยู่ไม่แสดงตัวเลือกนี้อีก", async () => {
        try {
            await deleteDoc(doc(db, "addonGroups", id));
        } catch(e) { showAlert("ผิดพลาด", "ลบไม่สำเร็จ", "error"); }
    });
};

function renderAddonGroups() {
    const list = document.getElementById('addonGroupList');
    if(!list) return;
    list.innerHTML = '';
    
    allAddonGroups.forEach(g => {
        const itemCount = g.items ? g.items.length : 0;
        const linkCount = g.linkedProductIds ? g.linkedProductIds.length : 0;
        const reqBadge = g.isRequired ? '<span style="background:#ffebee; color:#c62828; padding:2px 8px; border-radius:10px; font-size:11px; margin-left:5px; border:1px solid #ffcdd2;">บังคับเลือก</span>' : '<span style="background:#e8f5e9; color:#2e7d32; padding:2px 8px; border-radius:10px; font-size:11px; margin-left:5px; border:1px solid #c8e6c9;">ไม่บังคับ</span>';
        
        list.innerHTML += `
            <div class="addon-card">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <h3 style="margin:0; font-size:18px; color:#333; display:flex; align-items:center;">${g.name} ${reqBadge}</h3>
                    <div>
                        <button class="btn-bubble edit icon-only" onclick="openAddonForm('${g.id}')" title="แก้ไข">✏️</button>
                        <button class="btn-bubble delete icon-only" onclick="deleteAddonGroup('${g.id}')" title="ลบ">🗑️</button>
                    </div>
                </div>
                <div style="font-size:13px; color:#666; margin-bottom:15px;">
                    <div>📦 มีตัวเลือก: <b>${itemCount}</b> รายการ</div>
                    <div>🔗 ผูกกับสินค้า: <b>${linkCount}</b> รายการ</div>
                </div>
                <div style="background:#f9f9f9; padding:10px; border-radius:8px; font-size:12px; color:#888; max-height:80px; overflow-y:auto;">
                    ${g.items.map(i => `<span style="display:inline-block; background:white; border:1px solid #eee; padding:2px 6px; border-radius:4px; margin:2px;">${i.name} (${i.price > 0 ? '+' + i.price : 'ฟรี'})</span>`).join('')}
                </div>
            </div>
        `;
    });
}

// Helper: Render Categories with Counts
function renderCategories() {
    const list = document.getElementById('categoryList');
    const select = document.getElementById('catSelect');
    if(!list) return;

    list.innerHTML = '';
    if(select) select.innerHTML = '<option value="">เลือกหมวดหมู่</option>';

    allCategories.forEach(c => {
        // 🔢 Count products in this category
        const count = allProducts.filter(p => p.category === c.name).length;
        
        const item = document.createElement('div');
        item.id = `cat-item-${c.id}`;
        item.className = 'cat-card';
        item.innerHTML = `
            <div class="cat-info">
                <span class="cat-name">${c.name}</span>
                <span class="cat-count">${count} รายการ</span>
            </div>
            <div class="cat-actions">
                <button class="btn-bubble edit icon-only" onclick="editCategory('${c.id}')" title="แก้ไขชื่อ">✏️</button>
                <button class="btn-bubble delete icon-only" onclick="deleteCategory('${c.id}')" title="ลบ">🗑️</button>
            </div>`;
        list.appendChild(item);
        if(select) select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
}

// ---------------------------------------------------------
// 🔄 REAL-TIME LISTENERS (Sync Data)
// ---------------------------------------------------------

// Hamburger Real-time Listener (ดึงรายการสินค้ามาโชว์แบบแบ่งหน้า ดีไซน์แบบ image_9.png)
onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
    const body = document.getElementById('productTableBody');
    if(!body) return;
    
    // ถ้าอยู่หน้าสร้างสินค้า ให้รีเฟรชรายการแอดออนด้วย (เผื่อมีการสร้างใหม่)
    if(document.getElementById('page-menu-create').classList.contains('active') && !editingProductId) {
        renderAddonOptionsInProductForm();
    }
    
    allProducts = []; // เคลียร์ข้อมูลเก่า
    snap.forEach(d => { allProducts.push({ id: d.id, ...d.data() }); });
    selectedProductIds.clear(); // เคลียร์การเลือกเมื่อข้อมูลเปลี่ยน
    updateBulkDeleteButton();
    currentFilteredProducts = [...allProducts]; // เริ่มต้นให้แสดงทั้งหมด
    
    renderProductPage(currentFilteredProducts, currentPage); // แสดงผลหน้าปัจจุบัน
    setupPagination(currentFilteredProducts, itemsPerPage); // สร้างปุ่มแบ่งหน้า
    renderCategories(); // อัปเดตตัวเลขจำนวนสินค้าในหมวดหมู่
});

// Categories Real-time Listener
onSnapshot(query(collection(db, "categories"), orderBy("createdAt", "desc")), (snap) => {
    allCategories = [];
    snap.forEach(d => allCategories.push({ id: d.id, ...d.data() }));
    renderCategories();
});

// Addon Groups Real-time Listener
onSnapshot(query(collection(db, "addonGroups"), orderBy("createdAt", "desc")), (snap) => {
    allAddonGroups = [];
    snap.forEach(d => allAddonGroups.push({ id: d.id, ...d.data() }));
    renderAddonGroups();
    // Note: Addons in product form will be updated when opening the form
});

// ---------------------------------------------------------
// 🚀 PAGINATION & RENDERING FUNCTIONS
// ---------------------------------------------------------

// แสดงผลสินค้าเฉพาะหน้าที่กำหนด ดีไซน์แบบ Clean UI ของ image_9.png
function renderProductPage(data, page) {
    const body = document.getElementById('productTableBody');
    body.innerHTML = ''; // เคลียร์ตาราง
    
    // คำนวณขอบเขตข้อมูลที่จะแสดง
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const paginatedData = data.slice(startIndex, endIndex); // ตัดเอาเฉพาะ 20 รายการของหน้านี้
    
    paginatedData.forEach(p => {
        const pos = p.imagePos || { x: 50, y: 50 };
        const isChecked = selectedProductIds.has(p.id) ? 'checked' : '';
        body.innerHTML += `
            <tr>
                <td>
                    <label class="custom-checkbox">
                        <input type="checkbox" class="product-checkbox" value="${p.id}" onchange="toggleProductSelection('${p.id}')" ${isChecked}>
                        <span class="checkmark"></span>
                    </label>
                </td>
                <td><img src="${p.imageUrl}" width="50" height="50" style="border-radius:12px; object-fit:cover; object-position: ${pos.x}% ${pos.y}%;"></td>
                <td><span style="background:#eee; padding:5px; border-radius:10px; color:#888; font-size:12px;">${p.sku || '-'}</span></td>
                <td><span style="font-weight:600; color:#444;">${p.name}</span></td>
                <td>${p.group || '-'}</td>
                <td><span style="background:#eefbff; color:#888; padding:5px 15px; border-radius:20px; font-size:12px;">${p.category}</span></td>
                <td><span style="color:#A91D3A; font-weight:600;">${p.price.toFixed(2)}</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <button class="btn-bubble edit icon-only" onclick="editProduct('${p.id}')" title="แก้ไขสินค้า">✎</button>
                        <button class="btn-bubble delete icon-only" onclick="deleteProd('${p.id}')" title="ลบสินค้า">🗑️</button>
                        <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                    </div>
                </td>
            </tr>`;
    });
}

// 📦 Bulk Selection Logic
window.toggleProductSelection = (id) => {
    if(selectedProductIds.has(id)) {
        selectedProductIds.delete(id);
    } else {
        selectedProductIds.add(id);
    }
    updateBulkDeleteButton();
};

window.toggleSelectAll = (source) => {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
        if(source.checked) {
            selectedProductIds.add(cb.value);
        } else {
            selectedProductIds.delete(cb.value);
        }
    });
    updateBulkDeleteButton();
};

function updateBulkDeleteButton() {
    const btn = document.getElementById('btnBulkDelete');
    const btnCreate = document.getElementById('btnCreateMenu');
    const countSpan = document.getElementById('selectedCount');
    if(!btn || !btnCreate) return;
    
    if(selectedProductIds.size > 0) {
        btn.style.display = 'inline-flex';
        btnCreate.style.display = 'none'; // ซ่อนปุ่มสร้างเมนู
        countSpan.innerText = selectedProductIds.size;
    } else {
        btn.style.display = 'none';
        btnCreate.style.display = 'inline-flex'; // แสดงปุ่มสร้างเมนู
    }
}

window.deleteSelectedProducts = async () => {
    if(selectedProductIds.size === 0) return;
    
    showConfirm("ลบรายการที่เลือก?", `คุณต้องการลบสินค้า ${selectedProductIds.size} รายการนี้ใช่หรือไม่?`, async () => {
        const promises = Array.from(selectedProductIds).map(id => deleteDoc(doc(db, "products", id)));
        await Promise.all(promises);
        selectedProductIds.clear();
        updateBulkDeleteButton();
        showAlert("สำเร็จ", "ลบรายการที่เลือกเรียบร้อยแล้วครับ");
    });
};

// สร้างปุ่มเลขหน้าแบ่งตามจำนวนรายการสินค้า
function setupPagination(data, itemsPerPage) {
    const paginationArea = document.getElementById('pagination');
    if(!paginationArea) return;
    paginationArea.innerHTML = ''; // เคลียร์ปุ่มเก่า
    
    const pageCount = Math.ceil(data.length / itemsPerPage);
    if(pageCount <= 1) return; // ถ้ามีหน้าเดียว ไม่ต้องโชว์ปุ่ม
    
    // สร้างปุ่มหน้าก่อนหน้า (ย่อ placeholder)
    addPageButton(paginationArea, "<<", currentPage - 1, currentPage === 1);
    
    // สร้างปุ่มตัวเลขหน้า
    for(let i = 1; i <= pageCount; i++) {
        addPageButton(paginationArea, i, i, false, i === currentPage);
    }
    
    // สร้างปุ่มหน้าถัดไป (ย่อ placeholder)
    addPageButton(paginationArea, ">>", currentPage + 1, currentPage === pageCount);
}

// ฟังก์ชันช่วยสร้างปุ่มกด
function addPageButton(area, text, pageTarget, isDisabled, isActive) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.className = `page-btn ${isActive ? 'active' : ''}`;
    if(isDisabled) { btn.disabled = true; btn.style.opacity = 0.5; btn.style.cursor = 'default'; }
    
    if(!isDisabled && !isActive) {
        btn.onclick = () => {
            currentPage = pageTarget; // เปลี่ยนหน้าปัจจุบัน
            renderProductPage(currentFilteredProducts, currentPage); // โชว์ข้อมูลหน้าใหม่ (ใช้รายการที่กรองแล้ว)
            setupPagination(currentFilteredProducts, itemsPerPage); // อัปเดตสถานะปุ่ม
        }
    }
    area.appendChild(btn);
}