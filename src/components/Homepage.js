import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function HomePage() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // สำหรับเมนูผู้ใช้
  const navigate = useNavigate();

  // ตรวจสอบสถานะการล็อกอิน
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");

  // ฟังก์ชันสำหรับปุ่มที่ต้องล็อกอิน
  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      setOpen(true);
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } else {
      navigate(path);
    }
  };

  // ฟังก์ชันเมื่อคลิกไอคอนผู้ใช้งาน
  const handleUserIconClick = (event) => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  // ปิดเมนู
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    handleMenuClose();
    navigate("/login");
  };

  // ไปหน้าข้อมูลผู้ใช้
  const handleProfile = () => {
    handleMenuClose();
    navigate("/profile"); // ต้องมี route /profile
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        {/* Header */}
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              ระบบเบิก-จ่ายอุปกรณ์
            </Typography>
            {isLoggedIn && (
              <Typography sx={{ mr: 1 }}>
                {firstname} {lastname}
              </Typography>
            )}
            <IconButton
              color="inherit"
              edge="end"
              onClick={handleUserIconClick}
            >
              <AccountCircleIcon />
            </IconButton>
            {/* เมนูผู้ใช้ */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleProfile}>จัดการข้อมูลผู้ใช้</MenuItem>
              <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        {/* Main Content */}
        <Box
          sx={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: "column",
            pt: 6,
          }}
        >
          <Typography variant="h4" gutterBottom>
            ระบบเบิก-จ่ายอุปกรณ์
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการอุปกรณ์
          </Typography>
          <Stack spacing={2} sx={{ mt: 4, width: 300 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => handleProtectedClick("/request")}
            >
              เบิกอุปกรณ์
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => handleProtectedClick("/borrow")}
            >
              ยืมอุปกรณ์
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={() => navigate("/equipment-list")}
            >
              รายการอุปกรณ์
            </Button>
            <Button
              variant="outlined"
              color="info"
              size="large"
              onClick={() => handleProtectedClick("/history")}
            >
              ประวัติการเบิก-จ่าย
            </Button>
          </Stack>
        </Box>
        {/* Popup แจ้งเตือน */}
        <Snackbar
          open={open}
          autoHideDuration={1200}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="warning" sx={{ width: "100%" }}>
            กรุณาลงชื่อเข้าใช้ก่อน
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default HomePage;