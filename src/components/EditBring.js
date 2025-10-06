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
  TablePagination,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function EditBring() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [units, setUnits] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const navigate = useNavigate();

  const roleID = Number(localStorage.getItem("roleID") || 0);
  const isAdmin = roleID === 2 || roleID === 4;

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");

  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipAmount, setNewEquipAmount] = useState("");
  const [newEquipUnit, setNewEquipUnit] = useState("");
  const [editingEquipments, setEditingEquipments] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // 🔹 Dialog เพิ่มหน่วยใหม่
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");

  // โหลดข้อมูลอุปกรณ์
  const loadEquipment = () => {
    fetch("http://localhost:4000/api/equipment")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item) => item.typeID === 1);
        setEquipment(filtered);

        if (isAdmin) {
          const editState = {};
          filtered.forEach((item) => {
            editState[item.equipmentID] = {
              equipmentName: item.equipmentName,
              amount: item.amount,
              unitID: item.unitID,
            };
          });
          setEditingEquipments(editState);
        }
      })
      .catch(() => setEquipment([]));
  };

  // โหลดหน่วย
  const loadUnits = () => {
    fetch("http://localhost:4000/api/units")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setUnits(data.data);
      })
      .catch(() => setUnits([]));
  };

  useEffect(() => {
    loadEquipment();
    loadUnits();
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

  const handleEditChange = (equipmentID, field, value) => {
    setEditingEquipments((prev) => ({
      ...prev,
      [equipmentID]: {
        ...prev[equipmentID],
        [field]: field === "amount" ? Number(value) : value,
      },
    }));
  };

  // 🔹 บันทึกการแก้ไขอุปกรณ์
  const handleSaveEdit = (equipmentID) => {
    const edited = editingEquipments[equipmentID];
    const trimmedName = edited.equipmentName.trim();

    const duplicate = equipment.some(
      (item) =>
        item.equipmentID !== equipmentID &&
        item.equipmentName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setAlertMsg("ไม่สามารถแก้ไขเป็นชื่อที่ซ้ำกับอุปกรณ์อื่นได้");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    if (!trimmedName || edited.amount < 0 || !edited.unitID) {
      setAlertMsg("กรุณากรอกข้อมูลอุปกรณ์ให้ถูกต้อง");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    fetch(`http://localhost:4000/api/edit-equipment/${equipmentID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": roleID.toString(),
      },
      body: JSON.stringify({
        equipmentName: trimmedName,
        amount: edited.amount,
        unitID: edited.unitID,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("แก้ไขอุปกรณ์สำเร็จ");
          setAlertSeverity("success");
          setOpen(true);
          loadEquipment();
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

  // 🔹 ลบอุปกรณ์
  const handleDeleteEquipment = (equipmentID) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้?")) return;

    fetch(`http://localhost:4000/api/delete-equipment/${equipmentID}`, {
      method: "DELETE",
      headers: { "x-user-role": roleID.toString() },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("ลบอุปกรณ์สำเร็จ");
          setAlertSeverity("success");
          setOpen(true);
          loadEquipment();
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

  // 🔹 เพิ่มอุปกรณ์ใหม่
  const handleAddNewEquipment = () => {
    const trimmedName = newEquipName.trim();

    if (!trimmedName || Number(newEquipAmount) < 0 || !newEquipUnit) {
      setAlertMsg("กรุณากรอกข้อมูลอุปกรณ์ใหม่ให้ถูกต้อง");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    const duplicate = equipment.some(
      (item) => item.equipmentName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setAlertMsg("ไม่สามารถเพิ่มอุปกรณ์ที่มีชื่อซ้ำกันได้");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }

    fetch("http://localhost:4000/api/add-equipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": roleID.toString(),
      },
      body: JSON.stringify({
        equipmentName: trimmedName,
        amount: Number(newEquipAmount),
        unitID: newEquipUnit,
        typeID: 1,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setAlertMsg("เพิ่มอุปกรณ์ใหม่สำเร็จ");
          setAlertSeverity("success");
          setOpen(true);
          setNewEquipName("");
          setNewEquipAmount("");
          setNewEquipUnit("");
          loadEquipment();
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

  const filteredEquipment = equipment.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.equipmentName.toLowerCase().includes(term) ||
      item.amount.toString().includes(term)
    );
  });

  const getUnitName = (unitID) => {
    const unit = units.find((u) => u.unitID === unitID);
    return unit ? unit.unitName : "-";
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        {/* 🔹 AppBar */}
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            {false && (
            <IconButton
              color="inherit"
              onClick={() => navigate("/bring")}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            )}
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
              เบิก-จ่ายอุปกรณ์สำนักงาน
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
          {/* ✅ Search Bar (อยู่เหนือเพิ่มอุปกรณ์ใหม่) */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <TextField
              label="ค้นหาอุปกรณ์"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />
          </Box>

          {/* ✅ เพิ่มอุปกรณ์ใหม่ */}
          {isAdmin && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                เพิ่มอุปกรณ์ใหม่
              </Typography>
              <Stack spacing={2} direction="row" alignItems="center">
                <TextField
                  label="ชื่ออุปกรณ์"
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="จำนวน"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={newEquipAmount}
                  onChange={(e) => setNewEquipAmount(e.target.value)}
                  sx={{ width: 120 }}
                />
                <FormControl sx={{ width: 150 }}>
                  <InputLabel>หน่วย</InputLabel>
                  <Select
                    native
                    value={newEquipUnit}
                    onChange={(e) => {
                      if (e.target.value === "add_new_unit") {
                        setUnitDialogOpen(true);
                      } else {
                        setNewEquipUnit(e.target.value);
                      }
                    }}
                  >
                    <option aria-label="None" value="" />
                    {units.map((unit) => (
                      <option key={unit.unitID} value={unit.unitID}>
                        {unit.unitName}
                      </option>
                    ))}
                    <option value="add_new_unit">➕ เพิ่มหน่วยใหม่</option>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddNewEquipment}
                >
                  เพิ่มอุปกรณ์
                </Button>
              </Stack>
            </Paper>
          )}

          {/* ✅ ตารางอุปกรณ์ */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ชื่ออุปกรณ์</TableCell>
                  <TableCell>จำนวนคงเหลือ</TableCell>
                  <TableCell>หน่วย</TableCell>
                  {isAdmin && <TableCell>จัดการ</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEquipment
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.equipmentID}>
                      <TableCell>
                        {isAdmin ? (
                          <TextField
                            variant="standard"
                            value={
                              editingEquipments[item.equipmentID]?.equipmentName ||
                              ""
                            }
                            onChange={(e) =>
                              handleEditChange(
                                item.equipmentID,
                                "equipmentName",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          item.equipmentName
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <TextField
                            variant="standard"
                            type="number"
                            inputProps={{ min: 0 }}
                            value={editingEquipments[item.equipmentID]?.amount || 0}
                            onChange={(e) =>
                              handleEditChange(
                                item.equipmentID,
                                "amount",
                                e.target.value
                              )
                            }
                            sx={{ width: 80 }}
                          />
                        ) : (
                          item.amount
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <FormControl variant="standard" sx={{ minWidth: 100 }}>
                            <Select
                              native
                              value={editingEquipments[item.equipmentID]?.unitID || ""}
                              onChange={(e) =>
                                handleEditChange(
                                  item.equipmentID,
                                  "unitID",
                                  e.target.value
                                )
                              }
                            >
                              <option aria-label="None" value="" />
                              {units.map((unit) => (
                                <option key={unit.unitID} value={unit.unitID}>
                                  {unit.unitName}
                                </option>
                              ))}
                              <option value="add_new_unit">➕ เพิ่มหน่วยใหม่</option>
                            </Select>
                          </FormControl>
                        ) : (
                          getUnitName(item.unitID)
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSaveEdit(item.equipmentID)}
                            >
                              บันทึก
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() =>
                                handleDeleteEquipment(item.equipmentID)
                              }
                            >
                              ลบ
                            </Button>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredEquipment.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
            />
          </TableContainer>
        </Box>

        {/* ✅ Dialog เพิ่มหน่วยใหม่ */}
        <Dialog open={unitDialogOpen} onClose={() => setUnitDialogOpen(false)}>
          <DialogTitle>เพิ่มหน่วยใหม่</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="ชื่อหน่วย"
              fullWidth
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUnitDialogOpen(false)}>ยกเลิก</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (!newUnitName.trim()) return;
                fetch("http://localhost:4000/api/add-unit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ unitName: newUnitName.trim() }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.status) {
                      setAlertMsg("เพิ่มหน่วยใหม่สำเร็จ");
                      setAlertSeverity("success");
                      setOpen(true);
                      loadUnits();
                      setNewEquipUnit(data.unitID);
                    } else {
                      setAlertMsg("ไม่สามารถเพิ่มหน่วยได้");
                      setAlertSeverity("error");
                      setOpen(true);
                    }
                  })
                  .catch(() => {
                    setAlertMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
                    setAlertSeverity("error");
                    setOpen(true);
                  })
                  .finally(() => {
                    setUnitDialogOpen(false);
                    setNewUnitName("");
                  });
              }}
            >
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={open} autoHideDuration={2500} onClose={handleClose}>
          <Alert severity={alertSeverity} sx={{ width: "100%" }}>
            {alertMsg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default EditBring;
