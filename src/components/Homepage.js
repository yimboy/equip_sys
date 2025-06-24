import React, { useState, useEffect } from "react";
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
  Avatar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
// import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded"; // ลบไอคอนเดิม
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // เพิ่มโลโก้ (แก้ path ตามที่เก็บโลโก้จริง)

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function HomePage() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // สำหรับเมนูผู้ใช้
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();

  // ออกจากระบบอัตโนมัติเมื่อปิด/refresh เว็บ
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("firstname");
      localStorage.removeItem("lastname");
      localStorage.removeItem("userID");
      localStorage.removeItem("profilePic");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ตรวจสอบสถานะการล็อกอิน
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");

  // โหลดรูปโปรไฟล์จาก localStorage (ถ้ามี)
  useEffect(() => {
    if (isLoggedIn) {
      // กรณี profilePic ถูกเก็บใน localStorage
      const pic = localStorage.getItem("profilePic");
      if (pic) {
        setProfilePic(pic);
      } else {
        // ถ้าไม่มีใน localStorage ให้ลองดึงจาก backend (ถ้ามี userID)
        const userID = localStorage.getItem("userID");
        if (userID) {
          fetch(`http://localhost:4000/api/profile/${userID}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.imageFile) {
                setProfilePic(data.imageFile);
                localStorage.setItem("profilePic", data.imageFile);
              }
            })
            .catch(() => {});
        }
      }
    } else {
      setProfilePic(null);
    }
  }, [isLoggedIn]);

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
    localStorage.removeItem("userID");
    localStorage.removeItem("profilePic");
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
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
              <Box
                component="img"
                src={logo}
                alt="logo"
                sx={{ width: 36, height: 36, objectFit: "contain" }}
              />
            </IconButton>
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
              sx={{ p: 0, ml: 1 }}
            >
              {isLoggedIn && profilePic ? (
                <Avatar src={profilePic} sx={{ width: 36, height: 36 }} />
              ) : (
                <AccountCircleIcon sx={{ width: 36, height: 36 }} />
              )}
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