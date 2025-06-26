import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  MOCK_DATA_ENABLED,
  mockDashboardSummary,
  mockDashboardMetrics,
  mockBookings,
  mockRooms,
  mockChatHistory,
  mockChatSessions,
  mockChatInsights,
  mockBookingInsights,
  mockSystemMetrics,
  mockModelStatus,
  mockSystemHealth,
  mockAuthUser,
  mockNotifications,
  mockNotificationTemplates,
  mockConfig,
  mockBackupStatistics,
  mockChatHistoryFlat,
  mockChatHistoryGrouped,
  mockSystemMetricsExtended
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Client with interceptors for performance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Reduced timeout for faster fallback to mock data
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for performance monitoring
apiClient.interceptors.request.use((config) => {
  (config as any).metadata = { startTime: new Date() };
  return config;
});

// Response interceptor for caching and error handling
apiClient.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime.getTime() - (response.config as any).metadata.startTime.getTime();
    if (duration > 3000) {
      console.warn(`Slow API call: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// Helper function to handle API calls with mock fallback
const apiCallWithFallback = async <T>(
  apiCall: () => Promise<T>,
  mockData: T,
  endpoint: string
): Promise<T> => {
  if (MOCK_DATA_ENABLED) {
    console.log(`🎭 Using mock data for ${endpoint}`);
    return mockData;
  }

  try {
    return await apiCall();
  } catch (error) {
    console.warn(`⚠️ API call failed for ${endpoint}, falling back to mock data:`, error);
    return mockData;
  }
};

// Authentication hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Login attempt', { username });
        if (username === 'admin' && password === 'password') {
          return {
            ...mockAuthUser,
            role: 'admin',
            user_id: '1',
            email: 'admin@hotel.com'
          };
        } else if (username === 'user' && password === 'password') {
          return {
            ...mockAuthUser,
            username: 'user',
            role: 'user',
            user_id: '2',
            email: 'user@hotel.com'
          };
        }
        throw new Error('Invalid credentials');
      }
      
      const response = await apiClient.post('/auth/login/', { username, password });
      return response.data;
    },
  });
};

// Notification hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/api/notifications/my-notifications');
          return response.data;
        },
        mockNotifications,
        'notifications'
      );
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Marking notification as read', notificationId);
        return { success: true, message: 'Notification marked as read' };
      }
      
      const response = await apiClient.post(`/api/notifications/mark-read/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useSendEmail = () => {
  return useMutation({
    mutationFn: async ({ to_email, subject, body, to_name, html_body }: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Sending email', { to_email, subject });
        return { success: true, message: 'Email sent successfully' };
      }
      
      const response = await apiClient.post('/api/notifications/send-email', {
        to_email, subject, body, to_name, html_body
      });
      return response.data;
    },
  });
};

export const useSystemAlert = () => {
  return useMutation({
    mutationFn: async ({ alert_type, alert_details, severity, admin_emails }: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Sending system alert', { alert_type, severity });
        return { success: true, message: 'System alert sent successfully' };
      }
      
      const response = await apiClient.post('/api/notifications/system-alert', {
        alert_type, alert_details, severity, admin_emails
      });
      return response.data;
    },
  });
};

export const useNotificationTemplates = () => {
  return useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/api/notifications/templates');
          return response.data;
        },
        mockNotificationTemplates,
        'notification-templates'
      );
    },
    staleTime: 300000,
    retry: false,
  });
};

// Configuration hooks
export const useConfig = () => {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/config/');
          return response.data;
        },
        mockConfig,
        'config'
      );
    },
    staleTime: 300000,
    retry: false,
  });
};

export const useUpdateThresholds = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (thresholds: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Updating thresholds', thresholds);
        return { success: true, message: 'Thresholds updated successfully' };
      }
      
      const response = await apiClient.put('/config/thresholds/', thresholds);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });
};

export const useBookingKeywords = () => {
  return useQuery({
    queryKey: ['config', 'booking-keywords'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/config/keywords/');
          return response.data;
        },
        mockConfig.booking_keywords,
        'config/keywords'
      );
    },
    staleTime: 300000,
    retry: false,
  });
};

export const useAddBookingKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ keyword, intent }: { keyword: string; intent: string }) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Adding booking keyword', { keyword, intent });
        return { success: true, message: 'Keyword added successfully' };
      }
      
      const response = await apiClient.post('/config/keywords/booking/', { keyword, intent });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'booking-keywords'] });
    },
  });
};

// Backup/Export hooks
export const useBackupStatistics = () => {
  return useQuery({
    queryKey: ['backup', 'statistics'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/backup/statistics/');
          return response.data;
        },
        mockBackupStatistics,
        'backup/statistics'
      );
    },
    staleTime: 60000,
    retry: false,
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Creating database backup');
        return { success: true, message: 'Backup created successfully', backup_id: 'backup_' + Date.now() };
      }
      
      const response = await apiClient.post('/backup/database/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup', 'statistics'] });
    },
  });
};

