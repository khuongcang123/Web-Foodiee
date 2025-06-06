document.addEventListener("DOMContentLoaded", () => {
    console.log("Trang Quản lý nhân viên đã sẵn sàng.");

    // Cấu hình Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDV06m47eD90e8n3vTd6B9NmKsEOUz_r_E",
        authDomain: "foodiee-506f6.firebaseapp.com",
        projectId: "foodiee-506f6",
        storageBucket: "foodiee-506f6.appspot.com",
        messagingSenderId: "628837902932",
        appId: "1:628837902932:web:fcdfcfca84ad76e700dbc1",
        measurementId: "G-3ZNLCPWM94",
        databaseURL: "https://foodiee-506f6-default-rtdb.firebaseio.com"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.database();

    auth.onAuthStateChanged(user => user ? loadStaffData() : (window.location.href = 'login.html'));

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

    const showNotification = (message, isError = false) => {
        elements.notification.textContent = message;
        elements.notification.className = `notification${isError ? ' error' : ''} show`;
        setTimeout(() => elements.notification.classList.remove('show'), 3000);
    };

    const saveStaffData = async () => {
        try {
            await db.ref('staffs').set(currentStaffData);
            showNotification("Dữ liệu đã được lưu lên Firebase!");
        } catch (error) {
            console.error(error);
            showNotification("Không thể lưu dữ liệu lên Firebase!", true);
        }
    };

    const loadStaffData = async () => {
        try {
            const snapshot = await db.ref('staffs').once('value');
            currentStaffData = snapshot.val() || [];
            renderStaffTable();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ Firebase:", error);
            showNotification("Không thể tải dữ liệu từ Firebase!", true);
            currentStaffData = [];
            renderStaffTable();
        }
    };

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
        </tr>`).join('');

    const handleTableActions = e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const index = btn.dataset.index;
        btn.classList.contains('edit-btn') ? editStaff(index) :
            btn.classList.contains('delete-btn') && deleteStaff(index);
    };

    // Hàm tạo tài khoản nhân viên trên Firebase Authentication
    const createStaffAccount = (email) => {
        const password = "123456"; // Mật khẩu mặc định
        return auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("Tài khoản nhân viên đã được tạo:", userCredential.user.uid);
                return true;
            })
            .catch((error) => {
                console.error("Lỗi khi tạo tài khoản:", error);
                showNotification(`Lỗi tạo tài khoản: ${error.message}`, true);
                return false;
            });
    };

    const addStaffToLocal = async (staff) => {
        // Kiểm tra định dạng email
        if (!staff.id.endsWith('@gmail.com')) {
            showNotification("Mã nhân viên phải có đuôi @gmail.com!", true);
            return false;
        }
        
        // Kiểm tra trùng mã nhân viên
        if (currentStaffData.some(s => s.id === staff.id)) {
            showNotification("Mã nhân viên đã tồn tại!", true);
            return false;
        }
        
        // Tạo tài khoản authentication
        const accountCreated = await createStaffAccount(staff.id);
        if (!accountCreated) return false;
        
        // Thêm vào danh sách
        currentStaffData.push(staff);
        saveStaffData();
        showNotification("Thêm nhân viên thành công và đã tạo tài khoản!");
        return true;
    };

    const editStaff = index => {
        const { id, name, phone, position } = currentStaffData[index];
        const idField = document.getElementById("staffId");
        idField.value = id;
        idField.readOnly = true; // Không cho phép sửa email
        
        document.getElementById("staffName").value = name;
        document.getElementById("staffPhone").value = phone;
        document.getElementById("staffPosition").value = position;
        
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

    const backupData = () => {
        const dataUri = 'data:application/json;charset=utf-8,'
            + encodeURIComponent(JSON.stringify(currentStaffData));
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `staff_backup_${new Date().toISOString().slice(0, 10)}.json`;
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

    const showAddForm = () => {
        elements.formAddStaff.reset();
        // Cho phép nhập email khi thêm mới
        document.getElementById("staffId").readOnly = false; 
        delete elements.formAddStaff.dataset.editIndex;
        elements.addStaffForm.style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hideAddForm = () => {
        elements.addStaffForm.style.display = "none";
        elements.formAddStaff.reset();
        delete elements.formAddStaff.dataset.editIndex;
    };

    const handleStaffSubmit = async e => {
        e.preventDefault();
        const newStaff = {
            id: document.getElementById("staffId").value.trim(),
            name: document.getElementById("staffName").value.trim(),
            phone: document.getElementById("staffPhone").value.trim(),
            position: document.getElementById("staffPosition").value.trim(),
        };

        // Validate dữ liệu
        if (Object.values(newStaff).some(v => !v))
            return showNotification("Vui lòng nhập đầy đủ thông tin!", true);
        
        if (!/^\d{10,11}$/.test(newStaff.phone))
            return showNotification("Số điện thoại không hợp lệ!", true);
        
        const editIndex = elements.formAddStaff.dataset.editIndex;
        
        if (editIndex !== undefined) {
            // Không thay đổi email khi chỉnh sửa
            newStaff.id = currentStaffData[editIndex].id;
            updateStaff(editIndex, newStaff);
            hideAddForm();
        } else {
            // Thêm mới - yêu cầu tạo tài khoản
            const success = await addStaffToLocal(newStaff);
            success && hideAddForm();
        }
    };

    initEvents();
});