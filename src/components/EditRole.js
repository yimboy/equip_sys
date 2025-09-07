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
  Card,
  CardContent,
  Grid,
  Select,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function EditRole() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]); // ✅ เก็บ role ที่ดึงจาก backend
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");
  const roleID = localStorage.getItem("roleID");

  // ✅ ดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/user", {
        headers: { "x-user-role": roleID },
      });
      const data = await res.json();
      if (data.status) setUsers(data.data);
      else
        setSnackbar({ open: true, message: data.message || "ดึงข้อมูลล้มเหลว", severity: "error" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ API", severity: "error" });
    }
  };

  // ✅ ดึง role ทั้งหมด
  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/roles");
      const data = await res.json();
      if (data.status) setRoles(data.data);
    } catch (err) {
      console.error("โหลด role ล้มเหลว", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles(); // ✅ โหลด role ตอนเปิดหน้า
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const pic = localStorage.getItem("profilePic");
      if (pic) setProfilePic(pic);
    } else {
      setProfilePic(null);
    }
  }, [isLoggedIn]);

  // ✅ อัปเดต role
  const updateRole = async (userID, newRoleID) => {
  try {
    const res = await fetch(`http://localhost:4000/api/users/${userID}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": String(roleID).trim(), // ✅ กันพลาด
      },
      body: JSON.stringify({ roleID: Number(newRoleID) }), // ✅ ส่งเป็น number
    });

    const data = await res.json();
    if (data.status) {
      setSnackbar({ open: true, message: "อัปเดตสิทธิ์สำเร็จ", severity: "success" });
      fetchUsers();
    } else {
      setSnackbar({ open: true, message: data.message || "อัปเดตล้มเหลว", severity: "error" });
    }
  } catch (err) {
    console.error(err);
    setSnackbar({ open: true, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ API", severity: "error" });
  }
};


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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        {/* ✅ Header คล้าย History */}
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }} onClick={() => navigate("/homepage")}>
              <Box component="img" src={logo} alt="logo" sx={{ width: 52, height: 52, objectFit: "contain" }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              จัดการสิทธิ์ผู้ใช้
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

        {/* ✅ Layout */}
        <Grid container justifyContent="center" sx={{ mt: 6, px: 2 }}>
          <Grid item xs={12} md={11}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  รายชื่อผู้ใช้
                </Typography>

                <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell>ชื่อผู้ใช้งาน</TableCell>
                        <TableCell>ชื่อจริง</TableCell>
                        <TableCell>นามสกุล</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>เบอร์โทร</TableCell>
                        <TableCell>กองงาน</TableCell>
                        <TableCell>สิทธิ์ผู้ใช้</TableCell>
                        <TableCell align="center">จัดการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.userID} hover>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.firstname}</TableCell>
                          <TableCell>{user.lastname}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.mobilePhone}</TableCell>
                          <TableCell>{user.division}</TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={user.roleID}
                              onChange={(e) =>
                                setUsers((prev) =>
                                  prev.map((u) =>
                                    u.userID === user.userID
                                      ? { ...u, roleID: Number(e.target.value) } // ✅ แปลงเป็น number
                                      : u
                                  )
                                )
                              }
                              sx={{ minWidth: 150 }}
                            >
                              {roles.map((role) => (
                                <MenuItem key={role.roleID} value={role.roleID}>
                                  {role.roleName}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => updateRole(user.userID, user.roleID)}
                            >
                              บันทึก
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ✅ Snackbar แจ้งเตือน */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default EditRole;
