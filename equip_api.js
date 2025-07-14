const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: "uploads/" }); // โฟลเดอร์เก็บไฟล์ชั่วคราว
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
  const sql = 'INSERT INTO user (username, password, firstname, lastname, roleID) VALUES (?, ?, ?, ?, ?)';
  
  db.query(sql, [username, password, firstname, lastname, 1], 
    function(err, result) {
      if (err) throw err;
      res.send({ message: 'ลงทะเบียนสำเร็จ', status: true });
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

// ยืนยันการขอเบิก-จ่าย (พร้อมรับไฟล์รูป, ตรวจสต็อก, บันทึก DB)
app.post('/api/bring-confirm', upload.single('idCardImg'), (req, res) => {
  const selectedDate = req.body.selectedDate;
  const requestAmountsJSON = req.body.requestAmounts;
  const idCardImg = req.file;

  
  
  if (!selectedDate || !idCardImg || !requestAmountsJSON) {
    return res.json({ status: false, message: 'ข้อมูลไม่ครบ' });
  }

  let userID = req.headers['x-user-id']; // ✅ คุณเลือกว่าจะส่ง userID จาก header หรือ body
  if (!userID) {
    return res.json({ status: false, message: 'ไม่ได้ส่ง userID' });
  }

  let requestAmounts;
  try {
    requestAmounts = JSON.parse(requestAmountsJSON);
  } catch (err) {
    return res.json({ status: false, message: 'requestAmounts ไม่เป็น JSON' });
  }

  // ตรวจสอบจำนวนที่ขอเบิก
  const checkStockPromises = Object.entries(requestAmounts).map(([equipmentID, amount]) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT amount FROM equipments WHERE equipmentID = ?', [equipmentID], (err, rows) => {
        if (err) return reject(err);
        if (rows.length === 0) return reject(new Error(`ไม่พบอุปกรณ์ ID ${equipmentID}`));
        if (rows[0].amount < amount) return reject(new Error(`จำนวนคงเหลือของอุปกรณ์ ID ${equipmentID} ไม่พอ`));
        resolve();
      });
    });
  });

  Promise.all(checkStockPromises)
    .then(() => {
      // หัก stock
      const updateStockPromises = Object.entries(requestAmounts).map(([equipmentID, amount]) => {
        return new Promise((resolve, reject) => {
          db.query('UPDATE equipments SET amount = amount - ? WHERE equipmentID = ?', [amount, equipmentID], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      return Promise.all(updateStockPromises);
    })
    .then(() => {
      // บันทึก bring
      const bringDate = new Date();
      const imagePath = `/uploads/${idCardImg.filename}`;
      const insertBringSql = `
        INSERT INTO bring (userID, bringDate, receiveDate, imageFile)
        VALUES (?, ?, ?, ?)
      `;
      return new Promise((resolve, reject) => {
        db.query(insertBringSql, [userID, bringDate, selectedDate, imagePath], (err, result) => {
          if (err) return reject(err);
          const bringID = result.insertId;
          resolve(bringID);
        });
      });
    })
    .then((bringID) => {
      // บันทึก bring_detail
      const detailPromises = Object.entries(requestAmounts).map(([equipmentID, amount]) => {
        return new Promise((resolve, reject) => {
          const sql = 'INSERT INTO bringdetail (bringID, equipmentID, amount) VALUES (?, ?, ?)';
          db.query(sql, [bringID, equipmentID, amount], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      return Promise.all(detailPromises);
    })
    .then(() => {
      res.json({ status: true, message: 'บันทึกการขอเบิกสำเร็จ' });
    })
    .catch((err) => {
      console.error(err);
      res.json({ status: false, message: err.message });
    });
});

// ยืนยันการขอยืม-คืน (พร้อมรับไฟล์รูป, ตรวจสต็อก, บันทึก DB)
app.post('/api/borrow-confirm', upload.single('idCardImg'), (req, res) => {
  const selectedDate = req.body.selectedDate;
  const returnDate = req.body.returnDate;
  const requestAmountsJSON = req.body.requestAmounts;
  const idCardImg = req.file;

  console.log('selectedDate:', selectedDate);
  console.log('returnDate:', returnDate);

  if (!selectedDate || !returnDate || !idCardImg || !requestAmountsJSON) {
    return res.json({ status: false, message: 'ข้อมูลไม่ครบ' });
  }

  const userID = req.headers['x-user-id'];
  if (!userID) {
    return res.json({ status: false, message: 'ไม่ได้ส่ง userID' });
  }

  let requestAmounts;
  try {
    requestAmounts = JSON.parse(requestAmountsJSON);
  } catch (err) {
    return res.json({ status: false, message: 'requestAmounts ไม่เป็น JSON' });
  }

  // ตรวจสอบจำนวนที่ขอยืม
  const checkStockPromises = Object.entries(requestAmounts).map(([equipmentID, amount]) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT amount FROM equipments WHERE equipmentID = ?', [equipmentID], (err, rows) => {
        if (err) return reject(err);
        if (rows.length === 0) return reject(new Error(`ไม่พบอุปกรณ์ ID ${equipmentID}`));
        if (rows[0].amount < amount) return reject(new Error(`จำนวนคงเหลือของอุปกรณ์ ID ${equipmentID} ไม่พอ`));
        resolve();
      });
    });
  });

  Promise.all(checkStockPromises)
    .then(() => {
      // หักสต็อก
      const updateStockPromises = Object.entries(requestAmounts).map(([equipmentID, amount]) => {
        return new Promise((resolve, reject) => {
          db.query(
            'UPDATE equipments SET amount = amount - ? WHERE equipmentID = ?',
            [amount, equipmentID],
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      });
      return Promise.all(updateStockPromises);
    })
    .then(() => {
      // บันทึกตาราง borrow (master)
      const borrowDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const imagePath = `/uploads/${idCardImg.filename}`;
      const insertBorrowSql = `
        INSERT INTO borrow (userID, borrowDate, receiveDate, returnDate, imageFile)
        VALUES (?, ?, ?, ?, ?)
      `;
      return new Promise((resolve, reject) => {
        db.query(
          insertBorrowSql,
          [userID, borrowDate, selectedDate, returnDate, imagePath],
          (err, result) => {
            if (err) return reject(err);
            const borrowID = result.insertId;
            resolve(borrowID);
          }
        );
      });
    })
    .then((borrowID) => {
      // บันทึก borrowdetail (detail)
      const detailPromises = Object.entries(requestAmounts).map(([equipmentID, amount]) => {
        return new Promise((resolve, reject) => {
          const sql = `
            INSERT INTO borrowdetail (borrowID, equipmentID, returnDate, amount)
            VALUES (?, ?, ?, ?)
          `;
          db.query(sql, [borrowID, equipmentID, returnDate, amount], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      return Promise.all(detailPromises);
    })
    .then(() => {
      res.json({ status: true, message: 'บันทึกการขอยืมสำเร็จ' });
    })
    .catch((err) => {
      console.error('❌ Error in borrow-confirm:', err);
      res.json({ status: false, message: err.message });
    });
});

// API ดึงประวัติการเบิก-จ่าย (bring)
app.get('/api/history-bring', (req, res) => {
  const userID = req.query.userID;
  if (!userID) {
    return res.json([]);
  }

  // JOIN bring, bringdetail, equipments
  const sql = `
    SELECT 
      b.bringID,
      b.bringDate AS date,
      b.receiveDate,
      bd.equipmentID,
      e.equipmentName,
      bd.amount,
      b.statusID,
      b.imageFile
    FROM bring b
    JOIN bringdetail bd ON b.bringID = bd.bringID
    JOIN equipments e ON bd.equipmentID = e.equipmentID
    WHERE b.userID = ?
    ORDER BY b.bringDate DESC, b.bringID DESC
  `;

  db.query(sql, [userID], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    // Group by bringID
    const bringMap = new Map();

    rows.forEach(row => {
      if (!bringMap.has(row.bringID)) {
        bringMap.set(row.bringID, {
          bringID: row.bringID,
          date: row.date,
          receiveDate: row.receiveDate,
          returnDate: null,          // ไม่มีวันคืนสำหรับเบิก-จ่าย
          status: getStatusText(row.statusID),
          type: "เบิก-จ่าย",
          imageFile: row.imageFile || null,
          details: []
        });
      }

      bringMap.get(row.bringID).details.push({
        equipmentID: row.equipmentID,
        equipmentName: row.equipmentName,
        amount: row.amount,
        receiveDate: row.receiveDate
      });
    });

    // Convert to array and add count
    const result = Array.from(bringMap.values()).map(bring => ({
      ...bring,
      count: bring.details.length
    }));

    res.json(result);
  });
});

function getStatusText(statusID) {
  switch (statusID) {
    case 0: return "รอตรวจสอบ";
    case 1: return "อนุมัติ";
    case 2: return "ไม่อนุมติ";
    case 3: return "ขอยกเลิก";
    case 4: return "ยกเลิก";
    default: return "ไม่ทราบสถานะ";
  }
}



// API ดึงประวัติการยืม-คืน (borrow)
app.get('/api/history-borrow', (req, res) => {
  const userID = req.query.userID;
  if (!userID) {
    return res.json([]);
  }

  // JOIN borrow, borrowdetail, equipments
  const sql = `
    SELECT 
      bo.borrowID,
      bo.borrowDate AS date,
      bo.receiveDate,
      bo.returnDate,
      bd.equipmentID,
      e.equipmentName,
      bd.amount,
      bo.statusID,
      bo.imageFile
    FROM borrow bo
    JOIN borrowdetail bd ON bo.borrowID = bd.borrowID
    JOIN equipments e ON bd.equipmentID = e.equipmentID
    WHERE bo.userID = ?
    ORDER BY bo.borrowDate DESC, bo.borrowID DESC
  `;

  db.query(sql, [userID], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    // Group by borrowID
    const borrowMap = new Map();

    rows.forEach(row => {
      if (!borrowMap.has(row.borrowID)) {
        borrowMap.set(row.borrowID, {
          borrowID: row.borrowID,
          date: row.date,
          receiveDate: row.receiveDate,
          returnDate: row.returnDate,
          status: getBorrowStatusText(row.statusID),
          type: "ยืม-คืน",
          imageFile: row.imageFile || null,
          details: []
        });
      }

      borrowMap.get(row.borrowID).details.push({
        equipmentID: row.equipmentID,
        equipmentName: row.equipmentName,
        amount: row.amount,
        receiveDate: row.receiveDate,
        returnDate: row.returnDate
      });
    });

    // Convert to array and add count
    const result = Array.from(borrowMap.values()).map(borrow => ({
      ...borrow,
      count: borrow.details.length
    }));

    res.json(result);
  });
});

// ฟังก์ชันแปลงสถานะยืม-คืนเป็นภาษาไทย
function getBorrowStatusText(statusID) {
  switch (statusID) {
    case 0: return "รอตรวจสอบ";
    case 1: return "อนุมัติ";
    case 2: return "ไม่อนุมัติ";
    case 3: return "ส่งคืนเเล้ว";
    case 4: return "ขอยกเลิก";
    case 5: return "ยกเลิก";
    default: return "ไม่ทราบสถานะ";
  }
}

// API ยกเลิกการเบิก-จ่าย
app.post('/api/cancel-bring', (req, res) => {
  const { bringID, userID } = req.body;

  if (!bringID || !userID) {
    return res.send({ status: false, message: 'Missing parameters' });
  }

  // อัปเดตสถานะเป็น "รอตรวจสอบ" (statusID = 0)
  const sql = 'UPDATE bring SET statusID = ? WHERE bringID = ? AND userID = ?';

  db.query(sql, [3, bringID, userID], (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.send({ status: false, message: 'DB Error' });
    }

    if (result.affectedRows === 3) {
      return res.send({ status: false, message: 'ไม่พบรายการหรือไม่มีสิทธิ์ยกเลิก' });
    }

    return res.send({ status: true });
  });
});


// API ยกเลิกการยืม-คืน
app.post('/api/cancel-borrow', (req, res) => {
  const { borrowID, userID } = req.body;

  if (!borrowID || !userID) {
    return res.send({ status: false, message: 'Missing parameters' });
  }

  // อัปเดตสถานะเป็น "รอตรวจสอบ" (statusID = 0)
  const sql = 'UPDATE borrow SET statusID = ? WHERE borrowID = ? AND userID = ?';

  db.query(sql, [4, borrowID, userID], (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.send({ status: false, message: 'DB Error' });
    }

    if (result.affectedRows === 4) {
      return res.send({ status: false, message: 'ไม่พบรายการหรือไม่มีสิทธิ์ยกเลิก' });
    }

    return res.send({ status: true });
  });
});


//API อัพเดทสถานะคืน
app.post('/api/update-status', (req, res) => {
  const { borrowID, statusID } = req.body;

  if (borrowID === undefined || statusID === undefined) {
    return res.json({
      status: false,
      message: 'ข้อมูลไม่ครบถ้วน',
    });
  }

  const sql = 'UPDATE borrow SET statusID = ? WHERE borrowID = ?';
  db.query(sql, [statusID, borrowID], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({
        status: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล',
      });
    }

    if (result.affectedRows === 0) {
      return res.json({
        status: false,
        message: 'ไม่พบ borrowID ที่ต้องการอัพเดต',
      });
    }

    res.json({
      status: true,
      message: 'อัพเดตสถานะเรียบร้อย',
    });
  });
});



//Web sever
app.listen(port, function(){
  console.log(`Server is running on http://localhost:${port}`);
});