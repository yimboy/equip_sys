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

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function Bring() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [idCardImg, setIdCardImg] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [requestAmounts, setRequestAmounts] = useState({});
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const navigate = useNavigate();
  const roleID = Number(localStorage.getItem("roleID")); // ✅ เพิ่ม roleID

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");

  const loadEquipment = () => {
    fetch("http://localhost:4000/api/equipment")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item) => item.typeID === 1);
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
    if (!selectedDate || !idCardImg) {
      setAlertMsg("กรุณากรอกวันรับของและแนบรูปบัตรประจำตัว");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }
    const userID = localStorage.getItem("userID");
    const formData = new FormData();
    formData.append("selectedDate", selectedDate);
    formData.append("idCardImg", idCardImg);
    formData.append("requestAmounts", JSON.stringify(requestAmounts));

    fetch("http://localhost:4000/api/bring-confirm", {
      method: "POST",
      headers: {
        "x-user-id": userID,
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("ส่งคำขอเบิก-จ่ายสำเร็จ");
          setAlertSeverity("success");
          setOpen(true);
          setRequestAmounts({});
          setSelectedDate("");
          setIdCardImg(null);
          setIdCardPreview(null);
          loadEquipment();
          setTimeout(() => {
            navigate("/history");
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

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
              เบิก-จ่ายอุปกรณ์สำนักงาน
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

        <Box sx={{ maxWidth: 900, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            รายการอุปกรณ์สำนักงาน
          </Typography>

          {/* ✅ ปุ่มแก้ไขอุปกรณ์ สำหรับ roleID === 2 */}
          {roleID === 2 && (
            <Box sx={{ textAlign: "right", mb: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/edit-bring")}
              >
                แก้ไขอุปกรณ์
              </Button>
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ชื่ออุปกรณ์</TableCell>
                  <TableCell>จำนวนคงเหลือ</TableCell>
                  <TableCell>จำนวนที่ต้องการเบิก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipment.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                  <TableRow key={item.equipmentID}>
                    <TableCell>{item.equipmentName}</TableCell>
                    <TableCell>{Math.max(item.amount - (requestAmounts[item.equipmentID] || 0), 0)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button variant="outlined" size="small" onClick={() => handleDecrease(item.equipmentID)}>
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

          <Stack spacing={2} direction="row" alignItems="center" sx={{ mt: 4 }}>
            <TextField
              label="วันรับของ"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              inputProps={{ min: new Date().toISOString().split("T")[0] }}
              sx={{ minWidth: 200 }}
            />
            <label>
              <Input type="file" accept="image/*" sx={{ display: "none" }} onChange={handleIdCardChange} />
              <Button variant="outlined" component="span">
                แนบรูปบัตรประจำตัว
              </Button>
            </label>
            {idCardPreview && (
              <Box
                component="img"
                src={idCardPreview}
                alt="idcard"
                sx={{ width: 60, height: 40, objectFit: "cover", ml: 2, borderRadius: 1, border: "1px solid #ccc" }}
              />
            )}
            <Button variant="contained" color="primary" onClick={handleConfirm} sx={{ ml: 2 }}>
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

export default Bring;