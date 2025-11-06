export const environment = {
  production: true,
  apiUrl: 'https://api.carcommun.com/api',
  signalRUrl: 'https://api.carcommun.com',
  appName: 'CarCommun',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'ar'],
  enableDevTools: false,
  debugMode: false,
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