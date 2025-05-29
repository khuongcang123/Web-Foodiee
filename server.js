const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

const FILE_PATH = 'staff.json';

app.use(cors()); // Cho phép truy cập từ trình duyệt khác
app.use(express.json());

// Đọc danh sách nhân viên
app.get('/staff', (req, res) => {
    try {
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        const staffList = JSON.parse(data);
        res.json(staffList);
    } catch (err) {
        res.status(500).json({ error: 'Không thể đọc dữ liệu.' });
    }
});

// Lưu danh sách nhân viên
app.post('/staff', (req, res) => {
    try {
        const newData = req.body;
        if (!Array.isArray(newData)) {
            return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
        }
        fs.writeFileSync(FILE_PATH, JSON.stringify(newData, null, 2));
        res.json({ message: 'Lưu dữ liệu thành công.' });
    } catch (err) {
        res.status(500).json({ error: 'Không thể lưu dữ liệu.' });
    }
});

// Chạy server
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
