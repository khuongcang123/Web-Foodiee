// DOM Elements
const appContainer = document.getElementById('app');
const loadingContainer = document.getElementById('firebase-loading');
const currentDateTime = document.getElementById('currentDateTime');
const menuTableBody = document.getElementById('menuTableBody');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const menuSearch = document.getElementById('menuSearch');
const inventorySearch = document.getElementById('inventorySearch');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Modal Elements
const menuItemModal = document.getElementById('menuItemModal');
const inventoryItemModal = document.getElementById('inventoryItemModal');
const menuModalTitle = document.getElementById('menuModalTitle');
const inventoryModalTitle = document.getElementById('inventoryModalTitle');
const btnAddMenuItem = document.getElementById('btnAddMenuItem');
const btnAddInventoryItem = document.getElementById('btnAddInventoryItem');
const btnSaveMenuItem = document.getElementById('btnSaveMenuItem');
const btnCancelMenuItem = document.getElementById('btnCancelMenuItem');
const btnSaveInventoryItem = document.getElementById('btnSaveInventoryItem');
const btnCancelInventoryItem = document.getElementById('btnCancelInventoryItem');
const btnAddIngredient = document.getElementById('btnAddIngredient');
const ingredientsContainer = document.getElementById('ingredientsContainer');

// Form Elements
const menuItemName = document.getElementById('menuItemName');
const menuItemCategory = document.getElementById('menuItemCategory');
const menuItemPrice = document.getElementById('menuItemPrice');
const menuItemImage = document.getElementById('menuItemImage');
const menuItemDescription = document.getElementById('menuItemDescription');
const menuItemRecipe = document.getElementById('menuItemRecipe');
const menuImagePreview = document.getElementById('menuImagePreview');
const menuItemImagePreview = document.getElementById('menuItemImagePreview');

const inventoryItemName = document.getElementById('inventoryItemName');
const inventoryItemCategory = document.getElementById('inventoryItemCategory');
const inventoryItemQuantity = document.getElementById('inventoryItemQuantity');
const inventoryItemUnit = document.getElementById('inventoryItemUnit');
const inventoryItemImage = document.getElementById('inventoryItemImage');
const inventoryImagePreview = document.getElementById('inventoryImagePreview');
const inventoryItemImagePreview = document.getElementById('inventoryItemImagePreview');
const inventoryStatusRadios = document.querySelectorAll('input[name="inventoryStatus"]');

// Firebase References
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
const menuRef = db.ref('menu');
const inventoryRef = db.ref('inventory');
const ingredientsRef = db.ref('ingredients');

// State
let currentMenuItemId = null;
let currentInventoryItemId = null;
let currentMenuImageFile = null;
let currentInventoryImageFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Hide app container until Firebase is ready
    appContainer.style.display = 'none';
    
    // Set up Firebase listeners
    setupFirebaseListeners();
    
    // Update time every minute
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

// Set up Firebase listeners
function setupFirebaseListeners() {
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "index.html";
        } else {
            // Show app container and hide loading
            loadingContainer.style.display = 'none';
            appContainer.style.display = 'block';
        }
    });
    
    // Listen for menu data
    menuRef.on('value', snapshot => {
        const menuData = snapshot.val();
        renderMenu(menuData);
    });
    
    // Listen for inventory data
    inventoryRef.on('value', snapshot => {
        const inventoryData = snapshot.val();
        renderInventory(inventoryData);
    });
    
    // Listen for ingredients data
    inventoryRef.on('value', snapshot => {
    const inventoryData = snapshot.val();
    if (inventoryData) {
        const materialItems = {};
        Object.keys(inventoryData).forEach(id => {
            if (inventoryData[id].category === "material") {
                materialItems[id] = inventoryData[id];
            }
        });
        window.availableIngredients = materialItems; // Gán vào biến toàn cục
    }
});

    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Menu item modal
    btnAddMenuItem.addEventListener('click', () => {
        currentMenuItemId = null;
        menuModalTitle.textContent = "Thêm món mới";
        resetMenuItemForm();
        menuItemModal.style.display = 'flex';
    });
    
    // Save menu item
    btnSaveMenuItem.addEventListener('click', saveMenuItem);
    btnCancelMenuItem.addEventListener('click', () => menuItemModal.style.display = 'none');
    
    // Inventory item modal
    btnAddInventoryItem.addEventListener('click', () => {
        currentInventoryItemId = null;
        inventoryModalTitle.textContent = "Thêm hàng mới";
        resetInventoryItemForm();
        inventoryItemModal.style.display = 'flex';
    });
    
    // Save inventory item
    btnSaveInventoryItem.addEventListener('click', saveInventoryItem);
    btnCancelInventoryItem.addEventListener('click', () => inventoryItemModal.style.display = 'none');
    
    // Menu image preview
    menuItemImage.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            currentMenuImageFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                menuItemImagePreview.src = event.target.result;
                menuItemImagePreview.style.display = 'block';
                menuImagePreview.querySelector('.placeholder').style.display = 'none';
            };
            reader.readAsDataURL(currentMenuImageFile);
        }
    });
    
    // Inventory image preview
    inventoryItemImage.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            currentInventoryImageFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                inventoryItemImagePreview.src = event.target.result;
                inventoryItemImagePreview.style.display = 'block';
                inventoryImagePreview.querySelector('.placeholder').style.display = 'none';
            };
            reader.readAsDataURL(currentInventoryImageFile);
        }
    });
    
    // Add ingredient button
    btnAddIngredient.addEventListener('click', addIngredientRow);
    
    // Search functionality
    menuSearch.addEventListener('input', filterMenu);
    inventorySearch.addEventListener('input', filterInventory);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === menuItemModal) menuItemModal.style.display = 'none';
        if (e.target === inventoryItemModal) inventoryItemModal.style.display = 'none';
    });

    const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });
}
}

