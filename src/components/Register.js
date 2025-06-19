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

function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    firstname: "",
    lastname: "",
  });
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("info");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:4000/api/register", form);
      if (response.data.status) {
        setMessage("ลงทะเบียนสำเร็จ");
        setSeverity("success");
        setForm({ username: "", password: "", firstname: "", lastname: "" });
        setOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setMessage(response.data.message || "เกิดข้อผิดพลาด");
        setSeverity("error");
        setOpen(true);
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดในการลงทะเบียน");
      setSeverity("error");
      setOpen(true);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
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
            สมัครสมาชิก
          </Typography>
          <form onSubmit={handleRegister}>
            <TextField
              label="ชื่อจริง"
              name="firstname"
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.firstname}
              onChange={handleChange}
              required
            />
            <TextField
              label="นามสกุล"
              name="lastname"
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.lastname}
              onChange={handleChange}
              required
            />
            <TextField
              label="ชื่อผู้ใช้"
              name="username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.username}
              onChange={handleChange}
              required
            />
            <TextField
              label="รหัสผ่าน"
              name="password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={handleChange}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
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

export default Register;