import React, { useState, useMemo, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Alert,
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
  Skeleton,
  Pagination
} from '@mui/material';
import {
  Person,
  Hotel,
  DateRange,
  Add,
  Edit,
  Delete,
  Search
} from '@mui/icons-material';
import { 
  useBookings, 
  useRooms, 
  useCreateBooking, 
  useUpdateBooking, 
  useDeleteBooking 
} from '../../hooks/api';

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

// Memoized components for better performance
const StatCard = React.memo(({ icon, title, value, color = 'primary' }: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color?: 'primary' | 'success' | 'warning' | 'error';
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1}>
        <Box sx={{ color: `${color}.main` }}>
          {icon}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h3">{value}</Typography>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

const BookingRow = React.memo(({ 
  booking, 
  getRoomInfo, 
  getStatusColor, 
  onEdit, 
  onDelete 
}: {
  booking: Booking;
  getRoomInfo: (roomId: number) => string;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: number) => void;
}) => (
  <TableRow>
    <TableCell>
      <Box>
        <Typography variant="body2" fontWeight="bold">
          {booking.guest_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {booking.guest_email}
        </Typography>
      </Box>
    </TableCell>
    <TableCell>{getRoomInfo(booking.room_id)}</TableCell>
    <TableCell>{booking.check_in_date}</TableCell>
    <TableCell>{booking.check_out_date}</TableCell>
    <TableCell>${booking.total_price}</TableCell>
    <TableCell>
      <Chip 
        label={booking.status} 
        color={getStatusColor(booking.status)}
        size="small"
      />
    </TableCell>
    <TableCell>
      <Box display="flex" gap={1}>
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => onEdit(booking)}
        >
          Edit
        </Button>
        <Button
          size="small"
          color="error"
          startIcon={<Delete />}
          onClick={() => onDelete(booking.id)}
        >
          Delete
        </Button>
      </Box>
    </TableCell>
  </TableRow>
));

BookingRow.displayName = 'BookingRow';

const BookingsSkeleton = React.memo(() => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 4 }} />
    <Box 
      display="flex" 
      flexWrap="wrap" 
      gap={3} 
      mb={4}
    >
      {[...Array(4)].map((_, index) => (
        <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 12px)' } }}>
          <Skeleton variant="rectangular" height={120} />
        </Box>
      ))}
    </Box>
    <Skeleton variant="rectangular" height={400} />
  </Container>
));

BookingsSkeleton.displayName = 'BookingsSkeleton';

export const Bookings: React.FC = React.memo(() => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    total_price: 0
  });

  const itemsPerPage = 10;

  // API hooks
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useBookings(1, 100);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();

  // Extract bookings array from the paginated response
  const bookings = useMemo(() => {
    // Ensure we always return an array
    if (Array.isArray(bookingsData)) {
      return bookingsData;
    }
    return bookingsData?.data || [];
  }, [bookingsData]);

  // Memoized filtering and pagination
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: Booking) => {
      const matchesSearch = booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, page]);

  const totalPages = useMemo(() => 
    Math.ceil(filteredBookings.length / itemsPerPage), 
    [filteredBookings.length]
  );

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum: number, b: Booking) => sum + b.total_price, 0);
    const confirmedCount = bookings.filter((b: Booking) => b.status === 'confirmed').length;
    const pendingCount = bookings.filter((b: Booking) => b.status === 'pending').length;

    return [
      { icon: <Person />, title: 'Total Bookings', value: bookings.length, color: 'primary' as const },
      { icon: <Hotel />, title: 'Confirmed', value: confirmedCount, color: 'success' as const },
      { icon: <DateRange />, title: 'Pending', value: pendingCount, color: 'warning' as const },
      { icon: <Person />, title: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'primary' as const }
    ];
  }, [bookings]);

  // Memoized utility functions
  const getStatusColor = useCallback((status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'checked_in': return 'info' as any;
      case 'checked_out': return 'default';
      default: return 'default';
    }
  }, []);

  const getRoomInfo = useCallback((roomId: number): string => {
    const room = rooms.find((r: Room) => r.id === roomId);
    return room ? `${room.room_number} (${room.room_type})` : `Room ${roomId}`;
  }, [rooms]);

  // Debounced search
  const debouncedSearch = useCallback((value: string) => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(value);
      setPage(1); // Reset to first page on search
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Event handlers
  const handleSubmit = useCallback(async () => {
    try {
      const bookingData = {
        ...formData,
        room_id: parseInt(formData.room_id),
        total_price: parseFloat(formData.total_price.toString())
      };

      if (editingBooking) {
        await updateBookingMutation.mutateAsync({ id: editingBooking.id, ...bookingData });
      } else {
        await createBookingMutation.mutateAsync(bookingData);
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Save booking error:', err);
    }
  }, [formData, editingBooking, createBookingMutation, updateBookingMutation]);

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
    if (booking) {
      setEditingBooking(booking);
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
      setEditingBooking(null);
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
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingBooking(null);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  if (bookingsLoading || roomsLoading) {
    return <BookingsSkeleton />;
  }

  if (bookingsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Failed to load bookings data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          🏨 Booking Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Booking
        </Button>
      </Box>

      {/* Statistics */}
      <Box 
        display="flex" 
        flexWrap="wrap" 
        gap={3} 
        mb={4}
      >
        {statistics.map((stat, index) => (
          <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 12px)' } }}>
            <StatCard {...stat} />
          </Box>
        ))}
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={2} 
          alignItems="center"
        >
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              placeholder="Search by guest name or email..."
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 8px)' } }}>
            <FormControl fullWidth>
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
            </FormControl>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 8px)' } }}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedBookings.length} of {filteredBookings.length} bookings
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Bookings Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Guest</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  getRoomInfo={getRoomInfo}
                  getStatusColor={getStatusColor}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Booking Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBooking ? 'Edit Booking' : 'New Booking'}
        </DialogTitle>
        <DialogContent>
          <Box 
            display="flex" 
            flexDirection="column" 
            gap={2} 
            sx={{ mt: 1 }}
          >
            <TextField
              fullWidth
              label="Guest Name"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Guest Email"
              type="email"
              value={formData.guest_email}
              onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Guest Phone"
              value={formData.guest_phone}
              onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              >
                {rooms.map((room: Room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.room_number} - {room.room_type} (${room.price_per_night}/night)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box 
              display="flex" 
              gap={2}
            >
              <TextField
                fullWidth
                label="Check-in Date"
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Check-out Date"
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              fullWidth
              label="Total Price"
              type="number"
              value={formData.total_price}
              onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={createBookingMutation.isPending || updateBookingMutation.isPending}
          >
            {editingBooking ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
});

Bookings.displayName = 'Bookings';
