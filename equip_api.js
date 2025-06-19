const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
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
app.use(express.json()) // get JSON data
app.use(express.urlencoded({ extended: true })) // get HTML-FORM
app.use(cors()) // enable CORS to be Middleware

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
   

//Web sever
app.listen(port, function(){
  console.log(`Server is running on http://localhost:${port}`);
});