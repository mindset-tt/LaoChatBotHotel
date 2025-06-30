import { Box, Typography } from "@mui/material";
import React from "react";
import fnsLogo from "../../assets/fns-logo.png"; // Adjust the path as necessary

export const Navbar = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: "10px 20px",
        width: "100%",
      }}
    >
      <Box
        width={"30%"}
        sx={{ display: "flex", justifyContent: "end", alignItems: "center" }}
      >
        <Typography>Logo</Typography>
        <img src={fnsLogo} alt="Logo" />
      </Box>
      <Box width={"100%"}>
        <Box width={"70%"}>
          <Typography
            variant="h5"
            sx={{ textAlign: "center", color: "#414040" }}
          >
            ຫົວຂໍ້ ການພັດທະນາແຊັດບອດສຳລັບໃຫ້ຂໍ້ມູນການບໍລິການຂອງໂຮງແຮມຄອນເຊຍນາ
          </Typography>
          <Typography
            variant="h5"
            sx={{ textAlign: "center", color: "#414040" }}
          >
            Developing a Chatbot for Providing Hotel Consiana Service
            Information
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
