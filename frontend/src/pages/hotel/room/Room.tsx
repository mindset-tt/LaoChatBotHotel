import { Box, Button, Grid, Typography, CircularProgress, Alert } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import { useRooms } from "../../../hooks/api";

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
  const { data: roomList, isLoading, error } = useRooms();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={2}>
        <Alert severity="error">Failed to load rooms. Using mock data as fallback.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }} padding={2}>
      <Box
        gap={2}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Grid container spacing={2}>
          {(roomList ?? []).map((room, idx) => (
            <Grid size={2} key={room.id ?? idx}>
              <Box
                sx={{
                  borderRadius: "20px",
                  padding: 4,
                  color: "#fff",
                  boxShadow: "0 2px 16px 0 rgba(0,0,0,0.3)",
                  position: "relative",
                  mb: 2,
                  background: room.is_available ? "#49bb58" : "#f44336",
                }}
              >
                <Typography variant="h5" fontWeight={600} mb={1} color="white">
                  {room.room_number}
                </Typography>
                <Typography variant="body2" color="white" mb={2}>
                  {room.room_type}
                </Typography>
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                  }}
                >
                  <Box
                    sx={{
                      background: room.is_available ? "#D1FAE5" : "#F8D7DA",
                      color: room.is_available ? "#065F46" : "#B71C1C",
                      borderRadius: "12px",
                      px: 2,
                      py: 0.5,
                      fontWeight: 600,
                      fontSize: 14,
                      display: "inline-block",
                    }}
                  >
                    {room.is_available ? "Available" : "Occupied"}
                  </Box>
                </Box>
                
                <Typography fontWeight={500} color="white" mb={1}>
                  Price: ${room.price_per_night}/night
                </Typography>
                
                <Typography fontWeight={500} color="white" mb={1}>
                  Max Guests: {room.max_guests}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="white" 
                  sx={{ 
                    mb: 2,
                    opacity: 0.9,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Amenities: {room.amenities?.join(', ') || 'None'}
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    mt: 2,
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    px: 3,
                    "&:hover": { 
                      background: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  Edit Room
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};
