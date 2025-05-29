document.addEventListener("DOMContentLoaded", () => {
    console.log("Trang Quản lý nhân viên đã sẵn sàng.");

    // Firebase config
    const firebaseConfig = { /* Cấu hình Firebase giữ nguyên */ };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    auth.onAuthStateChanged(user => user ? loadStaffData() : (window.location.href = 'login.html'));

    const STAFF_STORAGE_KEY = 'staffData';
    let currentStaffData = [];
    const elements = {
        notification: document.getElementById('notification'),
        staffTable: document.querySelector("#staffTable tbody"),
        addStaffForm: document.getElementById("addStaffForm"),
        formAddStaff: document.getElementById("formAddStaff"),
        filterPhone: document.getElementById("filterPhone"),
        filterId: document.getElementById("filterId"),
        filterName: document.getElementById("filterName"),
        restoreFile: document.getElementById('restoreFile')
    };

    // Khởi tạo sự kiện
    const initEvents = () => {
        document.getElementById("btnAdd").addEventListener("click", showAddForm);
        document.getElementById("btnCancelAdd").addEventListener("click", hideAddForm);
        elements.formAddStaff.addEventListener("submit", handleStaffSubmit);
        document.getElementById("btnFilter").addEventListener("click", filterStaff);
        document.getElementById("btnClearFilter").addEventListener("click", clearFilters);
        document.getElementById("btnExport").addEventListener("click", exportCSV);
        document.getElementById("btnBackup").addEventListener("click", backupData);
        document.getElementById("btnRestore").addEventListener("click", () => elements.restoreFile.click());
        elements.restoreFile.addEventListener('change', (e) => e.target.files[0] && restoreData(e.target.files[0]));
        [elements.filterId, elements.filterName, elements.filterPhone].forEach(el => el.addEventListener("input", filterStaff));
        elements.staffTable.addEventListener('click', handleTableActions);
    };

    // Hiển thị thông báo
    const showNotification = (message, isError = false) => {
        elements.notification.textContent = message;
        elements.notification.className = `notification${isError ? ' error' : ''} show`;
        setTimeout(() => elements.notification.classList.remove('show'), 3000);
    };

    // Xử lý dữ liệu
    const SERVER_URL = 'http://localhost:3000/staff'; // Đổi nếu deploy online

const saveStaffData = async () => {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentStaffData)
        });
        if (!response.ok) throw new Error("Lỗi khi lưu dữ liệu lên server.");
        showNotification("Dữ liệu đã được lưu lên server!");
    } catch (error) {
        console.error(error);
        showNotification("Không thể lưu dữ liệu lên server!", true);
    }
};

