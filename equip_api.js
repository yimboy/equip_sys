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
  const { username, password, firstname, lastname, email, mobilePhone, division} = req.body;
  const sql = 'INSERT INTO users (username, password, firstname, lastname, email, mobilePhone, division, roleID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [username, password, firstname, lastname, email, mobilePhone, division, 1], 
    function(err, result) {
      if (err) throw err;
      res.send({ message: 'ลงทะเบียนสำเร็จ', status: true });
    }
  );
});
 

//Login
app.post('/api/login', function(req, res){
  const { username, password } = req.body;
  let sql = 'SELECT * FROM users WHERE ';
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

  const sql = "UPDATE users SET password = ? WHERE username = ?";
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
// ✅ API ดึงข้อมูลอุปกรณ์ พร้อมหน่วย + สถานะ
app.get('/api/equipment', (req, res) => {
  const sql = `
    SELECT 
      e.equipmentID,
      e.equipmentName,
      e.amount,
      e.unitID,
      u.unitName,             -- ✅ หน่วย
      e.typeID,
      e.equipstatusID,
      s.equipstatusName       -- ✅ สถานะ
    FROM equipments e
    LEFT JOIN unit u ON e.unitID = u.unitID
    LEFT JOIN equipstatus s ON e.equipstatusID = s.equipstatusID
    ORDER BY e.equipmentID ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({
        status: false,
        message: "เกิดข้อผิดพลาดในฐานข้อมูล",
      });
    }
    res.json(results);
  });
});



// ดึงข้อมูลหน่วยนับ
app.get('/api/units', (req, res) => {
  const sql = `SELECT unitID, unitName FROM unit ORDER BY unitID ASC`;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ status: false, message: "Database error" });
    res.json({ status: true, data: rows });
  });
});

//เพิ่มหน่วยนับใหม่
app.post('/api/add-unit', (req, res) => {
  const { unitName } = req.body;
  if (!unitName || unitName.trim() === "") {
    return res.status(400).json({ status: false, message: "ชื่อหน่วยไม่ถูกต้อง" });
  }

  const sql = "INSERT INTO unit (unitName) VALUES (?)";
  db.query(sql, [unitName.trim()], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ status: false, message: "Database error" });
    }
    res.json({ status: true, unitID: result.insertId, unitName });
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
     // ✅ เพิ่มแจ้งเตือนให้เจ้าหน้าที่ทุกคนเมื่อมีการขอเบิก
const notifSql = `
  INSERT INTO notifications (userID, message, type, isRead, createdAt)
  SELECT userID, '✅ มีคำขอเบิกที่รออนุมัติ', 'bring-request', 0, NOW()
  FROM users
  WHERE roleID = 2
`;
db.query(notifSql, (err) => {
  if (err) console.error("❌ Error inserting bring notif:", err);
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
  // ✅ เพิ่มแจ้งเตือนให้เจ้าหน้าที่ทุกคนเมื่อมีการขอเบิก
const notifSql = `
  INSERT INTO notifications (userID, message, type, isRead, createdAt)
  SELECT userID, '✅ มีคำขอยืมที่รออนุมัติ', 'borrow-request', 0, NOW()
  FROM users
  WHERE roleID = 3
`;
db.query(notifSql, (err) => {
  if (err) console.error("❌ Error inserting bring notif:", err);
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


// ✅ API ดึงประวัติการเบิก-จ่าย (bring) — แก้ให้ roleID = 2 เห็นทั้งหมดได้
app.get('/api/history-bring', (req, res) => {
  const userID = req.query.userID;
  const roleID = parseInt(req.query.roleID, 10); // ✅ รับ roleID จาก frontend

  // ❌ เดิม: ถ้าไม่มี userID จะ return [] ทันที
  // ✅ ใหม่: ถ้าไม่มี userID แต่เป็นเจ้าหน้าที่ (roleID = 2) ให้ดึงข้อมูลทุกคน
  let sql = `
    SELECT 
      b.bringID,
      b.userID,
      usr.firstname AS userFirstname,
      usr.lastname AS userLastname,
      DATE_FORMAT(b.bringDate, '%Y-%m-%d') AS bringDate,
      DATE_FORMAT(b.receiveDate, '%Y-%m-%d') AS receiveDate,
      DATE_FORMAT(b.approveDate, '%Y-%m-%d') AS approveDate,
      bd.equipmentID,
      e.equipmentName,
      bd.amount,
      b.statusID,
      s.statusName,
      b.imageFile,
      b.approveBy,
      u.firstname AS approveFirstname,
      u.lastname AS approveLastname
    FROM bring b
    JOIN bringdetail bd ON b.bringID = bd.bringID
    JOIN equipments e ON bd.equipmentID = e.equipmentID
    LEFT JOIN status s ON b.statusID = s.statusID
    LEFT JOIN users u ON b.approveBy = u.userID
    LEFT JOIN users usr ON b.userID = usr.userID   -- ✅ ดึงชื่อผู้ยืมด้วย
  `;

  const params = [];

  if (userID) {
    sql += " WHERE b.userID = ?";
    params.push(userID);
  } else if (roleID !== 2 && roleID !== 4) {
    // ถ้าไม่มี userID และไม่ใช่เจ้าหน้าที่ → ไม่อนุญาต
    return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูลทั้งหมด" });
  }

  sql += " ORDER BY b.bringDate DESC, b.bringID DESC";

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const bringMap = new Map();

    rows.forEach(row => {
      if (!bringMap.has(row.bringID)) {
        bringMap.set(row.bringID, {
          bringID: row.bringID,
          userID: row.userID,
          username: row.userFirstname ? `${row.userFirstname} ${row.userLastname}` : "ไม่ทราบชื่อ",
          bringDate: row.bringDate,
          receiveDate: row.receiveDate,
          approveDate: row.approveDate || null,
          statusID: row.statusID,
          statusName: row.statusName || "ไม่ทราบสถานะ",
          approveBy: row.approveBy || null,
          approveByName: row.approveFirstname ? `${row.approveFirstname} ${row.approveLastname}` : null,
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







// ✅ API ดึงประวัติการยืม-คืน (borrow) — แก้ให้ roleID = 3 เห็นทั้งหมดได้
app.get('/api/history-borrow', (req, res) => {
  const userID = req.query.userID;
  const roleID = parseInt(req.query.roleID, 10); // ✅ ดึง roleID จาก query

  // ✅ เขียน SQL พื้นฐาน (มี JOIN ดึงชื่อผู้ขอยืมด้วย)
  let sql = `
    SELECT 
      bo.borrowID,
      bo.userID,
      usr.firstname AS userFirstname,
      usr.lastname AS userLastname,
      DATE_FORMAT(bo.borrowDate, '%Y-%m-%d') AS borrowDate,
      DATE_FORMAT(bo.receiveDate, '%Y-%m-%d') AS receiveDate,
      DATE_FORMAT(bo.returnDate, '%Y-%m-%d') AS returnDate,
      DATE_FORMAT(bo.approveDate, '%Y-%m-%d') AS approveDate,
      bd.equipmentID,
      e.equipmentName,
      bd.amount,
      bd.note,
      bo.statusID,
      s.statusName,
      bo.imageFile,
      bo.approveBy,
      u.firstname AS approveFirstname,
      u.lastname AS approveLastname
    FROM borrow bo
    JOIN borrowdetail bd ON bo.borrowID = bd.borrowID
    JOIN equipments e ON bd.equipmentID = e.equipmentID
    LEFT JOIN status s ON bo.statusID = s.statusID
    LEFT JOIN users u ON bo.approveBy = u.userID
    LEFT JOIN users usr ON bo.userID = usr.userID  -- ✅ ดึงชื่อผู้ยืม
  `;

  const params = [];

  // ✅ เงื่อนไขกรองข้อมูล
  if (userID) {
    sql += " WHERE bo.userID = ?";
    params.push(userID);
  } else if (roleID !== 3 && roleID !== 4) {
    // ❌ ถ้าไม่มี userID และไม่ใช่ roleID=3 → ไม่มีสิทธิ์เข้าถึง
    return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูลทั้งหมด" });
  }

  sql += " ORDER BY bo.borrowDate DESC, bo.borrowID DESC";

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const borrowMap = new Map();

    rows.forEach(row => {
      if (!borrowMap.has(row.borrowID)) {
        borrowMap.set(row.borrowID, {
          borrowID: row.borrowID,
          userID: row.userID,
          username: row.userFirstname ? `${row.userFirstname} ${row.userLastname}` : "ไม่ทราบชื่อ",
          borrowDate: row.borrowDate,
          receiveDate: row.receiveDate,
          returnDate: row.returnDate,
          approveDate: row.approveDate || null,
          statusID: row.statusID,
          statusName: row.statusName || "ไม่ทราบสถานะ",
          approveBy: row.approveBy || null,
          approveByName: row.approveFirstname ? `${row.approveFirstname} ${row.approveLastname}` : null,
          type: "ยืม-คืน",
          imageFile: row.imageFile || null,
          note: row.note || "",
          details: []
        });
      }

      borrowMap.get(row.borrowID).details.push({
        equipmentID: row.equipmentID,
        equipmentName: row.equipmentName,
        amount: row.amount,
        note: row.note || "-",
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
  if (![2, 3, 4].includes(roleID)) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ใช้งาน" });
  }

  const equipmentID = Number(req.params.equipmentID);
  const { equipmentName, amount, unitID, equipstatusID } = req.body;

  // ✅ แปลงเป็นตัวเลข
  const amountNum = Number(amount);
  const unitIDNum = Number(unitID);
  const statusNum = equipstatusID !== undefined ? Number(equipstatusID) : null;

  // ✅ ตรวจสอบข้อมูล
  if (!equipmentName?.trim()
      || !Number.isFinite(amountNum) || amountNum < 0
      || !Number.isInteger(unitIDNum) || unitIDNum <= 0) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  const sql = `
    UPDATE equipments
    SET equipmentName = ?, amount = ?, unitID = ?, equipstatusID = ?
    WHERE equipmentID = ?
  `;

  db.query(sql, [equipmentName.trim(), amountNum, unitIDNum, statusNum, equipmentID], (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
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
  if (![2, 3, 4].includes(roleID)) {
    return res.status(403).json({ status: false, message: "ไม่มีสิทธิ์ใช้งาน" });
  }

  const { equipmentName, amount, unitID } = req.body;

  // แปลงค่าเป็น Number ชัดเจน
  const amountNum = Number(amount);
  const unitIDNum = Number(unitID);

  if (!equipmentName?.trim()
      || !Number.isFinite(amountNum)
      || amountNum < 0
      || !Number.isInteger(unitIDNum)
      || unitIDNum <= 0) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  // ✅ กำหนด typeID
  const typeID = roleID === 2 ? 1 : 2;

  const sql = `
    INSERT INTO equipments (equipmentName, amount, unitID, typeID)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [equipmentName.trim(), amountNum, unitIDNum, typeID], (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
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
      LEFT JOIN users u ON b.userID = u.userID
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

// API อัพเดตสถานะการเบิก (จนท.กจห.)
app.post("/api/update-bring-status", (req, res) => {
  const { bringID, statusID, userID } = req.body;
  if (!bringID || statusID === undefined || !userID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  const validStatus = [0, 1, 6, 9];
  if (!validStatus.includes(statusID)) {
    return res.status(400).json({ status: false, message: "สถานะไม่ถูกต้อง" });
  }

  let sql, params;
  if ([1, 9].includes(statusID)) {
    sql = `
      UPDATE bring
      SET statusID = ?, approveBy = ?, approveDate = NOW()
      WHERE bringID = ?
    `;
    params = [statusID, userID, bringID];
  } else {
    sql = `UPDATE bring SET statusID = ? WHERE bringID = ?`;
    params = [statusID, bringID];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error updating bring:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
    }
    if (result.affectedRows === 0) {
      return res.status(400).json({ status: false, message: "ไม่พบรายการ" });
    }

    // ✅ เพิ่มแจ้งเตือนเมื่ออนุมัติแล้ว
    if (statusID === 1) {
      const notifSql = `
        INSERT INTO notifications (userID, message, type, isRead, createdAt)
        SELECT userID, '✅ คำขอเบิกของคุณได้รับการอนุมัติแล้ว', 'bring-approve', 0, NOW()
        FROM bring WHERE bringID = ?
      `;
      db.query(notifSql, [bringID], err => {
        if (err) console.error("❌ Error inserting bring notif:", err);
      });
    }

    let msg = "อัปเดตสถานะเรียบร้อย";
    if (statusID === 1) msg = "อนุมัติเรียบร้อย";
    else if (statusID === 6) msg = "ยกเลิกสำเร็จ";
    else if (statusID === 9) msg = "รับของสำเร็จ";

    res.json({ status: true, message: msg });
  });
});

  



//API ไม่อนุมัติการเบิก-จ่าย (จนท.กจห.)
app.post("/api/reject-bring", (req, res) => {
  const { bringID } = req.body;
  if (!bringID) return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });

  const sqlDetail = `SELECT equipmentID, amount FROM bringdetail WHERE bringID = ?`;
  db.query(sqlDetail, [bringID], (err, details) => {
    if (err) return res.status(500).json({ status: false, message: "DB Error" });
    if (details.length === 0) return res.status(400).json({ status: false, message: "ไม่พบรายการ" });

    // คืนสต็อก
    let updatePromises = details.map(item => {
      return new Promise((resolve, reject) => {
        db.query(`UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?`,
          [item.amount, item.equipmentID], err => err ? reject(err) : resolve());
      });
    });

    Promise.all(updatePromises).then(() => {
      const sqlReject = `
        UPDATE bring SET statusID = 2 WHERE bringID = ? AND statusID = 0
      `;
      db.query(sqlReject, [bringID], (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "DB Error" });
        if (result.affectedRows === 0) return res.status(400).json({ status: false, message: "ไม่พบรายการ" });

        // ✅ แจ้งเตือน: ไม่อนุมัติการเบิก
        const notifSql = `
          INSERT INTO notifications (userID, message, type, isRead, createdAt)
          SELECT userID, '❌ คำขอเบิกของคุณไม่ได้รับการอนุมัติ', 'bring-reject', 0, NOW()
          FROM bring WHERE bringID = ?
        `;
        db.query(notifSql, [bringID], err => {
          if (err) console.error("❌ Error inserting bring reject notif:", err);
        });

        res.json({ status: true, message: "ไม่อนุมัติและคืนอุปกรณ์เรียบร้อย" });
      });
    }).catch(e => res.status(500).json({ status: false, message: e.message }));
  });
});


