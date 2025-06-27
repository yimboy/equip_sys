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
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function HomePage() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [first, setFirst] = useState(localStorage.getItem("firstname") || "");
  const [last, setLast] = useState(localStorage.getItem("lastname") || "");

  const navigate = useNavigate();

  // ออกจากระบบอัตโนมัติเมื่อปิด/refresh
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

  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // โหลดข้อมูลผู้ใช้ล่าสุด
  useEffect(() => {
    if (isLoggedIn) {
      const userID = localStorage.getItem("userID");
      if (userID) {
        fetch(`http://localhost:4000/api/profile/${userID}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.status) {
              // อัปเดตชื่อ
              if (data.firstName) {
                localStorage.setItem("firstname", data.firstName);
                setFirst(data.firstName);
              }
              if (data.lastName) {
                localStorage.setItem("lastname", data.lastName);
                setLast(data.lastName);
              }
              // อัปเดตรูป
              if (data.imageFile) {
                localStorage.setItem("profilePic", data.imageFile);
                setProfilePic(data.imageFile);
              }
            }
          })
          .catch((err) => {
            console.error("❌ Profile fetch error:", err);
          });
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

  const handleUserIconClick = (event) => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    localStorage.removeItem("userID");
    localStorage.removeItem("profilePic");
    handleMenuClose();
    navigate("/login");
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
              <Box
                component="img"
                src={logo}
                alt="logo"
                sx={{ width: 52, height: 52, objectFit: "contain" }}
              />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              ระบบเบิก-จ่ายอุปกรณ์
            </Typography>
            {isLoggedIn && (
              <Typography sx={{ mr: 1 }}>
                {first} {last}
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
              เบิก-จ่ายอุปกรณ์สำนักงาน
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => handleProtectedClick("/borrow")}
            >
              ยืม-คืนอุปกรณ์สำนักงาน
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
