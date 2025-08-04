import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Chip,
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

function Return() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const userID = localStorage.getItem("userID");

  useEffect(() => {
    if (!userID) return;
    fetch(`http://localhost:4000/api/history-borrow?userID=${userID}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("DATA FROM API:", data);
        setHistory(data);
      })
      .catch(() => setHistory([]));
  }, [userID]);

  useEffect(() => {
    if (isLoggedIn) {
      const pic = localStorage.getItem("profilePic");
      if (pic) setProfilePic(pic);
    } else {
      setProfilePic(null);
    }
  }, [isLoggedIn]);

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

  // ฟังก์ชันส่งคืนทั้งหมดใน borrowID นั้น ๆ
  const handleReturnAllClick = (borrowID) => {
    fetch("http://localhost:4000/api/update-all-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID, statusID: 0 }), // 0 = รอตรวจสอบ
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("ส่งคืนรายการทั้งหมดแล้ว → รอตรวจสอบ");
          setAlertSeverity("success");
          setOpen(true);
          // รีเฟรชข้อมูลใหม่
          fetch(`http://localhost:4000/api/history-borrow?userID=${userID}`)
            .then((res) => res.json())
            .then((data) => setHistory(data));
        } else {
          setAlertMsg("เกิดข้อผิดพลาดในการส่งคืน");
          setAlertSeverity("error");
          setOpen(true);
        }
      })
      .catch(() => {
        setAlertMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              sx={{ mr: 1 }}
              onClick={() => navigate("/homepage")}
            >
              <Box
                component="img"
                src={logo}
                alt="logo"
                sx={{ width: 52, height: 52, objectFit: "contain" }}
              />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              คืนอุปกรณ์โสตฯ
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

        <Box sx={{ maxWidth: 1100, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            ประวัติการยืม-คืนอุปกรณ์โสตฯ
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>วันที่ยืม</TableCell>
                  <TableCell>ชื่ออุปกรณ์</TableCell>
                  <TableCell>จำนวน</TableCell>
                  <TableCell>วันที่รับของ</TableCell>
                  <TableCell>กำหนดคืน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  history.flatMap((row) =>
                    row.details.map((detail, dIdx) => (
                      <TableRow key={`${row.borrowID}-${detail.equipmentID}`}>
                        <TableCell>
                          {row.date
                            ? new Date(row.date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{detail.equipmentName}</TableCell>
                        <TableCell>{detail.amount}</TableCell>
                        <TableCell>
                          {detail.receiveDate
                            ? new Date(detail.receiveDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {detail.returnDate
                            ? new Date(detail.returnDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              row.statusID === 0
                                ? "รอตรวจสอบ"
                                : row.statusID === 1
                                ? "อนุมัติ"
                                : row.statusID === 2
                                ? "ไม่อนุมัติ"
                                : row.statusID === 3
                                ? "ส่งคืนสำเร็จ"
                                : row.statusID === 4
                                ? "ส่งคืนไม่สำเร็จ"
                                : row.statusID === 5
                                ? "ขอยกเลิก"
                                : row.statusID === 6
                                ? "ยกเลิก"
                                : "ไม่ทราบสถานะ"
                            }
                            color={
                              row.statusID === 0
                                ? "default"
                                : row.statusID === 1
                                ? "success"
                                : row.statusID === 2
                                ? "error"
                                : row.statusID === 3
                                ? "success"
                                : row.statusID === 4
                                ? "error"
                                : row.statusID === 5
                                ? "warning"
                                : row.statusID === 6
                                ? "info"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {/* แสดงปุ่ม "ส่งคืนทั้งหมด" แค่แถวแรกของแต่ละ borrowID และเมื่อสถานะอนุมัติ */}
                          {dIdx === 0 && row.statusID === 1 && (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleReturnAllClick(row.borrowID)}
                            >
                              ส่งคืน
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Snackbar
          open={open}
          autoHideDuration={2500}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={alertSeverity} sx={{ width: "100%" }}>
            {alertMsg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default Return;