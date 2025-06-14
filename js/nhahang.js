// DOM elements
const areasContainer = document.getElementById('areasContainer');
const appContainer = document.getElementById('app');
const loadingContainer = document.getElementById('firebase-loading');

// Statistics elements
const customersInRestaurantEl = document.getElementById('customers-in-restaurant');
const customersServedEl = document.getElementById('customers-served');
const staffWorkingEl = document.getElementById('staff-working');
const staffServingEl = document.getElementById('staff-serving');
const staffCookingEl = document.getElementById('staff-cooking');
const revenueTodayEl = document.getElementById('revenue-today');
const invoicesCountEl = document.getElementById('invoices-count');
const cashPercentageEl = document.getElementById('cash-percentage');
const transferPercentageEl = document.getElementById('transfer-percentage');
const cashAmountEl = document.getElementById('cash-amount');
const transferAmountEl = document.getElementById('transfer-amount');

// Firebase references
const db = firebase.database();
const areasRef = db.ref('areas');
const statisticsRef = db.ref('statistics');
const currentDateTime = document.getElementById('currentDateTime');

// Variables for current editing state
let currentAreaId = null;
let currentTableId = null;
let isEditingArea = false;
let isEditingTable = false;

// Initialize the page
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
    // Listen for areas data
    areasRef.on('value', (snapshot) => {
        const areasData = snapshot.val();
        renderAreas(areasData);
        
        // Show app container and hide loading
        if (loadingContainer) loadingContainer.style.display = 'none';
        appContainer.style.display = 'block';
    });
    
    // Listen for statistics data
    statisticsRef.on('value', (snapshot) => {
        const statsData = snapshot.val();
        updateStatistics(statsData);
    });
    
    // Create modals
    createModals();
    setupPaymentQR();

}

