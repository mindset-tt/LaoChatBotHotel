# 🎨 Hotel Management Frontend

A modern, responsive hotel management dashboard and AI chatbot interface built with React 19, TypeScript, and Vite.

## 🚀 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1+ | UI Framework |
| **TypeScript** | 5.8+ | Type Safety |
| **Vite** | 6.3+ | Build Tool & Dev Server |
| **Material-UI** | 7.1+ | UI Components |
| **React Router** | 7.6+ | Navigation |
| **TanStack Query** | 5.80+ | Data Fetching & Caching |
| **Axios** | 1.9+ | HTTP Client |
| **Emotion** | 11.14+ | CSS-in-JS Styling |

## ✨ Features

### 🏨 **Hotel Management Dashboard**
- **Room Management:** View, edit, and manage hotel rooms with real-time status updates
- **Booking System:** Create, modify, and cancel reservations
- **Analytics:** Revenue metrics, occupancy rates, and business insights
- **System Monitoring:** Health checks and performance metrics

### 🤖 **AI Chat Assistant**
- **Intelligent Responses:** AI-powered chatbot with hotel domain expertise
- **Multi-Modal Interface:** Text-based conversation with rich formatting
- **Guest Support:** Answer questions about amenities, policies, and services
- **Fallback Mode:** Demo mode when backend is unavailable

### 🎨 **User Experience**
- **Responsive Design:** Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Themes:** Toggle between themes for user preference
- **Real-Time Updates:** Live data synchronization across components
- **Error Boundaries:** Graceful error handling and recovery

## 🛠️ Development Setup

### Prerequisites
- **Node.js:** 18+ (recommended: latest LTS)
- **npm:** 9+ or **yarn:** 1.22+
- **Backend:** Running on `http://localhost:8000`

### Installation

```powershell
# Clone and navigate to frontend
cd frontend

# Install dependencies
npm install
# or
yarn install
```

### Development Commands

```powershell
# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── public/                    # Static assets
│   └── vite.svg
├── src/
│   ├── assets/               # Images and static resources
│   │   ├── fns-logo.png
│   │   └── react.svg
│   ├── components/           # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── PublicRoute.tsx
│   │   └── common/
│   ├── constants/            # Application constants
│   │   ├── appConfig.ts
│   │   ├── colors.tsx
│   │   └── index.ts
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── optimizedChatHooks.ts
│   │   ├── useAuth.ts
│   │   ├── mutations/        # Data mutation hooks
│   │   └── queries/          # Data fetching hooks
│   ├── layouts/              # Layout components
│   │   ├── footer/
│   │   ├── main-layout/
│   │   ├── navbar/
│   │   └── public-layout/
│   ├── pages/                # Page components
│   │   ├── analytics/        # Analytics dashboard
│   │   ├── bookings/         # Booking management
│   │   ├── dashboard/        # Main dashboard
│   │   ├── detail-chats/     # Chat history details
│   │   ├── hotel/            # Hotel management
│   │   ├── login/            # Authentication
│   │   ├── new-chats/        # AI chat interface
│   │   └── system/           # System monitoring
│   ├── routes/               # Route configuration
│   │   └── Routes.tsx
│   ├── theme/                # Material-UI theming
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   └── vite-env.d.ts         # Vite type definitions
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── eslint.config.js          # ESLint configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_DEBUG=false

# UI Configuration
VITE_APP_NAME="Hotel AI Assistant"
VITE_DEFAULT_THEME=light
```

### Backend Integration

The frontend communicates with the FastAPI backend through:

- **API Base URL:** `http://localhost:8000` (configurable via environment)
- **WebSocket:** Real-time updates (if implemented)
- **Authentication:** JWT token-based authentication
- **Error Handling:** Automatic retry and fallback mechanisms

### Supported API Endpoints

```typescript
// Chat API
POST /chatbot/ask/              // Send message to AI
GET /chatbot/history/           // Get chat history
GET /chatbot/sessions/          // List chat sessions

// Hotel Management
GET /rooms/                     // List rooms
POST /bookings/                 // Create booking
GET /analytics/                 // Get analytics data

// System
GET /system/health/             // Health check
GET /system/metrics/            // System metrics
```

## 🎨 Customization

### Theming

The application uses Material-UI's theming system. Customize colors, typography, and components:

```typescript
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  // ... additional theme configuration
});
```

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/routes/Routes.tsx`
3. Update navigation in `src/layouts/navbar/`

### API Integration

Use TanStack Query for data fetching:

```typescript
// src/hooks/queries/useRooms.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiClient.get('/rooms/').then(res => res.data),
    staleTime: 30000, // 30 seconds
  });
};
```

## 🧪 Testing

### Component Testing
```powershell
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### E2E Testing
```powershell
# Install Playwright (if needed)
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

## 🚀 Deployment

### Production Build
```powershell
# Build optimized production bundle
npm run build

# Serve production build locally
npm run preview
```

### Docker Deployment
```dockerfile
# Use the provided Dockerfile
docker build -t hotel-frontend .
docker run -p 80:80 hotel-frontend
```

### Environment-Specific Builds
```powershell
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

## 🔍 Troubleshooting

### Common Issues

**1. Backend Connection Errors**
- Ensure backend is running on `http://localhost:8000`
- Check `VITE_API_BASE_URL` environment variable
- Verify CORS settings in backend

**2. Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`
- Check TypeScript errors: `npm run type-check`

**3. Performance Issues**
- Enable React DevTools for component profiling
- Check bundle size: `npm run analyze`
- Optimize images and assets

### Debug Mode

Enable debug logging:
```env
VITE_ENABLE_DEBUG=true
```

View logs in browser console for detailed API interactions and component states.

## 📈 Performance Optimization

### Bundle Optimization
- Code splitting with React.lazy()
- Tree shaking for unused imports
- Image optimization and lazy loading
- Service worker for caching

### Runtime Performance
- React Query for efficient data caching
- Memoization for expensive calculations
- Virtual scrolling for large datasets
- Debounced search and input handlers

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Material-UI components when possible
- Write unit tests for new components
- Update documentation for new features
- Follow existing code style and patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for modern hotel management**