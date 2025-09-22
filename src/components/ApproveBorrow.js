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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const theme = createTheme({
  typography: { fontFamily: "Kanit, Arial, sans-serif" },
});

function ApproveBorrow() {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [borrowList, setBorrowList] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pendingBorrowID, setPendingBorrowID] = useState(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const roleID = localStorage.getItem("roleID");
  const userID = localStorage.getItem("userID");

  const formatDateOnly = (dateStr) => (dateStr ? dateStr.slice(0, 10) : "-");

  const getStatusColor = (statusID) => {
    switch (statusID) {
      case 0: return "default"; // รอดำเนินการ
      case 1: return "success"; // อนุมัติ
      case 9: return "success"; // รับของสำเร็จ
      case 7: return "warning"; // ติดตามอุปกรณ์
      case 2: return "error";   // ไม่อนุมัติ
      case 3: return "success"; // ส่งคืนสำเร็จ
      case 8: return "default"; // รอตรวจสอบ
      default: return "default";
    }
  };

  const loadBorrowData = () => {
    fetch("http://localhost:4000/api/borrow-pending")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setBorrowList(data.data);
        else setBorrowList([]);
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  useEffect(() => {
    if (!isLoggedIn || (roleID !== "3" && roleID !== "4")) {
      navigate("/login");
      return;
    }
    loadBorrowData();
  }, [isLoggedIn, roleID]);

  useEffect(() => {
    if (isLoggedIn) {
      const pic = localStorage.getItem("profilePic");
      if (pic) setProfilePic(pic);
    } else setProfilePic(null);
  }, [isLoggedIn]);

  const handleUserIconClick = (event) => {
    if (!isLoggedIn) navigate("/login");
    else setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => { localStorage.clear(); handleMenuClose(); navigate("/login"); };
  const handleProfile = () => { handleMenuClose(); navigate("/profile"); };
  const handleClose = (_, reason) => { if (reason !== "clickaway") setOpen(false); };

  // อัปเดตสถานะ
  const handleUpdateStatus = (borrowID, currentStatus) => {
    let newStatus = null;
    if (currentStatus === 0) newStatus = 1; // อนุมัติ
    else if (currentStatus === 1) newStatus = 9; // รับของ
    else if (currentStatus === 9) newStatus = 7; // ✅ ติดตามอุปกรณ์
    else return;

    const confirmMsg =
      newStatus === 1 ? "ยืนยันการอนุมัติการยืม?" :
      newStatus === 9 ? "ยืนยันการรับของแล้ว?" :
      "เปลี่ยนเป็นติดตามอุปกรณ์?";

    if (!window.confirm(confirmMsg)) return;

    fetch("http://localhost:4000/api/update-borrow-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID, statusID: newStatus, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.message || "อัปเดตสถานะสำเร็จ");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBorrowData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  // ไม่อนุมัติ
  const handleReject = (borrowID) => {
    if (!window.confirm("ยืนยันการไม่อนุมัติการยืม-คืนนี้?")) return;

    fetch("http://localhost:4000/api/update-borrow-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID, statusID: 2, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.message || "ไม่อนุมัติสำเร็จ");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBorrowData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการไม่อนุมัติ");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  // ส่งคืน
  const handleReturnClick = (borrowID) => {
    setPendingBorrowID(borrowID);
    setNoteText("");
    setNoteOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!pendingBorrowID) return;

    fetch("http://localhost:4000/api/update-borrow-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID: pendingBorrowID, statusID: 3, note: noteText, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.message || "อัปเดตสถานะสำเร็จ");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBorrowData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        setAlertSeverity("error");
        setOpen(true);
      })
      .finally(() => {
        setNoteOpen(false);
        setPendingBorrowID(null);
      });
  };

  const handleDetailOpen = (item) => { setSelectedDetail(item); setDetailOpen(true); };
  const handleDetailClose = () => { setDetailOpen(false); setSelectedDetail(null); };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }} onClick={() => navigate("/homepage")}>
              <Box component="img" src={logo} alt="logo" sx={{ width: 52, height: 52, objectFit: "contain" }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>อนุมัติการยืม-คืนอุปกรณ์</Typography>
            {isLoggedIn && <Typography sx={{ mr: 1 }}>{firstname} {lastname}</Typography>}
            <IconButton color="inherit" edge="end" onClick={handleUserIconClick} sx={{ p: 0, ml: 1 }}>
              {isLoggedIn && profilePic ? <Avatar src={profilePic} sx={{ width: 36, height: 36 }} /> : <AccountCircleIcon sx={{ width: 36, height: 36 }} />}
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleProfile}>จัดการข้อมูลผู้ใช้</MenuItem>
              <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>รายการที่รออนุมัติ</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>วันที่ยืม</TableCell>
                  <TableCell>จำนวนรายการ</TableCell>
                  <TableCell>วันรับของ</TableCell>
                  <TableCell>วันส่งคืน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>รายละเอียด</TableCell>
                  <TableCell>การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {borrowList.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">ไม่พบข้อมูล</TableCell></TableRow>
                ) : borrowList.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDateOnly(item.borrowDate)}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{formatDateOnly(item.receiveDate)}</TableCell>
                    <TableCell>{formatDateOnly(item.returnDate)}</TableCell>
                    <TableCell><Chip label={item.statusName || "-"} color={getStatusColor(item.statusID)} /></TableCell>
                    <TableCell><Button size="small" variant="outlined" onClick={() => handleDetailOpen(item)}>รายละเอียด</Button></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {(item.statusID === 0 || item.statusID === 1 || item.statusID === 9) && (
                          <Button
                            size="small"
                            variant="contained"
                            color={
                              item.statusID === 0 ? "success" :
                              item.statusID === 1 ? "primary" : "warning"
                            }
                            onClick={() => handleUpdateStatus(item.borrowID, item.statusID)}
                          >
                            {item.statusID === 0 ? "อนุมัติ" :
                             item.statusID === 1 ? "รับของ" : "ติดตาม"}
                          </Button>
                        )}
                        {item.statusID === 8 && (
                          <Button size="small" variant="contained" color="success" onClick={() => handleReturnClick(item.borrowID)}>ส่งคืนสำเร็จ</Button>
                        )}
                        {item.statusID !== 7 && item.statusID !== 8 && item.statusID !== 9 && (
                          <Button size="small" variant="contained" color="error" onClick={() => handleReject(item.borrowID)}>ไม่อนุมัติ</Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Dialog รายละเอียด */}
        <Dialog open={detailOpen} onClose={handleDetailClose} maxWidth="sm" fullWidth>
          <DialogTitle>รายละเอียดการยืม-คืน</DialogTitle>
          <DialogContent dividers>
            {selectedDetail ? (
              <Box>
                <Typography variant="body1" mb={1}><strong>วันที่ยืม:</strong> {formatDateOnly(selectedDetail.borrowDate)}</Typography>
                <Typography variant="body1" mb={1}><strong>ประเภท:</strong> {selectedDetail.typeName || "-"}</Typography>
                <Typography variant="body1" mb={1}><strong>วันรับของ:</strong> {formatDateOnly(selectedDetail.receiveDate)}</Typography>
                <Typography variant="body1" mb={1}><strong>วันส่งคืน:</strong> {formatDateOnly(selectedDetail.returnDate)}</Typography>
                <Typography variant="body1" mb={1}><strong>สถานะ:</strong> {selectedDetail.statusName || "-"}</Typography>
                <Typography variant="body1" mb={1}><strong>ชื่อผู้ยืม:</strong> {selectedDetail.firstname && selectedDetail.lastname ? `${selectedDetail.firstname} ${selectedDetail.lastname}` : "-"}</Typography>
                {selectedDetail.items && selectedDetail.items.length > 0 ? selectedDetail.items.map((item, idx) => (
                  <Typography key={idx} variant="body2" sx={{ ml: 2 }}>- {item.equipmentName} จำนวน {item.amount} ชิ้น</Typography>
                )) : <Typography variant="body2" sx={{ ml: 2 }}>ไม่มีข้อมูลอุปกรณ์</Typography>}
              </Box>
            ) : <Typography>กำลังโหลดข้อมูล...</Typography>}
          </DialogContent>
          <DialogActions><Button onClick={handleDetailClose}>ปิด</Button></DialogActions>
        </Dialog>

        {/* Dialog หมายเหตุ */}
        <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>กรอกหมายเหตุการส่งคืน</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="หมายเหตุ"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNoteOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleConfirmReturn} variant="contained" color="success">ยืนยัน</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={open} autoHideDuration={2500} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={alertSeverity} sx={{ width: "100%" }}>{alertMsg}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default ApproveBorrow;
