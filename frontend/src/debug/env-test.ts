// Environment Variable Debug Test
console.log('=== Environment Variables Debug ===');
console.log('VITE_MOCK_DATA_ENABLED:', import.meta.env.VITE_MOCK_DATA_ENABLED);
console.log('DEV mode:', import.meta.env.DEV);
console.log('Combined result:', import.meta.env.VITE_MOCK_DATA_ENABLED === 'true' || import.meta.env.DEV);

// Check all environment variables
console.log('All env vars:', import.meta.env);
