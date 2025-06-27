import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Delete";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobilePhone: "",
    division: "",
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (!userID) {
      setError("ไม่พบ userID กรุณาเข้าสู่ระบบใหม่");
      setLoading(false);
      return;
    }
    axios
      .get(`http://localhost:4000/api/profile/${userID}`)
      .then((response) => {
        setProfile(response.data);
        setFormData({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          mobilePhone: response.data.mobilePhone,
          division: response.data.division || "", // ถ้าไม่มีข้อมูล division ให้เป็นค่าว่าง
        });
        setPreview(response.data.imageFile || null); // base64 string or null
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response ? err.response.data.message : "เกิดข้อผิดพลาด");
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    setPreview(profile?.imageFile || null);
  };

  // อ่านไฟล์รูปเป็น base64
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // ลบรูปโปรไฟล์ (set preview เป็น null)
  const handleRemoveProfilePic = () => {
    setPreview(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const userID = localStorage.getItem("userID");
    const payload = {
      userID,
      ...formData,
      imageFile: preview, // ส่ง base64 string ไปที่ API (ถ้า null คือไม่มีรูป)
    };
    try {
      const res = await axios.post("http://localhost:4000/api/profile/update", payload);
      if (res.data && res.data.status) {
        setProfile((prev) => ({
          ...prev,
          ...formData,
          imageFile: preview,
        }));
        setIsEditing(false);
      } else {
        setError(res.data.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleBackClick = () => {
    navigate("/homepage");
  };

  if (loading)
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  if (!profile)
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <Alert severity="warning">ไม่พบข้อมูล</Alert>
      </Box>
    );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        {/* Header */}
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleBackClick} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              โปรไฟล์ลูกค้า
            </Typography>
            <AccountCircleIcon />
          </Toolbar>
        </AppBar>
        {/* Main Content */}
        <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
          <Card elevation={4}>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Box sx={{ position: "relative", mb: 2 }}>
                  <Avatar
                    src={preview}
                    sx={{
                      width: 110,
                      height: 110,
                      border: "3px solid #1976d2",
                      boxShadow: 2,
                    }}
                  />
                  {isEditing && preview && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleRemoveProfilePic}
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        bgcolor: "#fff",
                        border: "1px solid #ccc",
                        ":hover": { bgcolor: "#f8d7da" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  ข้อมูลส่วนตัว
                </Typography>
                <Divider sx={{ width: "100%", mb: 1 }} />
              </Stack>
              {isEditing ? (
                <form onSubmit={handleFormSubmit}>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Button variant="outlined" component="label">
                      เปลี่ยนรูปโปรไฟล์
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleProfilePicChange}
                      />
                    </Button>
                    <TextField
                      fullWidth
                      label="ชื่อ"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                    <TextField
                      fullWidth
                      label="นามสกุล"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    <TextField
                      fullWidth
                      label="เบอร์โทรศัพท์"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleInputChange}
                    />
                    <TextField
                      fullWidth
                      label="กองงาน"
                      name="division"
                      value={formData.division}
                      onChange={handleInputChange}
                    />
                    <Box display="flex" justifyContent="center" gap={2}>
                      <Button type="submit" variant="contained" color="primary">
                        บันทึก
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleEditToggle}
                      >
                        ยกเลิก
                      </Button>
                    </Box>
                  </Stack>
                </form>
              ) : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      ชื่อ
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {profile.firstName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      นามสกุล
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {profile.lastName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {profile.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      เบอร์โทรศัพท์
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {profile.mobilePhone}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      กองงาน
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {profile.division}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="center">
                    <Button variant="contained" color="primary" onClick={handleEditToggle}>
                      แก้ไขโปรไฟล์
                    </Button>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;