// Mock data for all APIs
export const MOCK_DATA_ENABLED = import.meta.env.VITE_MOCK_DATA_ENABLED === 'true' || process.env.NODE_ENV === 'development';

// Auth mock data
export const mockAuthUser = {
  access_token: "mock_token_" + Date.now(),
  token_type: "bearer",
  username: "admin",
  expires_in: 3600
};

// Notifications mock data
export const mockNotifications = [
  {
    id: 1,
    title: "New Booking",
    message: "A new booking has been created for Room 101",
    notification_type: "info",
    action_url: "/bookings/1",
    created_at: "2025-06-26T10:30:00Z",
    read: false
  },
  {
    id: 2,
    title: "System Alert",
    message: "High CPU usage detected",
    notification_type: "warning",
    action_url: "/system",
    created_at: "2025-06-26T09:15:00Z",
    read: true
  },
  {
    id: 3,
    title: "Chat Activity",
    message: "Unusual chat activity pattern detected",
    notification_type: "info",
    action_url: "/analytics",
    created_at: "2025-06-26T08:45:00Z",
    read: false
  }
];

export const mockNotificationTemplates = [
  {
    id: 1,
    name: "Booking Confirmation",
    subject: "Your booking has been confirmed",
    body: "Dear {guest_name}, your booking for {room_type} from {check_in} to {check_out} has been confirmed.",
    type: "email"
  },
  {
    id: 2,
    name: "System Alert",
    subject: "System Alert: {alert_type}",
    body: "A system alert has been triggered: {alert_details}",
    type: "system"
  }
];

// Config mock data
export const mockConfig = {
  chat_thresholds: {
    response_time_warning: 2000,
    session_timeout: 1800,
    max_concurrent_sessions: 100
  },
  booking_keywords: {
    intent_keywords: ["book", "reserve", "room", "stay", "check-in"],
    room_type_keywords: {
      "standard": ["standard", "basic", "regular"],
      "deluxe": ["deluxe", "premium", "upgraded"],
      "suite": ["suite", "luxury", "executive"]
    }
  },
  system_settings: {
    maintenance_mode: false,
    debug_mode: false,
    auto_backup: true,
    backup_interval_hours: 24
  }
};

// Backup/Export mock data
export const mockBackupStatistics = {
  last_backup: "2025-06-26T02:00:00Z",
  backup_size_mb: 156.7,
  total_backups: 30,
  backup_retention_days: 30,
  next_scheduled_backup: "2025-06-27T02:00:00Z",
  backup_status: "completed",
  chat_records_count: 1250,
  booking_records_count: 456,
  room_records_count: 50
};

// History mock data (expanded)
export const mockChatHistoryFlat = [
  {
    id: "msg_001",
    session_id: "session_123",
    content: "Hello, I'd like to book a room",
    role: "user",
    timestamp: "2025-06-26T10:30:00Z",
    guest_name: "John Smith"
  },
  {
    id: "msg_002", 
    session_id: "session_123",
    content: "I'd be happy to help you book a room. What dates are you looking for?",
    role: "assistant",
    timestamp: "2025-06-26T10:30:15Z",
    guest_name: "John Smith"
  },
  {
    id: "msg_003",
    session_id: "session_124",
    content: "What time is checkout?",
    role: "user", 
    timestamp: "2025-06-26T11:00:00Z",
    guest_name: "Sarah Johnson"
  },
  {
    id: "msg_004",
    session_id: "session_124",
    content: "Checkout time is 11:00 AM. Would you like to arrange a late checkout?",
    role: "assistant",
    timestamp: "2025-06-26T11:00:05Z",
    guest_name: "Sarah Johnson"
  }
];

export const mockChatHistoryGrouped = {
  "session_123": [
    {
      id: "msg_001",
      content: "Hello, I'd like to book a room",
      role: "user",
      timestamp: "2025-06-26T10:30:00Z"
    },
    {
      id: "msg_002",
      content: "I'd be happy to help you book a room. What dates are you looking for?", 
      role: "assistant",
      timestamp: "2025-06-26T10:30:15Z"
    }
  ],
  "session_124": [
    {
      id: "msg_003",
      content: "What time is checkout?",
      role: "user",
      timestamp: "2025-06-26T11:00:00Z"
    },
    {
      id: "msg_004",
      content: "Checkout time is 11:00 AM. Would you like to arrange a late checkout?",
      role: "assistant",
      timestamp: "2025-06-26T11:00:05Z"
    }
  ]
};

