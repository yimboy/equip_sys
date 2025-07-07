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
  Snackbar,
  Alert,
  Input,
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
  const [borrowed, setBorrowed] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [returnImg, setReturnImg] = useState(null);
  const [returnImgPreview, setReturnImgPreview] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const userID = localStorage.getItem("userID");

  // โหลดข้อมูลอุปกรณ์ที่ยืม
  useEffect(() => {
    if (!userID) return;
    fetch(`http://localhost:4000/api/borrowed?userID=${userID}`)
      .then((res) => res.json())
      .then((data) => setBorrowed(data))
      .catch(() => setBorrowed([]));
  }, [userID]);

  // โหลดรูปโปรไฟล์
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

  const handleReturnImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReturnImg(file);
      const reader = new FileReader();
      reader.onloadend = () => setReturnImgPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleReturnClick = (borrowID) => {
    if (!returnImg) {
      setAlertMsg("กรุณาแนบรูปหลักฐานก่อนส่งคืน");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("userID", userID);
    formData.append("returnImg", returnImg);
    formData.append("returnIDs", JSON.stringify([borrowID]));

    fetch("http://localhost:4000/api/return-confirm", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("คืนอุปกรณ์สำเร็จ");
          setAlertSeverity("success");
          setOpen(true);
          setReturnImg(null);
          setReturnImgPreview(null);
          // โหลดข้อมูลใหม่
          fetch(`http://localhost:4000/api/borrowed?userID=${userID}`)
            .then((res) => res.json())
            .then((data) => setBorrowed(data))
            .catch(() => setBorrowed([]));
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        {/* Header */}
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
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
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleProfile}>จัดการข้อมูลผู้ใช้</MenuItem>
              <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ maxWidth: 900, mx: "auto", mt: 6, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            รายการอุปกรณ์โสตฯ ที่ยืม
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ลำดับ</TableCell>
                  <TableCell>ชื่ออุปกรณ์</TableCell>
                  <TableCell>จำนวน</TableCell>
                  <TableCell>กำหนดคืน</TableCell>
                  <TableCell>การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {borrowed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      ไม่พบข้อมูลอุปกรณ์ที่ยืม
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowed.map((item, idx) => (
                    <TableRow key={item.borrowID || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.equipmentName}</TableCell>
                      <TableCell>{item.amount}</TableCell>
                      <TableCell>
                        {item.returnDate
                          ? new Date(item.returnDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleReturnClick(item.borrowID)}
                        >
                          ส่งคืน
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={2} direction="row" alignItems="center" sx={{ mt: 4 }}>
            <label>
              <Input
                type="file"
                accept="image/*"
                sx={{ display: "none" }}
                onChange={handleReturnImgChange}
              />
              <Button variant="outlined" component="span">
                แนบรูปหลักฐานการคืน
              </Button>
            </label>
            {returnImgPreview && (
              <Box
                component="img"
                src={returnImgPreview}
                alt="return"
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

export default Return;
