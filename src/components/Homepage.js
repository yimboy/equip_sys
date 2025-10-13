import React, { useState, useEffect, useRef } from "react";
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
  Badge,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const theme = createTheme({
  typography: { fontFamily: "Kanit, Arial, sans-serif" },
});

const API_BASE = "http://localhost:4000";
const ENDPOINTS = {
  PENDING_BRING_COUNT: `${API_BASE}/api/bring/pending-count`,
  PENDING_BORROW_COUNT: `${API_BASE}/api/borrow/pending-count`,
  PENDING_RETURN_COUNT: `${API_BASE}/api/returns/pending-count`,
  LOW_STOCK: `${API_BASE}/api/low-stock`,
  NOTIFICATIONS: `${API_BASE}/api/notifications`,
};

function HomePage() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [first, setFirst] = useState(localStorage.getItem("firstname") || "");
  const [last, setLast] = useState(localStorage.getItem("lastname") || "");
  const [roleID, setRoleID] = useState(parseInt(localStorage.getItem("roleID") || "0"));

  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, text: "", severity: "info" });

  const navigate = useNavigate();
  const lastBringCountRef = useRef(0);
  const lastBorrowCountRef = useRef(0);
  const lastReturnCountRef = useRef(0);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userID = localStorage.getItem("userID");

  // ✅ โหลดข้อมูลโปรไฟล์
  useEffect(() => {
    if (isLoggedIn && userID) {
      fetch(`${API_BASE}/api/profile/${userID}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            if (data.firstName) {
              localStorage.setItem("firstname", data.firstName);
              setFirst(data.firstName);
            }
            if (data.lastName) {
              localStorage.setItem("lastname", data.lastName);
              setLast(data.lastName);
            }
            if (data.imageFile) {
              localStorage.setItem("profilePic", data.imageFile);
              setProfilePic(data.imageFile);
            }
            if (data.roleID) {
              localStorage.setItem("roleID", data.roleID);
              setRoleID(parseInt(data.roleID));
            }
          }
        })
        .catch((err) => console.error("❌ Profile fetch error:", err));
    }
  }, [isLoggedIn, userID]);

  // ✅ ดึงแจ้งเตือนทั้งหมด
  useEffect(() => {
    if (!isLoggedIn || !userID) return;

    const fetchNotifications = () => {
      fetch(`${ENDPOINTS.NOTIFICATIONS}?userID=${userID}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setNotifications(data.data);
          }
        })
        .catch((err) => console.error("❌ Fetch notifications error:", err));
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userID]);

  // 📦 ตรวจสอบอุปกรณ์เหลือน้อย (เฉพาะเจ้าหน้าที่)
  useEffect(() => {
    if (!isLoggedIn || roleID !== 2) return;

    const fetchLowStock = () => {
      fetch(ENDPOINTS.LOW_STOCK)
        .then((res) => res.json())
        .then((data) => {
          if (data?.status && data.data?.length > 0) {
            setSnackbar({
              open: true,
              text: `⚠️ พบอุปกรณ์ ${data.data.length} รายการที่เหลือน้อย`,
              severity: "warning",
            });

            setNotifications((prev) => {
              const filtered = prev.filter((n) => n.type !== "lowstock");
              return [
                ...filtered,
                ...data.data.map((item) => ({
                  id: `low-${item.equipmentID}`,
                  message: `⚠️ ${item.equipmentName} เหลือ ${item.amount} ชิ้น`,
                  isRead: 0,
                  type: "lowstock",
                })),
              ];
            });
          }
        })
        .catch((err) => console.error("❌ Fetch low stock error:", err));
    };

    fetchLowStock();
    const interval = setInterval(fetchLowStock, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, roleID]);

  // 📥 Polling ตรวจสอบคำขอใหม่
  useEffect(() => {
    if (!roleID) return;
    const controller = new AbortController();
    let timer;

    const poll = async () => {
      try {
        // 📥 คำขอเบิก
        if (roleID === 2) {
          const res = await fetch(ENDPOINTS.PENDING_BRING_COUNT, { signal: controller.signal });
          const data = await res.json();
          if (data?.status) {
            const count = Number(data.count || 0);
            if (count > 0 && count !== lastBringCountRef.current) {
              setSnackbar({ open: true, text: "📥 มีคำขอเบิกใหม่", severity: "info" });

              setNotifications((prev) => {
                const filtered = prev.filter((n) => n.type !== "bring-request");
                return [
                  ...filtered,
                  {
                    id: "bring-request",
                    message: `📥 มีคำขอเบิกใหม่ ${count} รายการ`,
                    isRead: 0,
                    type: "bring-request",
                  },
                ];
              });

              lastBringCountRef.current = count;
            }
          }
        }

        // 🎧 คำขอยืม
        if (roleID === 3) {
          const res = await fetch(ENDPOINTS.PENDING_BORROW_COUNT, { signal: controller.signal });
          const data = await res.json();
          if (data?.status) {
            const count = Number(data.count || 0);
            if (count > 0 && count !== lastBorrowCountRef.current) {
              setSnackbar({ open: true, text: "🎧 มีคำขอยืมใหม่", severity: "info" });

              setNotifications((prev) => {
                const filtered = prev.filter((n) => n.type !== "borrow-request");
                return [
                  ...filtered,
                  {
                    id: "borrow-request",
                    message: `🎧 มีคำขอยืมใหม่ ${count} รายการ`,
                    isRead: 0,
                    type: "borrow-request",
                  },
                ];
              });

              lastBorrowCountRef.current = count;
            }
          }
        }

        // 📦 คำขอคืน
        if (roleID === 3) {
          const res = await fetch(ENDPOINTS.PENDING_RETURN_COUNT, { signal: controller.signal });
          const data = await res.json();
          if (data?.status) {
            const count = Number(data.count || 0);
            if (count > 0 && count !== lastReturnCountRef.current) {
              setSnackbar({ open: true, text: "📦 มีคำขอส่งคืนใหม่", severity: "info" });

              setNotifications((prev) => {
                const filtered = prev.filter((n) => n.type !== "return-request");
                return [
                  ...filtered,
                  {
                    id: "return-request",
                    message: `📦 มีคำขอส่งคืนใหม่ ${count} รายการ`,
                    isRead: 0,
                    type: "return-request",
                  },
                ];
              });

              lastReturnCountRef.current = count;
            }
          }
        }
      } catch (err) {
        if (err?.name !== "AbortError") console.error("Polling error:", err);
      } finally {
        timer = setTimeout(poll, 30000);
      }
    };

    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [roleID]);

  // ✅ mark ว่าอ่านแล้ว
  const handleNotifClick = (event) => {
    if (!isLoggedIn) {
      setOpen(true);
      setTimeout(() => navigate("/login"), 1200);
    } else {
      setNotifAnchorEl(event.currentTarget);
      fetch(`${API_BASE}/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID }),
      }).then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      });
    }
  };

  // ✅ เมื่อคลิกที่แจ้งเตือน
  const handleNotifItemClick = (id) => {
    const clicked = notifications.find((n) => n.id === id);

    setNotifAnchorEl(null);
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // ✅ นำทางตาม type
    if (clicked?.type === "lowstock") navigate("/bring");
    if (clicked?.type === "bring-approve" || clicked?.type === "bring-reject") navigate("/history?type=bring");
    if (clicked?.type === "borrow-approve" || clicked?.type === "borrow-reject") navigate("/history?type=borrow");
    if (clicked?.type === "bring-request") navigate("/approvebring");
    if (clicked?.type === "borrow-request" || clicked?.type === "return-request") navigate("/approveborrow");

    fetch(`${API_BASE}/api/notifications/${id}`, { method: "DELETE" }).catch((err) =>
      console.error("❌ Delete notification error:", err)
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    setNotifAnchorEl(null);
    fetch(`${API_BASE}/api/notifications/clear?userID=${userID}`, { method: "DELETE" });
  };

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      setOpen(true);
      setTimeout(() => navigate("/login"), 1200);
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setNotifications([]);
    navigate("/login");
  };

  const notifCount = notifications.filter((n) => n.isRead === 0).length;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
              <Box component="img" src={logo} alt="logo" sx={{ width: 52, height: 52 }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              ระบบยืม-คืนอุปกรณ์
            </Typography>
            {isLoggedIn && <Typography sx={{ mr: 1 }}>{first} {last}</Typography>}

            {/* 🔔 กระดิ่ง */}
            <IconButton color="inherit" onClick={handleNotifClick}>
              <Badge badgeContent={notifCount} color="error" invisible={notifCount === 0}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={() => setNotifAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {notifications.length === 0 && <MenuItem disabled>ไม่มีการแจ้งเตือน</MenuItem>}
              {notifications.map((n) => (
                <MenuItem key={n.id} onClick={() => handleNotifItemClick(n.id)}>
                  {n.message}
                </MenuItem>
              ))}
              {notifications.length > 0 && (
                <MenuItem onClick={handleClearAll} sx={{ color: "red", fontWeight: "bold" }}>
                  ลบแจ้งเตือนทั้งหมด
                </MenuItem>
              )}
            </Menu>

            {/* 👤 เมนูผู้ใช้ */}
            <IconButton
              color="inherit"
              edge="end"
              onClick={(event) => setAnchorEl(event.currentTarget)}
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
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={() => navigate("/profile")}>จัดการข้อมูลผู้ใช้</MenuItem>
              <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* 📄 เนื้อหา */}
        <Box sx={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", alignItems: "center", pt: 6 }}>
          <Typography variant="h4" gutterBottom>ระบบยืม-คืนอุปกรณ์</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการอุปกรณ์</Typography>
          <Stack spacing={2} sx={{ mt: 4, width: 300 }}>
           {roleID === 1 && (
            <Stack direction="column" spacing={2}>
            <Button variant="contained" color="primary" size="large" onClick={() => handleProtectedClick("/bring")}>เบิก-จ่ายอุปกรณ์สำนักงาน</Button>
            <Button variant="contained" color="success" size="large" onClick={() => handleProtectedClick("/borrow")}>ยืมโสตทัศนูปกรณ์</Button>
            <Button variant="contained" color="warning" size="large" onClick={() => handleProtectedClick("/return")}>คืนโสตทัศนูปกรณ์</Button>
            </Stack>
            )}
          {roleID === 2 && (
            <Button variant="contained" color="success" size="large" onClick={() => handleProtectedClick("/edit-bring")}>
                แก้ไขวัสดุอุปกรณ์สำนักงาน
              </Button>
            )}
            {roleID === 3 && (
            <Button variant="contained" color="success" size="large" onClick={() => handleProtectedClick("/edit-borrow")}>
                แก้ไขอุปกรณ์โสตทัศนูปกรณ์
              </Button>
            )}

            {(roleID === 2 || roleID === 4) && (
              <Button variant="contained" color="secondary" size="large" onClick={() => handleProtectedClick("/approvebring")}>
                อนุมัติการเบิก-จ่าย
              </Button>
            )}
            {(roleID === 3 || roleID === 4) && (
              <Button variant="contained" color="secondary" size="large" onClick={() => handleProtectedClick("/approveborrow")}>
                อนุมัติการยืม-คืน
              </Button>
            )}
            {roleID === 4 && (
              <Button variant="contained" color="secondary" size="large" onClick={() => handleProtectedClick("/editrole")}>
                จัดการสิทธิ์ผู้ใช้
              </Button>
            )}
            <Button variant="outlined" color="info" size="large" onClick={() => handleProtectedClick("/history")}>
              ประวัติการเบิก-ยืมอุปกรณ์
            </Button>
          </Stack>
        </Box>

        {/* 🔔 Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.text || "มีการอัปเดตใหม่ ดูที่กระดิ่ง 🔔"}
          </Alert>
        </Snackbar>

        {/* ⚠️ Snackbar login */}
        <Snackbar
          open={open}
          autoHideDuration={1200}
          onClose={() => setOpen(false)}
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