// Enhanced room details
export const mockRoomDetails = [
  {
    id: 1,
    room_number: "101",
    room_type: "Deluxe Suite",
    floor: 1,
    max_guests: 4,
    price_per_night: 225.00,
    amenities: ["WiFi", "TV", "Mini Bar", "Balcony", "Ocean View"],
    status: "occupied",
    is_available: false,
    last_cleaned: "2025-06-26T08:00:00Z",
    maintenance_status: "good",
    description: "Spacious suite with ocean view and private balcony",
    images: ["room_101_1.jpg", "room_101_2.jpg"],
    booking_history: [
      {
        guest_name: "John Smith",
        check_in: "2025-06-26",
        check_out: "2025-06-28",
        status: "current"
      }
    ]
  }
];

// System metrics (enhanced)
export const mockSystemMetricsExtended = {
  cpu_usage: 35.5,
  memory_usage: 62.3,
  disk_usage: 78.1,
  network_io: 12.4,
  gpu_usage: 45.2,
  gpu_memory: 6.8,
  gpu_temperature: 72,
  system_temperature: 65,
  running_processes: 156,
  database_connections: 12,
  active_chat_sessions: 8,
  queue_length: 3,
  error_rate_last_hour: 0.02,
  response_time_avg: 145,
  uptime_seconds: 864000
};

// Dashboard mock data
export const mockDashboardSummary = {
  current_occupancy: {
    total_rooms: 50,
    occupied_rooms: 32,
    available_rooms: 18,
    occupancy_rate: 64.0,
    maintenance_rooms: 2
  },
  today_stats: {
    check_ins: 8,
    check_outs: 5,
    new_bookings: 12,
    revenue: 24500.00,
    cancellations: 2
  },
  recent_bookings: [
    {
      id: 1,
      guest_name: "John Smith",
      room_number: "101",
      room_type: "Deluxe Suite",
      check_in_date: "2025-06-26",
      check_out_date: "2025-06-28",
      status: "confirmed",
      total_amount: 450.00,
      created_at: "2025-06-26T10:30:00Z"
    },
    {
      id: 2,
      guest_name: "Sarah Johnson",
      room_number: "205",
      room_type: "Standard Room",
      check_in_date: "2025-06-27",
      check_out_date: "2025-06-29",
      status: "checked_in",
      total_amount: 280.00,
      created_at: "2025-06-26T09:15:00Z"
    },
    {
      id: 3,
      guest_name: "Mike Wilson",
      room_number: "312",
      room_type: "Executive Suite",
      check_in_date: "2025-06-28",
      check_out_date: "2025-07-01",
      status: "pending",
      total_amount: 720.00,
      created_at: "2025-06-26T08:45:00Z"
    }
  ],
  recent_chats: [
    {
      id: "chat_001",
      guest_name: "Emily Davis",
      last_message: "Thank you for helping me with the room service order!",
      timestamp: "2025-06-26T11:20:00Z",
      session_id: "session_123",
      status: "resolved"
    },
    {
      id: "chat_002",
      guest_name: "Robert Brown",
      last_message: "What time is checkout?",
      timestamp: "2025-06-26T10:55:00Z",
      session_id: "session_124",
      status: "active"
    }
  ],
  system_health: {
    api_status: "healthy",
    database_status: "healthy",
    ai_models_status: "loaded",
    cache_status: "healthy",
    uptime_seconds: 86400,
    response_time_ms: 45
  },
  cache_stats: {
    hit_rate: 0.85,
    total_requests: 1250,
    cache_size_mb: 128
  }
};

export const mockDashboardMetrics = {
  performance: {
    avg_response_time: 150,
    error_rate: 0.02,
    requests_per_minute: 45,
    active_sessions: 28
  },
  resources: {
    cpu_usage: 35.5,
    memory_usage: 62.3,
    disk_usage: 78.1,
    network_io: 12.4
  }
};

