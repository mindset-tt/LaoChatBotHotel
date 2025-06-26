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
      }}
    >
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          ອາຈານທີ່ປຶກສາ:
        </Typography>
        <Typography variant="body2">ຊອ. ປທ. ທອງສິງ ສີວົງໄຊ</Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          ຜູ້ຊ່ວຍທີ່ປຶກສາ:
        </Typography>
        <Typography variant="body2">ຊອ. ປທ. ສຸກປະເສີດ ບັນຈົງ</Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          ພັດທະນາໂດຍ:
        </Typography>
        <Typography variant="body2">ນາງ ສຸກດາວີ ສີວິໄລ</Typography>
        <Typography variant="body2">ນາງ ພູທອງເພັດ ພັນທະປັນຍາ</Typography>
      </Box>
    </Box>
  );
};
