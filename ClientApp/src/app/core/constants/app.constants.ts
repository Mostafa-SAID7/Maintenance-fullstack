export const APP_CONSTANTS = {
  APP_NAME: 'CarCommun',
  APP_VERSION: '1.0.0',
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'ar'],
  TOKEN_EXPIRY_DAYS: 7,
  CACHE_EXPIRY_MINUTES: 30,
  DEBOUNCE_TIME_MS: 300,
  RETRY_ATTEMPTS: 3,
  UPLOAD_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAINTENANCE_TYPES: {
    ROUTINE: 'routine',
    REPAIR: 'repair',
    INSPECTION: 'inspection',
    EMERGENCY: 'emergency'
  }
} as const;