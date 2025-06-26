import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Hotel,
  Edit,
  Add,
  Delete,
  Bed,
  AttachMoney,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../../../hooks/api';
import {
  PageContainer,
  PageHeader,
  InfoCard,
  PageLoading,
  ErrorState
} from '../../../components/common';
import {
  formatCurrency,
  getRoomStatusColor,
  capitalizeFirst
} from '../../../utils';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  is_available: boolean;
  capacity?: number;
  amenities?: string[];
  description?: string;
  status?: string;
}

// Room card component
const RoomCard: React.FC<{
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (roomId: number) => void;
}> = ({ room, onEdit, onDelete }) => {
  const getStatusDisplay = () => {
    if (room.status) return room.status;
    return room.is_available ? 'Available' : 'Occupied';
  };

  const getStatusColor = () => {
    if (room.status) return getRoomStatusColor(room.status);
    return room.is_available ? 'success' : 'warning';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Room {room.room_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {capitalizeFirst(room.room_type)}
            </Typography>
          </Box>
          <Chip
            label={getStatusDisplay()}
            color={getStatusColor()}
            size="small"
            variant="filled"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AttachMoney fontSize="small" color="primary" />
            <Typography variant="h6" color="primary.main">
              {formatCurrency(room.price_per_night)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / night
            </Typography>
          </Box>
          
          {room.capacity && (
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Bed fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {room.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {room.description}
          </Typography>
        )}

        {room.amenities && room.amenities.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Amenities:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {room.amenities.slice(0, 3).map((amenity, index) => (
                <Chip
                  key={index}
                  label={amenity}
                  size="small"
                  variant="outlined"
                />
              ))}
              {room.amenities.length > 3 && (
                <Chip
                  label={`+${room.amenities.length - 3} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        <Box display="flex" gap={1} justifyContent="flex-end">
          <Tooltip title="Edit room">
            <IconButton
              size="small"
              onClick={() => onEdit(room)}
              color="primary"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete room">
            <IconButton
              size="small"
              onClick={() => onDelete(room.id)}
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

// Room form dialog
const RoomDialog: React.FC<{
  open: boolean;
  room: Room | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading: boolean;
}> = ({ open, room, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: '',
    price_per_night: 0,
    capacity: 1,
    is_available: true,
    description: '',
    amenities: ''
  });

  React.useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.room_number,
        room_type: room.room_type,
        price_per_night: room.price_per_night,
        capacity: room.capacity || 1,
        is_available: room.is_available,
        description: room.description || '',
        amenities: room.amenities?.join(', ') || ''
      });
    } else {
      setFormData({
        room_number: '',
        room_type: '',
        price_per_night: 0,
        capacity: 1,
        is_available: true,
        description: '',
        amenities: ''
      });
    }
  }, [room]);

  const handleSubmit = () => {
    const roomData = {
      ...formData,
      amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : []
    };
    
    if (room) {
      onSave({ id: room.id, ...roomData });
    } else {
      onSave(roomData);
    }
  };

  const isFormValid = formData.room_number && formData.room_type && formData.price_per_night > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {room ? '✏️ Edit Room' : '➕ Add New Room'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 3, mt: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TextField
            fullWidth
            label="Room Number"
            value={formData.room_number}
            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Room Type"
            value={formData.room_type}
            onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
            placeholder="e.g., Standard, Deluxe, Suite"
            required
          />
          <TextField
            fullWidth
            label="Price per Night"
            type="number"
            value={formData.price_per_night}
            onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) || 0 })}
            InputProps={{
              startAdornment: <AttachMoney fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            }}
            required
          />
          <TextField
            fullWidth
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
            inputProps={{ min: 1, max: 10 }}
          />
          <FormControl fullWidth>
            <InputLabel>Availability</InputLabel>            <Select
              value={formData.is_available ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.value === "true" })}
            >
              <MenuItem value="true">Available</MenuItem>
              <MenuItem value="false">Not Available</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Amenities"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
            placeholder="WiFi, TV, AC, Mini Bar (comma separated)"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {room ? 'Update Room' : 'Add Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const RoomModern: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // API hooks
  const { data: rooms = [], isLoading, error } = useRooms();
  const createRoomMutation = useCreateRoom();
  const updateRoomMutation = useUpdateRoom();
  const deleteRoomMutation = useDeleteRoom();

  // Filter rooms
  const filteredRooms = useMemo(() => {
    if (statusFilter === 'all') return rooms;
    
    return rooms.filter((room: Room) => {
      if (statusFilter === 'available') return room.is_available;
      if (statusFilter === 'occupied') return !room.is_available;
      return true;
    });
  }, [rooms, statusFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((r: Room) => r.is_available).length;
    const occupiedRooms = totalRooms - availableRooms;
    const averagePrice = totalRooms > 0 
      ? rooms.reduce((sum: number, r: Room) => sum + r.price_per_night, 0) / totalRooms 
      : 0;

    return {
      total: totalRooms,
      available: availableRooms,
      occupied: occupiedRooms,
      averagePrice
    };
  }, [rooms]);

  const handleSave = async (data: any) => {
    try {
      if (editingRoom) {
        await updateRoomMutation.mutateAsync(data);
      } else {
        await createRoomMutation.mutateAsync(data);
      }
      setOpenDialog(false);
      setEditingRoom(null);
    } catch (error) {
      console.error('Save room error:', error);
    }
  };

  const handleDelete = async (roomId: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRoomMutation.mutateAsync(roomId);
      } catch (error) {
        console.error('Delete room error:', error);
      }
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setOpenDialog(true);
  };

  const isSubmitting = createRoomMutation.isPending || updateRoomMutation.isPending;

  if (isLoading) {
    return <PageLoading message="Loading rooms..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          error={error}
          title="Failed to Load Rooms"
          fullPage
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Room Management"
        subtitle="Manage hotel rooms, pricing, and availability"
        icon={<Hotel sx={{ fontSize: '2rem', color: 'primary.main' }} />}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            size="large"
          >
            Add Room
          </Button>
        }
      />

      {/* Statistics */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h3" color="primary.main">
            {statistics.total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Rooms
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h3" color="success.main">
            {statistics.available}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h3" color="warning.main">
            {statistics.occupied}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Occupied
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h3" color="info.main">
            {formatCurrency(statistics.averagePrice)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average Price
          </Typography>
        </Paper>
      </Box>

      {/* Filter */}
      <InfoCard title="Filter Rooms" icon={<Hotel color="primary" />}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Rooms</MenuItem>
              <MenuItem value="available">Available Only</MenuItem>
              <MenuItem value="occupied">Occupied Only</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </Typography>
        </Box>
      </InfoCard>

      {/* Rooms Grid */}
      <Box sx={{ 
        display: 'grid', 
        gap: 3, 
        mt: 3,
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
      }}>
        {filteredRooms.map((room: Room) => (
          <RoomCard
            key={room.id}
            room={room}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        
        {filteredRooms.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              No rooms found matching your criteria
            </Typography>
          </Box>
        )}
      </Box>

      {/* Room Dialog */}
      <RoomDialog
        open={openDialog}
        room={editingRoom}
        onClose={() => {
          setOpenDialog(false);
          setEditingRoom(null);
        }}
        onSave={handleSave}
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
};

RoomModern.displayName = 'RoomModern';
