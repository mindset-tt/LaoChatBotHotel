import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  useTheme,
  Paper,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Hotel
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '../../hooks/api'; // Use original hook with mock data support
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail, validateField } from '../../utils';
import { ROUTES } from '../../constants';
import type { LoginFormData, FormErrors } from '../../types';

/**
 * Modern Login Component
 * 
 * Provides user authentication with:
 * - Form validation
 * - Loading states
 * - Error handling
 * - Responsive design
 * - Accessibility features
 */

export const LoginModern: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();  const { login } = useAuth();
  const loginMutation = useLogin();

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await loginMutation.mutateAsync({
        username: formData.username,
        password: formData.password
      });

      // Create user object with proper role mapping for auth context
      const userRole = result.role || (formData.username.toLowerCase() === 'admin' ? 'admin' : 'user');
      const user = {
        id: result.user_id || result.id || '1',
        username: result.username || formData.username,
        email: result.email || `${formData.username}@hotel.com`,
        role: userRole as 'admin' | 'user' | 'guest',
      };

      // Update auth context with token and user data
      login(result.access_token || result.token || 'mock-token', user);
      
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({
        username: error.response?.data?.detail || error.message || 'Invalid username or password'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'white'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
              py: 4,
              textAlign: 'center'
            }}
          >
            <Hotel sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Hotel Management System
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Welcome back! Please sign in to your account
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              {/* General Error */}
              {loginMutation.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {loginMutation.error.message || 'Login failed. Please try again.'}
                </Alert>
              )}

              {/* Username Field */}
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={formData.username}
                onChange={handleInputChange('username')}
                error={!!errors.username}
                helperText={errors.username}
                disabled={isSubmitting}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LoginIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isSubmitting}
                sx={{
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  }
                }}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            {/* Demo Credentials */}
            <Box
              sx={{
                mt: 4,
                p: 3,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Typography variant="subtitle2" color="info.main" fontWeight="bold" gutterBottom>
                Demo Credentials:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Admin:</strong> admin / password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>User:</strong> user / password
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};