// Bookings mock data
export const mockBookings = {
  total: 156,
  pages: 16,
  current_page: 1,
  data: [
    {
      id: 1,
      guest_name: "Alice Cooper",
      guest_email: "alice@example.com",
      guest_phone: "+1234567890",
      room_id: 1,
      room_number: "101",
      room_type: "Deluxe Suite",
      check_in_date: "2025-06-26",
      check_out_date: "2025-06-28",
      nights: 2,
      guests: 2,
      status: "confirmed",
      total_price: 450.00,
      payment_status: "paid",
      booking_source: "website",
      special_requests: "Late checkout",
      created_at: "2025-06-25T14:30:00Z",
      updated_at: "2025-06-25T14:30:00Z"
    },
    {
      id: 2,
      guest_name: "Bob Johnson",
      guest_email: "bob@example.com", 
      guest_phone: "+1234567891",
      room_id: 2,
      room_number: "205",
      room_type: "Standard Room",
      check_in_date: "2025-06-27",
      check_out_date: "2025-06-30",
      nights: 3,
      guests: 1,
      status: "checked_in",
      total_price: 420.00,
      payment_status: "paid",
      booking_source: "phone",
      special_requests: "Ground floor",
      created_at: "2025-06-24T09:15:00Z",
      updated_at: "2025-06-27T15:00:00Z"
    },
    {
      id: 3,
      guest_name: "Carol White",
      email: "carol@example.com",
      phone: "+1234567892",
      room_number: "312",
      room_type: "Executive Suite",
      check_in_date: "2025-06-28",
      check_out_date: "2025-07-02",
      nights: 4,
      guests: 3,
      status: "pending",
      total_amount: 960.00,
      payment_status: "pending",
      booking_source: "booking.com",
      special_requests: "Extra bed, ocean view",
      created_at: "2025-06-23T16:45:00Z",
      updated_at: "2025-06-23T16:45:00Z"
    }
  ]
};

// Rooms mock data
export const mockRooms = [
  {
    id: 1,
    room_number: "101",
    room_type: "Deluxe Suite",
    floor: 1,
    max_guests: 4,
    price_per_night: 225.00,
    amenities: ["WiFi", "TV", "Mini Bar", "Balcony", "Ocean View"],
    status: "occupied",
    is_available: false,
    last_cleaned: "2025-06-26T08:00:00Z",
    maintenance_status: "good"
  },
  {
    id: 2,
    room_number: "102",
    room_type: "Standard Room",
    floor: 1,
    max_guests: 2,
    price_per_night: 140.00,
    amenities: ["WiFi", "TV", "Mini Fridge"],
    status: "available",
    is_available: true,
    last_cleaned: "2025-06-26T09:30:00Z",
    maintenance_status: "good"
  },
  {
    id: 3,
    room_number: "205",
    room_type: "Standard Room",
    floor: 2,
    max_guests: 2,
    price_per_night: 140.00,
    amenities: ["WiFi", "TV", "Mini Fridge"],
    status: "occupied",
    is_available: false,
    last_cleaned: "2025-06-25T10:00:00Z",
    maintenance_status: "good"
  },
  {
    id: 4,
    room_number: "301",
    room_type: "Executive Suite",
    floor: 3,
    max_guests: 6,
    price_per_night: 350.00,
    amenities: ["WiFi", "TV", "Mini Bar", "Kitchenette", "Living Room", "City View"],
    status: "maintenance",
    is_available: false,
    last_cleaned: "2025-06-24T14:00:00Z",
    maintenance_status: "under_repair"
  }
];

// Chat/History mock data
export const mockChatHistory = [
  {
    id: "msg_001",
    session_id: "session_123",
    content: "Hello! I'd like to know about room service options.",
    sender: "user",
    timestamp: "2025-06-26T10:15:00Z",
    guest_name: "John Smith"
  },
  {
    id: "msg_002", 
    session_id: "session_123",
    content: "Hello! I'd be happy to help you with our room service options. We offer 24/7 room service with a variety of dining options including breakfast, lunch, dinner, and snacks. Would you like me to share our current menu?",
    sender: "assistant",
    timestamp: "2025-06-26T10:15:30Z",
    guest_name: "John Smith"
  },
  {
    id: "msg_003",
    session_id: "session_123", 
    content: "Yes, please share the breakfast menu.",
    sender: "user",
    timestamp: "2025-06-26T10:16:00Z",
    guest_name: "John Smith"
  }
];

