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
        width={"50%"}
        sx={{ display: "flex", justifyContent: "end", alignItems: "center" }}
      >
        <img
          src={fnsLogo}
          alt="Logo"
          style={{ width: "60px", height: "80px" }}
        />
      </Box>
      <Box width={"100%"}>
        <Box width={"70%"}>
          <Typography
            sx={{
              fontSize: "14px",
              textAlign: "center",
              color: "#414040",
              fontWeight: "bold",
            }}
          >
            ຫົວຂໍ້ ການພັດທະນາແຊັດບອດສຳລັບໃຫ້ຂໍ້ມູນການບໍລິການຂອງໂຮງແຮມຄອນເຊຍນາ
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              textAlign: "center",
              color: "#414040",
              fontWeight: "bold",
            }}
          >
            Developing a Chatbot for Providing Hotel Consiana Service
            Information
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
