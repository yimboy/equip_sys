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
  const sql = "SELECT  firstName, lastName, email, mobilePhone, division, imageFile FROM users WHERE userID = ?";
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

  const sql = "UPDATE users SET firstName = ?, lastName = ?, email = ?, mobilePhone = ?, division = ?, imageFile = ? WHERE userID = ?";
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

//api ดึงสถานะอุปกรณ์
app.get('/api/equip-status', (req, res) => {
  const sql = `SELECT equipstatusID, equipstatusName FROM equipstatus`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในฐานข้อมูล" });
    }
    res.json(results);
  });
});

//api ดึงข้อมูลสิทธิ์ผู้ใช้
app.get("/api/roles", (req, res) => {
  const sql = `SELECT roleID, roleName FROM role ORDER BY roleID ASC`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: "ดึง role ล้มเหลว", error: err });
    }
    res.json({ status: true, data: results });
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
      const bringDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
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

  const sql = `
    SELECT 
      b.bringID,
      DATE_FORMAT(b.bringDate, '%Y-%m-%d') AS date,
      DATE_FORMAT(b.receiveDate, '%Y-%m-%d') AS receiveDate,
      bd.equipmentID,
      e.equipmentName,
      bd.amount,
      b.statusID,
      s.statusName,
      b.imageFile
    FROM bring b
    JOIN bringdetail bd ON b.bringID = bd.bringID
    JOIN equipments e ON bd.equipmentID = e.equipmentID
    LEFT JOIN status s ON b.statusID = s.statusID
    WHERE b.userID = ?
    ORDER BY b.bringDate DESC, b.bringID DESC
  `;

  db.query(sql, [userID], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const bringMap = new Map();

    rows.forEach(row => {
      if (!bringMap.has(row.bringID)) {
        bringMap.set(row.bringID, {
          bringID: row.bringID,
          date: row.date,
          receiveDate: row.receiveDate,
          statusID: row.statusID,
          statusName: row.statusName || "ไม่ทราบสถานะ",
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

    const result = Array.from(bringMap.values()).map(bring => ({
      ...bring,
      count: bring.details.length
    }));

    res.json(result);
  });
});




// API ดึงประวัติการยืม-คืน (borrow)
app.get('/api/history-borrow', (req, res) => {
  const userID = req.query.userID;
  if (!userID) {
    return res.json([]);
  }

  const sql = `
    SELECT 
      bo.borrowID,
      DATE_FORMAT(bo.borrowDate, '%Y-%m-%d') AS date,
      DATE_FORMAT(bo.receiveDate, '%Y-%m-%d') AS receiveDate,
      DATE_FORMAT(bo.returnDate, '%Y-%m-%d') AS returnDate,
      bd.equipmentID,
      e.equipmentName,
      bd.amount,
      bo.statusID,
      s.statusName,
      bo.imageFile
    FROM borrow bo
    JOIN borrowdetail bd ON bo.borrowID = bd.borrowID
    JOIN equipments e ON bd.equipmentID = e.equipmentID
    LEFT JOIN status s ON bo.statusID = s.statusID
    WHERE bo.userID = ?
    ORDER BY bo.borrowDate DESC, bo.borrowID DESC
  `;

  db.query(sql, [userID], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const borrowMap = new Map();

    rows.forEach(row => {
      if (!borrowMap.has(row.borrowID)) {
        borrowMap.set(row.borrowID, {
          borrowID: row.borrowID,
          date: row.date,
          receiveDate: row.receiveDate,
          returnDate: row.returnDate,
          statusID: row.statusID,
          statusName: row.statusName || "ไม่ทราบสถานะ",
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

    const result = Array.from(borrowMap.values()).map(borrow => ({
      ...borrow,
      count: borrow.details.length
    }));

    res.json(result);
  });
});


// API ยกเลิกการเบิก-จ่าย
app.post('/api/cancel-bring', (req, res) => {
  const { bringID, userID } = req.body;

  if (!bringID || !userID) {
    return res.send({ status: false, message: 'Missing parameters' });
  }

  // ดึงรายการอุปกรณ์ที่เกี่ยวข้องกับ bringID
  const getDetailsSql = 'SELECT equipmentID, amount FROM bringdetail WHERE bringID = ?';
  db.query(getDetailsSql, [bringID], (err, rows) => {
    if (err) {
      console.error('DB Error (get details):', err);
      return res.send({ status: false, message: 'DB Error' });
    }

    if (rows.length === 0) {
      return res.send({ status: false, message: 'ไม่พบรายละเอียดการเบิก' });
    }

    // คืน stock ของอุปกรณ์แต่ละชิ้น
    rows.forEach(item => {
      const updateStockSql = 'UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?';
      db.query(updateStockSql, [item.amount, item.equipmentID], (err2) => {
        if (err2) {
          console.error('DB Error (update stock):', err2);
        }
      });
    });

    // อัปเดตสถานะเป็น "ยกเลิก" (เช่น statusID = 6)
    const updateStatusSql = 'UPDATE bring SET statusID = ? WHERE bringID = ?';
    db.query(updateStatusSql, [6, bringID,], (err3, result) => {
      if (err3) {
        console.error('DB Error (update status):', err3);
        return res.send({ status: false, message: 'DB Error' });
      }

      if (result.affectedRows === 0) {
        return res.send({ status: false, message: 'ไม่พบรายการหรือไม่มีสิทธิ์ยกเลิก' });
      }

      return res.send({ status: true, message: 'ยกเลิกรายการสำเร็จ และคืนค่าอุปกรณ์แล้ว' });
    });
  });
});



// API ยกเลิกการยืม-คืน
app.post('/api/cancel-borrow', (req, res) => {
  const { borrowID, userID } = req.body;

  if (!borrowID || !userID) {
    return res.send({ status: false, message: 'Missing parameters' });
  }

  // ดึงรายการ borrowdetail ที่เกี่ยวข้องกับ borrowID
  const getDetailsSql = 'SELECT equipmentID, amount FROM borrowdetail WHERE borrowID = ?';
  db.query(getDetailsSql, [borrowID], (err, details) => {
    if (err) {
      console.error('DB Error (get details):', err);
      return res.send({ status: false, message: 'DB Error' });
    }

    if (details.length === 0) {
      return res.send({ status: false, message: 'ไม่พบรายการอุปกรณ์ใน borrowdetail' });
    }

    // คืนค่า stock ของอุปกรณ์ทีละตัว
    let updateStockPromises = details.map(item => {
      return new Promise((resolve, reject) => {
        const updateStockSql = 'UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?';
        db.query(updateStockSql, [item.amount, item.equipmentID], (err2) => {
          if (err2) reject(err2);
          else resolve();
        });
      });
    });

    Promise.all(updateStockPromises)
      .then(() => {
        // อัปเดตสถานะ borrow เป็น "ยกเลิก" (statusID = 6)
        const updateStatusSql = 'UPDATE borrow SET statusID = ? WHERE borrowID = ? AND userID = ?';
        db.query(updateStatusSql, [6, borrowID, userID], (err3, result) => {
          if (err3) {
            console.error('DB Error (update status):', err3);
            return res.send({ status: false, message: 'DB Error' });
          }

          if (result.affectedRows === 0) {
            return res.send({ status: false, message: 'ไม่พบรายการหรือไม่มีสิทธิ์ยกเลิก' });
          }

          return res.send({ status: true, message: 'ยกเลิกรายการยืมสำเร็จ และคืนค่าอุปกรณ์แล้ว' });
        });
      })
      .catch(err2 => {
        console.error('DB Error (update stock):', err2);
        return res.send({ status: false, message: 'DB Error' });
      });
  });
});




//API อัพเดทสถานะคืน
app.post("/api/update-all-status", (req, res) => {
  const { borrowID, statusID } = req.body;

  const sql = `
    UPDATE borrow
    SET statusID = ?
    WHERE borrowID = ?
  `;

  db.query(sql, [statusID, borrowID], (err, result) => {
    if (err) return res.status(500).json({ status: false, message: "DB Error" });
    res.json({ status: true });
  });
});

//api แก้ไขชื่อเเละจำนวนอุปกรณ์(จนท.กจห.,จนท.กทด.)
app.put('/api/edit-equipment/:equipmentID', (req, res) => {
  const roleID = Number(req.headers['x-user-role']);
  if (roleID !== 2 && roleID !== 3 && roleID !== 4) { // ✅ แก้ไขให้รองรับ roleID 3 ด้วย
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ใช้งาน" });
  }

  const equipmentID = req.params.equipmentID;
  const { equipmentName, amount, equipstatusID } = req.body;

  if (!equipmentName || typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  const sql = `
    UPDATE equipments
    SET equipmentName = ?, amount = ?, equipstatusID = ?
    WHERE equipmentID = ?
  `;

  db.query(sql, [equipmentName, amount, equipstatusID, equipmentID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในฐานข้อมูล" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบอุปกรณ์ที่ต้องการแก้ไข" });
    }

    res.json({ status: true, message: "แก้ไขอุปกรณ์สำเร็จ" });
  });
});

//api เพิ่มอุปกรณ์ใหม่(จนท.กจห.,จนท.กทด.)
app.post('/api/add-equipment', (req, res) => {
  const roleID = Number(req.headers['x-user-role']);
  if (roleID !== 2 && roleID !== 3 && roleID !== 4) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ใช้งาน" });
  }

  const { equipmentName, amount } = req.body;

  if (!equipmentName || typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  // ✅ บังคับ typeID ตาม roleID
  const typeID = roleID === 2 ? 1 : 2;

  const sql = `
    INSERT INTO equipments (equipmentName, amount, typeID)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [equipmentName, amount, typeID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในฐานข้อมูล" });
    }

    res.json({ 
      status: true, 
      message: "เพิ่มอุปกรณ์ใหม่สำเร็จ", 
      equipmentID: result.insertId,
      typeID 
    });
  });
});


//api ลบอุปกรณ์(จนท.กจห.,จนท.กทด.)
app.delete("/api/delete-equipment/:equipmentID", (req, res) => {
  const { equipmentID } = req.params;
  const roleID = Number(req.headers["x-user-role"] || 0);

  // ตรวจสอบสิทธิ์ admin
  if (roleID !== 2 && roleID !== 3 && roleID !== 4 ) { // ✅ แก้ไขให้รองรับ roleID 3 ด้วย
    return res.status(403).json({ status: false, message: "คุณไม่มีสิทธิ์ลบอุปกรณ์" });
  }

  if (!equipmentID) {
    return res.status(400).json({ status: false, message: "Missing equipmentID" });
  }

  // SQL ลบอุปกรณ์
  const sql = "DELETE FROM equipments WHERE equipmentID = ?";

  db.query(sql, [equipmentID], (err, result) => {
    if (err) {
      console.error("DB Error (delete equipment):", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในฐานข้อมูล" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบอุปกรณ์นี้" });
    }

    return res.json({ status: true, message: "ลบอุปกรณ์สำเร็จ" });
  });
});


// API ดึงรายการที่รออนุมัติ (จนท.กจห.)
app.get("/api/bring-pending", async (req, res) => {
  try {
    // 1. ดึงรายการ bring ที่สถานะ = 0 (รออนุมัติ) และ 1 (อนุมัติ)
    const sqlBring = `
      SELECT 
        b.bringID,
        b.statusID,
        DATE_FORMAT(b.bringDate, '%Y-%m-%d') AS bringDate,
        DATE_FORMAT(b.receiveDate, '%Y-%m-%d') AS receiveDate,
        s.statusName,
        u.firstname,
        u.lastname,
        COUNT(bd.equipmentID) AS count,
        MAX(et.typeName) AS typeName
      FROM bring b
      LEFT JOIN bringdetail bd ON b.bringID = bd.bringID
      LEFT JOIN status s ON b.statusID = s.statusID
      LEFT JOIN user u ON b.userID = u.userID
      LEFT JOIN equipments e ON bd.equipmentID = e.equipmentID
      LEFT JOIN equipmenttype et ON e.typeID = et.typeID
      WHERE b.statusID IN (0,1)
      GROUP BY 
        b.bringID,
        b.statusID,
        b.bringDate,
        b.receiveDate,
        s.statusName,
        u.firstname,
        u.lastname
      ORDER BY b.bringDate DESC
    `;

    const brings = await new Promise((resolve, reject) => {
      db.query(sqlBring, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (brings.length === 0) {
      return res.json({ status: true, data: [] });
    }

    const bringIDs = brings.map(b => b.bringID);
    const sqlItems = `
      SELECT bd.bringID, e.equipmentName, bd.amount
      FROM bringdetail bd
      LEFT JOIN equipments e ON bd.equipmentID = e.equipmentID
      WHERE bd.bringID IN (?)
    `;

    const items = await new Promise((resolve, reject) => {
      db.query(sqlItems, [bringIDs], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const bringMap = {};
    brings.forEach(b => {
      bringMap[b.bringID] = { ...b, items: [] };
    });

    items.forEach(i => {
      if (bringMap[i.bringID]) {
        bringMap[i.bringID].items.push({
          equipmentName: i.equipmentName,
          amount: i.amount,
        });
      }
    });

    res.json({ status: true, data: Object.values(bringMap) });
  } catch (err) {
    console.error("Error fetching bring pending:", err);
    res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด", data: [] });
  }
});

// API อนุมัติการเบิก-จ่าย (จนท.กจห.)
app.post("/api/approve-bring", (req, res) => {
  const { bringID, userID } = req.body;

  if (!bringID || !userID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  const sql = `
    UPDATE bring
    SET statusID = 1
    WHERE bringID = ? AND statusID = 0
  `;

  db.query(sql, [bringID], (err, result) => {
    if (err) {
      console.error("Error approving bring:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอนุมัติ" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ status: false, message: "ไม่พบรายการหรือสถานะไม่ถูกต้อง" });
    }

    res.json({ status: true, message: "อนุมัติเรียบร้อย" });
  });
});

//API ไม่อนุมัติการเบิก-จ่าย (จนท.กจห.)
app.post("/api/reject-bring", (req, res) => {
  const { bringID } = req.body;

  if (!bringID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  // 1. ดึง bringdetail ของ bringID นี้
  const sqlDetail = `SELECT equipmentID, amount FROM bringdetail WHERE bringID = ?`;

  db.query(sqlDetail, [bringID], (err, details) => {
    if (err) {
      console.error("Error fetching bring details:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }

    if (details.length === 0) {
      return res.status(400).json({ status: false, message: "ไม่พบรายการอุปกรณ์" });
    }

    // 2. อัปเดตจำนวนอุปกรณ์คืนเข้า equipments
    let updatePromises = details.map((item) => {
      return new Promise((resolve, reject) => {
        const sqlUpdate = `UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?`;
        db.query(sqlUpdate, [item.amount, item.equipmentID], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    Promise.all(updatePromises)
      .then(() => {
        // 3. อัปเดตสถานะ bring เป็น ไม่อนุมัติ
        const sqlReject = `
          UPDATE bring
          SET statusID = 2
          WHERE bringID = ? AND statusID = 0
        `;
        db.query(sqlReject, [bringID], (err, result) => {
          if (err) {
            console.error("Error rejecting bring:", err);
            return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการไม่อนุมัติ" });
          }

          if (result.affectedRows === 0) {
            return res.status(400).json({ status: false, message: "ไม่พบรายการหรือสถานะไม่ถูกต้อง" });
          }

          res.json({ status: true, message: "ไม่อนุมัติและคืนอุปกรณ์เรียบร้อย" });
        });
      })
      .catch((err) => {
        console.error("Error updating equipment amounts:", err);
        res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการคืนอุปกรณ์" });
      });
  });
});


//API ดึงรายการที่รออนุมัติ ยืม-คืน (จนท.กทด.)
app.get("/api/borrow-pending", async (req, res) => {
  try {
    // 1. ดึง borrow ที่ statusID = 0, 7, 8
    const sqlBorrow = `
      SELECT 
        b.borrowID,
        b.statusID,
        DATE_FORMAT(b.borrowDate, '%Y-%m-%d') AS borrowDate,
        DATE_FORMAT(b.receiveDate, '%Y-%m-%d') AS receiveDate,
        DATE_FORMAT(b.returnDate, '%Y-%m-%d') AS returnDate,
        s.statusName,
        u.firstname,
        u.lastname,
        b.imageFile,
        COUNT(bd.equipmentID) AS count,
        MAX(et.typeName) AS typeName
      FROM borrow b
      LEFT JOIN borrowdetail bd ON b.borrowID = bd.borrowID
      LEFT JOIN status s ON b.statusID = s.statusID
      LEFT JOIN user u ON b.userID = u.userID
      LEFT JOIN equipments e ON bd.equipmentID = e.equipmentID
      LEFT JOIN equipmenttype et ON e.typeID = et.typeID
      WHERE b.statusID IN (0, 7, 8)
      GROUP BY 
        b.borrowID,
        b.borrowDate,
        b.receiveDate,
        b.returnDate,
        b.imageFile,
        s.statusName,
        u.firstname,
        u.lastname
      ORDER BY b.borrowDate DESC
    `;

    const borrows = await new Promise((resolve, reject) => {
      db.query(sqlBorrow, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (borrows.length === 0) {
      return res.json({ status: true, data: [] });
    }

    const borrowIDs = borrows.map(b => b.borrowID);
    const sqlItems = `
      SELECT bd.borrowID, e.equipmentName, bd.amount
      FROM borrowdetail bd
      LEFT JOIN equipments e ON bd.equipmentID = e.equipmentID
      WHERE bd.borrowID IN (?)
    `;

    const items = await new Promise((resolve, reject) => {
      db.query(sqlItems, [borrowIDs], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const borrowMap = {};
    borrows.forEach(b => {
      borrowMap[b.borrowID] = { ...b, items: [] };
    });

    items.forEach(i => {
      if (borrowMap[i.borrowID]) {
        borrowMap[i.borrowID].items.push({
          equipmentName: i.equipmentName,
          amount: i.amount,
        });
      }
    });

    res.json({ status: true, data: Object.values(borrowMap) });
  } catch (err) {
    console.error("Error fetching borrow pending:", err);
    res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด", data: [] });
  }
});


//API เช็คสถานะติดตามอุปกรณ์การยืม-คืน (จนท.กทด.)
app.post("/api/update-overdue-borrow", async (req, res) => {
  try {
    // อัปเดต borrow ที่เลยวันส่งคืนและสถานะยังไม่อนุมัติ/รอตรวจสอบ
    const sqlUpdate = `
      UPDATE borrow
      SET statusID = 7
      WHERE returnDate < CURDATE() AND statusID IN (0, 8)
    `;

    db.query(sqlUpdate, (err, result) => {
      if (err) {
        console.error("Error updating overdue borrow:", err);
        return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอัปเดตสถานะติดตามอุปกรณ์" });
      }

      res.json({ status: true, message: `อัปเดต ${result.affectedRows} รายการเป็นติดตามอุปกรณ์เรียบร้อย` });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
  }
});



// API อนุมัติการยืม-คืน (จนท.กทด.)
app.post("/api/approve-borrow", (req, res) => {
  const { borrowID } = req.body;

  if (!borrowID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  // 1. ดึงสถานะปัจจุบัน
  const sqlGet = "SELECT statusID FROM borrow WHERE borrowID = ?";
  db.query(sqlGet, [borrowID], (err, results) => {
    if (err) {
      console.error("Error fetching borrow status:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }

    if (results.length === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบรายการ" });
    }

    const currentStatus = results[0].statusID;
    let newStatus;

    if (currentStatus === 0) {
      newStatus = 1; // 0=กำลังดำเนินการ → 1=อนุมัติ
      updateBorrow();
    } else if (currentStatus === 8 || currentStatus === 7) {
      newStatus = 3; // 8/7 → ส่งคืนสำเร็จ
      // คืนอุปกรณ์ก่อนอัปเดตสถานะ
      const sqlDetail = "SELECT equipmentID, amount FROM borrowdetail WHERE borrowID = ?";
      db.query(sqlDetail, [borrowID], (err, details) => {
        if (err) {
          console.error("Error fetching borrow details:", err);
          return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์" });
        }

        let promises = details.map((item) => {
          return new Promise((resolve, reject) => {
            const sqlUpdate = "UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?";
            db.query(sqlUpdate, [item.amount, item.equipmentID], (err2) => {
              if (err2) reject(err2);
              else resolve();
            });
          });
        });

        Promise.all(promises)
          .then(() => updateBorrow())
          .catch((e) => {
            console.error("Error updating equipment amounts:", e);
            res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการคืนอุปกรณ์" });
          });
      });
    } else {
      return res.status(400).json({ status: false, message: "สถานะนี้ไม่สามารถอนุมัติได้" });
    }

    // ฟังก์ชันอัปเดตสถานะ borrow
    function updateBorrow() {
      const sqlUpdate = "UPDATE borrow SET statusID = ? WHERE borrowID = ?";
      db.query(sqlUpdate, [newStatus, borrowID], (err2, result) => {
        if (err2) {
          console.error("Error updating borrow:", err2);
          return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอนุมัติ" });
        }

        if (result.affectedRows === 0) {
          return res.status(400).json({ status: false, message: "ไม่สามารถอัปเดตสถานะได้" });
        }

        res.json({ status: true, message: "อนุมัติเรียบร้อย", newStatus });
      });
    }
  });
});




// API ไม่อนุมัติการยืม-คืน (จนท.กทด.)
app.post("/api/reject-borrow", (req, res) => {
  const { borrowID } = req.body;

  if (!borrowID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  // 1. ดึงสถานะปัจจุบันของ borrow
  const sqlStatus = "SELECT statusID FROM borrow WHERE borrowID = ?";
  db.query(sqlStatus, [borrowID], (err, results) => {
    if (err) {
      console.error("Error fetching borrow status:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }

    if (results.length === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบรายการ" });
    }

    const currentStatus = results[0].statusID;
    let newStatus;

    if (currentStatus === 0) {
      newStatus = 2; // ไม่อนุมัติ → คืนอุปกรณ์
    } else if (currentStatus === 8) {
      newStatus = 4; // ส่งคืนไม่สำเร็จ → ไม่คืนอุปกรณ์
    } else {
      return res.status(400).json({ status: false, message: "สถานะนี้ไม่สามารถไม่อนุมัติได้" });
    }

    // ฟังก์ชันคืนอุปกรณ์ (เฉพาะ status 0)
    const updateEquipments = () => {
      if (currentStatus === 0) {
        const sqlDetail = "SELECT equipmentID, amount FROM borrowdetail WHERE borrowID = ?";
        return new Promise((resolve, reject) => {
          db.query(sqlDetail, [borrowID], (err, details) => {
            if (err) return reject(err);

            let promises = details.map((item) => {
              return new Promise((resv, rej) => {
                const sqlUpdate = "UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?";
                db.query(sqlUpdate, [item.amount, item.equipmentID], (err2) => {
                  if (err2) rej(err2);
                  else resv();
                });
              });
            });

            Promise.all(promises)
              .then(() => resolve())
              .catch((e) => reject(e));
          });
        });
      } else {
        return Promise.resolve(); // status 8 → ไม่คืนอุปกรณ์
      }
    };

    // 2. คืนอุปกรณ์ถ้าจำเป็น แล้วอัปเดต status
    updateEquipments()
      .then(() => {
        const sqlReject = "UPDATE borrow SET statusID = ? WHERE borrowID = ?";
        db.query(sqlReject, [newStatus, borrowID], (err, result) => {
          if (err) {
            console.error("Error updating borrow status:", err);
            return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
          }

          if (result.affectedRows === 0) {
            return res.status(400).json({ status: false, message: "ไม่สามารถอัปเดตสถานะได้" });
          }

          res.json({ status: true, message: "อัปเดตสถานะไม่อนุมัติเรียบร้อย", newStatus });
        });
      })
      .catch((err) => {
        console.error("Error updating equipment amounts:", err);
        res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการคืนอุปกรณ์" });
      });
  });
});

// ✅ ดึงข้อมูลผู้ใช้ทั้งหมด
app.get("/api/user", (req, res) => {
  const roleID = Number(req.headers["x-user-role"]); // อ่าน role ของคนที่เรียก API

  // อนุญาตเฉพาะ roleID = 4 เท่านั้น
  if (roleID !== 4) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ใช้งาน" });
  }

  const sql = `  
    SELECT userID, username, firstname, lastname, email, mobilePhone, division, roleID 
    FROM users
    ORDER BY userID ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: "ดึงข้อมูลล้มเหลว", error: err });
    }
    res.json({ status: true, data: results });
  });
});

