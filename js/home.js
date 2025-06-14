// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDV06m47eD90e8n3vTd6B9NmKsEOUz_r_E",
    authDomain: "foodiee-506f6.firebaseapp.com",
    projectId: "foodiee-506f6",
    storageBucket: "foodiee-506f6.appspot.com",
    messagingSenderId: "628837902932",
    appId: "1:628837902932:web:fcdfcfca84ad76e700dbc1",
    measurementId: "G-3ZNLCPWM94"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// DOM Elements
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const todayRevenueEl = document.getElementById('todayRevenue');
const todayCustomersEl = document.getElementById('todayCustomers');
const takeawayRateEl = document.getElementById('takeawayRate');
const monthDebtEl = document.getElementById('monthDebt');
const activityList = document.getElementById('activityList');

// Toggle sidebar
if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });
}

// Check authentication
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        // Load data once authenticated
        loadData();
    }
});

// Format currency
function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND'
    });
}

// Format date to YYYY-MM-DD
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date to Vietnamese format
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get days in month
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// Load data from Firebase
function loadData(monthFilter = 'current') {
    // Load today's revenue and customers
    const today = getTodayDate();
    const ordersRef = db.ref('orders');
    const debtsRef = db.ref('debts');
    
    // Xác định tháng cần lọc
    let targetMonth;
    if (monthFilter === 'current') {
        targetMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    } else {
        targetMonth = monthFilter;
    }
    
    // Get today's orders
    ordersRef.orderByChild('date').equalTo(today).once('value', (snapshot) => {
        const orders = snapshot.val();
        let totalRevenue = 0;
        let customerCount = 0;
        let dineInCount = 0;
        let takeawayCount = 0;
        
        if (orders) {
            Object.keys(orders).forEach(key => {
                const order = orders[key];
                // Chỉ tính đơn hàng của tháng hiện tại
                if (order.date.startsWith(targetMonth)) {
                    totalRevenue += order.total;
                    customerCount++;
                    
                    if (order.type === 'dine-in') {
                        dineInCount++;
                    } else {
                        takeawayCount++;
                    }
                }
            });
        }
        
        todayRevenueEl.textContent = formatCurrency(totalRevenue);
        todayCustomersEl.textContent = customerCount;
        
        // Calculate takeaway rate
        const takeawayRate = customerCount > 0 ? Math.round((takeawayCount / customerCount) * 100) : 0;
        takeawayRateEl.textContent = takeawayRate + '%';
        
        // Update change indicators
        updateChangeIndicators(totalRevenue, customerCount, takeawayRate);
        
        // Draw order type chart
        drawOrderTypeChart(dineInCount, takeawayCount);
    });
    
    // Get monthly debt
    debtsRef.orderByChild('month').equalTo(targetMonth).once('value', (snapshot) => {
        const debts = snapshot.val();
        let totalDebt = 0;
        
        if (debts) {
            Object.keys(debts).forEach(key => {
                totalDebt += debts[key].amount;
            });
        }
        
        monthDebtEl.textContent = formatCurrency(totalDebt);
        document.getElementById('debtChange').innerHTML = `<span class="${totalDebt > 0 ? 'negative' : 'positive'}">${totalDebt > 0 ? 'Cần thanh toán' : 'Không có nợ'}</span>`;
    });
    
    // Load revenue and customers for charts
    loadChartData(targetMonth);
    
    // Load recent activities
    loadActivities();
}

