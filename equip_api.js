const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: "uploads/" }); // โฟลเดอร์เก็บไฟล์ชั่วคราว
const db = require("./db"); // สมมติคุณมีโมดูลเชื่อม MySQL
const port = 4000;

//Database(MySql) configuration
const db = mysql.createConnection(
  {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'equipment'
  }
)
db.connect()

//Middleware (Body parser)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
//Hello World API
app.get('/', function(req, res){
  res.send('Hello World!');
});

//Register
app.post('/api/register', function(req, res){
  const { username, password, firstname, lastname } = req.body;
  const sql = 'INSERT INTO user (username, password, firstname, lastname ) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [username, password, firstname, lastname], 
    function(err, result) {
    if (err) throw err;
    res.send({ message: 'ลงทะเบียนสำเร็จ','status':true });
}
  );
}); 

//Login
app.post('/api/login', function(req, res){
  const { username, password } = req.body;
  let sql = 'SELECT * FROM user WHERE ';
  sql += "username ='" + username+ "'";
  sql += " AND password ='" + password + "'";
  console.log(sql);
  //' OR '1=1
  db.query(sql, [username, password], function(err, result) {
    if (err) throw err;
    if (result.length > 0) {
      let user = result[0]
      user['message'] = 'เข้าสู่ระบบสำเร็จ';
      user['status'] = true;
      res.send(user);
    }
    else {
      res.send({ 'message': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'status': false });
    }
  })
}
);
   
// Forgot Password
app.post('/api/forgot-password', (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ status: false, message: "กรุณาระบุ username และ newPassword" });
  }

  const sql = "UPDATE user SET password = ? WHERE username = ?";
  db.query(sql, [newPassword, username], (err, result) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดทางเซิร์ฟเวอร์" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบผู้ใช้นี้" });
    }

    res.json({ status: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  });
});



// ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม userID (base64)
app.get('/api/profile/:id', (req, res) => {
  const userID = req.params.id; // ✅ แก้ตรงนี้
  const sql = "SELECT  firstName, lastName, email, mobilePhone, division, imageFile FROM user WHERE userID = ?";
  db.query(sql, [userID], (err, result) => {
    if (err) {
      console.error("❌ SQL Error: " + err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาด", status: false });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน", status: false });
    }
    res.json(result[0]);
  });
});


// อัปเดตข้อมูลโปรไฟล์และอัปโหลดรูป (base64)
app.post('/api/profile/update', (req, res) => {
  const { userID, firstName, lastName, email, mobilePhone, division, imageFile } = req.body;

  if (!userID) {
    return res.status(400).json({ status: false, message: "ไม่พบ userID" });
  }

  const sql = "UPDATE user SET firstName = ?, lastName = ?, email = ?, mobilePhone = ?, division = ?, imageFile = ? WHERE userID = ?";
  db.query(sql, [firstName, lastName, email, mobilePhone, division, imageFile, userID], (err, result) => {
    if (err) {
      console.error("❌ SQL Error: " + err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาด", status: false });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน", status: false });
    }

    res.json({ message: "ข้อมูลถูกอัปเดตเรียบร้อยแล้ว", status: true });
  });
});

// ดึงข้อมูลอุปกรณ์สำนักงานทั้งหมดจากตาราง equipments
app.get('/api/equipment', (req, res) => {
  const sql = "SELECT * FROM equipments";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ SQL Error: " + err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาด", status: false });
    }
    res.json(result);
  });
});

// อัปเดตจำนวนอุปกรณ์ที่ถูกเบิก

app.post("/api/bring-confirm", upload.single("idCardImg"), (req, res) => {
  const { selectedDate, requestAmounts } = req.body;
  const userID = req.headers['userid']; // สมมติเอา userID มาจาก header (หรือ token / session ตามจริง)

  if (!selectedDate || !requestAmounts) {
    return res.json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  let requestObj;
  try {
    requestObj = JSON.parse(requestAmounts);
  } catch {
    return res.json({ status: false, message: "requestAmounts ไม่ถูกต้อง" });
  }

  if (!req.file) {
    return res.json({ status: false, message: "กรุณาแนบรูปบัตรประจำตัว" });
  }

  const idCardImgPath = req.file.path;

  // 1. เตรียมคำสั่งอัพเดตจำนวนคงเหลือใน equipments
  const updatePromises = Object.entries(requestObj).map(([equipmentID, amount]) => {
    return new Promise((resolve, reject) => {
      // ตรวจสอบจำนวนคงเหลือก่อน
      db.query(
        "SELECT amount FROM equipments WHERE equipmentID = ?",
        [equipmentID],
        (err, results) => {
          if (err) return reject(err);
          if (results.length === 0) return reject(new Error(`ไม่พบอุปกรณ์ ID ${equipmentID}`));

          const currentAmount = results[0].amount;
          const newAmount = currentAmount - amount;
          if (newAmount < 0) return reject(new Error(`จำนวนเบิกเกินคงเหลือ ID ${equipmentID}`));

          // อัพเดตจำนวนคงเหลือ
          db.query(
            "UPDATE equipments SET amount = ? WHERE equipmentID = ?",
            [newAmount, equipmentID],
            (err2) => {
              if (err2) return reject(err2);
              resolve();
            }
          );
        }
      );
    });
  });

  // 2. เตรียมคำสั่ง INSERT log การเบิกลง bring
  const insertPromises = Object.entries(requestObj).map(([equipmentID, amount]) => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO bring (equipmentID, amount, selectedDate, userID, idCardImgPath) VALUES (?, ?, ?, ?, ?)",
        [equipmentID, amount, selectedDate, userID || null, idCardImgPath],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  });

  // ทำพร้อมกัน
  Promise.all([...updatePromises, ...insertPromises])
    .then(() => {
      res.json({ status: true, message: "บันทึกการเบิกสำเร็จและอัพเดตจำนวนคงเหลือแล้ว" });
    })
    .catch((error) => {
      console.error(error);
      res.json({ status: false, message: error.message || "เกิดข้อผิดพลาด" });
    });
});


//Web sever
app.listen(port, function(){
  console.log(`Server is running on http://localhost:${port}`);
});