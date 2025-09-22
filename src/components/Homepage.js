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
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

const API_BASE = "http://localhost:4000";
const ENDPOINTS = {
  PENDING_BRING_COUNT: `${API_BASE}/api/bring/pending-count`,
  PENDING_BORROW_COUNT: `${API_BASE}/api/borrow/pending-count`,
  APPROVALS_LATEST: `${API_BASE}/api/approvals/latest`,
  LOW_STOCK: `${API_BASE}/api/low-stock`,
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
  const lastSeenApprovalTsRef = useRef(0);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.clear();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // โหลดโปรไฟล์
  useEffect(() => {
    if (isLoggedIn) {
      const userID = localStorage.getItem("userID");
      if (userID) {
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
    } else {
      setProfilePic(null);
    }
  }, [isLoggedIn]);

  // 📦 แจ้งเตือนอุปกรณ์เหลือน้อย
  useEffect(() => {
    if (roleID === 2) {
      fetch(ENDPOINTS.LOW_STOCK)
        .then((res) => res.json())
        .then((data) => {
          if (data.status && Array.isArray(data.data) && data.data.length > 0) {
            const texts = data.data.map(
              (item) => `⚠️ ${item.equipmentName} คงเหลือ ${item.amount} ชิ้น`
            );
            setNotifications((prev) => [
              ...texts.map((t, idx) => ({
                id: `lowstock-${idx}-${Date.now()}`,
                text: t,
                to: "/bring",
                kind: "lowstock", // ✅ lowstock
              })),
              ...prev,
            ]);
            setSnackbar({ open: true, text: "มีอุปกรณ์บางรายการใกล้หมด", severity: "warning" });
          }
        })
        .catch((err) => console.error("❌ Low stock fetch error:", err));
    }
  }, [roleID]);

  // 📥 ระบบแจ้งเตือนตาม role
  useEffect(() => {
    if (!roleID) return;

    const controller = new AbortController();
    let timer;

    const poll = async () => {
      try {
        if (roleID === 2) {
          const res = await fetch(ENDPOINTS.PENDING_BRING_COUNT, { signal: controller.signal });
          const data = await res.json();
          if (data?.status) {
            const count = Number(data.count || 0);
            if (count > 0 && count !== lastBringCountRef.current) {
              pushOrReplaceNotice(
                "bring-pending",
                `📥 มีรายการขอเบิก (${count})`,
                "/approvebring",
                "request" // ✅ request
              );
              setSnackbar({ open: true, text: "มีรายการขอเบิกใหม่", severity: "info" });
              lastBringCountRef.current = count;
            }
          }
        }

        if (roleID === 3) {
          const res = await fetch(ENDPOINTS.PENDING_BORROW_COUNT, { signal: controller.signal });
          const data = await res.json();
          if (data?.status) {
            const count = Number(data.count || 0);
            if (count > 0 && count !== lastBorrowCountRef.current) {
              pushOrReplaceNotice(
                "borrow-pending",
                `🎧 มีรายการขอยืม (${count})`,
                "/approveborrow",
                "request" // ✅ request
              );
              setSnackbar({ open: true, text: "มีรายการขอยืมใหม่", severity: "info" });
              lastBorrowCountRef.current = count;
            }
          }
        }

        if (roleID === 1) {
          const since = lastSeenApprovalTsRef.current || 0;
          const res = await fetch(`${ENDPOINTS.APPROVALS_LATEST}?since=${since}`, { signal: controller.signal });
          const data = await res.json();
          if (data?.status && Array.isArray(data.items) && data.items.length > 0) {
            const maxTs = Math.max(...data.items.map((it) => Number(it.at || 0)));
            if (maxTs) lastSeenApprovalTsRef.current = maxTs;
            pushOrPrepend(
              `✅ อนุมัติแล้ว (${data.items.length})`,
              "/history",
              "request" // ✅ request
            );
            setSnackbar({ open: true, text: "มีรายการที่ได้รับการอนุมัติแล้ว", severity: "success" });
          }
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Polling error:", err);
        }
      } finally {
        timer = setTimeout(poll, 30000);
      }
    };

    const pushOrReplaceNotice = (key, text, to, kind = "request") => {
      setNotifications((prev) => {
        const idx = prev.findIndex((n) => n.id.startsWith(key));
        const nextItem = { id: `${key}-${Date.now()}`, text, to, kind };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = nextItem;
          return copy;
        }
        return [nextItem, ...prev];
      });
    };

    const pushOrPrepend = (text, to, kind = "request") => {
      setNotifications((prev) => [{ id: `msg-${Date.now()}`, text, to, kind }, ...prev]);
    };

    poll();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [roleID]);

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      setOpen(true);
      setTimeout(() => navigate("/login"), 1200);
    } else {
      navigate(path);
    }
  };

  const handleUserIconClick = (event) => {
    if (!isLoggedIn) navigate("/login");
    else setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    handleMenuClose();
    navigate("/login");
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  // เมนูกระดิ่ง
  const handleNotifClick = (event) => {
    if (!isLoggedIn) {
      setOpen(true);
      setTimeout(() => navigate("/login"), 1200);
    } else {
      setNotifAnchorEl(event.currentTarget);
    }
  };
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleNotifItemClick = (to) => {
    setNotifAnchorEl(null);
    if (to) navigate(to);
  };

  const lowStockCount = notifications.filter(n => n.kind === "lowstock").length;
  const requestCount = notifications.filter(n => n.kind === "request").length;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
              <Box component="img" src={logo} alt="logo" sx={{ width: 52, height: 52, objectFit: "contain" }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              ระบบเบิก-จ่ายอุปกรณ์
            </Typography>
            {isLoggedIn && <Typography sx={{ mr: 1 }}>{first} {last}</Typography>}

            {/* กระดิ่งแจ้งเตือน (Badge 2 สี) */}
            <IconButton color="inherit" onClick={handleNotifClick}>
              <Badge
                badgeContent={requestCount}
                color="error"
                invisible={requestCount === 0}
              >
                <Badge
                  badgeContent={lowStockCount}
                  color="warning"
                  invisible={lowStockCount === 0}
                >
                  <NotificationsIcon />
                </Badge>
              </Badge>
            </IconButton>

            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {/* 📦 อุปกรณ์ใกล้หมด */}
              {lowStockCount > 0 && (
                <>
                  <MenuItem disabled>📦 อุปกรณ์ใกล้หมด</MenuItem>
                  {notifications.filter(n => n.kind === "lowstock").map((n) => (
                    <MenuItem key={n.id} onClick={() => handleNotifItemClick(n.to)}>
                      {n.text}
                    </MenuItem>
                  ))}
                </>
              )}

              {/* 📥 คำขอใหม่ */}
              {requestCount > 0 && (
                <>
                  <MenuItem disabled>📥 คำขอใหม่</MenuItem>
                  {notifications.filter(n => n.kind === "request").map((n) => (
                    <MenuItem key={n.id} onClick={() => handleNotifItemClick(n.to)}>
                      {n.text}
                    </MenuItem>
                  ))}
                </>
              )}

              {notifications.length === 0 && <MenuItem disabled>ไม่มีการแจ้งเตือน</MenuItem>}
            </Menu>

            {/* User Avatar */}
            <IconButton color="inherit" edge="end" onClick={handleUserIconClick} sx={{ p: 0, ml: 1 }}>
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
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleProfile}>จัดการข้อมูลผู้ใช้</MenuItem>
              <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* เนื้อหาหลัก */}
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
          <Typography variant="h4" gutterBottom>ระบบเบิก-จ่ายอุปกรณ์</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการอุปกรณ์
          </Typography>
          <Stack spacing={2} sx={{ mt: 4, width: 300 }}>
            <Button variant="contained" color="primary" size="large" onClick={() => handleProtectedClick("/bring")}>
              เบิก-จ่ายอุปกรณ์สำนักงาน
            </Button>
            <Button variant="contained" color="success" size="large" onClick={() => handleProtectedClick("/borrow")}>
              ยืมโสตทัศนูปกรณ์
            </Button>
            <Button variant="contained" color="warning" size="large" onClick={() => handleProtectedClick("/return")}>
              คืนโสตทัศนูปกรณ์
            </Button>

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
                แก้ไขสิทธิ์ผู้ใช้
              </Button>
            )}
            <Button variant="outlined" color="info" size="large" onClick={() => handleProtectedClick("/history")}>
              ประวัติการเบิก-จ่าย
            </Button>
          </Stack>
        </Box>

        {/* Snackbar กลางๆ */}
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

        {/* Snackbar แจ้ง login */}
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