export const mockChatSessions = [
  {
    id: "session_123",
    title: "Room Service Inquiry",
    guest_name: "John Smith",
    room_number: "101",
    created_at: "2025-06-26T10:15:00Z",
    updated_at: "2025-06-26T10:20:00Z",
    status: "active",
    message_count: 6
  },
  {
    id: "session_124",
    title: "Checkout Information",
    guest_name: "Sarah Johnson", 
    room_number: "205",
    created_at: "2025-06-26T09:30:00Z",
    updated_at: "2025-06-26T09:35:00Z",
    status: "resolved",
    message_count: 4
  }
];

// Analytics mock data
export const mockChatInsights = {
  daily_stats: [
    {
      date: "2025-06-20",
      total_messages: 45,
      user_messages: 23,
      bot_messages: 22
    },
    {
      date: "2025-06-21", 
      total_messages: 52,
      user_messages: 26,
      bot_messages: 26
    },
    {
      date: "2025-06-22",
      total_messages: 38,
      user_messages: 19,
      bot_messages: 19
    },
    {
      date: "2025-06-23",
      total_messages: 61,
      user_messages: 31,
      bot_messages: 30
    },
    {
      date: "2025-06-24",
      total_messages: 48,
      user_messages: 24,
      bot_messages: 24
    },
    {
      date: "2025-06-25",
      total_messages: 55,
      user_messages: 28,
      bot_messages: 27
    },
    {
      date: "2025-06-26",
      total_messages: 42,
      user_messages: 21,
      bot_messages: 21
    }
  ],
  avg_session_duration: 8.5,
  total_sessions: 124,
  avg_messages_per_session: 4.2,
  peak_hours: [
    { hour: 14, message_count: 28 },
    { hour: 20, message_count: 25 },
    { hour: 10, message_count: 22 },
    { hour: 16, message_count: 20 },
    { hour: 11, message_count: 18 }
  ]
};

export const mockBookingInsights = {
  occupancy_rate: 64.0,
  total_revenue: 125000.00,
  avg_daily_rate: 186.50,
  total_bookings: 89,
  cancellation_rate: 0.08,
  avg_length_of_stay: 2.3,
  revenue_by_room_type: [
    { room_type: "Executive Suite", revenue: 52000.00, bookings: 18 },
    { room_type: "Deluxe Suite", revenue: 45000.00, bookings: 35 },
    { room_type: "Standard Room", revenue: 28000.00, bookings: 36 }
  ],
  monthly_trends: [
    { month: "2025-01", occupancy: 58.2, revenue: 98000 },
    { month: "2025-02", occupancy: 62.1, revenue: 105000 },
    { month: "2025-03", occupancy: 55.8, revenue: 89000 },
    { month: "2025-04", occupancy: 69.3, revenue: 118000 },
    { month: "2025-05", occupancy: 71.5, revenue: 125000 },
    { month: "2025-06", occupancy: 64.0, revenue: 98500 }
  ]
};

// System Management mock data
export const mockSystemMetrics = {
  cpu_percent: 45.2,
  memory_usage: {
    percent: 68.5,
    available_gb: 12.8,
    total_gb: 32.0
  },
  disk_usage: {
    percent: 74.2,
    free_gb: 128.5,
    total_gb: 500.0,
    used_gb: 371.5
  },
  network: {
    bytes_sent: 1250000000,
    bytes_recv: 980000000,
    packets_sent: 125000,
    packets_recv: 98000
  },
  process_count: 145,
  boot_time: "2025-06-20T08:00:00Z"
};

export const mockModelStatus = {
  models_loaded: true,
  retriever_loaded: true,
  generator_loaded: true,
  tokenizer_loaded: true,
  rag_chunks_count: 2547,
  device: "cuda:0",
  model_info: {
    model_name: "sailor2-1b-vangvieng-finetuned",
    model_size: "1.2GB",
    last_loaded: "2025-06-26T08:15:00Z",
    inference_time_avg: 0.85
  }
};

export const mockSystemHealth = {
  status: "healthy",
  uptime: 518400, // 6 days in seconds
  services: {
    api: { status: "healthy", response_time: 45 },
    database: { status: "healthy", connections: 8 },
    ai_models: { status: "loaded", memory_usage: 2.1 },
    cache: { status: "healthy", hit_rate: 0.87 }
  },
  last_check: "2025-06-26T12:00:00Z"
};
