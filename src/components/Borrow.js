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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Snackbar,
  Alert,
  Input,
  TablePagination,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { Chip } from "@mui/material"; // อย่าลืม import Chip ด้านบนด้วย

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function Borrow() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [idCardImg, setIdCardImg] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [requestAmounts, setRequestAmounts] = useState({});
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const loadEquipment = () => {
    fetch("http://localhost:4000/api/equipment")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item) => item.typeID === 2);
        setEquipment(filtered);
      })
      .catch(() => setEquipment([]));
  };

  useEffect(() => {
    loadEquipment();
  }, []);

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

  const handleIdCardChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdCardImg(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdCardPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIncrease = (id) => {
    setRequestAmounts((prev) => {
      const current = prev[id] || 0;
      const item = equipment.find((e) => e.equipmentID === id);
      if (!item) return prev;
      if (current < item.amount) {
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  const handleDecrease = (id) => {
    setRequestAmounts((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));
  };

  const handleConfirm = () => {
    if (!selectedDate || !returnDate || !idCardImg) {
      setAlertMsg("กรุณากรอกวันรับของ วันรับคืน และแนบรูปบัตรประจำตัว");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    const minDate = getMinDate();
    if (selectedDate < minDate || returnDate < selectedDate) {
      setAlertMsg("วันรับของต้องล่วงหน้าอย่างน้อย 2 วัน และวันคืนต้องไม่น้อยกว่าวันรับของ");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    const userID = localStorage.getItem("userID");
    const formData = new FormData();
    formData.append("selectedDate", selectedDate);
    formData.append("returnDate", returnDate);
    formData.append("idCardImg", idCardImg);
    formData.append("requestAmounts", JSON.stringify(requestAmounts));

    fetch("http://localhost:4000/api/borrow-confirm", {
      method: "POST",
      headers: {
        "x-user-id": userID,
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("ส่งคำขอยืม-คืนสำเร็จ");
          setAlertSeverity("success");
          setOpen(true);
          setRequestAmounts({});
          setSelectedDate("");
          setReturnDate("");
          setIdCardImg(null);
          setIdCardPreview(null);
          loadEquipment();
          setTimeout(() => {
            // เด้งไปหน้าประวัติ พร้อมแท็บยืมคืน
            navigate("/history?tab=borrow");
          }, 1200);
        } else {
          setAlertMsg(`เกิดข้อผิดพลาด: ${data.message}`);
          setAlertSeverity("error");
          setOpen(true);
        }
      })
      .catch(() => {
        setAlertMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        setAlertSeverity("error");
        setOpen(true);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
              ยืม-คืนโสตทัศนูปกรณ์
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

        <Box sx={{ maxWidth: 900, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            รายการโสตทัศนูปกรณ์ 
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ชื่ออุปกรณ์</TableCell>
                  <TableCell>จำนวนคงเหลือ</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>จำนวนที่ต้องการยืม</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipment
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.equipmentID}>
                      <TableCell>{item.equipmentName}</TableCell>
                      <TableCell>
                        {Math.max(item.amount - (requestAmounts[item.equipmentID] || 0), 0)}
                      </TableCell>
                      <TableCell>
                        {item.statusID === 1 ? (
                      <Chip label="ใช้งานได้" color="success" size="small" />
                        ) : item.statusID === 0 ? (
                      <Chip label="ชำรุด" color="error" size="small" />
                        ) : (
                      <Chip label="ไม่ทราบสถานะ" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleDecrease(item.equipmentID)}
                          >
                            -
                          </Button>
                          <Typography>{requestAmounts[item.equipmentID] || 0}</Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleIncrease(item.equipmentID)}
                            disabled={(requestAmounts[item.equipmentID] || 0) >= item.amount}
                          >
                            +
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={equipment.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
            />
          </TableContainer>

          <Stack
            spacing={2}
            direction="row"
            alignItems="center"
            sx={{ mt: 4, flexWrap: "wrap" }}
          >
            <TextField
              label="วันรับของ"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              inputProps={{ min: getMinDate() }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="กำหนดคืน"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              inputProps={{ min: selectedDate || getMinDate() }}
              sx={{ minWidth: 200 }}
            />
            <label>
              <Input
                type="file"
                accept="image/*"
                sx={{ display: "none" }}
                onChange={handleIdCardChange}
              />
              <Button variant="outlined" component="span">
                แนบรูปบัตรประจำตัว
              </Button>
            </label>
            {idCardPreview && (
              <Box
                component="img"
                src={idCardPreview}
                alt="idcard"
                sx={{
                  width: 60,
                  height: 40,
                  objectFit: "cover",
                  ml: 2,
                  borderRadius: 1,
                  border: "1px solid #ccc",
                }}
              />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              sx={{ ml: 2 }}
            >
              ยืนยัน
            </Button>
          </Stack>
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

export default Borrow;