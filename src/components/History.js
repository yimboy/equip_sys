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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function History() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");

  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [filterType, setFilterType] = useState(tabParam === "borrow" ? "borrow" : "bring");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const userID = localStorage.getItem("userID");
  const roleID = parseInt(localStorage.getItem("roleID"), 10); // ✅ เพิ่ม roleID

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

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    return dateStr.slice(0, 10);
  };

  // ✅ ปรับให้ส่ง roleID ไปด้วย และไม่ส่ง userID ถ้า role มีสิทธิ์ดูทั้งหมด
  const loadHistory = () => {
    const bringQuery = (roleID === 2 || roleID === 4) 
  ? `?roleID=${roleID}` 
  : `?userID=${userID}&roleID=${roleID}`;

const borrowQuery = (roleID === 3 || roleID === 4) 
  ? `?roleID=${roleID}` 
  : `?userID=${userID}&roleID=${roleID}`;

    Promise.all([
      fetch(`http://localhost:4000/api/history-bring${bringQuery}`).then((res) => res.json()),
      fetch(`http://localhost:4000/api/history-borrow${borrowQuery}`).then((res) => res.json()),
    ])
      .then(([bringData, borrowData]) => {
        const bring = bringData.map((item) => ({
          ...item,
          id: item.bringID,
          date: item.bringDate,
          approveBy: item.approveByName || "-",
          approveDate: item.approveDate,
          statusID: item.statusID,
          statusName: item.statusName,
          type: "เบิก-จ่าย",
        }));
        const borrow = borrowData.map((item) => ({
          ...item,
          id: item.borrowID,
          date: item.borrowDate,
          approveBy: item.approveByName || "-",
          approveDate: item.approveDate,
          statusID: item.statusID,
          statusName: item.statusName,
          type: "ยืม-คืน",
        }));
        setHistory([...bring, ...borrow]);
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  useEffect(() => {
    if (userID) loadHistory();
  }, [userID, roleID]); // ✅ โหลดใหม่ถ้า role เปลี่ยน

  useEffect(() => {
    if (isLoggedIn) {
      const pic = localStorage.getItem("profilePic");
      if (pic) setProfilePic(pic);
    } else {
      setProfilePic(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (tabParam === "borrow" || tabParam === "bring") {
      setFilterType(tabParam);
    }
  }, [tabParam]);

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

  const filteredHistory = history.filter((item) => {
    if (filterType === "bring") return item.type === "เบิก-จ่าย";
    if (filterType === "borrow") return item.type === "ยืม-คืน";
    return true;
  });

  const handleDetailOpen = (item) => {
    setSelectedDetail(item);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedDetail(null);
  };

  const handleCancel = (item) => {
    if (!window.confirm("ยืนยันที่จะยกเลิกรายการนี้?")) return;

    let url = "";
    let bodyData = { userID };

    if (item.type === "เบิก-จ่าย") {
      url = "http://localhost:4000/api/cancel-bring";
      bodyData.bringID = item.id;
    } else if (item.type === "ยืม-คืน") {
      url = "http://localhost:4000/api/cancel-borrow";
      bodyData.borrowID = item.id;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("ยกเลิกรายการสำเร็จ และรอการตรวจสอบ");
          setAlertSeverity("success");
          loadHistory();
        } else {
          setAlertMsg(data.message || "ไม่สามารถยกเลิกได้");
          setAlertSeverity("error");
        }
        setOpen(true);
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการยกเลิก");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handlePrint = () => {
    if (!selectedDetail) return;

    const equipmentRows = selectedDetail.details?.map(
      (item, idx) =>
        `<tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${item.equipmentName}</td>
          <td style="text-align:center;">${item.amount}</td>
          <td>${item.note || "-"}</td>
        </tr>`
    ).join("") || "<tr><td colspan='3'>ไม่มีรายการอุปกรณ์</td></tr>";

    const printContent = `
      <html>
        <head>
          <title>รายละเอียดรายการ</title>
          <style>
            body { font-family: Kanit, Arial, sans-serif; padding: 30px; background: #fff; color: #333; }
            h1 { text-align: center; color: #1976d2; margin-bottom: 20px; }
            h2 { text-align: center; margin-bottom: 20px; color: #1976d2; }
            .section { margin-bottom: 15px; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; }
            .section p { margin: 6px 0; font-size: 15px; }
            b { color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 15px; }
            th, td { border: 1px solid #aaa; padding: 8px; }
            th { background: #1976d2; color: #fff; text-align: center; }
            td { background: #fff; }
            .footer { margin-top: 25px; font-size: 14px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h1>ระบบเบิก-ยืมอุปกรณ์</h1>

          <h2>รายละเอียดรายการอุปกรณ์</h2>

          <div class="section">
            <p><b>ชื่อผู้ใช้งาน:</b> ${firstname} ${lastname}</p>
            <p><b>วันที่ทำรายการ:</b> ${formatDateOnly(selectedDetail.date)}</p>
            <p><b>ประเภท:</b> ${selectedDetail.type}</p>
            <p><b>วันรับของ:</b> ${formatDateOnly(selectedDetail.receiveDate)}</p>
            <p><b>วันรับคืน:</b> ${formatDateOnly(selectedDetail.returnDate)}</p>
            <p><b>สถานะ:</b> ${selectedDetail.statusName || "-"}</p>
            <p><b>ผู้อนุมัติ:</b> ${selectedDetail.approveByName || "-"}</p>
            <p><b>วันที่อนุมัติ:</b> ${formatDateOnly(selectedDetail.approveDate)}</p>
            <p><b>หมายเหตุ:</b> ${selectedDetail.note || "-"}</p>
          </div>

          <h3>📋 รายการอุปกรณ์</h3>
          <table>
            <thead>
              <tr>
                <th style="width:60px;">ลำดับ</th>
                <th>ชื่ออุปกรณ์</th>
                <th style="width:100px;">จำนวน</th>
                <th style="width:200px;">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows}
            </tbody>
          </table>

          <div class="footer">
            <p>ระบบเบิก-ยืมอุปกรณ์ © ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=650");
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
              ประวัติการเบิก-ยืมอุปกรณ์
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
            {(roleID === 2 || roleID === 3|| roleID === 4) ? "ประวัติการเบิก-ยืมอุปกรณ์ทั้งหมด" : "ประวัติของคุณ"}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button variant={filterType === "bring" ? "contained" : "outlined"} onClick={() => setFilterType("bring")}>
              เบิก-จ่าย
            </Button>
            <Button variant={filterType === "borrow" ? "contained" : "outlined"} onClick={() => setFilterType("borrow")}>
              ยืม-คืน
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {/* ✅ เพิ่มชื่อผู้ใช้ถ้า role มีสิทธิ์ดูทั้งหมด */}
                  {(roleID === 2 || roleID === 3|| roleID === 4) && <TableCell>ชื่อผู้ใช้งาน</TableCell>}
                  <TableCell>วันที่ทำรายการ</TableCell>
                  <TableCell>จำนวนรายการ</TableCell>
                  <TableCell>วันรับของ</TableCell>
                  <TableCell>วันรับคืน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">ไม่พบข้อมูล</TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <TableRow key={idx}>
                      {(roleID === 2 || roleID === 3|| roleID === 4) && (
                        <TableCell>{item.username || "-"}</TableCell>
                      )}
                      <TableCell>{formatDateOnly(item.date)}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{formatDateOnly(item.receiveDate)}</TableCell>
                      <TableCell>{formatDateOnly(item.returnDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.statusName || "-"}
                          color={getStatusColor(item.statusID)}
                          sx={{ fontWeight: "bold" }}
                          variant="contained"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => handleDetailOpen(item)}>
                            รายละเอียด
                          </Button>
                          {roleID === 1 && item.statusID === 0 && (
                            <Button size="small" variant="contained" color="error" onClick={() => handleCancel(item)}>
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

        {/* Dialog + Snackbar เหมือนเดิม */}
        <Dialog open={detailOpen} onClose={handleDetailClose} maxWidth="sm" fullWidth>
          <DialogTitle>รายละเอียดรายการ</DialogTitle>
          <DialogContent dividers>
            {selectedDetail && (
              <Box>
                <Typography><b>วันที่ทำรายการ:</b> {formatDateOnly(selectedDetail.date)}</Typography>
                <Typography><b>ประเภท:</b> {selectedDetail.type}</Typography>
                <Typography><b>วันรับของ:</b> {formatDateOnly(selectedDetail.receiveDate)}</Typography>
                <Typography><b>วันรับคืน:</b> {formatDateOnly(selectedDetail.returnDate)}</Typography>
                <Typography><b>สถานะ:</b> {selectedDetail.statusName || "-"}</Typography>
                <Typography><b>ผู้อนุมัติ:</b> {selectedDetail.approveByName || "-"}</Typography>
                <Typography><b>วันที่อนุมัติ:</b> {formatDateOnly(selectedDetail.approveDate)}</Typography>
                <Typography><b>หมายเหตุ:</b> {selectedDetail.note || "-"}</Typography>
                
                {selectedDetail.details?.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>รายการสินค้า</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ลำดับ</TableCell>
                          <TableCell>ชื่ออุปกรณ์</TableCell>
                          <TableCell>จำนวน</TableCell>
                          <TableCell>หมายเหตุ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedDetail.details.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{item.equipmentName}</TableCell>
                            <TableCell>{item.amount}</TableCell>
                            <TableCell>{item.note || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography sx={{ mt: 2 }}>ไม่มีรายละเอียดอุปกรณ์</Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDetailClose} variant="contained">ปิด</Button>
            <Button onClick={handlePrint} variant="outlined" color="primary">พิมพ์</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={open}
          autoHideDuration={2500}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={alertSeverity} sx={{ width: "100%" }}>{alertMsg}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default History;