// Create modals
function createModals() {
    // Area modal
    const areaModal = document.createElement('div');
    areaModal.id = 'areaModal';
    areaModal.className = 'modal';
    areaModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalAreaTitle">Thêm khu vực mới</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="areaName">Tên khu vực</label>
                    <input type="text" id="areaName" class="form-control" placeholder="Nhập tên khu vực">
                </div>
                <div class="form-group">
                    <label for="areaDescription">Mô tả</label>
                    <textarea id="areaDescription" class="form-control" placeholder="Mô tả khu vực" rows="3"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button id="btnCancelArea" class="btn">Hủy bỏ</button>
                <button id="btnSaveArea" class="btn btn-primary">Lưu khu vực</button>
            </div>
        </div>
    `;
    
    // Table modal
    const tableModal = document.createElement('div');
    tableModal.id = 'tableModal';
    tableModal.className = 'modal';
    tableModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTableTitle">Thêm bàn mới</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="tableNumber">Số bàn</label>
                    <input type="text" id="tableNumber" class="form-control" placeholder="Nhập số bàn">
                </div>
                <div class="form-group">
                    <label for="tableCapacity">Sức chứa</label>
                    <input type="number" id="tableCapacity" class="form-control" min="2" max="20" value="4">
                </div>
                <div class="form-group">
                    <label for="tableStatus">Trạng thái</label>
                    <select id="tableStatus" class="form-control">
                        <option value="available">Trống</option>
                        <option value="occupied">Đang sử dụng</option>
                        <option value="reserved">Đã đặt trước</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button id="btnCancelTable" class="btn">Hủy bỏ</button>
                <button id="btnSaveTable" class="btn btn-primary">Lưu bàn</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(areaModal);
    document.body.appendChild(tableModal);
    
    // Get modal elements
    const btnAddArea = document.getElementById('btnAddArea');
    const btnSaveArea = document.getElementById('btnSaveArea');
    const btnCancelArea = document.getElementById('btnCancelArea');
    const btnSaveTable = document.getElementById('btnSaveTable');
    const btnCancelTable = document.getElementById('btnCancelTable');
    const modalAreaTitle = document.getElementById('modalAreaTitle');
    const modalTableTitle = document.getElementById('modalTableTitle');
    const areaNameInput = document.getElementById('areaName');
    const areaDescInput = document.getElementById('areaDescription');
    const tableNumberInput = document.getElementById('tableNumber');
    const tableCapacityInput = document.getElementById('tableCapacity');
    const tableStatusInput = document.getElementById('tableStatus');
    
    // Setup event listeners
    setupEventListeners();
    
    function setupEventListeners() {
        // Area modal
        btnAddArea.addEventListener('click', () => {
            isEditingArea = false;
            modalAreaTitle.textContent = "Thêm khu vực mới";
            areaNameInput.value = "";
            areaDescInput.value = "";
            areaModal.style.display = "flex";
        });
        
        btnSaveArea.addEventListener('click', saveArea);
        btnCancelArea.addEventListener('click', () => areaModal.style.display = "none");
        
        // Table modal
        btnSaveTable.addEventListener('click', saveTable);
        btnCancelTable.addEventListener('click', () => tableModal.style.display = "none");
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === areaModal) areaModal.style.display = "none";
            if (e.target === tableModal) tableModal.style.display = "none";
        });
        
        // Close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                areaModal.style.display = "none";
                tableModal.style.display = "none";
            });
        });
    }
}

// Render areas and tables
function renderAreas(areasData) {
    if (!areasData) {
        areasContainer.innerHTML = '<div class="no-data">Chưa có khu vực nào. Hãy thêm khu vực đầu tiên!</div>';
        return;
    }
    
    areasContainer.innerHTML = '';
    
    Object.keys(areasData).forEach(areaId => {
        const area = areasData[areaId];
        const areaCard = document.createElement('div');
        areaCard.className = 'area-card';
        areaCard.innerHTML = `
            <div class="area-header">
                <h3>${area.name}</h3>
                <div class="area-actions">
                    <button class="edit-area" data-id="${areaId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-area" data-id="${areaId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="tables-container">
                ${renderTables(area.tables, areaId)}
                <div class="table-card add-table-btn" data-area="${areaId}">
                    <i class="fas fa-plus"></i>
                    <span>Thêm bàn</span>
                </div>
            </div>
        `;
        areasContainer.appendChild(areaCard);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-area').forEach(btn => {
        btn.addEventListener('click', () => editArea(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-area').forEach(btn => {
        btn.addEventListener('click', () => deleteArea(btn.dataset.id));
    });
    
    document.querySelectorAll('.edit-table').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editTable(btn.dataset.area, btn.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-table').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTable(btn.dataset.area, btn.dataset.id);
        });
    });
    
    document.querySelectorAll('.table-card:not(.add-table-btn)').forEach(card => {
        card.addEventListener('click', () => {
            const areaId = card.dataset.area;
            const tableId = card.dataset.id;
            // Implement table selection functionality
            alert(`Bàn được chọn: ${tableId} trong khu vực ${areaId}`);
        });
    });
    
    document.querySelectorAll('.add-table-btn').forEach(btn => {
        btn.addEventListener('click', () => addTable(btn.dataset.area));
    });
}

// Render tables for an area
function renderTables(tables, areaId) {
    if (!tables) return '<div class="no-tables">Chưa có bàn nào trong khu vực này</div>';
    
    return Object.keys(tables).map(tableId => {
        const table = tables[tableId];
        const statusClass = table.status === 'occupied' ? 'occupied' : 
                          table.status === 'reserved' ? 'reserved' : '';
        const guestBadge = table.guests > 0 ? `<div class="guests">${table.guests}</div>` : '';
        
        return `
            <div class="table-card ${statusClass}" 
                 data-area="${areaId}" 
                 data-id="${tableId}">
                ${guestBadge}
                <div class="table-number">${table.number}</div>
                <div class="capacity">${table.capacity} chỗ</div>
                <div class="table-actions">
                    <button class="edit-table" 
                            data-area="${areaId}" 
                            data-id="${tableId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-table" 
                            data-area="${areaId}" 
                            data-id="${tableId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Edit area
function editArea(areaId) {
    areasRef.child(areaId).once('value', (snapshot) => {
        const area = snapshot.val();
        if (area) {
            isEditingArea = true;
            currentAreaId = areaId;
            document.getElementById('modalAreaTitle').textContent = "Chỉnh sửa khu vực";
            document.getElementById('areaName').value = area.name;
            document.getElementById('areaDescription').value = area.description || '';
            document.getElementById('areaModal').style.display = "flex";
        }
    });
}

// Delete area
function deleteArea(areaId) {
    if (confirm("Bạn có chắc chắn muốn xóa khu vực này? Tất cả các bàn trong khu vực sẽ bị xóa.")) {
        areasRef.child(areaId).remove()
            .then(() => {
                console.log("Khu vực đã được xóa");
            })
            .catch((error) => {
                console.error("Lỗi khi xóa khu vực: ", error);
                alert("Đã xảy ra lỗi khi xóa khu vực");
            });
    }
}

// Save area (add or edit)
function saveArea() {
    const areaName = document.getElementById('areaName').value.trim();
    const areaDesc = document.getElementById('areaDescription').value.trim();
    
    if (!areaName) {
        alert("Vui lòng nhập tên khu vực");
        return;
    }
    
    const areaData = {
        name: areaName,
        description: areaDesc
    };
    
    if (isEditingArea) {
        // Update existing area
        areasRef.child(currentAreaId).update(areaData)
            .then(() => {
                document.getElementById('areaModal').style.display = "none";
            })
            .catch((error) => {
                console.error("Lỗi khi cập nhật khu vực: ", error);
                alert("Đã xảy ra lỗi khi cập nhật khu vực");
            });
    } else {
        // Add new area
        areasRef.push(areaData)
            .then(() => {
                document.getElementById('areaModal').style.display = "none";
            })
            .catch((error) => {
                console.error("Lỗi khi thêm khu vực: ", error);
                alert("Đã xảy ra lỗi khi thêm khu vực");
            });
    }
}

// Add table
function addTable(areaId) {
    isEditingTable = false;
    currentAreaId = areaId;
    document.getElementById('modalTableTitle').textContent = "Thêm bàn mới";
    document.getElementById('tableNumber').value = "";
    document.getElementById('tableCapacity').value = "4";
    document.getElementById('tableStatus').value = "available";
    document.getElementById('tableModal').style.display = "flex";
}

// Edit table
function editTable(areaId, tableId) {
    areasRef.child(areaId).child('tables').child(tableId).once('value', (snapshot) => {
        const table = snapshot.val();
        if (table) {
            isEditingTable = true;
            currentAreaId = areaId;
            currentTableId = tableId;
            document.getElementById('modalTableTitle').textContent = "Chỉnh sửa bàn";
            document.getElementById('tableNumber').value = table.number;
            document.getElementById('tableCapacity').value = table.capacity;
            document.getElementById('tableStatus').value = table.status;
            document.getElementById('tableModal').style.display = "flex";
        }
    });
}

// Delete table
function deleteTable(areaId, tableId) {
    if (confirm("Bạn có chắc chắn muốn xóa bàn này?")) {
        areasRef.child(areaId).child('tables').child(tableId).remove()
            .then(() => {
                console.log("Bàn đã được xóa");
            })
            .catch((error) => {
                console.error("Lỗi khi xóa bàn: ", error);
                alert("Đã xảy ra lỗi khi xóa bàn");
            });
    }
}

// Save table (add or edit)
function saveTable() {
    const number = document.getElementById('tableNumber').value.trim();
    const capacity = parseInt(document.getElementById('tableCapacity').value);
    const status = document.getElementById('tableStatus').value;
    
    if (!number) {
        alert("Vui lòng nhập số bàn");
        return;
    }
    
    if (isNaN(capacity)) {
        alert("Sức chứa không hợp lệ");
        return;
    }
    
    const tableData = {
        number: number,
        capacity: capacity,
        status: status,
        guests: 0 // Default value
    };
    
    if (isEditingTable) {
        // Update existing table
        areasRef.child(currentAreaId).child('tables').child(currentTableId).update(tableData)
            .then(() => {
                document.getElementById('tableModal').style.display = "none";
            })
            .catch((error) => {
                console.error("Lỗi khi cập nhật bàn: ", error);
                alert("Đã xảy ra lỗi khi cập nhật bàn");
            });
    } else {
        // Add new table
        areasRef.child(currentAreaId).child('tables').push(tableData)
            .then(() => {
                document.getElementById('tableModal').style.display = "none";
            })
            .catch((error) => {
                console.error("Lỗi khi thêm bàn: ", error);
                alert("Đã xảy ra lỗi khi thêm bàn");
            });
    }
}

// Update statistics
function updateStatistics(statsData) {
    if (!statsData) return;
    
    // Update customers stats
    customersInRestaurantEl.textContent = statsData.customersInRestaurant || 0;
    customersServedEl.textContent = statsData.customersServed || 0;
    
    // Update staff stats
    staffWorkingEl.textContent = statsData.staffWorking || 0;
    staffServingEl.textContent = statsData.staffServing || 0;
    staffCookingEl.textContent = statsData.staffCooking || 0;
    
    // Update revenue stats
    const revenue = statsData.revenue || 0;
    revenueTodayEl.textContent = formatCurrency(revenue);
    invoicesCountEl.textContent = statsData.invoices || 0;
    
    // Update payment methods
    const cashPercentage = statsData.paymentMethods?.cash?.percentage || 0;
    const transferPercentage = statsData.paymentMethods?.transfer?.percentage || 0;
    const cashAmount = statsData.paymentMethods?.cash?.amount || 0;
    const transferAmount = statsData.paymentMethods?.transfer?.amount || 0;
    
    cashPercentageEl.textContent = `${cashPercentage}%`;
    transferPercentageEl.textContent = `${transferPercentage}%`;
    cashAmountEl.textContent = formatCurrency(cashAmount);
    transferAmountEl.textContent = formatCurrency(transferAmount);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Update date and time display
// Update date and time display
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

// ✅ Tách hàm setupPaymentQR ra ngoài updateDateTime
function setupPaymentQR() {
  const btn = document.getElementById('btnSetupPayment');
  if (!btn) return;

  // Tạo modal QR nếu chưa tồn tại
  const existingModal = document.getElementById('paymentModal');
  if (!existingModal) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'paymentModal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Thiết lập mã QR thanh toán</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <input type="file" id="qrUpload" accept="image/*" class="form-control">
          <img id="qrPreview" style="max-width: 100%; margin-top: 10px; display: none;" />
        </div>
        <div class="modal-footer">
          <button class="btn" id="btnCancelQR">Hủy</button>
          <button class="btn btn-primary" id="btnSaveQR">Lưu</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modal = document.getElementById('paymentModal');
  const qrUpload = document.getElementById('qrUpload');
  const qrPreview = document.getElementById('qrPreview');

  // Sự kiện khi chọn file mới
  qrUpload.onchange = () => {
    const file = qrUpload.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        qrPreview.src = e.target.result;
        qrPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };

  // Hiển thị modal và load ảnh QR từ Firebase
  btn.onclick = () => {
    qrUpload.value = '';
    qrPreview.style.display = 'none';
    qrPreview.src = '';

    // Hiển thị ảnh cũ nếu có
    db.ref('paymentMethods/qrImage').once('value').then(snapshot => {
      const image = snapshot.val();
      if (image) {
        qrPreview.src = image;
        qrPreview.style.display = 'block';
      }
    });

    modal.style.display = 'flex';
  };

  // Nút đóng modal
  modal.querySelector('.close-btn').onclick =
  modal.querySelector('#btnCancelQR').onclick = () => {
    modal.style.display = 'none';
  };

  // Nút lưu QR mới
  modal.querySelector('#btnSaveQR').onclick = () => {
    const file = qrUpload.files[0];
    if (!file) return alert("Vui lòng chọn ảnh QR mới!");

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      db.ref('paymentMethods/qrImage').set(base64)
        .then(() => {
          alert("Đã lưu ảnh QR mới thành công!");
          modal.style.display = 'none';
        })
        .catch(err => {
          console.error("Lỗi khi lưu ảnh QR:", err);
          alert("Lỗi khi lưu ảnh QR");
        });
    };
    reader.readAsDataURL(file);
  };
}
