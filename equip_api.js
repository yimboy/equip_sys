const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require('path');
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
   
// ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม userID (base64)
app.get('/api/profile/:id', (req, res) => {
  const userID = req.params.id; // ✅ แก้ตรงนี้
  const sql = "SELECT  firstName, lastName, email, mobilePhone, imageFile FROM user WHERE userID = ?";
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
  const { firstName, lastName, email, mobilePhone, imageFile } = req.body;
  if (!userID) {
    return res.status(400).json({ status: false, message: "ไม่พบ userID" });
  }
  const sql = "UPDATE user SET firstName = ?, lastName = ?, email = ?, mobilePhone = ?, imageFile = ? WHERE userID = ?";
  db.query(sql, [firstName, lastName, email, mobilePhone, imageFile, userID], (err, result) => {
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

//Web sever
app.listen(port, function(){
  console.log(`Server is running on http://localhost:${port}`);
});