document.addEventListener("DOMContentLoaded", () => {
    console.log("Trang Quản lý nhân viên đã sẵn sàng.");
    
    // Toggle sidebar
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });
    
    // Firebase configuration - chỉ dùng cho xác thực
    const firebaseConfig = {
        apiKey: "AIzaSyDV06m47eD90e8n3vTd6B9NmKsEOUz_r_E",
    authDomain: "foodiee-506f6.firebaseapp.com",
    projectId: "foodiee-506f6",
    storageBucket: "foodiee-506f6.appspot.com",
    messagingSenderId: "628837902932",
    appId: "1:628837902932:web:fcdfcfca84ad76e700dbc1",
    measurementId: "G-3ZNLCPWM94"
    };
    
    // Khởi tạo Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Khởi tạo Firebase Authentication
    const auth = firebase.auth();
    
    // Kiểm tra đăng nhập
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Người dùng đã đăng nhập:", user.email);
            loadStaffData();
        } else {
            console.log("Chưa đăng nhập");
            // Chuyển hướng đến trang đăng nhập
            window.location.href = 'login.html';
        }
    });
    
    // Lưu trữ dữ liệu cục bộ
    const STAFF_STORAGE_KEY = 'staffData';
    let currentStaffData = [];
    
    // Hiển thị thông báo
    function showNotification(message, isError = false) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'notification';
        
        if (isError) {
            notification.classList.add('error');
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Lưu dữ liệu vào localStorage
    function saveStaffData() {
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(currentStaffData));
        showNotification("Dữ liệu đã được lưu thành công!");
    }
    
    // Tải dữ liệu từ localStorage
    function loadStaffData() {
        const savedData = localStorage.getItem(STAFF_STORAGE_KEY);
        if (savedData) {
            try {
                currentStaffData = JSON.parse(savedData);
                renderStaffTable();
            } catch (e) {
                console.error("Lỗi khi tải dữ liệu:", e);
                showNotification("Lỗi khi tải dữ liệu đã lưu", true);
                currentStaffData = [];
                renderStaffTable();
            }
        } else {
            currentStaffData = [];
            renderStaffTable();
        }
    }
    
    // Hiển thị bảng nhân viên
    function renderStaffTable() {
        const tbody = document.querySelector("#staffTable tbody");
        tbody.innerHTML = "";
        
        if (currentStaffData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px;">
                        <i class="fas fa-info-circle"></i> Không có nhân viên nào
                    </td>
                </tr>
            `;
            return;
        }
        
        currentStaffData.forEach((staff, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${staff.id}</td>
                <td>${staff.name}</td>
                <td>${staff.phone}</td>
                <td>${staff.position}</td>
                <td class="action-cell">
                    <button class="action-btn edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="action-btn delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Gắn sự kiện cho nút sửa
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                editStaff(index);
            });
        });
        
        // Gắn sự kiện cho nút xóa
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                deleteStaff(index);
            });
        });
    }
    
    // Thêm nhân viên mới
    function addStaffToLocal(staff) {
        // Kiểm tra trùng ID
        const exists = currentStaffData.some(s => s.id === staff.id);
        if (exists) {
            showNotification("Mã nhân viên đã tồn tại!", true);
            return false;
        }
        
        currentStaffData.push(staff);
        saveStaffData();
        showNotification("Thêm nhân viên thành công!");
        return true;
    }
    
    // Sửa nhân viên
    function editStaff(index) {
        const staff = currentStaffData[index];
        
        // Điền dữ liệu vào form
        document.getElementById('staffId').value = staff.id;
        document.getElementById('staffName').value = staff.name;
        document.getElementById('staffPhone').value = staff.phone;
        document.getElementById('staffPosition').value = staff.position;
        
        // Hiển thị form
        document.getElementById('addStaffForm').style.display = 'block';
        
        // Lưu index để cập nhật
        document.getElementById('formAddStaff').dataset.editIndex = index;
    }
    
    // Cập nhật nhân viên
    function updateStaff(index, updatedStaff) {
        currentStaffData[index] = updatedStaff;
        saveStaffData();
        showNotification("Cập nhật nhân viên thành công!");
    }
    
    // Xóa nhân viên
    function deleteStaff(index) {
        if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
            currentStaffData.splice(index, 1);
            saveStaffData();
            showNotification("Đã xóa nhân viên thành công!");
        }
    }
    
    // Lọc dữ liệu theo input
    function filterStaff() {
        const phone = document.getElementById("filterPhone").value.trim().toLowerCase();
        const id = document.getElementById("filterId").value.trim().toLowerCase();
        const name = document.getElementById("filterName").value.trim().toLowerCase();
        
        const filtered = currentStaffData.filter((staff) => {
            return (
                (!phone || (staff.phone && staff.phone.toLowerCase().includes(phone))) &&
                (!id || (staff.id && staff.id.toLowerCase().includes(id))) &&
                (!name || (staff.name && staff.name.toLowerCase().includes(name)))
            );
        });
        
        renderFilteredTable(filtered);
        
        if (filtered.length === 0) {
            showNotification("Không tìm thấy nhân viên phù hợp");
        }
    }
    
    // Hiển thị bảng đã lọc
    function renderFilteredTable(filteredData) {
        const tbody = document.querySelector("#staffTable tbody");
        tbody.innerHTML = "";
        
        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px;">
                        <i class="fas fa-info-circle"></i> Không tìm thấy nhân viên phù hợp
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredData.forEach((staff, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${staff.id}</td>
                <td>${staff.name}</td>
                <td>${staff.phone}</td>
                <td>${staff.position}</td>
                <td class="action-cell">
                    <button class="action-btn edit-btn" data-index="${currentStaffData.findIndex(s => s.id === staff.id)}">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="action-btn delete-btn" data-index="${currentStaffData.findIndex(s => s.id === staff.id)}">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Gắn lại sự kiện
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                editStaff(index);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                deleteStaff(index);
            });
        });
    }
    
    // Xóa bộ lọc
    function clearFilters() {
        document.getElementById("filterPhone").value = "";
        document.getElementById("filterId").value = "";
        document.getElementById("filterName").value = "";
        renderStaffTable();
    }
    
    // Xuất danh sách CSV
    function exportCSV() {
        if (currentStaffData.length === 0) {
            showNotification("Không có dữ liệu để xuất", true);
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Mã nhân viên,Tên nhân viên,Số điện thoại,Chức vụ\n";
        
        currentStaffData.forEach((staff) => {
            const row = [staff.id, staff.name, staff.phone, staff.position].join(",");
            csvContent += row + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "danh_sach_nhan_vien.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification("Xuất file CSV thành công!");
    }
    
    // Sao lưu dữ liệu
    function backupData() {
        const dataStr = JSON.stringify(currentStaffData);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `staff_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification("Sao lưu dữ liệu thành công!");
    }
    
    // Khôi phục dữ liệu
    function restoreData(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    currentStaffData = data;
                    saveStaffData();
                    showNotification("Khôi phục dữ liệu thành công!");
                } else {
                    showNotification("File không hợp lệ", true);
                }
            } catch (error) {
                showNotification("Lỗi khi đọc file: " + error.message, true);
            }
        };
        reader.readAsText(file);
    }
    
    // Hiển thị/ẩn form thêm nhân viên
    const btnAdd = document.getElementById("btnAdd");
    const btnCancelAdd = document.getElementById("btnCancelAdd");
    const formAddStaff = document.getElementById("formAddStaff");
    
    btnAdd.addEventListener("click", () => {
        document.getElementById('formAddStaff').reset();
        delete document.getElementById('formAddStaff').dataset.editIndex;
        addStaffForm.style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    btnCancelAdd.addEventListener("click", () => {
        addStaffForm.style.display = "none";
        formAddStaff.reset();
        delete document.getElementById('formAddStaff').dataset.editIndex;
    });
    
    // Xử lý submit form thêm/sửa nhân viên
    formAddStaff.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const newStaff = {
            id: document.getElementById("staffId").value.trim(),
            name: document.getElementById("staffName").value.trim(),
            phone: document.getElementById("staffPhone").value.trim(),
            position: document.getElementById("staffPosition").value.trim(),
        };
        
        // Validate input
        if (!newStaff.id || !newStaff.name || !newStaff.phone || !newStaff.position) {
            showNotification("Vui lòng nhập đầy đủ thông tin!", true);
            return;
        }
        
        // Simple phone validation
        if (!/^\d{10,11}$/.test(newStaff.phone)) {
            showNotification("Số điện thoại không hợp lệ!", true);
            return;
        }
        
        const editIndex = document.getElementById('formAddStaff').dataset.editIndex;
        
        if (editIndex !== undefined) {
            // Cập nhật nhân viên
            updateStaff(editIndex, newStaff);
        } else {
            // Thêm nhân viên mới
            if (addStaffToLocal(newStaff)) {
                formAddStaff.reset();
            } else {
                return;
            }
        }
        
        addStaffForm.style.display = "none";
    });
    
    // Gán các nút chức năng
    document.getElementById("btnFilter").addEventListener("click", filterStaff);
    document.getElementById("btnClearFilter").addEventListener("click", clearFilters);
    document.getElementById("btnExport").addEventListener("click", exportCSV);
    document.getElementById("btnBackup").addEventListener("click", backupData);
    document.getElementById("btnRestore").addEventListener("click", () => {
        document.getElementById('restoreFile').click();
    });
    
    document.getElementById('restoreFile').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            restoreData(e.target.files[0]);
        }
    });
    
    // Tự động áp dụng bộ lọc khi nhập
    document.getElementById("filterId").addEventListener("input", filterStaff);
    document.getElementById("filterName").addEventListener("input", filterStaff);
    document.getElementById("filterPhone").addEventListener("input", filterStaff);
});