// ✅ API ดึงรายการที่รออนุมัติ ยืม-คืน (จนท.กทด.)
app.get("/api/borrow-pending", async (req, res) => {
  try {
    // 1. ดึงข้อมูล borrow หลัก
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
      LEFT JOIN users u ON b.userID = u.userID
      LEFT JOIN equipments e ON bd.equipmentID = e.equipmentID
      LEFT JOIN equipmenttype et ON e.typeID = et.typeID
      WHERE b.statusID IN (0, 1, 7, 8, 9)
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

    // 2. ดึงรายการอุปกรณ์แต่ละชิ้นของ borrow
    const borrowIDs = borrows.map(b => b.borrowID);
    const sqlItems = `
      SELECT 
        bd.borrowID, 
        bd.equipmentID, 
        e.equipmentName, 
        bd.amount,
        bd.statusID AS detailStatus,
        s.statusName AS detailStatusName
      FROM borrowdetail bd
      LEFT JOIN equipments e ON bd.equipmentID = e.equipmentID
      LEFT JOIN status s ON bd.statusID = s.statusID
      WHERE bd.borrowID IN (?)
    `;

    const items = await new Promise((resolve, reject) => {
      db.query(sqlItems, [borrowIDs], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // 3. จัดกลุ่มข้อมูล
    const borrowMap = {};
    borrows.forEach(b => {
      borrowMap[b.borrowID] = { ...b, items: [] };
    });

    items.forEach(i => {
      if (borrowMap[i.borrowID]) {
        borrowMap[i.borrowID].items.push({
          equipmentID: i.equipmentID,
          equipmentName: i.equipmentName,
          amount: i.amount,
          detailStatusID: i.detailStatusID,
          detailStatusName: i.detailStatusName
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


// ✅ API อัปเดตสถานะยืม-คืน (จนท.กทด.)
app.post("/api/update-borrow-status", (req, res) => {
  const { borrowID, statusID, note, userID } = req.body;

  if (!borrowID || statusID === undefined || !userID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  // ✅ ตรวจสอบสถานะปัจจุบันก่อน
  const sqlGet = "SELECT statusID, userID AS ownerID FROM borrow WHERE borrowID = ?";
  db.query(sqlGet, [borrowID], (err, results) => {
    if (err) {
      console.error("❌ Error fetching borrow status:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
    if (results.length === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบรายการนี้" });
    }

    const currentStatus = results[0].statusID;
    const ownerID = results[0].ownerID; // ✅ ผู้ใช้ที่ทำรายการนี้

    // ✅ ฟังก์ชันอัปเดตสถานะหลัก
    function updateBorrow(newStatus, msg, notifMsg, notifType, noteValue = null) {
      let sqlUpdate = "UPDATE borrow SET statusID = ?";
      const params = [newStatus];

      // ✅ ถ้าเป็นการอนุมัติ → บันทึกผู้อนุมัติ + วันที่
      if (newStatus === 1) {
        sqlUpdate += ", approveBy = ?, approveDate = NOW()";
        params.push(userID);
      }

      // ✅ ถ้าเป็นการส่งคืนสำเร็จ → บันทึกวันที่คืน
      if (newStatus === 3) {
        sqlUpdate += ", returnDate = NOW()";
      }

      // ✅ ถ้ามีหมายเหตุ
      if (noteValue) {
        sqlUpdate += ", note = ?";
        params.push(noteValue);
      }

      sqlUpdate += " WHERE borrowID = ?";
      params.push(borrowID);

      db.query(sqlUpdate, params, (err2, result) => {
        if (err2) {
          console.error("❌ Error updating borrow:", err2);
          return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
        }
        if (result.affectedRows === 0) {
          return res.status(400).json({ status: false, message: "ไม่สามารถอัปเดตสถานะได้" });
        }

        // ✅ เพิ่มแจ้งเตือนเข้า notifications
        const notifSql = `
          INSERT INTO notifications (userID, message, type, isRead, createdAt)
          VALUES (?, ?, ?, 0, NOW())
        `;
        db.query(notifSql, [ownerID, notifMsg, notifType], (notifErr) => {
          if (notifErr) console.error("❌ Error inserting borrow notif:", notifErr);
        });

        res.json({ status: true, message: msg, newStatus });
      });
    }

    // ✅ เงื่อนไขการเปลี่ยนสถานะ
    if (statusID === 1 && currentStatus === 0) {
      // 0 → 1 อนุมัติ
      return updateBorrow(
        statusID,
        "✅ อนุมัติการยืมเรียบร้อย",
        "✅ คำขอยืมของคุณได้รับการอนุมัติแล้ว",
        "borrow-approve",
        note
      );

    } else if (statusID === 9 && currentStatus === 1) {
      // 1 → 9 รับของ
      return updateBorrow(
        statusID,
        "📦 รับของสำเร็จแล้ว",
        "📦 คุณได้รับอุปกรณ์เรียบร้อยแล้ว",
        "borrow-receive",
        note
      );

    } else if (statusID === 7 && currentStatus === 9) {
      // 9 → 7 ติดตามอุปกรณ์
      return updateBorrow(
        statusID,
        "🔎 เปลี่ยนสถานะเป็นติดตามอุปกรณ์",
        "🔎 อุปกรณ์ของคุณอยู่ในสถานะติดตาม",
        "borrow-tracking",
        note
      );

    } else if (statusID === 3 && (currentStatus === 7 || currentStatus === 8)) {
      // ✅ ตรวจสอบว่าคืนครบทุกชิ้นหรือยัง
      const checkAllReturned = `
        SELECT COUNT(*) AS notReturned
        FROM borrowdetail
        WHERE borrowID = ? AND (statusID IS NULL OR statusID != 3)
      `;
      db.query(checkAllReturned, [borrowID], (errCheck, resultCheck) => {
        if (errCheck) {
          console.error("❌ Error checking returned items:", errCheck);
          return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะอุปกรณ์" });
        }

        const notReturned = resultCheck[0].notReturned;

        if (notReturned > 0) {
          return res.json({
            status: false,
            message: `❌ ยังมีอุปกรณ์ ${notReturned} รายการที่ยังไม่ได้ส่งคืนครบ`,
          });
        }

        // ✅ ดึงจำนวนที่คืนจริง (goodAmount + damagedAmount)
        const sqlDetail = `
          SELECT equipmentID, 
                 COALESCE(goodAmount, 0) + COALESCE(damagedAmount, 0) AS returnedAmount
          FROM borrowdetail
          WHERE borrowID = ?
        `;
        db.query(sqlDetail, [borrowID], (errDetail, details) => {
          if (errDetail) {
            console.error("❌ Error fetching borrow details:", errDetail);
            return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์" });
          }

          // ✅ คืนจำนวนที่คืนจริงกลับเข้า stock
          const promises = details.map(item =>
            new Promise((resolve, reject) => {
              const sqlUpdateEq = "UPDATE equipments SET amount = amount + ? WHERE equipmentID = ?";
              db.query(sqlUpdateEq, [item.returnedAmount, item.equipmentID], (errUpdate) =>
                errUpdate ? reject(errUpdate) : resolve()
              );
            })
          );

          Promise.all(promises)
            .then(() => {
              console.log("✅ คืนสต็อกอุปกรณ์สำเร็จ");
              updateBorrow(
                statusID,
                "✅ ส่งคืนครบทุกอุปกรณ์แล้ว และสต็อกถูกอัปเดตเรียบร้อย",
                "✅ คุณได้ส่งคืนอุปกรณ์ครบแล้ว",
                "borrow-return",
                note
              );
            })
            .catch(e => {
              console.error("❌ Error updating equipment stock:", e);
              res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการคืนอุปกรณ์" });
            });
        });
      });

    } else {
      return res.status(400).json({ status: false, message: "❌ สถานะนี้ไม่สามารถอัปเดตได้" });
    }
  });
});


// ✅ อัปเดตสถานะแยกชิ้น + ตรวจสอบสถานะรวมของรายการ
app.post("/api/update-borrowdetail-status", (req, res) => {
  const { borrowID, equipmentID, statusID, goodAmount, damagedAmount, note } = req.body;

  if (!borrowID || !equipmentID) {
    return res.status(400).json({ status: false, message: "❌ ข้อมูลไม่ครบ" });
  }

  const returnedAmount = (goodAmount || 0) + (damagedAmount || 0);

  const updateDetailSql = `
    UPDATE borrowdetail
    SET 
      statusID = ?, 
      goodAmount = ?, 
      damagedAmount = ?, 
      returnedAmount = ?, 
      note = ?, 
      returnDate = NOW()
    WHERE borrowID = ? AND equipmentID = ?
  `;

  db.query(
    updateDetailSql,
    [statusID, goodAmount, damagedAmount, returnedAmount, note, borrowID, equipmentID],
    (err, result) => {
      if (err) {
        console.error("❌ Error updating borrowdetail:", err);
        return res.status(500).json({ status: false, message: "อัปเดต borrowdetail ไม่สำเร็จ" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: false, message: "❌ ไม่พบอุปกรณ์นี้" });
      }

      // ✅ ตรวจสอบว่าทุกอุปกรณ์ในรายการนี้ statusID = 3 หรือยัง
      const checkAllSql = `
        SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN statusID = 3 THEN 1 ELSE 0 END) AS returned
        FROM borrowdetail
        WHERE borrowID = ?
      `;

      db.query(checkAllSql, [borrowID], (err2, rows) => {
        if (err2) {
          console.error("❌ Error checking borrowdetail:", err2);
          return res.status(500).json({ status: false, message: "ตรวจสอบสถานะรวมไม่สำเร็จ" });
        }

        const { total, returned } = rows[0];

        // ✅ ถ้าทุกชิ้นคืนแล้ว → อัปเดตตาราง borrow เป็น statusID = 3
        if (total > 0 && total === returned) {
          const updateBorrowSql = `
            UPDATE borrow 
            SET statusID = 3, returnDate = NOW()
            WHERE borrowID = ?
          `;
          db.query(updateBorrowSql, [borrowID], (err3) => {
            if (err3) {
              console.error("❌ Error updating borrow:", err3);
              return res.status(500).json({ status: false, message: "อัปเดตสถานะ borrow ไม่สำเร็จ" });
            }

            return res.json({
              status: true,
              message: "✅ อัปเดตสถานะสำเร็จ และรายการนี้ถูกเปลี่ยนเป็น 'ส่งคืนสำเร็จ'",
            });
          });
        } else {
          // ❗ ถ้ายังไม่ครบ แค่ตอบกลับว่าอัปเดต borrowdetail สำเร็จ
          return res.json({
            status: true,
            message: "✅ อัปเดตสถานะอุปกรณ์สำเร็จ (ยังไม่ครบทุกชิ้น)",
          });
        }
      });
    }
  );
});

// ✅ อัปเดตสถานะ borrow เป็น 3 และคืนอุปกรณ์เข้าสต็อก
app.post("/api/complete-borrow", (req, res) => {
  const { borrowID } = req.body;
  if (!borrowID) {
    return res.status(400).json({ status: false, message: "❌ ไม่พบ borrowID" });
  }

  // 1️⃣ ดึงรายการอุปกรณ์ที่อยู่ใน borrowdetail
  const sqlGetDetails = `
    SELECT equipmentID, goodAmount, damagedAmount
    FROM borrowdetail
    WHERE borrowID = ?
  `;
  db.query(sqlGetDetails, [borrowID], (err, details) => {
    if (err) {
      console.error("❌ Error fetching borrow details:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงรายการอุปกรณ์" });
    }

    if (details.length === 0) {
      return res.status(404).json({ status: false, message: "❌ ไม่พบรายละเอียดอุปกรณ์ของรายการนี้" });
    }

    // 2️⃣ อัปเดต stock ของอุปกรณ์แต่ละรายการ
    const updatePromises = details.map((item) => {
      const totalReturn = (item.goodAmount || 0) + (item.damagedAmount || 0);
      return new Promise((resolve, reject) => {
        const sqlUpdateEquip = `
          UPDATE equipments
          SET amount = amount + ?
          WHERE equipmentID = ?
        `;
        db.query(sqlUpdateEquip, [totalReturn, item.equipmentID], (err2) => {
          if (err2) {
            console.error("❌ Error updating equipment stock:", err2);
            return reject(err2);
          }
          resolve();
        });
      });
    });

    // 3️⃣ เมื่อคืนครบแล้ว → อัปเดตสถานะ borrow เป็น 3
    Promise.all(updatePromises)
      .then(() => {
        const sqlUpdateBorrow = `
          UPDATE borrow
          SET statusID = 3, returnDate = NOW()
          WHERE borrowID = ?
        `;
        db.query(sqlUpdateBorrow, [borrowID], (err3, result) => {
          if (err3) {
            console.error("❌ Error updating borrow:", err3);
            return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "❌ ไม่พบรายการนี้" });
          }
          return res.json({
            status: true,
            message: "✅ คืนอุปกรณ์เข้าสต็อกและเปลี่ยนสถานะเป็น 'ส่งคืนสำเร็จ' แล้ว",
          });
        });
      })
      .catch((err4) => {
        console.error("❌ Error in returning stock:", err4);
        return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการคืนอุปกรณ์เข้าสต็อก" });
      });
  });
});


// ✅ API ไม่อนุมัติการยืม-คืน (จนท.กทด.)
app.post("/api/reject-borrow", (req, res) => {
  const { borrowID } = req.body;

  if (!borrowID) {
    return res.status(400).json({ status: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  // 1️⃣ ดึงสถานะปัจจุบัน + userID ของรายการนี้
  const sqlStatus = "SELECT statusID, userID FROM borrow WHERE borrowID = ?";
  db.query(sqlStatus, [borrowID], (err, results) => {
    if (err) {
      console.error("❌ Error fetching borrow status:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }

    if (results.length === 0) {
      return res.status(404).json({ status: false, message: "ไม่พบรายการ" });
    }

    const currentStatus = results[0].statusID;
    const ownerID = results[0].userID; // ✅ เก็บ userID ผู้ขอไว้เพื่อแจ้งเตือน
    let newStatus;
    let notifMsg = "";
    let notifType = "";

    if (currentStatus === 0) {
      newStatus = 2; // ❌ ไม่อนุมัติคำขอยืม
      notifMsg = "❌ คำขอยืมของคุณไม่ได้รับการอนุมัติ";
      notifType = "borrow_rejected";
    } else if (currentStatus === 8) {
      newStatus = 4; // ❌ ส่งคืนไม่สำเร็จ → ไม่คืนอุปกรณ์
      notifMsg = "❌ คำขอส่งคืนของคุณไม่ได้รับการอนุมัติ";
      notifType = "return_rejected";
    } else {
      return res.status(400).json({ status: false, message: "สถานะนี้ไม่สามารถไม่อนุมัติได้" });
    }

    // ✅ ฟังก์ชันคืนอุปกรณ์ (เฉพาะ status 0)
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

    // 2️⃣ คืนอุปกรณ์ถ้าจำเป็น แล้วอัปเดตสถานะ
    updateEquipments()
      .then(() => {
        const sqlReject = "UPDATE borrow SET statusID = ? WHERE borrowID = ?";
        db.query(sqlReject, [newStatus, borrowID], (err, result) => {
          if (err) {
            console.error("❌ Error updating borrow status:", err);
            return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
          }

          if (result.affectedRows === 0) {
            return res.status(400).json({ status: false, message: "ไม่สามารถอัปเดตสถานะได้" });
          }

          // ✅ เพิ่มแจ้งเตือนเข้า notifications
          const notifSql = `
            INSERT INTO notifications (userID, message, type, isRead, createdAt)
            VALUES (?, ?, ?, 0, NOW())
          `;
          db.query(notifSql, [ownerID, notifMsg, notifType], (notifErr) => {
            if (notifErr) console.error("❌ Error inserting reject notif:", notifErr);
          });

          res.json({ status: true, message: "อัปเดตสถานะไม่อนุมัติเรียบร้อย", newStatus });
        });
      })
      .catch((err) => {
        console.error("❌ Error updating equipment amounts:", err);
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

// ✅ ตรวจสอบอุปกรณ์ที่ใกล้หมด
app.get("/api/low-stock", (req, res) => {
  const threshold = 5; // เช่น น้อยกว่า 5 ชิ้น

  const sql = `
    SELECT equipmentID, equipmentName, amount, typeID
    FROM equipments
    WHERE typeID = 1 AND amount < ?
    ORDER BY amount ASC
  `;

  db.query(sql, [threshold], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ status: false, message: "DB Error", error: err });
    }
    res.json({ status: true, data: results });
  });
});

// ✅ ดึงแจ้งเตือนตาม roleID
app.get("/api/notifications/:roleID", (req, res) => {
  const roleID = Number(req.params.roleID);

  if (roleID === 2) {
    // role 2 → เช็ค bring-pending
    const sql = `SELECT COUNT(*) AS total FROM bring WHERE statusID = 0`;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ status: false, message: "DB Error" });
      res.json({ status: true, notifications: rows[0].total > 0 ? ["มีรายการขอเบิก"] : [] });
    });
  } else if (roleID === 3) {
    // role 3 → เช็ค borrow-pending
    const sql = `SELECT COUNT(*) AS total FROM borrow WHERE statusID = 0`;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ status: false, message: "DB Error" });
      res.json({ status: true, notifications: rows[0].total > 0 ? ["มีรายการขอยืม"] : [] });
    });
  } else if (roleID === 1) {
    // role 1 → เช็คว่ามีอนุมัติแล้วมั้ย
    const sql = `
      SELECT COUNT(*) AS total 
      FROM bring 
      WHERE statusID = 1 AND approveDate >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ status: false, message: "DB Error" });
      res.json({ status: true, notifications: rows[0].total > 0 ? ["รายการของคุณได้รับการอนุมัติแล้ว"] : [] });
    });
  } else {
    res.json({ status: true, notifications: [] });
  }
});

// ✅ จำนวน bring pending
app.get("/api/bring/pending-count", (req, res) => {
  const sql = "SELECT COUNT(*) AS count FROM bring WHERE statusID = 0";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ status: false, message: "DB Error" });
    res.json({ status: true, count: rows[0].count });
  });
});

// ✅ จำนวน borrow pending
app.get("/api/borrow/pending-count", (req, res) => {
  const sql = "SELECT COUNT(*) AS count FROM borrow WHERE statusID = 0";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ status: false, message: "DB Error" });
    res.json({ status: true, count: rows[0].count });
  });
});

// ✅ API ดึงคำขอที่เพิ่งถูกอนุมัติ (แก้ชื่อให้ตรง approved ไม่ใช่ approvals)
app.get("/api/approved/latest", (req, res) => {
  const { userID, since } = req.query;
  if (!userID) return res.status(400).json({ status: false, message: "ต้องระบุ userID" });

  const sql = `
    SELECT borrowID AS refID, 'borrow' AS type, statusID, approveDate
    FROM borrow
    WHERE userID = ? AND statusID = 1 AND approveDate IS NOT NULL AND UNIX_TIMESTAMP(approveDate) > ?
    UNION
    SELECT bringID AS refID, 'bring' AS type, statusID, approveDate
    FROM bring
    WHERE userID = ? AND statusID = 1 AND approveDate IS NOT NULL AND UNIX_TIMESTAMP(approveDate) > ?
    ORDER BY approveDate DESC
  `;

  db.query(sql, [userID, since || 0, userID, since || 0], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: "DB Error" });
    }
    res.json({ status: true, items: rows });
  });
});


// ✅ API สำหรับเจ้าหน้าที่ roleID=3: มีคำขอคืนค้างอยู่
app.get("/api/returns/pending-count", (req, res) => {
  const sql = "SELECT COUNT(*) AS count FROM borrow WHERE statusID = 7 OR statusID = 8";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ status: false, message: "DB Error" });
    res.json({ status: true, count: rows[0].count });
  });
});

// ✅ API ดึงข้อมูลการคืนที่เสร็จสิ้น
app.get("/api/returns/approved-latest", (req, res) => {
  const { userID, since } = req.query;
  if (!userID) return res.status(400).json({ status: false, message: "ต้องระบุ userID" });

  const sql = `
    SELECT borrowID AS refID, 'return' AS type, statusID, returnDate AS at
    FROM borrow
    WHERE userID = ? AND statusID = 3 AND returnDate IS NOT NULL AND UNIX_TIMESTAMP(returnDate) > ?
    ORDER BY returnDate DESC
  `;
  db.query(sql, [userID, since || 0], (err, rows) => {
    if (err) {
      console.error("Error fetching return approved:", err);
      return res.status(500).json({ status: false, message: "DB Error" });
    }
    res.json({ status: true, items: rows });
  });
});

// ✅ ดึงแจ้งเตือนทั้งหมดของผู้ใช้ (อ่านแล้ว/ยังไม่อ่าน)
app.get("/api/notifications", (req, res) => {
  const userID = req.query.userID;
  const sql = `
    SELECT notifID AS id, message, type, isRead, createdAt
    FROM notifications
    WHERE userID = ?
    ORDER BY createdAt DESC
  `;
  db.query(sql, [userID], (err, results) => {
    if (err) return res.status(500).json({ status: false, message: "DB Error" });
    res.json({ status: true, data: results });
  });
});


// ✅ ดึงเฉพาะแจ้งเตือนที่ยังไม่อ่าน
app.get("/api/notifications/unread", (req, res) => {
  const userID = req.query.userID;
  if (!userID) {
    return res.status(400).json({ status: false, message: "ต้องระบุ userID" });
  }

  const sql = `
    SELECT notifID AS id, message, type, isRead, createdAt
    FROM notifications
    WHERE userID = ? AND isRead = 0
    ORDER BY createdAt DESC
  `;
  db.query(sql, [userID], (err, results) => {
    if (err) {
      console.error("❌ DB Error fetching unread notifications:", err);
      return res.status(500).json({ status: false, message: "DB Error" });
    }
    res.json({ status: true, data: results });
  });
});

// ✅ อัปเดตสถานะแจ้งเตือนเป็น "อ่านแล้ว"
app.post("/api/notifications/read", (req, res) => {
  const { userID } = req.body;
  if (!userID) {
    return res.status(400).json({ status: false, message: "ต้องระบุ userID" });
  }

  const sql = "UPDATE notifications SET isRead = 1 WHERE userID = ?";
  db.query(sql, [userID], (err, result) => {
    if (err) {
      console.error("❌ DB Error marking read:", err);
      return res.status(500).json({ status: false, message: "DB Error" });
    }
    res.json({ status: true, message: "✅ อัปเดตการแจ้งเตือนเป็นอ่านแล้ว" });
  });
});

// ✅ ลบแจ้งเตือนทั้งหมดของผู้ใช้
app.delete("/api/notifications/clear", (req, res) => {
  const userID = req.query.userID;
  if (!userID) {
    return res.status(400).json({ status: false, message: "ต้องระบุ userID" });
  }

  const sql = "DELETE FROM notifications WHERE userID = ?";
  db.query(sql, [userID], (err, result) => {
    if (err) {
      console.error("❌ DB Error clearing notifications:", err);
      return res.status(500).json({ status: false, message: "DB Error" });
    }
    res.json({ status: true, message: "🗑️ ลบแจ้งเตือนทั้งหมดสำเร็จ" });
  });
});

// ✅ ลบแจ้งเตือนตาม ID
app.delete("/api/notifications/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM notifications WHERE notifID = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ DB Error deleting notification:", err);
      return res.status(500).json({ status: false, message: "DB Error" });
    }
    res.json({ status: true, message: "🗑️ ลบแจ้งเตือนสำเร็จ" });
  });
});





//Web sever
app.listen(port, function(){
  console.log(`Server is running on http://localhost:${port}`);
});