// Status color utilities
export const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'healthy':
    case 'active':
    case 'online':
    case 'connected':
    case 'loaded':
    case 'success':
    case 'completed':
    case 'confirmed':
      return 'success';
      
    case 'degraded':
    case 'warning':
    case 'pending':
    case 'loading':
    case 'partial':
      return 'warning';
      
    case 'error':
    case 'failed':
    case 'offline':
    case 'disconnected':
    case 'cancelled':
    case 'rejected':
      return 'error';
      
    default:
      return 'default';
  }
};

// Priority color utilities
export const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
  const normalizedPriority = priority.toLowerCase();
  
  switch (normalizedPriority) {
    case 'high':
    case 'critical':
    case 'urgent':
      return 'error';
      
    case 'medium':
    case 'normal':
      return 'warning';
      
    case 'low':
      return 'info';
      
    default:
      return 'default';
  }
};

// Booking status utilities
export const getBookingStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'confirmed':
    case 'checked-in':
      return 'success';
      
    case 'pending':
    case 'processing':
      return 'warning';
      
    case 'cancelled':
    case 'no-show':
      return 'error';
      
    case 'checked-out':
    case 'completed':
      return 'info';
      
    default:
      return 'default';
  }
};

// Room status utilities
export const getRoomStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'available':
    case 'clean':
      return 'success';
      
    case 'occupied':
    case 'maintenance':
      return 'warning';
      
    case 'out-of-order':
    case 'dirty':
      return 'error';
      
    default:
      return 'default';
  }
};
