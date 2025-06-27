import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// สร้าง theme สำหรับฟอนต์ Kanit
const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("info");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:4000/api/login", {
        username,
        password,
      });
      if (response.data.status) {
        setMessage("เข้าสู่ระบบสำเร็จ");
        setSeverity("success");
        // เก็บข้อมูลผู้ใช้ใน localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("firstname", response.data.firstname);
        localStorage.setItem("lastname", response.data.lastname);
        localStorage.setItem("userID", response.data.userID);
        setOpen(true);
        setTimeout(() => {
          navigate("/homepage");
        }, 1200);
      } else {
        setMessage(response.data.message);
        setSeverity("error");
        setOpen(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setSeverity("error");
      setOpen(true);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  // ฟังก์ชันสำหรับ Forgot Password
  const handleForgotPassword = async () => {
    if (!forgotUsername || !newPassword || !confirmPassword) {
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setSeverity("error");
      setOpen(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      setSeverity("error");
      setOpen(true);
      return;
    }
    setForgotLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/forgot-password", {
        username: forgotUsername,
        newPassword,
      });
      if (res.data.status) {
        setMessage("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่");
        setSeverity("success");
        setForgotOpen(false);
        setForgotUsername("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(res.data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
        setSeverity("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      setSeverity("error");
    }
    setForgotLoading(false);
    setOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
          <Typography variant="h5" align="center" gutterBottom>
            เข้าสู่ระบบ
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              label="ชื่อผู้ใช้"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <TextField
              label="รหัสผ่าน"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              เข้าสู่ระบบ
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleRegisterClick}
            >
              สมัครสมาชิก
            </Button>
            <Button
              variant="text"
              color="info"
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => setForgotOpen(true)}
            >
              ลืมรหัสผ่าน?
            </Button>
          </form>
        </Paper>
        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
            {message}
          </Alert>
        </Snackbar>
        {/* Dialog สำหรับลืมรหัสผ่าน */}
        <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)}>
          <DialogTitle>ลืมรหัสผ่าน</DialogTitle>
          <DialogContent>
            <TextField
              label="ชื่อผู้ใช้"
              variant="outlined"
              fullWidth
              margin="normal"
              value={forgotUsername}
              onChange={(e) => setForgotUsername(e.target.value)}
            />
            <TextField
              label="รหัสผ่านใหม่"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForgotOpen(false)} color="secondary">
              ยกเลิก
            </Button>
            <Button
              onClick={handleForgotPassword}
              color="primary"
              disabled={forgotLoading}
            >
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default Login;