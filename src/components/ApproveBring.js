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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const theme = createTheme({
  typography: { fontFamily: "Kanit, Arial, sans-serif" },
});

function ApproveBring() {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [bringList, setBringList] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const userID = localStorage.getItem("userID");
  const roleID = localStorage.getItem("roleID"); // roleID 2 = เจ้าหน้าที่กจห.

  const formatDateOnly = (dateStr) => (dateStr ? dateStr.slice(0, 10) : "-");

  const loadBringData = () => {
    fetch("http://localhost:4000/api/bring-pending")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setBringList(data.data);
        else setBringList([]);
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  useEffect(() => {
    if (!isLoggedIn || roleID !== "2") {
      navigate("/login");
      return;
    }
    loadBringData();
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
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleApprove = (bringID) => {
    if (!window.confirm("ยืนยันการอนุมัติการเบิกนี้?")) return;

    fetch("http://localhost:4000/api/approve-bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bringID, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.status ? "อนุมัติสำเร็จ" : data.message || "ไม่สามารถอนุมัติได้");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBringData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการอนุมัติ");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handleReject = (bringID) => {
    if (!window.confirm("ยืนยันการไม่อนุมัติการเบิกนี้?")) return;

    fetch("http://localhost:4000/api/reject-bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bringID, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.status ? "ไม่อนุมัติสำเร็จ" : data.message || "ไม่สามารถไม่อนุมัติได้");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBringData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการไม่อนุมัติ");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handleCancel = (bringID) => {
    if (!window.confirm("ยืนยันการยกเลิกรายการเบิกนี้?")) return;

    fetch("http://localhost:4000/api/cancel-bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bringID, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAlertMsg(data.status ? "ยกเลิกรายการสำเร็จ" : data.message || "ไม่สามารถยกเลิกได้");
        setAlertSeverity(data.status ? "success" : "error");
        setOpen(true);
        if (data.status) loadBringData();
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการยกเลิก");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handleDetailOpen = (item) => {
    setSelectedDetail(item);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedDetail(null);
  };

  const getStatusColor = (statusID) => {
    switch (statusID) {
      case 0: return "default"; // รออนุมัติ = เทา
      case 1: return "success"; // อนุมัติ = เขียว
      case 6: return "error";   // ยกเลิก = แดง
      default: return "default";
    }
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
              <Box component="img" src={logo} alt="logo" sx={{ width: 52, height: 52, objectFit: "contain" }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              อนุมัติการเบิกอุปกรณ์
            </Typography>
            {isLoggedIn && <Typography sx={{ mr: 1 }}>{firstname} {lastname}</Typography>}
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

        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            รายการที่รออนุมัติ
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>วันที่ทำรายการ</TableCell>
                  <TableCell>จำนวนรายการ</TableCell>
                  <TableCell>วันรับของ</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>รายละเอียด</TableCell>
                  <TableCell>การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bringList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">ไม่พบข้อมูล</TableCell>
                  </TableRow>
                ) : (
                  bringList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{formatDateOnly(item.bringDate)}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{formatDateOnly(item.receiveDate)}</TableCell>
                      <TableCell>
                        <Chip label={item.statusName || "-"} color={getStatusColor(item.statusID)} />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => handleDetailOpen(item)}>
                          รายละเอียด
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {item.statusID === 0 && (
                            <>
                              <Button size="small" variant="contained" color="success" onClick={() => handleApprove(item.bringID)}>อนุมัติ</Button>
                              <Button size="small" variant="contained" color="error" onClick={() => handleReject(item.bringID)}>ไม่อนุมัติ</Button>
                            </>
                          )}
                          {item.statusID === 1 && (
                            <Button size="small" variant="contained" color="error" onClick={() => handleCancel(item.bringID)}>
                              ยกเลิก
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Dialog open={detailOpen} onClose={handleDetailClose} maxWidth="sm" fullWidth>
          <DialogTitle>รายละเอียดรายการเบิก</DialogTitle>
          <DialogContent dividers>
            {selectedDetail ? (
              <Box>
                <Typography variant="body1" mb={1}><strong>วันที่ทำรายการ:</strong> {formatDateOnly(selectedDetail.bringDate)}</Typography>
                <Typography variant="body1" mb={1}><strong>ประเภท:</strong> {selectedDetail.typeName || "-"}</Typography>
                <Typography variant="body1" mb={1}><strong>วันรับของ:</strong> {formatDateOnly(selectedDetail.receiveDate)}</Typography>
                <Typography variant="body1" mb={1}><strong>สถานะ:</strong> {selectedDetail.statusName || "-"}</Typography>
                <Typography variant="body1" mb={1}><strong>ชื่อผู้เบิก:</strong> {selectedDetail.firstname && selectedDetail.lastname ? `${selectedDetail.firstname} ${selectedDetail.lastname}` : "-"}</Typography>

                <Typography variant="body1" mt={2} mb={1} fontWeight="bold">รายการอุปกรณ์ที่เบิก:</Typography>
                {selectedDetail.items && selectedDetail.items.length > 0 ? (
                  selectedDetail.items.map((it, i) => (
                    <Typography key={i} variant="body2" sx={{ ml: 2 }}>- {it.equipmentName} จำนวน {it.amount} ชิ้น</Typography>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ ml: 2 }}>ไม่มีข้อมูลอุปกรณ์</Typography>
                )}
              </Box>
            ) : (
              <Typography>กำลังโหลดข้อมูล...</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDetailClose}>ปิด</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={open} autoHideDuration={2500} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={alertSeverity} sx={{ width: "100%" }}>{alertMsg}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default ApproveBring;
