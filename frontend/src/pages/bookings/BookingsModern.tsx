import React, { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person,
  Hotel,
  DateRange,
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  TrendingUp,
  AttachMoney
} from '@mui/icons-material';
import { 
  useBookings, 
  useRooms, 
  useCreateBooking, 
  useUpdateBooking, 
  useDeleteBooking 
} from '../../hooks/api';
import {
  PageContainer,
  MetricCard,
  InfoCard,
  PageLoading,
  ErrorState
} from '../../components/common';
import { 
  formatDate, 
  formatCurrency, 
  getBookingStatusColor,
  capitalizeFirst,
  truncateText 
} from '../../utils';

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_id: number;
  room_number?: string;
  room_type?: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  created_at: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  is_available: boolean;
}

// Enhanced booking row component
const BookingRow = React.memo(({ 
  booking, 
  getRoomInfo, 
  onEdit, 
  onDelete 
}: {
  booking: Booking;
  getRoomInfo: (roomId: number) => { display: string; type: string };
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: number) => void;
}) => {
  const roomInfo = getRoomInfo(booking?.room_id || 0);
  
  return (
    <TableRow sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {booking?.guest_name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {truncateText(booking?.guest_email, 25)}
          </Typography>
          {booking?.guest_phone && (
            <Typography variant="caption" color="text.secondary" display="block">
              {booking.guest_phone}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {roomInfo.display}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {roomInfo.type}
          </Typography>
        </Box>
      </TableCell>      <TableCell>
        <Typography variant="body2">
          {formatDate(booking?.check_in_date)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatDate(booking?.check_out_date)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(booking?.total_price || 0)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip 
          label={capitalizeFirst((booking?.status || '').replace('_', ' '))} 
          color={getBookingStatusColor(booking?.status || 'pending')}
          size="small"
          variant="filled"
        />
      </TableCell>
      <TableCell>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit booking">
            <IconButton
              size="small"
              onClick={() => onEdit(booking)}
              color="primary"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete booking">
            <IconButton
              size="small"
              onClick={() => onDelete(booking.id)}
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

BookingRow.displayName = 'BookingRow';

// Booking form dialog component
const BookingDialog: React.FC<{
  open: boolean;
  booking: Booking | null;
  rooms: Room[];
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading: boolean;
}> = ({ open, booking, rooms, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    total_price: 0
  });

  // Update form data when booking changes
  React.useEffect(() => {
    if (booking) {
      setFormData({
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        room_id: booking.room_id.toString(),
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        total_price: booking.total_price
      });
    } else {
      setFormData({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        room_id: '',
        check_in_date: '',
        check_out_date: '',
        total_price: 0
      });
    }
  }, [booking]);

  const handleSubmit = () => {
    const bookingData = {
      ...formData,
      room_id: parseInt(formData.room_id),
      total_price: parseFloat(formData.total_price.toString())
    };
    
    if (booking) {
      onSave({ id: booking.id, ...bookingData });
    } else {
      onSave(bookingData);
    }
  };

  const isFormValid = formData.guest_name && formData.guest_email && formData.room_id && 
                     formData.check_in_date && formData.check_out_date && formData.total_price > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">
          {booking ? '✏️ Edit Booking' : '➕ New Booking'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 3, mt: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TextField
            fullWidth
            label="Guest Name"
            value={formData.guest_name}
            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Guest Email"
            type="email"
            value={formData.guest_email}
            onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Guest Phone"
            value={formData.guest_phone}
            onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
          />
          <FormControl fullWidth required>
            <InputLabel>Room</InputLabel>
            <Select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
            >
              {rooms.map((room: Room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.room_number} - {room.room_type} ({formatCurrency(room.price_per_night)}/night)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Check-in Date"
            type="date"
            value={formData.check_in_date}
            onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Check-out Date"
            type="date"
            value={formData.check_out_date}
            onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Total Price"
            type="number"
            value={formData.total_price}
            onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
            InputProps={{
              startAdornment: <AttachMoney fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            }}
            required
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
          {booking ? 'Update Booking' : 'Create Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const BookingsModern: React.FC = React.memo(() => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const itemsPerPage = 10;

  // API hooks
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useBookings(1, 100);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();
  // Extract bookings array from the paginated response
  const bookings = useMemo(() => {
    if (Array.isArray(bookingsData)) {
      return bookingsData;
    }
    return bookingsData?.data || [];
  }, [bookingsData]);
  // Memoized filtering and pagination
  const filteredBookings = useMemo(() => {
    // Ensure bookings is always an array
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    return safeBookings.filter((booking: Booking) => {
      const matchesSearch = booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.guest_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const paginatedBookings = useMemo(() => {
    if (!Array.isArray(filteredBookings)) return [];
    const startIndex = (page - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, page, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!Array.isArray(filteredBookings)) return 1;
    return Math.ceil(filteredBookings.length / itemsPerPage);
  }, [filteredBookings, itemsPerPage]);
  // Memoized statistics
  const statistics = useMemo(() => {
    // Ensure bookings is always an array
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    const totalRevenue = safeBookings.reduce((sum: number, b: Booking) => sum + (b.total_price || 0), 0);
    const confirmedCount = safeBookings.filter((b: Booking) => b.status === 'confirmed').length;
    const pendingCount = safeBookings.filter((b: Booking) => b.status === 'pending').length;
    const averageValue = safeBookings.length > 0 ? totalRevenue / safeBookings.length : 0;

    return [
      { 
        icon: <Hotel color="primary" />, 
        title: 'Total Bookings', 
        value: safeBookings.length, 
        subtitle: 'All time bookings' 
      },
      { 
        icon: <TrendingUp color="success" />, 
        title: 'Confirmed', 
        value: confirmedCount, 
        subtitle: 'Ready to go' 
      },
      { 
        icon: <DateRange color="warning" />, 
        title: 'Pending', 
        value: pendingCount, 
        subtitle: 'Awaiting confirmation' 
      },
      { 
        icon: <AttachMoney color="primary" />, 
        title: 'Total Revenue', 
        value: formatCurrency(totalRevenue), 
        subtitle: `Avg: ${formatCurrency(averageValue)}` 
      }
    ];
  }, [bookings]);

  // Utility functions
  const getRoomInfo = useCallback((roomId: number) => {
    const room = rooms.find((r: Room) => r.id === roomId);
    return {
      display: room ? `Room ${room.room_number}` : `Room ${roomId}`,
      type: room ? room.room_type : 'Unknown'
    };
  }, [rooms]);

  // Event handlers
  const handleSubmit = useCallback(async (data: any) => {
    try {
      if (editingBooking) {
        await updateBookingMutation.mutateAsync(data);
      } else {
        await createBookingMutation.mutateAsync(data);
      }
      setOpenDialog(false);
      setEditingBooking(null);
    } catch (err) {
      console.error('Save booking error:', err);
    }
  }, [editingBooking, createBookingMutation, updateBookingMutation]);

  const handleDelete = useCallback(async (bookingId: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBookingMutation.mutateAsync(bookingId);
      } catch (err) {
        console.error('Delete booking error:', err);
      }
    }
  }, [deleteBookingMutation]);

  const handleOpenDialog = useCallback((booking?: Booking) => {
    setEditingBooking(booking || null);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingBooking(null);
  }, []);

  const isLoading = bookingsLoading || roomsLoading;
  const isSubmitting = createBookingMutation.isPending || updateBookingMutation.isPending;

  if (isLoading) {
    return <PageLoading message="Loading bookings data..." />;
  }

  if (bookingsError) {
    return (
      <PageContainer>
        <ErrorState
          error={bookingsError}
          title="Bookings Error"
          fullPage
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Hotel sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Booking Management
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Manage hotel reservations and guest bookings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          New Booking
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gap: 3, mb: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        {statistics.map((stat, index) => (
          <MetricCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
          />
        ))}
      </Box>

      {/* Filters and Search */}
      <InfoCard 
        title="Search & Filter"
        icon={<FilterList color="primary" />}
      >
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto' } }}>
          <TextField
            placeholder="Search by guest name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <FormControl>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="checked_in">Checked In</MenuItem>
              <MenuItem value="checked_out">Checked Out</MenuItem>
            </Select>
          </FormControl>          <Box display="flex" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {Array.isArray(filteredBookings) ? filteredBookings.length : 0} result{Array.isArray(filteredBookings) && filteredBookings.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </InfoCard>

      {/* Bookings Table */}
      <Paper elevation={2} sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell><strong>Guest Information</strong></TableCell>
                <TableCell><strong>Room Details</strong></TableCell>
                <TableCell><strong>Check-in</strong></TableCell>
                <TableCell><strong>Check-out</strong></TableCell>
                <TableCell><strong>Total Price</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>            <TableBody>
              {Array.isArray(paginatedBookings) && paginatedBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  getRoomInfo={getRoomInfo}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))}
              {(!Array.isArray(paginatedBookings) || paginatedBookings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">
                      No bookings found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Paper>

      {/* Booking Dialog */}
      <BookingDialog
        open={openDialog}
        booking={editingBooking}
        rooms={rooms}
        onClose={handleCloseDialog}
        onSave={handleSubmit}
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
});

BookingsModern.displayName = 'BookingsModern';
