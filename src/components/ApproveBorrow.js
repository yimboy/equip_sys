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

function ApproveBorrow() {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [borrowList, setBorrowList] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  // State สำหรับ Dialog รายละเอียด
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const userID = localStorage.getItem("userID");
  const roleID = localStorage.getItem("roleID"); // roleID 3 = เจ้าหน้าที่กทด.

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
      default: return "default";
    }
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    return dateStr.slice(0, 10);
  };

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
    if (!isLoggedIn || roleID !== "3") {
      navigate("/login");
      return;
    }
    loadBorrowData();
  }, [isLoggedIn, roleID]);

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

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleApprove = (borrowID) => {
    if (!window.confirm("ยืนยันการอนุมัติการยืม-คืนนี้?")) return;

    fetch("http://localhost:4000/api/approve-borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("อนุมัติสำเร็จ");
          setAlertSeverity("success");
          loadBorrowData();
        } else {
          setAlertMsg(data.message || "ไม่สามารถอนุมัติได้");
          setAlertSeverity("error");
        }
        setOpen(true);
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการอนุมัติ");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handleReject = (borrowID) => {
    if (!window.confirm("ยืนยันการไม่อนุมัติการยืม-คืนนี้?")) return;

    fetch("http://localhost:4000/api/reject-borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowID, userID }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("ไม่อนุมัติสำเร็จ");
          setAlertSeverity("success");
          loadBorrowData();
        } else {
          setAlertMsg(data.message || "ไม่สามารถไม่อนุมัติได้");
          setAlertSeverity("error");
        }
        setOpen(true);
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการไม่อนุมัติ");
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
              อนุมัติการยืม-คืนอุปกรณ์
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
            >
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
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{formatDateOnly(item.borrowDate)}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{formatDateOnly(item.receiveDate)}</TableCell>
                      <TableCell>{formatDateOnly(item.returnDate)}</TableCell>
                      <TableCell>
                        <Chip label={item.statusName || "-"} 
                        color={getStatusColor(item.statusID)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDetailOpen(item)}
                        >
                          รายละเอียด
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(item.borrowID)}
                          >
                            อนุมัติ
                          </Button>

                           {/* แสดงปุ่มไม่อนุมัติเฉพาะ statusID !== 8,7 */}
                      {item.statusID !== 7 && item.statusID !== 8 &&(
                       <Button
                       size="small"
                       variant="contained"
                       color="error"
                       onClick={() => handleReject(item.borrowID)}
                      >
                       ไม่อนุมัติ
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
        <Dialog
          open={detailOpen}
          onClose={handleDetailClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>รายละเอียดการยืม-คืน</DialogTitle>
          <DialogContent dividers>
            {selectedDetail ? (
              <Box>
                <Typography variant="body1" mb={1}>
                  <strong>วันที่ยืม:</strong>{" "}
                  {formatDateOnly(selectedDetail.borrowDate)}
                </Typography>
                <Typography variant="body1" mb={1}>
                  <strong>ประเภท:</strong> {selectedDetail.typeName || "-"}
                </Typography>
                <Typography variant="body1" mb={1}>
                  <strong>วันรับของ:</strong>{" "}
                  {formatDateOnly(selectedDetail.receiveDate)}
                </Typography>
                <Typography variant="body1" mb={1}>
                  <strong>วันส่งคืน:</strong>{" "}
                  {formatDateOnly(selectedDetail.returnDate)}
                </Typography>
                <Typography variant="body1" mb={1}>
                  <strong>สถานะ:</strong> {selectedDetail.statusName || "-"}
                </Typography>
                <Typography variant="body1" mb={1}>
                  <strong>ชื่อผู้ยืม:</strong>{" "}
                  {selectedDetail.firstname && selectedDetail.lastname
                    ? `${selectedDetail.firstname} ${selectedDetail.lastname}`
                    : "-"}
                </Typography>

                {/* แสดงรูปถ้ามี */}
                {selectedDetail.imageFile && (
                  <Box mt={2}>
                    <Typography variant="body1" mb={1} fontWeight="bold">
                      หลักฐานประกอบ:
                    </Typography>
                    <Box
                      component="img"
                      src={`http://localhost:4000/uploads/${selectedDetail.imageFile}`}
                      alt="proof"
                      sx={{ maxWidth: "100%", borderRadius: 1 }}
                    />
                  </Box>
                )}

                <Typography
                  variant="body1"
                  mt={2}
                  mb={1}
                  fontWeight="bold"
                  sx={{ mt: 2, mb: 1 }}
                >
                  รายการอุปกรณ์:
                </Typography>
                {selectedDetail.items && selectedDetail.items.length > 0 ? (
                  selectedDetail.items.map((item, idx) => (
                    <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                      - {item.equipmentName} จำนวน {item.amount} ชิ้น
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    ไม่มีข้อมูลอุปกรณ์
                  </Typography>
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
