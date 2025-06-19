import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "Kanit, Arial, sans-serif",
  },
});

function HomePage() {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography variant="h4" gutterBottom>
          ระบบเบิก-จ่ายอุปกรณ์
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการอุปกรณ์
        </Typography>
        <Stack spacing={2} sx={{ mt: 4, width: 300 }}>
          <Button variant="contained" color="primary" size="large">
            เบิกอุปกรณ์
          </Button>
          <Button variant="contained" color="success" size="large">
            คืนอุปกรณ์
          </Button>
          <Button variant="outlined" color="secondary" size="large">
            รายการอุปกรณ์
          </Button>
          <Button variant="outlined" color="info" size="large">
            ประวัติการเบิก-จ่าย
          </Button>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}

export default HomePage;