// History hooks (expanded)
export const useChatHistoryFlat = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ['chat', 'history', 'flat', { page, limit }],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get(`/history/all?page=${page}&limit=${limit}`);
          return response.data;
        },
        mockChatHistoryFlat.slice((page - 1) * limit, page * limit),
        'history/all'
      );
    },
    staleTime: 30000,
    retry: false,
  });
};

export const useChatHistoryGrouped = () => {
  return useQuery({
    queryKey: ['chat', 'history', 'grouped'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/history/allContent');
          return response.data;
        },
        mockChatHistoryGrouped,
        'history/allContent'
      );
    },
    staleTime: 30000,
    retry: false,
  });
};

export const useSessionHistory = (sessionId: string) => {
  return useQuery({
    queryKey: ['chat', 'history', 'session', sessionId],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get(`/history/${sessionId}`);
          return response.data;
        },
        mockChatHistoryGrouped[sessionId] || [],
        `history/${sessionId}`
      );
    },
    staleTime: 30000,
    retry: false,
    enabled: !!sessionId,
  });
};

// Enhanced System hooks
export const useSystemMetricsDetailed = () => {
  return useQuery({
    queryKey: ['system', 'metrics', 'detailed'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/system/metrics/');
          return response.data;
        },
        mockSystemMetricsExtended,
        'system/metrics/detailed'
      );
    },
    staleTime: 10000,
    refetchInterval: 15000,
    retry: false,
  });
};

export const useGpuStatus = () => {
  return useQuery({
    queryKey: ['system', 'gpu-status'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/system/gpu_status/');
          return response.data;
        },
        {
          gpu_available: true,
          gpu_count: 1,
          gpu_memory_total: 8192,
          gpu_memory_used: 3500,
          gpu_utilization: 45.2,
          gpu_temperature: 72
        },
        'system/gpu_status'
      );
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
};

// Model management hooks
export const useModelConfig = () => {
  return useQuery({
    queryKey: ['models', 'config'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/models/config/');
          return response.data;
        },
        {
          model_name: "sailor2-1b-vangvieng-finetuned",
          model_path: "./models/checkpoints/sailor2-1b-vangvieng-finetuned/best-checkpoint",
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
          context_length: 4096
        },
        'models/config'
      );
    },
    staleTime: 300000,
    retry: false,
  });
};

export const useModelMemory = () => {
  return useQuery({
    queryKey: ['models', 'memory'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/models/memory/');
          return response.data;
        },
        {
          total_memory_mb: 8192,
          used_memory_mb: 3500,
          available_memory_mb: 4692,
          model_memory_mb: 2800,
          cache_memory_mb: 700
        },
        'models/memory'
      );
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
};

export const useModelCleanup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Cleaning up models');
        return { success: true, message: 'Model cleanup completed' };
      }
      
      const response = await apiClient.post('/models/cleanup/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['system'] });
    },
  });
};

// Room management hooks (enhanced)
export const useAvailableRooms = () => {
  return useQuery({
    queryKey: ['rooms', 'available'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/rooms/available/');
          return response.data;
        },
        mockRooms.filter(room => room.is_available).map(room => room.room_number),
        'rooms/available'
      );
    },
    staleTime: 60000,
    retry: false,
  });
};

export const useRoomStatus = (roomNumber: string) => {
  return useQuery({
    queryKey: ['rooms', 'status', roomNumber],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get(`/rooms/status/${roomNumber}`);
          return response.data;
        },
        mockRooms.find(room => room.room_number === roomNumber) || mockRooms[0],
        `rooms/status/${roomNumber}`
      );
    },
    staleTime: 60000,
    retry: false,
    enabled: !!roomNumber,
  });
};

// Dashboard hooks
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/api/dashboard/summary');
          return response.data;
        },
        mockDashboardSummary,
        'dashboard/summary'
      );
    },
    staleTime: 30000,
    refetchInterval: 30000,
    retry: false,
  });
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/api/dashboard/metrics');
          return response.data;
        },
        mockDashboardMetrics,
        'dashboard/metrics'
      );
    },
    staleTime: 30000,
    refetchInterval: 30000,
    retry: false,
  });
};

