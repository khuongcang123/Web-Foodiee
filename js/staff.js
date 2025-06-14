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

    // Khởi tạo Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.database();
    
    // Kiểm tra đăng nhập
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Người dùng đã đăng nhập:", user.email);
            loadSalarySettings(); // Tải cài đặt hệ số lương trước
            loadStaffData();
        } else {
            console.log("Chưa đăng nhập, chuyển hướng...");
            window.location.href = 'login.html';
        }
    });

    let currentStaffData = [];
    let currentDetailStaff = null;
    let currentTimekeepingData = [];
    let salarySettings = { level1: 25000, level2: 0, level3: 0 }; // Mặc định
    
    const elements = {
        notification: document.getElementById('notification'),
        staffTable: document.querySelector("#staffTable tbody"),
        addStaffForm: document.getElementById("addStaffForm"),
        formAddStaff: document.getElementById("formAddStaff"),
        filterPhone: document.getElementById("filterPhone"),
        filterId: document.getElementById("filterId"),
        filterName: document.getElementById("filterName"),
        restoreFile: document.getElementById('restoreFile'),
        staffDetailModal: document.getElementById('staffDetailModal'),
        timekeepingTableBody: document.getElementById('timekeepingTableBody'),
        timekeepingMonth: document.getElementById('timekeepingMonth'),
        timekeepingYear: document.getElementById('timekeepingYear'),
        btnExportTimekeeping: document.getElementById('btnExportTimekeeping'),
        detailSalaryCoefficient: document.getElementById('detailSalaryCoefficient'),
        detailBaseSalary: document.getElementById('detailBaseSalary'),
        detailAllowance: document.getElementById('detailAllowance'),
        btnSaveSalaryChanges: document.getElementById('btnSaveSalaryChanges'),
        detailTotalSalary: document.getElementById('detailTotalSalary'),
        btnSalarySettings: document.getElementById('btnSalarySettings'),
        salarySettingsModal: document.getElementById('salarySettingsModal'),
        salaryLevel1: document.getElementById('salaryLevel1'),
        salaryLevel2: document.getElementById('salaryLevel2'),
        salaryLevel3: document.getElementById('salaryLevel3'),
        btnSaveSalarySettings: document.getElementById('btnSaveSalarySettings'),
        btnCloseSalarySettings: document.getElementById('btnCloseSalarySettings'),
    };

    // Tải cài đặt hệ số lương từ Firebase
    const loadSalarySettings = async () => {
        try {
            const snapshot = await db.ref('salarySettings').once('value');
            if (snapshot.exists()) {
                salarySettings = snapshot.val();
            }
            console.log("Cài đặt hệ số lương:", salarySettings);
        } catch (error) {
            console.error("Lỗi khi tải cài đặt hệ số lương:", error);
            showNotification("Không thể tải cài đặt hệ số lương!", true);
        }
    };

    // Lưu cài đặt hệ số lương lên Firebase
    const saveSalarySettings = async () => {
        try {
            await db.ref('salarySettings').set(salarySettings);
            showNotification("Cập nhật cài đặt hệ số lương thành công!");
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu cài đặt hệ số lương:", error);
            showNotification("Lỗi khi cập nhật cài đặt hệ số lương!", true);
            return false;
        }
    };

    // Khởi tạo năm trong bộ chọn
    const initYearSelector = () => {
        const currentYear = new Date().getFullYear();
        elements.timekeepingYear.innerHTML = '';
        
        for (let year = currentYear - 5; year <= currentYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            elements.timekeepingYear.appendChild(option);
        }
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
        document.querySelector('.close-modal').addEventListener('click', hideStaffDetail);
        document.getElementById('btnExportTimekeeping').addEventListener('click', exportTimekeepingReport);
        elements.timekeepingMonth.addEventListener('change', updateTimekeepingTable);
        elements.timekeepingYear.addEventListener('change', updateTimekeepingTable);
        
        // Toggle sidebar
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('closed');
        });
        
        // Đóng modal khi click bên ngoài
        document.addEventListener('click', (e) => {
            if (e.target === elements.staffDetailModal) {
                hideStaffDetail();
            }
            if (e.target === elements.salarySettingsModal) {
                hideSalarySettings();
            }
        });

        // Xử lý cài đặt hệ số lương
        if (elements.btnSalarySettings) {
            elements.btnSalarySettings.addEventListener('click', showSalarySettings);
        }
        if (elements.btnSaveSalarySettings) {
            elements.btnSaveSalarySettings.addEventListener('click', saveSalarySettingsHandler);
        }
        if (elements.btnCloseSalarySettings) {
            elements.btnCloseSalarySettings.addEventListener('click', hideSalarySettings);
        }
    };

    const showSalarySettings = () => {
        elements.salaryLevel1.value = salarySettings.level1;
        elements.salaryLevel2.value = salarySettings.level2;
        elements.salaryLevel3.value = salarySettings.level3;
        elements.salarySettingsModal.style.display = 'flex';
    };

    const hideSalarySettings = () => {
        elements.salarySettingsModal.style.display = 'none';
    };

    const saveSalarySettingsHandler = async () => {
        salarySettings = {
            level1: parseInt(elements.salaryLevel1.value) || 0,
            level2: parseInt(elements.salaryLevel2.value) || 0,
            level3: parseInt(elements.salaryLevel3.value) || 0
        };
        const saved = await saveSalarySettings();
        if (saved) {
            hideSalarySettings();
            // Cập nhật lại bảng lương nếu đang xem chi tiết nhân viên
            if (currentDetailStaff) {
                updateTimekeepingTable();
            }
        }
    };

    const showNotification = (message, isError = false) => {
        elements.notification.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
        elements.notification.className = `notification${isError ? ' error' : ''} show`;
        setTimeout(() => elements.notification.classList.remove('show'), 3000);
    };

    // Tải dữ liệu nhân viên từ Firebase
    const loadStaffData = async () => {
        try {
            elements.staffTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 30px;">
                        <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                    </td>
                </tr>
            `;
            
            const snapshot = await db.ref('staffs').once('value');
            const data = snapshot.val();
            
            // Chuyển đổi dữ liệu từ object sang array
            currentStaffData = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            
            renderStaffTable();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu nhân viên:", error);
            showNotification("Không thể tải dữ liệu nhân viên!", true);
            currentStaffData = [];
            renderStaffTable();
        }
    };

    // Tạo tài khoản authentication
    const createStaffAccount = async (email) => {
        const password = "123456"; // Mật khẩu mặc định
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            return true;
        } catch (error) {
            console.error("Lỗi khi tạo tài khoản:", error);
            showNotification(`Lỗi tạo tài khoản: ${error.message}`, true);
            return false;
        }
    };

    // Lưu nhân viên lên Firebase
    const saveStaffToFirebase = async (staff) => {
        try {
            // Tạo key an toàn từ ID nhân viên
            const safeKey = staff.id.replace(/[.#$\[\]]/g, '_');
            
            // Lưu vào Realtime Database
            await db.ref(`staffs/${safeKey}`).set(staff);
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu nhân viên:", error);
            showNotification(`Lỗi khi lưu nhân viên: ${error.message}`, true);
            return false;
        }
    };

    // Xóa nhân viên từ Firebase
    const deleteStaffFromFirebase = async (staffId) => {
        try {
            // Tạo key an toàn từ ID nhân viên
            const safeKey = staffId.replace(/[.#$\[\]]/g, '_');
            
            // Xóa khỏi Realtime Database
            await db.ref(`staffs/${safeKey}`).remove();
            return true;
        } catch (error) {
            console.error("Lỗi khi xóa nhân viên:", error);
            showNotification(`Lỗi khi xóa nhân viên: ${error.message}`, true);
            return false;
        }
    };

    // Tải dữ liệu chấm công từ Firebase
    const loadTimekeepingData = async (staffId) => {
        try {
            elements.timekeepingTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <div class="spinner"></div> Đang tải dữ liệu chấm công...
                    </td>
                </tr>
            `;
            
            const snapshot = await db.ref('timekeeping')
                .orderByChild('staffId')
                .equalTo(staffId)
                .once('value');
            
            const data = snapshot.val();
            currentTimekeepingData = data ? Object.values(data) : [];
            updateTimekeepingTable();
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu chấm công:", error);
            showNotification("Không thể tải dữ liệu chấm công!", true);
            currentTimekeepingData = [];
            updateTimekeepingTable();
        }
    };

    const renderStaffTable = (data = currentStaffData) => {
        elements.staffTable.innerHTML = data.length ? generateTableRows(data) :
            `<tr><td colspan="6" style="text-align: center; padding: 30px;">
                <i class="fas fa-info-circle"></i> ${data === currentStaffData ? 'Không có nhân viên nào' : 'Không tìm thấy nhân viên phù hợp'}
            </td></tr>`;
    };

    const generateTableRows = data => data.map((staff) => `
        <tr>
            <td>${staff.id}</td>
            <td>${staff.name}</td>
            <td>${staff.phone}</td>
            <td>${staff.position}</td>
            <td>Cấp ${staff.salaryCoefficient}</td>
            <td class="action-cell">
                <button class="action-btn detail-btn" data-id="${staff.id}"><i class="fas fa-info-circle"></i> Chi tiết</button>
                <button class="action-btn edit-btn" data-id="${staff.id}"><i class="fas fa-edit"></i> Sửa</button>
                <button class="action-btn delete-btn" data-id="${staff.id}"><i class="fas fa-trash"></i> Xóa</button>
            </td>
        </tr>`).join('');

    const handleTableActions = e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const staffId = btn.dataset.id;
        if (btn.classList.contains('detail-btn')) {
            showStaffDetail(staffId);
        } else if (btn.classList.contains('edit-btn')) {
            editStaff(staffId);
        } else if (btn.classList.contains('delete-btn')) {
            deleteStaff(staffId);
        }
    };

    const showStaffDetail = (staffId) => {
        // Tạo key an toàn từ ID nhân viên
        const safeKey = staffId.replace(/[.#$\[\]]/g, '_');
        
        const staff = currentStaffData.find(s => s.id === staffId);
        if (!staff) return;
        
        currentDetailStaff = staff;
        
        // Cập nhật thông tin nhân viên
        document.getElementById('detailStaffId').textContent = staff.id;
        document.getElementById('detailStaffName').textContent = staff.name;
        document.getElementById('detailStaffPosition').textContent = staff.position;
        document.getElementById('detailStaffEmail').textContent = staff.email;
        elements.detailSalaryCoefficient.value = staff.salaryCoefficient;
        elements.detailBaseSalary.value = staff.baseSalary;
        elements.detailAllowance.value = staff.allowance || 0;
        
        // Hiển thị modal
        elements.staffDetailModal.style.display = 'flex';
        
        // Tải dữ liệu chấm công
        loadTimekeepingData(staff.id);
    };

    const hideStaffDetail = () => {
        elements.staffDetailModal.style.display = 'none';
        currentDetailStaff = null;
    };

    const updateTimekeepingTable = () => {
        if (!currentDetailStaff) return;
        
        const month = parseInt(elements.timekeepingMonth.value);
        const year = parseInt(elements.timekeepingYear.value);
        
        // Lọc theo tháng và năm
        const filteredTimekeeping = currentTimekeepingData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === month && recordDate.getFullYear() === year;
        });
        
        // Hiển thị dữ liệu
        let totalWorkHours = 0;
        let totalWorkDays = 0;
        
        elements.timekeepingTableBody.innerHTML = filteredTimekeeping.length > 0 ? 
            filteredTimekeeping.map(record => {
                const workHours = calculateWorkHours(record.checkin, record.checkout);
                if (workHours > 0) totalWorkDays++;
                totalWorkHours += workHours;
                
                return `
                    <tr>
                        <td>${formatDate(record.date)}</td>
                        <td>${record.checkin || '--'}</td>
                        <td>${record.checkout || '--'}</td>
                        <td>${workHours > 0 ? workHours.toFixed(1) + ' giờ' : '--'}</td>
                        <td>${record.status || 'Chưa xác định'}</td>
                    </tr>
                `;
            }).join('') : 
            `<tr><td colspan="5" style="text-align: center; padding: 20px;">Không có dữ liệu chấm công</td></tr>`;
        
        // Cập nhật tổng cộng
        document.getElementById('totalWorkHours').textContent = totalWorkHours.toFixed(1) + ' giờ';
        document.getElementById('totalWorkDays').textContent = totalWorkDays + ' công';
        
        // Tính và hiển thị tổng lương
        const totalSalary = calculateTotalSalary(
            currentDetailStaff.salaryCoefficient,
            totalWorkHours,
            currentDetailStaff.baseSalary,
            currentDetailStaff.allowance || 0
        );
        document.getElementById('detailTotalSalary').textContent = formatCurrency(totalSalary) + ' VNĐ';
    };

    // Hàm tính tổng lương mới
    const calculateTotalSalary = (salaryLevel, totalWorkHours, baseSalary, allowance) => {
        // Lấy mức lương theo cấp từ cài đặt
        const hourlyRate = salarySettings[`level${salaryLevel}`] || 0;
        
        // Tính lương theo giờ = tổng giờ làm * mức lương/giờ
        const salaryByHours = totalWorkHours * hourlyRate;
        
        // Tổng lương = lương theo giờ + lương cơ bản + phụ cấp
        return salaryByHours + (baseSalary || 0) + (allowance || 0);
    };

    const calculateWorkHours = (checkin, checkout) => {
        if (!checkin || !checkout) return 0;
        
        const [inHour, inMinute] = checkin.split(':').map(Number);
        const [outHour, outMinute] = checkout.split(':').map(Number);
        
        const totalInMinutes = inHour * 60 + inMinute;
        const totalOutMinutes = outHour * 60 + outMinute;
        
        // Tính thời gian làm việc (giờ)
        return (totalOutMinutes - totalInMinutes) / 60;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const exportTimekeepingReport = () => {
                if (!currentDetailStaff) return;
                
                const month = parseInt(elements.timekeepingMonth.value) + 1;
                const year = parseInt(elements.timekeepingYear.value);
                
                // Tạo nội dung CSV
                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += `Báo cáo chấm công tháng ${month}/${year}\n`;
                csvContent += `Nhân viên: ${currentDetailStaff.name} (${currentDetailStaff.id})\n\n`;
                
                csvContent += "Ngày,Check-in,Check-out,Thời gian làm việc,Trạng thái\n";
                
                const filteredTimekeeping = currentTimekeepingData.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate.getMonth() === month - 1 && recordDate.getFullYear() === year;
                });
                
                filteredTimekeeping.forEach(record => {
                    const workHours = calculateWorkHours(record.checkin, record.checkout);
                    csvContent += `${formatDate(record.date)},${record.checkin || ''},${record.checkout || ''},`;
                    csvContent += `${workHours > 0 ? workHours.toFixed(1) + ' giờ' : ''},${record.status || ''}\n`;
                });
                
                // Tạo và tải file
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `cham_cong_${currentDetailStaff.id}_${month}_${year}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

    const showAddForm = () => {
        elements.formAddStaff.reset();
        document.getElementById("staffSalaryCoefficient").value = "1";
        document.getElementById("staffBaseSalary").value = "5000000";
        document.getElementById("staffAllowance").value = "0";
        document.getElementById("staffId").readOnly = false;
        delete elements.formAddStaff.dataset.editId;
        elements.addStaffForm.style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hideAddForm = () => {
                elements.addStaffForm.style.display = "none";
                elements.formAddStaff.reset();
                delete elements.formAddStaff.dataset.editId;
            };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        const newStaff = {
            id: document.getElementById("staffId").value.trim(),
            name: document.getElementById("staffName").value.trim(),
            email: document.getElementById("staffEmail").value.trim(),
            phone: document.getElementById("staffPhone").value.trim(),
            position: document.getElementById("staffPosition").value.trim(),
            salaryCoefficient: parseInt(document.getElementById("staffSalaryCoefficient").value) || 1,
            baseSalary: parseInt(document.getElementById("staffBaseSalary").value) || 0,
            allowance: parseInt(document.getElementById("staffAllowance").value) || 0
        };

        // Validate dữ liệu
        if (Object.values(newStaff).some(v => !v))
            return showNotification("Vui lòng nhập đầy đủ thông tin!", true);
        
        if (!/^\d{10,11}$/.test(newStaff.phone))
            return showNotification("Số điện thoại không hợp lệ!", true);
        
        // Kiểm tra hệ số lương hợp lệ (1-3)
        if (newStaff.salaryCoefficient < 1 || newStaff.salaryCoefficient > 3) {
            return showNotification("Hệ số lương phải là 1, 2 hoặc 3!", true);
        }
        
        const editId = elements.formAddStaff.dataset.editId;
        
        if (editId) {
                    // Cập nhật nhân viên
                    try {
                        // Tạo key an toàn từ ID nhân viên
                        const safeKey = getSafeKey(newStaff.id);
                        await db.ref(`staffs/${safeKey}`).set(newStaff);
                        showNotification("Cập nhật nhân viên thành công!");
                        hideAddForm();
                        loadStaffData();
                    } catch (error) {
                        showNotification("Lỗi khi cập nhật nhân viên!", true);
                        console.error(error);
                    }
                } else {
                    // Thêm nhân viên mới
                    if (currentStaffData.some(s => s.id === newStaff.id)) {
                        return showNotification("Mã nhân viên đã tồn tại!", true);
                    }
                    
                    // Tạo tài khoản authentication với email
                    const accountCreated = await createStaffAccount(newStaff.email);
                    if (!accountCreated) return;
                    
                    // Lưu thông tin nhân viên
                    const saved = await saveStaffToFirebase(newStaff);
                    if (saved) {
                        showNotification("Thêm nhân viên thành công!");
                        hideAddForm();
                        loadStaffData();
                    }
                }
            };

            const editStaff = (staffId) => {
                const staff = currentStaffData.find(s => s.id === staffId);
                if (!staff) return;
                
                document.getElementById("staffId").value = staff.id;
                document.getElementById("staffName").value = staff.name;
                document.getElementById("staffEmail").value = staff.email; // Hiển thị email
                document.getElementById("staffPhone").value = staff.phone;
                document.getElementById("staffPosition").value = staff.position;
                document.getElementById("staffSalaryCoefficient").value = staff.salaryCoefficient;
                document.getElementById("staffBaseSalary").value = staff.baseSalary;
                document.getElementById("staffAllowance").value = staff.allowance || 0;
                
                document.getElementById("staffId").readOnly = true;
                elements.formAddStaff.dataset.editId = staff.id;
                elements.addStaffForm.style.display = 'block';
            };

            const deleteStaff = async (staffId) => {
                if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
                    const success = await deleteStaffFromFirebase(staffId);
                    if (success) {
                        showNotification("Đã xóa nhân viên thành công!");
                        loadStaffData();
                    }
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
                    + "Mã nhân viên,Tên nhân viên,Email,Số điện thoại,Chức vụ,Hệ số lương,Lương cơ bản,Phụ cấp\n"
                    + currentStaffData.map(s => 
                        [s.id, s.name, s.email, s.phone, s.position, s.salaryCoefficient, s.baseSalary, s.allowance || 0].join(",")
                    ).join("\n");

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
                reader.onload = async e => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (!Array.isArray(data)) throw new Error("File không hợp lệ");
                        
                        // Xóa toàn bộ dữ liệu cũ
                        await db.ref('staffs').remove();
                        
                        // Tạo tài khoản mới cho từng nhân viên
                        for (const staff of data) {
// Tạo tài khoản authentication bằng email
                            const accountCreated = await createStaffAccount(staff.email);
                            if (!accountCreated) continue;
                            
                            // Lưu thông tin nhân viên
                            await saveStaffToFirebase(staff);
                        }
                        
                        showNotification("Khôi phục dữ liệu thành công!");
                        loadStaffData();
                    } catch (error) {
                        showNotification(`Lỗi khi đọc file: ${error.message}`, true);
                    }
                };
                reader.readAsText(file);
            };

    // Hàm tạo key an toàn từ ID nhân viên
    const getSafeKey = (id) => {
        return id.replace(/[.#$\[\]]/g, '_');
    };

    // Khởi tạo ứng dụng
    initYearSelector();
    initEvents();
    
    if (elements.btnSaveSalaryChanges) {
        elements.btnSaveSalaryChanges.addEventListener("click", async () => {
            if (!currentDetailStaff) return;

            const updated = {
                ...currentDetailStaff,
                salaryCoefficient: parseInt(elements.detailSalaryCoefficient.value) || 1,
                baseSalary: parseInt(elements.detailBaseSalary.value) || 0,
                allowance: parseInt(elements.detailAllowance.value) || 0
            };

            try {
                // Tạo key an toàn từ ID nhân viên
                const safeKey = getSafeKey(updated.id);
                await db.ref(`staffs/${safeKey}`).set(updated);
                showNotification("Cập nhật lương thành công!");
                currentDetailStaff = updated;
                loadStaffData();
                updateTimekeepingTable();
            } catch (err) {
                showNotification("Lỗi khi cập nhật lương!", true);
            }
        });
    }
    
    ['detailSalaryCoefficient', 'detailBaseSalary', 'detailAllowance'].forEach(id => {
        elements[id].addEventListener('input', () => {
            if (!currentDetailStaff) return;
            const level = parseInt(elements.detailSalaryCoefficient.value) || 1;
            const base = parseInt(elements.detailBaseSalary.value) || 0;
            const allowance = parseInt(elements.detailAllowance.value) || 0;
            
            // Lấy tổng giờ làm việc từ phần tổng cộng trong bảng chấm công
            const totalWorkHoursElement = document.getElementById('totalWorkHours');
            let totalWorkHours = 0;
            if (totalWorkHoursElement) {
                // text có dạng: "XX giờ", chúng ta cần lấy số
                const text = totalWorkHoursElement.textContent;
                totalWorkHours = parseFloat(text) || 0;
            }
            
            // Tính lại tổng lương với công thức mới
            const total = calculateTotalSalary(level, totalWorkHours, base, allowance);
            elements.detailTotalSalary.textContent = formatCurrency(total) + ' VNĐ';
        });
    });
    
    // Xử lý sự kiện click trên bảng
    elements.staffTable.addEventListener('click', handleTableActions);
});