// Render menu items
function renderMenu(menuData) {
    menuTableBody.innerHTML = '';
    
    if (!menuData) {
        menuTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có món nào</td></tr>';
        return;
    }
    
    Object.keys(menuData).forEach(itemId => {
        const item = menuData[itemId];
        const row = document.createElement('tr');
        
        // Get category name
        let categoryName = "Khác";
        if (item.category === "food") categoryName = "Đồ ăn";
        if (item.category === "drink") categoryName = "Đồ uống";
        
        row.innerHTML = `
            <td>${itemId.substring(0, 6)}</td>
            <td>
        ${item.imageUrl ? `<img src="${item.imageUrl}" class="table-thumb">` : '<span>Không có</span>'}
    </td>
            <td>${item.name}</td>
            <td>${categoryName}</td>
            <td>${formatCurrency(item.price)}</td>
            <td class="actions">
                <button class="btn-icon edit-menu-item" data-id="${itemId}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-menu-item" data-id="${itemId}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        menuTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-menu-item').forEach(btn => {
        btn.addEventListener('click', () => editMenuItem(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-menu-item').forEach(btn => {
        btn.addEventListener('click', () => deleteMenuItem(btn.dataset.id));
    });
}

// Render inventory items
function renderInventory(inventoryData) {
    inventoryTableBody.innerHTML = '';
    
    if (!inventoryData) {
        inventoryTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có hàng nào</td></tr>';
        return;
    }
    
    Object.keys(inventoryData).forEach(itemId => {
        const item = inventoryData[itemId];
        const row = document.createElement('tr');
        
        // Get category name
        let categoryName = "Vật phẩm";
        if (item.category === "material") categoryName = "Nguyên liệu";
        if (item.category === "tool") categoryName = "Dụng cụ";
        
        // Get status
        let statusClass = "in-stock";
        let statusText = "Còn hàng";
        
        if (item.status === "low-stock") {
            statusClass = "low-stock";
            statusText = "Sắp hết";
        } else if (item.status === "out-of-stock") {
            statusClass = "out-of-stock";
            statusText = "Hết hàng";
        }
        
        row.innerHTML = `
            <td>${itemId.substring(0, 6)}</td>
            <td>
        ${item.imageUrl ? `<img src="${item.imageUrl}" class="table-thumb">` : '<span>Không có</span>'}
    </td>   
            <td>${item.name}</td>
            <td>${categoryName}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td><span class="status ${statusClass}"><span class="status-dot"></span> ${statusText}</span></td>
            <td class="actions">
                <button class="btn-icon edit-inventory-item" data-id="${itemId}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-inventory-item" data-id="${itemId}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-inventory-item').forEach(btn => {
        btn.addEventListener('click', () => editInventoryItem(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-inventory-item').forEach(btn => {
        btn.addEventListener('click', () => deleteInventoryItem(btn.dataset.id));
    });
}

// Edit menu item
function editMenuItem(itemId) {
    menuRef.child(itemId).once('value', snapshot => {
        const item = snapshot.val();
        if (item) {
            currentMenuItemId = itemId;
            menuModalTitle.textContent = "Chỉnh sửa món";
            
            // Populate form
            menuItemName.value = item.name || '';
            menuItemCategory.value = item.category || 'food';
            menuItemPrice.value = item.price || '';
            menuItemDescription.value = item.description || '';
            menuItemRecipe.value = item.recipe || '';
            
            // Image
            if (item.imageUrl) {
                menuItemImagePreview.src = item.imageUrl;
                menuItemImagePreview.style.display = 'block';
                menuImagePreview.querySelector('.placeholder').style.display = 'none';
            }
            
            // Ingredients
            ingredientsContainer.innerHTML = '';
            if (item.ingredients) {
                Object.keys(item.ingredients).forEach(ingId => {
                    addIngredientRow(item.ingredients[ingId]);
                });
            }
            
            menuItemModal.style.display = 'flex';
        }
    });
}

// Edit inventory item
function editInventoryItem(itemId) {
    inventoryRef.child(itemId).once('value', snapshot => {
        const item = snapshot.val();
        if (item) {
            currentInventoryItemId = itemId;
            inventoryModalTitle.textContent = "Chỉnh sửa hàng";
            
            // Populate form
            inventoryItemName.value = item.name || '';
            inventoryItemCategory.value = item.category || 'material';
            inventoryItemQuantity.value = item.quantity || '';
            inventoryItemUnit.value = item.unit || 'kg';
            
            // Status
            document.querySelector(`input[name="inventoryStatus"][value="${item.status}"]`).checked = true;
            
            // Image
            if (item.imageUrl) {
                inventoryItemImagePreview.src = item.imageUrl;
                inventoryItemImagePreview.style.display = 'block';
                inventoryImagePreview.querySelector('.placeholder').style.display = 'none';
            }
            
            inventoryItemModal.style.display = 'flex';
        }
    });
}

// Save menu item
function saveMenuItem() {
    const name = menuItemName.value.trim();
    const category = menuItemCategory.value;
    const price = parseFloat(menuItemPrice.value);
    const description = menuItemDescription.value.trim();
    const recipe = menuItemRecipe.value.trim();
    
    if (!name || isNaN(price)) {
        alert("Vui lòng nhập đầy đủ thông tin và giá tiền hợp lệ");
        return;
    }
    
    // Get ingredients
    const ingredients = {};
    const ingredientRows = ingredientsContainer.querySelectorAll('.ingredient-item');
    ingredientRows.forEach(row => {
        const ingredientId = row.querySelector('.ingredient-select').value;
        const quantity = row.querySelector('.ingredient-quantity').value;
        
        if (ingredientId && quantity) {
            ingredients[ingredientId] = quantity;
        }
    });
    
    const menuItem = {
        name,
        category,
        price,
        description,
        recipe,
        ingredients
    };
    
    // Save to Firebase
    let savePromise;
    if (currentMenuItemId) {
        savePromise = menuRef.child(currentMenuItemId).update(menuItem);
    } else {
        savePromise = menuRef.push(menuItem);
    }
    
    savePromise
        .then(() => {
            // Upload image if exists
            if (currentMenuImageFile) {
                uploadMenuImage(currentMenuImageFile, currentMenuItemId || savePromise.key);
            }
            menuItemModal.style.display = 'none';
        })
        .catch(error => {
            console.error("Lỗi khi lưu món: ", error);
            alert("Đã xảy ra lỗi khi lưu món");
        });
}

// Save inventory item
function saveInventoryItem() {
    const name = inventoryItemName.value.trim();
    const category = inventoryItemCategory.value;
    const quantity = parseFloat(inventoryItemQuantity.value);
    const unit = inventoryItemUnit.value;
    const status = document.querySelector('input[name="inventoryStatus"]:checked').value;
    
    if (!name || isNaN(quantity)) {
        alert("Vui lòng nhập đầy đủ thông tin và số lượng hợp lệ");
        return;
    }
    
    const inventoryItem = {
        name,
        category,
        quantity,
        unit,
        status
    };
    
    // Save to Firebase
    let savePromise;
    if (currentInventoryItemId) {
        savePromise = inventoryRef.child(currentInventoryItemId).update(inventoryItem);
    } else {
        savePromise = inventoryRef.push(inventoryItem);
    }
    
    savePromise
        .then(() => {
            // Upload image if exists
            if (currentInventoryImageFile) {
    uploadInventoryImage(currentInventoryImageFile, currentInventoryItemId || savePromise.key);
}

            inventoryItemModal.style.display = 'none';
        })
        .catch(error => {
            console.error("Lỗi khi lưu hàng: ", error);
            alert("Đã xảy ra lỗi khi lưu hàng");
        });
}

// Upload menu image
function uploadMenuImage(file, itemId) {
    const fileRef = storage.ref().child(`menu/${itemId}`);

    fileRef.put(file)
        .then(() => fileRef.getDownloadURL())
        .then(url => {
            console.log("✅ Menu image URL:", url); // Kiểm tra URL
            return menuRef.child(itemId).update({ imageUrl: url });
        })
        .catch(error => {
            console.error("❌ Lỗi khi tải ảnh menu:", error);
        });
}



// Upload inventory image
function uploadInventoryImage(file, itemId) {
    const fileRef = storage.ref().child(`inventory/${itemId}`);

    fileRef.put(file)
        .then(() => fileRef.getDownloadURL())
        .then(url => {
            console.log("✅ Inventory image URL:", url); // kiểm tra
            return inventoryRef.child(itemId).update({ imageUrl: url });
        })
        .catch(error => {
            console.error("❌ Lỗi khi tải ảnh inventory:", error);
        });
}



// Add ingredient row
function addIngredientRow(ingredient = null) {
    const row = document.createElement('div');
    row.className = 'ingredient-item';
    
    row.innerHTML = `
        <select class="form-control ingredient-select">
            <option value="">Chọn nguyên liệu</option>
            <!-- Options will be populated by JS -->
        </select>
        <input type="number" class="form-control ingredient-quantity" placeholder="Số lượng" min="0" step="0.01" value="${ingredient?.quantity || ''}">
        <div class="ingredient-actions">
            <button class="btn-icon remove-ingredient">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    ingredientsContainer.appendChild(row);
    
    // Populate ingredient options
    populateIngredientOptions(row.querySelector('.ingredient-select'), ingredient?.id);
    
    // Add event listener for remove button
    row.querySelector('.remove-ingredient').addEventListener('click', () => {
        row.remove();
    });
}

// Populate ingredient options
function populateIngredientOptions(select, selectedId = null) {
    select.innerHTML = '<option value="">Chọn nguyên liệu</option>';
    const ingredients = window.availableIngredients;
    
    if (ingredients) {
        Object.keys(ingredients).forEach(ingId => {
            const option = document.createElement('option');
            option.value = ingId;
            option.textContent = ingredients[ingId].name;
            if (ingId === selectedId) option.selected = true;
            select.appendChild(option);
        });
    }
}


// Delete menu item
function deleteMenuItem(itemId) {
    if (confirm("Bạn có chắc chắn muốn xóa món này?")) {
        menuRef.child(itemId).remove()
            .then(() => {
                console.log("Món đã được xóa");
            })
            .catch(error => {
                console.error("Lỗi khi xóa món: ", error);
                alert("Đã xảy ra lỗi khi xóa món");
            });
    }
}

// Delete inventory item
function deleteInventoryItem(itemId) {
    if (confirm("Bạn có chắc chắn muốn xóa hàng này?")) {
        inventoryRef.child(itemId).remove()
            .then(() => {
                console.log("Hàng đã được xóa");
            })
            .catch(error => {
                console.error("Lỗi khi xóa hàng: ", error);
                alert("Đã xảy ra lỗi khi xóa hàng");
            });
    }
}

// Reset menu item form
function resetMenuItemForm() {
    menuItemName.value = '';
    menuItemCategory.value = 'food';
    menuItemPrice.value = '';
    menuItemDescription.value = '';
    menuItemRecipe.value = '';
    ingredientsContainer.innerHTML = '';
    
    // Reset image
    menuItemImagePreview.style.display = 'none';
    menuImagePreview.querySelector('.placeholder').style.display = 'block';
    menuItemImage.value = '';
    currentMenuImageFile = null;
}

// Reset inventory item form
function resetInventoryItemForm() {
    inventoryItemName.value = '';
    inventoryItemCategory.value = 'material';
    inventoryItemQuantity.value = '';
    inventoryItemUnit.value = 'kg';
    document.querySelector('input[name="inventoryStatus"][value="in-stock"]').checked = true;
    
    // Reset image
    inventoryItemImagePreview.style.display = 'none';
    inventoryImagePreview.querySelector('.placeholder').style.display = 'block';
    inventoryItemImage.value = '';
    currentInventoryImageFile = null;
}

// Filter menu
function filterMenu() {
    const searchTerm = menuSearch.value.toLowerCase();
    const rows = menuTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter inventory
function filterInventory() {
    const searchTerm = inventorySearch.value.toLowerCase();
    const rows = inventoryTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    currentDateTime.textContent = now.toLocaleDateString('vi-VN', options);
}