// Bookings hooks
export const useBookings = (
  page: number = 1,
  limit: number = 10,
  filters: Record<string, any> = {}
) => {
  return useQuery({
    queryKey: ['bookings', { page, limit, filters }],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...Object.fromEntries(
              Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
            ),
          });
          
          const response = await apiClient.get(`/bookings/?${params}`);
          return response.data;
        },
        {
          ...mockBookings,
          data: mockBookings.data.slice((page - 1) * limit, page * limit)
        },
        'bookings'
      );
    },
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingData: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Creating booking', bookingData);
        return { success: true, message: 'Booking created successfully', id: Date.now() };
      }
      
      const response = await apiClient.post('/bookings/', bookingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...bookingData }: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Updating booking', id, bookingData);
        return { success: true, message: 'Booking updated successfully' };
      }
      
      const response = await apiClient.put(`/bookings/${id}`, bookingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string | number) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Deleting booking', id);
        return { success: true, message: 'Booking deleted successfully' };
      }
      
      const response = await apiClient.delete(`/bookings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Rooms hooks
export const useRooms = (available?: boolean) => {
  return useQuery({
    queryKey: ['rooms', { available }],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const params = available !== undefined ? `?available=${available}` : '';
          const response = await apiClient.get(`/rooms/${params}`);
          return response.data;
        },
        available !== undefined 
          ? mockRooms.filter(room => room.is_available === available)
          : mockRooms,
        'rooms'
      );
    },
    staleTime: 60000,
    retry: false,
  });
};

export const useRoom = (id: string | number) => {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get(`/rooms/${id}`);
          return response.data;
        },
        mockRooms.find(room => room.id === Number(id)) || mockRooms[0],
        `rooms/${id}`
      );
    },
    staleTime: 60000,
    retry: false,
    enabled: !!id,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roomData: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Creating room', roomData);
        return { success: true, message: 'Room created successfully', id: Date.now() };
      }
      
      const response = await apiClient.post('/rooms/', roomData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...roomData }: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Updating room', id, roomData);
        return { success: true, message: 'Room updated successfully' };
      }
      
      const response = await apiClient.put(`/rooms/${id}`, roomData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string | number) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Deleting room', id);
        return { success: true, message: 'Room deleted successfully' };
      }
      
      const response = await apiClient.delete(`/rooms/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Chat hooks
export const useChatHistory = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ['chat', 'history', { page, limit }],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get(`/chat/history?page=${page}&limit=${limit}`);
          return response.data;
        },
        {
          data: mockChatHistory.slice((page - 1) * limit, page * limit),
          total: mockChatHistory.length,
          page,
          limit
        },
        'chat/history'
      );
    },
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
};

export const useChatSessions = () => {
  return useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/chat/sessions');
          return response.data;
        },
        mockChatSessions,
        'chat/sessions'
      );
    },
    staleTime: 30000,
    retry: false,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId?: string }) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Sending message', { message, sessionId });
        return {
          id: `msg_${Date.now()}`,
          content: "This is a mock response from the AI assistant.",
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          session_id: sessionId || 'mock_session'
        };
      }
      
      const response = await apiClient.post('/chat/send', { message, session_id: sessionId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    },
  });
};

// Analytics hooks
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/api/analytics/overview');
          return response.data;
        },
        { chat_insights: mockChatInsights, booking_insights: mockBookingInsights },
        'analytics/overview'
      );
    },
    staleTime: 60000,
    refetchInterval: 300000,
    retry: false,
  });
};

export const useChatInsights = (days: number) => {
  return useQuery({
    queryKey: ['analytics', 'chat-insights'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/analytics/chat-insights/');
          return response.data;
        },
        mockChatInsights,
        'analytics/chat-insights'
      );
    },
    staleTime: 60000,
    refetchInterval: 300000,
    retry: false,
  });
};

export const useBookingInsights = () => {
  return useQuery({
    queryKey: ['analytics', 'booking-insights'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/analytics/booking-insights/');
          return response.data;
        },
        mockBookingInsights,
        'analytics/booking-insights'
      );
    },
    staleTime: 60000,
    refetchInterval: 300000,
    retry: false,
  });
};

// System Management hooks
export const useSystemMetrics = () => {
  return useQuery({
    queryKey: ['system', 'metrics'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/system/metrics/');
          return response.data;
        },
        mockSystemMetrics,
        'system/metrics'
      );
    },
    staleTime: 10000,
    refetchInterval: 15000,
    retry: false,
  });
};

export const useModelStatus = () => {
  return useQuery({
    queryKey: ['system', 'model-status'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/models/status/');
          return response.data;
        },
        mockModelStatus,
        'models/status'
      );
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      return await apiCallWithFallback(
        async () => {
          const response = await apiClient.get('/system/health/');
          return response.data;
        },
        mockSystemHealth,
        'system/health'
      );
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
};

// System control mutations
export const useSystemCleanup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: System cleanup');
        return { success: true, message: 'System cleanup completed' };
      }
      
      const response = await apiClient.post('/system/cleanup/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system'] });
    },
  });
};

export const useSystemRestart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: System restart');
        return { success: true, message: 'System restart initiated' };
      }
      
      const response = await apiClient.post('/system/restart/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system'] });
    },
  });
};

export const useReloadModels = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Reloading models');
        return { success: true, message: 'Models reloaded successfully' };
      }
      
      const response = await apiClient.post('/models/reload/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['system'] });
    },
  });
};

// Export utilities
export const useExportData = () => {
  return useMutation({
    mutationFn: async ({ type, format }: { type: 'chat' | 'bookings'; format: 'json' | 'csv' }) => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Exporting data', { type, format });
        const data = type === 'chat' ? mockChatHistory : mockBookings.data;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_export_mock_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true };
      }

      const endpoint = type === 'chat' 
        ? `/backup/chat-history/export/?format=${format}`
        : `/backup/bookings/export/?format=${format}`;
      
      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
  });
};