import { Box, Typography } from "@mui/material";
import React from "react";

export const Footer = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#878484",
        width: "100%",
        fontSize: "12px",
      }}
    >
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "12px" }}>
          ອາຈານທີ່ປຶກສາ:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "12px" }}>ຊອ. ປທ. ທອງສິງ ສີວົງໄຊ</Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "12px" }}>
          ຜູ້ຊ່ວຍທີ່ປຶກສາ:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "12px" }}>ຊອ. ປທ. ສຸກປະເສີດ ບັນຈົງ</Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "12px" }}>
          ພັດທະນາໂດຍ:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "12px" }}>ນາງ ສຸກດາວີ ສີວິໄລ</Typography>
        <Typography variant="body2" sx={{ fontSize: "12px" }}>ນາງ ພູທອງເພັດ ພັນທະປັນຍາ</Typography>
      </Box>
    </Box>
  );
};
