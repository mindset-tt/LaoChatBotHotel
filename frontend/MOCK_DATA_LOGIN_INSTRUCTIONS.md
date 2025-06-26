# Mock Data Login Instructions

## Current Status
Your mock data setup is correctly configured and should be working. Here's what you need to know:

## Environment Configuration ✅
- `.env` file has `VITE_MOCK_DATA_ENABLED=true` ✅
- Mock data constant is properly configured ✅
- Login hook includes mock data logic ✅

## Mock Login Credentials
To use the mock data, you must use these exact credentials:

### Admin Access
- **Username:** `admin`
- **Password:** `password`

### Regular User Access  
- **Username:** `user`
- **Password:** `password`

## How It Works
1. When `VITE_MOCK_DATA_ENABLED=true` in your `.env` file
2. The app checks the username and password against the hardcoded mock credentials
3. If they match, it returns mock user data instead of calling the real API
4. You'll see a console log `🎭 Mock: Login attempt` when mock mode is active

## Troubleshooting
If mock data isn't working:

1. **Check Console Logs:** Look for `🎭 Mock: Login attempt` in the browser console
2. **Verify Credentials:** Make sure you're using exactly `admin`/`password` or `user`/`password`
3. **Restart Dev Server:** After changing `.env` files, restart with `npm run dev`
4. **Check Browser:** Open Developer Tools → Console to see mock data logs

## Test Steps
1. Go to http://localhost:5173/
2. Navigate to login page
3. Enter: Username: `admin`, Password: `password`
4. Check browser console for mock data logs
5. Should login successfully with mock data

## Real API vs Mock Data
- **Mock Mode:** When `VITE_MOCK_DATA_ENABLED=true`
- **Real API Mode:** When `VITE_MOCK_DATA_ENABLED=false` or not set

The mock system automatically falls back to mock data even if the real API fails, providing a robust development experience.
