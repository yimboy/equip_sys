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
      } else {
        setMessage(response.data.message);
        setSeverity("error");
      }
      setOpen(true);
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
      </Box>
    </ThemeProvider>
  );
}

export default Login;