const loadStaffData = async () => {
    try {
        const response = await fetch(SERVER_URL);
        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu từ server.");
        currentStaffData = await response.json();
        renderStaffTable();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ server:", error);
        showNotification("Không thể tải dữ liệu từ server!", true);
        currentStaffData = [];
        renderStaffTable();
    }
};


    // Render bảng
    const renderStaffTable = (data = currentStaffData) => {
        elements.staffTable.innerHTML = data.length ? generateTableRows(data) : 
            `<tr><td colspan="5" style="text-align: center; padding: 30px;">
                <i class="fas fa-info-circle"></i> ${data === currentStaffData ? 'Không có nhân viên nào' : 'Không tìm thấy nhân viên phù hợp'}
            </td></tr>`;
    };

    const generateTableRows = data => data.map((staff, index) => `
        <tr>
            <td>${staff.id}</td>
            <td>${staff.name}</td>
            <td>${staff.phone}</td>
            <td>${staff.position}</td>
            <td class="action-cell">
                <button class="action-btn edit-btn" data-index="${index}"><i class="fas fa-edit"></i> Sửa</button>
                <button class="action-btn delete-btn" data-index="${index}"><i class="fas fa-trash"></i> Xóa</button>
            </td>
        </tr>`
    ).join('');

    // Xử lý hành động trong bảng
    const handleTableActions = e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const index = btn.dataset.index;
        btn.classList.contains('edit-btn') ? editStaff(index) : 
        btn.classList.contains('delete-btn') && deleteStaff(index);
    };

    // Quản lý nhân viên
    const addStaffToLocal = staff => {
        if (currentStaffData.some(s => s.id === staff.id)) {
            showNotification("Mã nhân viên đã tồn tại!", true);
            return false;
        }
        currentStaffData.push(staff);
        saveStaffData();
        showNotification("Thêm nhân viên thành công!");
        return true;
    };

    const editStaff = index => {
        const {id, name, phone, position} = currentStaffData[index];
        ['staffId', 'staffName', 'staffPhone', 'staffPosition'].forEach((id, i) => 
            document.getElementById(id).value = [id, name, phone, position][i]);
        elements.addStaffForm.style.display = 'block';
        elements.formAddStaff.dataset.editIndex = index;
    };

    const updateStaff = (index, updatedStaff) => {
        currentStaffData[index] = updatedStaff;
        saveStaffData();
        showNotification("Cập nhật nhân viên thành công!");
    };

    const deleteStaff = index => {
        if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
            currentStaffData.splice(index, 1);
            saveStaffData();
            showNotification("Đã xóa nhân viên thành công!");
        }
    };

    // Bộ lọc
    const filterStaff = () => {
        const [phone, id, name] = ['filterPhone', 'filterId', 'filterName'].map(id => 
            document.getElementById(id).value.trim().toLowerCase());
        
        const filtered = currentStaffData.filter(staff => 
            (!phone || staff.phone?.toLowerCase().includes(phone)) &&
            (!id || staff.id?.toLowerCase().includes(id)) &&
            (!name || staff.name?.toLowerCase().includes(name)));
        
        renderStaffTable(filtered);
        filtered.length === 0 && showNotification("Không tìm thấy nhân viên phù hợp");
    };

    const clearFilters = () => {
        ['filterPhone', 'filterId', 'filterName'].forEach(id => 
            document.getElementById(id).value = "");
        renderStaffTable();
    };

    // Xuất dữ liệu
    const exportCSV = () => {
        if (!currentStaffData.length) return showNotification("Không có dữ liệu để xuất", true);
        
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Mã nhân viên,Tên nhân viên,Số điện thoại,Chức vụ\n"
            + currentStaffData.map(s => [s.id, s.name, s.phone, s.position].join(",")).join("\n");
        
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "danh_sach_nhan_vien.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        showNotification("Xuất file CSV thành công!");
    };

    // Sao lưu & khôi phục
    const backupData = () => {
        const dataUri = 'data:application/json;charset=utf-8,' 
            + encodeURIComponent(JSON.stringify(currentStaffData));
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `staff_backup_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        showNotification("Sao lưu dữ liệu thành công!");
    };

    const restoreData = file => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error("File không hợp lệ");
                currentStaffData = data;
                saveStaffData();
                showNotification("Khôi phục dữ liệu thành công!");
            } catch (error) {
                showNotification(`Lỗi khi đọc file: ${error.message}`, true);
            }
        };
        reader.readAsText(file);
    };

    // Quản lý form
    const showAddForm = () => {
        elements.formAddStaff.reset();
        delete elements.formAddStaff.dataset.editIndex;
        elements.addStaffForm.style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hideAddForm = () => {
        elements.addStaffForm.style.display = "none";
        elements.formAddStaff.reset();
        delete elements.formAddStaff.dataset.editIndex;
    };

    const handleStaffSubmit = e => {
        e.preventDefault();
        const newStaff = {
            id: document.getElementById("staffId").value.trim(),
            name: document.getElementById("staffName").value.trim(),
            phone: document.getElementById("staffPhone").value.trim(),
            position: document.getElementById("staffPosition").value.trim(),
        };

        // Validate
        if (Object.values(newStaff).some(v => !v)) 
            return showNotification("Vui lòng nhập đầy đủ thông tin!", true);
        if (!/^\d{10,11}$/.test(newStaff.phone)) 
            return showNotification("Số điện thoại không hợp lệ!", true);

        // Xử lý cập nhật/thêm mới
        const editIndex = elements.formAddStaff.dataset.editIndex;
        editIndex !== undefined ? updateStaff(editIndex, newStaff) : addStaffToLocal(newStaff);
        hideAddForm();
    };

    // Khởi chạy ứng dụng
    initEvents();
});