// Load chart data
function loadChartData(targetMonth) {
    const ordersRef = db.ref('orders');
    
    // Tạo ngày bắt đầu và kết thúc của tháng
    const [year, month] = targetMonth.split('-');
    const daysInMonth = getDaysInMonth(parseInt(year), parseInt(month));
    const startDate = `${targetMonth}-01`;
    const endDate = `${targetMonth}-${daysInMonth < 10 ? '0' + daysInMonth : daysInMonth}`;
    
    ordersRef.orderByChild('date').startAt(startDate).endAt(endDate).once('value', (snapshot) => {
        const orders = snapshot.val();
        const revenueByDay = {};
        const customersByDay = {};
        
        // Tạo cấu trúc dữ liệu cho tất cả các ngày trong tháng
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${targetMonth}-${day < 10 ? '0' + day : day}`;
            revenueByDay[dateKey] = 0;
            customersByDay[dateKey] = 0;
        }
        
        if (orders) {
            Object.keys(orders).forEach(key => {
                const order = orders[key];
                const day = order.date;
                
                if (revenueByDay.hasOwnProperty(day)) {
                    revenueByDay[day] += order.total;
                    customersByDay[day] += 1;
                }
            });
        }
        
        // Sắp xếp ngày
        const sortedDays = Object.keys(revenueByDay).sort();
        const revenueData = sortedDays.map(day => revenueByDay[day] / 1000000); // Chuyển sang triệu VNĐ
        const customersData = sortedDays.map(day => customersByDay[day]);
        
        // Chỉ lấy số ngày (không cần tháng) cho nhãn
        const dayLabels = sortedDays.map(day => day.split('-')[2]);
        
        // Vẽ biểu đồ
        drawRevenueChart(dayLabels, revenueData);
        drawCustomersChart(dayLabels, customersData);
    });
}

// Update change indicators
function updateChangeIndicators(revenue, customers, takeawayRate) {
    // For demo purposes - in real app, compare with previous day's data
    const revenueChange = revenue > 15000000 ? 'positive' : 'negative';
    const revenueChangeValue = revenue > 15000000 ? '+12.5%' : '-5.2%';
    
    const customersChange = customers > 100 ? 'positive' : 'negative';
    const customersChangeValue = customers > 100 ? '+8.4%' : '-3.7%';
    
    const takeawayChange = takeawayRate > 30 ? 'positive' : 'negative';
    const takeawayChangeValue = takeawayRate > 30 ? '+4.2%' : '-2.1%';
    
    document.getElementById('revenueChange').innerHTML = 
        `<span class="${revenueChange}">${revenueChangeValue}</span> so với hôm qua`;
    
    document.getElementById('customersChange').innerHTML = 
        `<span class="${customersChange}">${customersChangeValue}</span> so với hôm qua`;
    
    document.getElementById('takeawayChange').innerHTML = 
        `<span class="${takeawayChange}">${takeawayRate > 30 ? '+' : ''}${takeawayChangeValue}</span> so với tuần trước`;
}

// Load recent activities
function loadActivities() {
    const activitiesRef = db.ref('activities');
    
    activitiesRef.limitToLast(5).once('value', (snapshot) => {
        const activities = snapshot.val();
        activityList.innerHTML = '';
        
        if (activities) {
            Object.keys(activities).forEach(key => {
                const activity = activities[key];
                const item = document.createElement('li');
                item.className = 'activity-item';
                
                // Set icon based on type
                let iconClass = '';
                if (activity.type === 'order') iconClass = 'order';
                else if (activity.type === 'inventory') iconClass = 'inventory';
                else if (activity.type === 'staff') iconClass = 'staff';
                
                item.innerHTML = `
                    <div class="activity-icon ${iconClass}">
                        <i class="fas ${activity.icon || 'fa-info-circle'}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${formatDate(activity.timestamp)}</div>
                    </div>
                `;
                
                activityList.appendChild(item);
            });
        } else {
            activityList.innerHTML = '<li class="activity-item">Không có hoạt động nào gần đây</li>';
        }
    });
}

// Draw charts
function drawRevenueChart(labels, data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }
    
    window.revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: data,
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'tr';
                        }
                    }
                }
            }
        }
    });
}

function drawCustomersChart(labels, data) {
    const ctx = document.getElementById('customersChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.customersChartInstance) {
        window.customersChartInstance.destroy();
    }
    
    window.customersChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số khách hàng',
                data: data,
                backgroundColor: 'rgba(33, 150, 243, 0.7)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function drawOrderTypeChart(dineIn, takeaway) {
    const ctx = document.getElementById('orderTypeChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.orderTypeChartInstance) {
        window.orderTypeChartInstance.destroy();
    }
    
    window.orderTypeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tại quán', 'Mang về'],
            datasets: [{
                data: [dineIn, takeaway],
                backgroundColor: [
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(244, 67, 54, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 152, 0, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Tạo dữ liệu mẫu cho tháng 5
function generateTestData() {
    const ordersRef = db.ref('orders');
    const debtsRef = db.ref('debts');
    const activitiesRef = db.ref('activities');
    
    // Xóa dữ liệu cũ nếu có
    ordersRef.remove();
    debtsRef.remove();
    activitiesRef.remove();
    
    // Tạo dữ liệu đơn hàng tháng 5
    const orders = {};
    const month = '2023-05';
    
    for (let day = 1; day <= 31; day++) {
        const date = `${month}-${day < 10 ? '0' + day : day}`;
        
        // Số lượng đơn hàng mỗi ngày (ngẫu nhiên)
        const numOrders = Math.floor(Math.random() * 15) + 8; // 8-22 đơn/ngày
        
        for (let i = 0; i < numOrders; i++) {
            const orderId = `order_${date}_${i}`;
            const isTakeaway = Math.random() > 0.7; // 30% mang về
            const total = Math.floor(Math.random() * 500000) + 100000; // 100k-600k
            
            orders[orderId] = {
                id: `ORD-${date.replace(/-/g, '')}-${i}`,
                date: date,
                type: isTakeaway ? 'takeaway' : 'dine-in',
                total: total,
                items: [
                    {name: "Phở bò", quantity: 1, price: 50000},
                    {name: "Nước cam", quantity: 1, price: 25000}
                ]
            };
        }
    }
    
    // Tạo dữ liệu công nợ tháng 5
    const debts = {
        debt1: {
            supplier: "Nhà cung cấp thịt bò",
            amount: 2500000,
            dueDate: "2023-05-15",
            month: month,
            paid: false
        },
        debt2: {
            supplier: "Nhà cung cấp rau củ",
            amount: 1200000,
            dueDate: "2023-05-25",
            month: month,
            paid: false
        }
    };
    
    // Tạo dữ liệu hoạt động tháng 5
    const activities = {
        activity1: {
            type: "order",
            description: "Đơn hàng #ORD-2023051501 đã thanh toán thành công - 1,250,000 VNĐ",
            timestamp: "2023-05-15T10:30:00Z",
            icon: "fa-cash-register"
        },
        activity2: {
            type: "inventory",
            description: "Nhập kho 50kg thịt bò Mỹ từ nhà cung cấp ABC",
            timestamp: "2023-05-10T09:15:00Z",
            icon: "fa-box"
        },
        activity3: {
            type: "staff",
            description: "Nhân viên Nguyễn Văn A đã điểm danh ca sáng",
            timestamp: "2023-05-05T07:45:00Z",
            icon: "fa-user"
        },
        activity4: {
            type: "order",
            description: "Đơn hàng #ORD-2023052003 đã thanh toán thành công - 850,000 VNĐ",
            timestamp: "2023-05-20T14:20:00Z",
            icon: "fa-cash-register"
        }
    };
    
    // Ghi dữ liệu lên Firebase
    ordersRef.set(orders)
        .then(() => {
            return debtsRef.set(debts);
        })
        .then(() => {
            return activitiesRef.set(activities);
        })
        .then(() => {
            alert('Đã tạo dữ liệu mẫu cho tháng 5 thành công!');
            // Tải lại trang để xem dữ liệu mới
            setTimeout(() => location.reload(), 1000);
        })
        .catch(error => {
            console.error("Lỗi khi tạo dữ liệu mẫu:", error);
            alert('Có lỗi xảy ra khi tạo dữ liệu mẫu: ' + error.message);
        });
}

// Thêm bộ lọc theo tháng
function setupMonthFilter() {
    // Tạo dropdown chọn tháng
    const filterHTML = `
    <div class="filter-controls">
        <div class="filter-group">
            <label class="filter-label">Xem báo cáo theo:</label>
            <select id="monthFilter" class="filter-select">
                <option value="current">Tháng hiện tại</option>
                <option value="2023-05">Tháng 5/2023</option>
                <option value="2023-04">Tháng 4/2023</option>
                <option value="2023-03">Tháng 3/2023</option>
            </select>
        </div>
    </div>
    `;
    
    // Chèn vào sau thẻ h1
    document.querySelector('h1').insertAdjacentHTML('afterend', filterHTML);
    
    // Xử lý thay đổi lọc
    document.getElementById('monthFilter').addEventListener('change', function() {
        loadData(this.value);
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Thêm bộ lọc tháng
    setupMonthFilter();
    
    // Thêm sự kiện cho nút tạo dữ liệu test
    const generateTestBtn = document.getElementById('generateTestData');
    if (generateTestBtn) {
        generateTestBtn.addEventListener('click', generateTestData);
    }
});