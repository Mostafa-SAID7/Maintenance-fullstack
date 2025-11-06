export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api',
  signalRUrl: 'https://localhost:5001',
  appName: 'CarCommun',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'ar'],
  enableDevTools: true,
  debugMode: true,
  cacheExpiryMinutes: 30,
  retryAttempts: 3,
  tokenExpiryDays: 7,
  debounceTimeMs: 300,
  uploadMaxSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maintenanceTypes: {
    ROUTINE: 'routine',
    REPAIR: 'repair',
    INSPECTION: 'inspection',
    EMERGENCY: 'emergency'
  }
};