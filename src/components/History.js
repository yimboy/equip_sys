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

function History() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [filterType, setFilterType] = useState("bring");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const userID = localStorage.getItem("userID");

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  const loadHistory = () => {
    Promise.all([
      fetch(`http://localhost:4000/api/history-bring?userID=${userID}`).then((res) =>
        res.json()
      ),
      fetch(`http://localhost:4000/api/history-borrow?userID=${userID}`).then((res) =>
        res.json()
      ),
    ])
      .then(([bringData, borrowData]) => {
        const bring = bringData.map((item) => ({
          ...item,
          id: item.bringID,
          type: "เบิก-จ่าย",
        }));
        const borrow = borrowData.map((item) => ({
          ...item,
          id: item.borrowID,
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
    } else {
      setAlertMsg("ไม่สามารถระบุประเภทข้อมูลได้");
      setAlertSeverity("error");
      setOpen(true);
      return;
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

  // ✅ ฟังก์ชันพิมพ์ (เพิ่มชื่อผู้ใช้งาน + ตารางอุปกรณ์)
  const handlePrint = () => {
    if (!selectedDetail) return;

    const equipmentRows = selectedDetail.details?.map(
      (item) =>
        `<tr>
          <td>${item.equipmentName}</td>
          <td style="text-align:center;">${item.amount}</td>
        </tr>`
    ).join("") || "<tr><td colspan='2'>ไม่มีรายการอุปกรณ์</td></tr>";

    const printContent = `
      <html>
        <head>
          <title>รายละเอียดรายการ</title>
          <style>
            body { font-family: Kanit, Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 20px; }
            p { font-size: 16px; margin: 8px 0; }
            b { font-weight: 600; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #888;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
            }
          </style>
        </head>
        <body>
          <h2>รายละเอียดรายการ</h2>
          <p><b>ชื่อผู้ใช้งาน:</b> ${firstname} ${lastname}</p>
          <p><b>วันที่ทำรายการ:</b> ${formatDateOnly(selectedDetail.date)}</p>
          <p><b>ประเภท:</b> ${selectedDetail.type}</p>
          <p><b>วันรับของ:</b> ${formatDateOnly(selectedDetail.receiveDate)}</p>
          <p><b>วันรับคืน:</b> ${formatDateOnly(selectedDetail.returnDate)}</p>
          <p><b>สถานะ:</b> ${selectedDetail.status || "-"}</p>

          <h3>รายการอุปกรณ์</h3>
          <table>
            <thead>
              <tr>
                <th>ชื่ออุปกรณ์</th>
                <th style="text-align:center;">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
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
              ประวัติการเบิก-ยืมอุปกรณ์
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

        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            ประวัติการเบิก-ยืมอุปกรณ์ของคุณ
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant={filterType === "bring" ? "contained" : "outlined"}
              onClick={() => setFilterType("bring")}
            >
              เบิก-จ่าย
            </Button>
            <Button
              variant={filterType === "borrow" ? "contained" : "outlined"}
              onClick={() => setFilterType("borrow")}
            >
              ยืม-คืน
            </Button>
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
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
                    <TableCell colSpan={6} align="center">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{formatDateOnly(item.date)}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{formatDateOnly(item.receiveDate)}</TableCell>
                      <TableCell>{formatDateOnly(item.returnDate)}</TableCell>
                      <TableCell>{item.status || "-"}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDetailOpen(item)}
                          >
                            รายละเอียด
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleCancel(item)}
                          >
                            ยกเลิก
                          </Button>
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
          <DialogTitle>รายละเอียดรายการ</DialogTitle>
          <DialogContent dividers>
            {selectedDetail && (
              <Box>
                <Typography>
                  <b>วันที่ทำรายการ:</b> {formatDateOnly(selectedDetail.date)}
                </Typography>
                <Typography>
                  <b>ประเภท:</b> {selectedDetail.type}
                </Typography>
                <Typography>
                  <b>วันรับของ:</b> {formatDateOnly(selectedDetail.receiveDate)}
                </Typography>
                <Typography>
                  <b>วันรับคืน:</b> {formatDateOnly(selectedDetail.returnDate)}
                </Typography>
                <Typography>
                  <b>สถานะ:</b> {selectedDetail.status || "-"}
                </Typography>
                {selectedDetail.details && selectedDetail.details.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      รายการสินค้า
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ชื่ออุปกรณ์</TableCell>
                          <TableCell>จำนวน</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedDetail.details.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.equipmentName}</TableCell>
                            <TableCell>{item.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDetailClose} variant="contained">
              ปิด
            </Button>
            <Button onClick={handlePrint} variant="outlined" color="primary">
              พิมพ์
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

export default History;
