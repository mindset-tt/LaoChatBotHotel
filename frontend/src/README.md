# Frontend Architecture Documentation

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Cards, Loading states, etc.)
│   ├── ErrorBoundary.tsx
│   ├── ProtectedRoute.tsx
│   └── PublicRoute.tsx
├── contexts/           # React contexts for global state
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   ├── api.ts         # API-related hooks
│   ├── mutations/     # React Query mutation hooks
│   └── queries/       # React Query query hooks
├── layouts/           # Layout components
│   ├── main-layout/   # Authenticated user layout
│   └── public-layout/ # Public/guest layout
├── pages/             # Page components (route destinations)
│   ├── analytics/
│   ├── bookings/
│   ├── dashboard/
│   ├── login/
│   └── ...
├── routes/            # Routing configuration
├── theme/             # Material-UI theme configuration
├── utils/             # Utility functions
└── constants/         # Application constants
```

## 🏗️ Architecture Principles

### Component Organization
- **Pages**: Top-level route components
- **Layouts**: Wrapper components for consistent page structure
- **Components**: Reusable UI elements
- **Hooks**: Business logic and state management
- **Utils**: Pure utility functions

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useUserData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### File Exports
- Use named exports for better tree-shaking
- Create index files for clean imports
- Separate concerns into focused files

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow React best practices (hooks, memo, etc.)
- Use Material-UI design system consistently

### Performance
- Lazy load pages with React.lazy()
- Use React.memo() for expensive components
- Implement proper loading states
- Cache API responses with React Query

### Testing
- Write unit tests for utilities
- Test components with React Testing Library
- Mock API calls in tests
- Test user interactions and edge cases