//API เเก้ไชสิทธ์์ผู้ใช้
app.put("/api/users/:userID/role", (req, res) => {
  const adminRole = Number(req.headers["x-user-role"]);
  const { userID } = req.params;
  const { roleID } = req.body;

  console.log("adminRole:", adminRole, "userID:", userID, "roleID:", roleID);

  if (adminRole !== 4) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์แก้ไข role" });
  }

  if (!roleID) {
    return res.status(400).json({ status: false, message: "กรุณาส่ง roleID ใหม่" });
  }

  const sql = "UPDATE users SET roleID = ? WHERE userID = ?"; // เปลี่ยน table เป็น users
  db.query(sql, [Number(roleID), userID], (err, result) => {
    if (err) {
      console.error("SQL error:", err);
      return res.status(500).json({ status: false, message: "อัปเดตล้มเหลว", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบผู้ใช้" });
    }

    res.json({ status: true, message: "อัปเดต role สำเร็จ" });
  });
});


// ✅ ดึงผู้ใช้ทั้งหมดที่ยัง active
app.get("/api/users", (req, res) => {
  const roleID = Number(req.headers["x-user-role"]);

  if (roleID !== 4) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ใช้งาน" });
  }

  const sql = `
    SELECT userID, username, email, roleID, isActive
    FROM users
    WHERE isActive = 1
    ORDER BY userID ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: "ดึงข้อมูลล้มเหลว", error: err });
    }
    res.json({ status: true, data: results });
  });
});

// ✅ Soft delete ผู้ใช้
app.put("/api/users/:userID/deactivate", (req, res) => {
  const adminRole = Number(req.headers["x-user-role"]);
  const { userID } = req.params;

  if (adminRole !== 4) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ปิดการใช้งานผู้ใช้" });
  }

  const sql = "UPDATE users SET isActive = 0 WHERE userID = ?";
  db.query(sql, [userID], (err, result) => {
    if (err) {
      return res.status(500).json({ status: false, message: "อัปเดตล้มเหลว", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบผู้ใช้" });
    }

    res.json({ status: true, message: "ปิดการใช้งานผู้ใช้สำเร็จ" });
  });
});

// ✅ Restore ผู้ใช้
app.put("/api/users/:userID/activate", (req, res) => {
  const adminRole = Number(req.headers["x-user-role"]);
  const { userID } = req.params;

  if (adminRole !== 4) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์เปิดการใช้งานผู้ใช้" });
  }

  const sql = "UPDATE users SET isActive = 1 WHERE userID = ?";
  db.query(sql, [userID], (err, result) => {
    if (err) {
      return res.status(500).json({ status: false, message: "อัปเดตล้มเหลว", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบผู้ใช้" });
    }

    res.json({ status: true, message: "เปิดการใช้งานผู้ใช้สำเร็จ" });
  });
});



//Web sever
app.listen(port, function(){
  console.log(`Server is running on http://localhost:${port}`);
});