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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [goodAmount, setGoodAmount] = useState("");
  const [damagedAmount, setDamagedAmount] = useState("");
  const [note, setNote] = useState("");

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const roleID = localStorage.getItem("roleID");
  const userID = localStorage.getItem("userID");

  const getStatusColor = (statusID) => {
    switch (statusID) {
      case 0: return "default";
      case 1: return "success";
      case 2: return "error";
      case 3: return "success";
      case 4: return "error";
      case 5: return "warning";
      case 6: return "error";
      case 7: return "warning";
      case 8: return "default";
      case 9: return "success";
      default: return "default";
    }
  };

  const formatDateOnly = (dateStr) => (dateStr ? dateStr.slice(0, 10) : "-");

  // ✅ โหลดข้อมูล
  const loadBorrowData = () => {
    fetch("http://localhost:4000/api/borrow-pending")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setBorrowList(data.data);
        } else {
          setBorrowList([]);
        }
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
    if (reason !== "clickaway") setOpen(false);
  };

  const handleUpdateStatus = (borrowID, currentStatus) => {
    let newStatus = null;
    if (currentStatus === 0) newStatus = 1;
    else if (currentStatus === 1) newStatus = 9;
    else if (currentStatus === 9) newStatus = 7;
    else return;

    const confirmMsg =
      newStatus === 1
        ? "ยืนยันการอนุมัติการยืม?"
        : newStatus === 9
        ? "ยืนยันการรับของแล้ว?"
        : "เปลี่ยนเป็นติดตามอุปกรณ์?";

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

  // ✅ แก้ตรงนี้ให้ใช้ API /api/reject-borrow
  const handleReject = (borrowID) => {
    if (!window.confirm("❌ ยืนยันการไม่อนุมัติการยืม-คืนนี้?")) return;

    fetch("http://localhost:4000/api/reject-borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID }),
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

  const handleCancel = (borrowID) => {
  if (!window.confirm("⚠️ ยืนยันการยกเลิกรายการนี้?")) return;

  fetch("http://localhost:4000/api/update-borrow-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ borrowID, statusID: 6, userID }),
  })
    .then((res) => res.json())
    .then((data) => {
      setAlertMsg(data.message || "ยกเลิกรายการสำเร็จ");
      setAlertSeverity(data.status ? "success" : "error");
      setOpen(true);
      if (data.status) loadBorrowData();
    })
    .catch(() => {
      setAlertMsg("เกิดข้อผิดพลาดในการยกเลิกรายการ");
      setAlertSeverity("error");
      setOpen(true);
    });
};

  const openReturnDialog = (borrow, equip) => {
    setSelectedBorrow(borrow);
    setSelectedEquip(equip);
    setGoodAmount("");
    setDamagedAmount("");
    setNote("");
    setDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    const total = parseInt(goodAmount || 0) + parseInt(damagedAmount || 0);
    const maxAmount = selectedEquip.amount;

    if (total > maxAmount) {
      setAlertMsg(`❌ จำนวนรวมเกิน ${maxAmount} ชิ้น กรุณาตรวจสอบอีกครั้ง`);
      setAlertSeverity("error");
      setOpen(true);
      return;
    }
    if (total < maxAmount) {
      setAlertMsg(`❌ จำนวนรวมต้องเท่ากับ ${maxAmount} ชิ้น`);
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    fetch("http://localhost:4000/api/update-borrowdetail-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        borrowID: selectedBorrow.borrowID,
        equipmentID: selectedEquip.equipmentID,
        statusID: 3,
        goodAmount: parseInt(goodAmount),
        damagedAmount: parseInt(damagedAmount),
        note,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDialogOpen(false);
        setAlertMsg(data.message || "อัปเดตสถานะอุปกรณ์สำเร็จ");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBorrowData();
      })
      .catch(() => {
        setDialogOpen(false);
        setAlertMsg("เกิดข้อผิดพลาดในการอัปเดตสถานะอุปกรณ์");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const completeBorrow = (borrowID) => {
    if (!window.confirm("ยืนยันว่ารายการนี้คืนอุปกรณ์ครบแล้ว?")) return;

    fetch("http://localhost:4000/api/complete-borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.message || "อัปเดตสถานะรายการเป็นส่งคืนสำเร็จแล้ว");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBorrowData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการอัปเดตสถานะรายการ");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }} onClick={() => navigate("/homepage")}>
              <Box component="img" src={logo} alt="logo" sx={{ width: 52, height: 52, objectFit: "contain" }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              อนุมัติการยืม-คืน
            </Typography>
            {isLoggedIn && (
              <Typography sx={{ mr: 1 }}>
                {firstname} {lastname}
              </Typography>
            )}
            <IconButton color="inherit" edge="end" onClick={handleUserIconClick} sx={{ p: 0, ml: 1 }}>
              {isLoggedIn && profilePic ? (
                <Avatar src={profilePic} sx={{ width: 36, height: 36 }} />
              ) : (
                <AccountCircleIcon sx={{ width: 36, height: 36 }} />
              )}
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleProfile}>จัดการข้อมูลผู้ใช้</MenuItem>
              <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ maxWidth: 1100, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            รายการที่รออนุมัติ
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>วันที่ยืม</TableCell>
                  <TableCell>ชื่ออุปกรณ์</TableCell>
                  <TableCell>จำนวน</TableCell>
                  <TableCell>วันรับของ</TableCell>
                  <TableCell>วันส่งคืน</TableCell>
                  <TableCell>สถานะอุปกรณ์</TableCell>
                  <TableCell>สถานะรายการ</TableCell>
                  <TableCell>การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {borrowList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowList.flatMap((row) =>
                    row.items?.map((equip, index) => {
                       const isFirstItem = index === 0; // ✅ แค่ชิ้นแรกของแต่ละ borrowID

                       return (
                      <TableRow key={`${row.borrowID}-${equip.equipmentID}`}>
                        <TableCell>{formatDateOnly(row.borrowDate)}</TableCell>
                        <TableCell>{equip.equipmentName}</TableCell>
                        <TableCell>{equip.amount}</TableCell>
                        <TableCell>{formatDateOnly(row.receiveDate)}</TableCell>
                        <TableCell>{formatDateOnly(row.returnDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={equip.detailStatusName || "-"}
                            color={
                              equip.detailStatusID === 3
                                ? "success"
                                : equip.detailStatusID === 8
                                ? "warning"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.statusName || "-"}
                            color={getStatusColor(Number(row.statusID))}
                            sx={{ fontWeight: "bold" }}
                            variant="contained"
                          
                          />
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {row.statusID === 8 && equip.detailStatusID !== 3 && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => openReturnDialog(row, equip)}
                              >
                                ส่งคืนอุปกรณ์นี้
                              </Button>
                            )}

                            {row.statusID === 0 && isFirstItem && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleUpdateStatus(row.borrowID, row.statusID)}
                                >
                                  อนุมัติ
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  onClick={() => handleReject(row.borrowID)}
                                >
                                  ไม่อนุมัติ
                                </Button>
                              </>
                            )}

                            {row.statusID === 1 && isFirstItem &&  (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleUpdateStatus(row.borrowID, row.statusID)}
                              >
                                รับของ
                              </Button>
                            )}

                            {row.statusID === 1 && isFirstItem &&  (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => handleCancel(row.borrowID, row.statusID)}
                              >
                                ยกเลิก
                              </Button>
                            )}

                            {row.statusID === 8 && isFirstItem && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => completeBorrow(row.borrowID)}
                              >
                                ส่งคืนสำเร็จ
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                        );
                    })
                  )
                )}  
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ✅ Dialog กรอกจำนวน */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>กรอกจำนวนอุปกรณ์ที่คืน</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="จำนวนที่สภาพดี"
              type="number"
              inputProps={{
                min: 0,
                max: selectedEquip?.amount || 0,
              }}
              value={goodAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value || 0);
                if (val + parseInt(damagedAmount || 0) <= (selectedEquip?.amount || 0)) {
                  setGoodAmount(val);
                }
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              label="จำนวนที่ชำรุด"
              type="number"
              inputProps={{
                min: 0,
                max: selectedEquip?.amount || 0,
              }}
              value={damagedAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value || 0);
                if (val + parseInt(goodAmount || 0) <= (selectedEquip?.amount || 0)) {
                  setDamagedAmount(val);
                }
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              label="หมายเหตุ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleConfirmReturn} color="success" variant="contained">
              ยืนยันส่งคืน
            </Button>
          </DialogActions>
        </Dialog>

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

export default ApproveBorrow;
