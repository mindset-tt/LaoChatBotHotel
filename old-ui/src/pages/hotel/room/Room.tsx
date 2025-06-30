import { Box, Button, Grid, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import { useGetRoomsList } from "../../../hooks/queries/rooms/rooms.query";

const rooms = [
  {
    roomId: "R-b8dea5",
    roomNumber: "102",
    status: "Available",
    reserveStartDate: null,
    reserveEndDate: null,
    note: null,
  },
  {
    roomId: "R-b8dea5",
    roomNumber: "102",
    status: "Available",
    reserveStartDate: null,
    reserveEndDate: null,
    note: null,
  },
];

export const Room = () => {
  const { data: roomList } = useGetRoomsList();
  return (
    <Box sx={{ width: "100%", height: "100%" }} padding={2}>
      <Box
        // padding={3}
        gap={2}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Grid container spacing={2}>
          {(roomList ?? []).map((room, idx) => (
            <Grid size={2}>
              <Box
                key={room.roomId ?? idx}
                sx={{
                  borderRadius: "20px",
                  padding: 4,
                  //   width: 350,
                  color: "#fff",
                  boxShadow: "0 2px 16px 0 rgba(0,0,0,0.3)",
                  position: "relative",
                  mb: 2,
                }}
              >
                <Typography variant="h5" fontWeight={600} mb={1} color="black">
                  {room.roomNumber}
                </Typography>
                <Box
                  sx={{
                    position: "absolute",
                    top: 24,
                    right: 24,
                  }}
                >
                  <Box
                    sx={{
                      background:
                        room.status === "Booked" ? "#F8D7DA" : "#D1FAE5",
                      color: room.status === "Booked" ? "#B71C1C" : "#065F46",
                      borderRadius: "20px",
                      px: 2,
                      py: 0.5,
                      fontWeight: 600,
                      fontSize: 16,
                      display: "inline-block",
                    }}
                  >
                    {room.status}
                  </Box>
                </Box>
                {room.reserveStartDate && room.reserveEndDate && (
                  <Typography fontWeight={600} mt={3} color="black">
                    Reserved:{" "}
                    <span style={{ fontWeight: 400 }}>
                      {room.reserveStartDate} - {room.reserveEndDate}
                    </span>
                  </Typography>
                )}
                <Typography fontWeight={600} mt={1} color="black">
                  Notes:{" "}
                  <span style={{ fontWeight: 400 }}>{room.note ?? "-"}</span>
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    mt: 3,
                    borderRadius: "10px",
                    background: "#49bb58",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 16,
                    px: 3,
                    "&:hover": { background: "#53a45e" },
                  }}
                >
                  Edit
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};
