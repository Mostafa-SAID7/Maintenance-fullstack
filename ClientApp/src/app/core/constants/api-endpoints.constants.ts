export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  
  // Car endpoints
  CARS: {
    BASE: '/api/cars',
    BY_ID: (id: number) => `/api/cars/${id}`,
    BY_USER: (userId: number) => `/api/users/${userId}/cars`,
    MAINTENANCE_RECORDS: (carId: number) => `/api/cars/${carId}/maintenance-records`,
    PREDICTIONS: (carId: number) => `/api/cars/${carId}/predictions`,
    EXPORT: (carId: number) => `/api/cars/${carId}/export`,
    IMPORT: '/api/cars/import'
  },
  
  // Maintenance endpoints
  MAINTENANCE: {
    BASE: '/api/maintenance',
    BY_ID: (id: number) => `/api/maintenance/${id}`,
    BY_CAR: (carId: number) => `/api/maintenance/car/${carId}`,
    UPCOMING: '/api/maintenance/upcoming',
    SCHEDULE: '/api/maintenance/schedule',
    EXPORT: '/api/maintenance/export',
    CALENDAR: '/api/maintenance/calendar'
  },
  
  // Owner endpoints
  OWNERS: {
    BASE: '/api/owners',
    BY_ID: (id: number) => `/api/owners/${id}`,
    CARS: (ownerId: number) => `/api/owners/${ownerId}/cars`,
    STATS: (ownerId: number) => `/api/owners/${ownerId}/stats`,
    EXPORT: '/api/owners/export'
  },
  
  // Service Types endpoints
  SERVICE_TYPES: {
    BASE: '/api/service-types',
    BY_ID: (id: number) => `/api/service-types/${id}`,
    MAINTENANCE_TYPES: '/api/service-types/maintenance-types'
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (id: number) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    SETTINGS: '/api/notifications/settings',
    REMINDERS: '/api/notifications/reminders'
  },
  
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    COST_ANALYSIS: '/api/analytics/costs',
    MAINTENANCE_TRENDS: '/api/analytics/trends',
    PREDICTIONS: '/api/analytics/predictions',
    COMPARISONS: '/api/analytics/comparisons',
    EXPORT: '/api/analytics/export'
  },
  
  // Reports endpoints
  REPORTS: {
    BASE: '/api/reports',
    GENERATE: '/api/reports/generate',
    DOWNLOAD: (id: string) => `/api/reports/${id}/download`,
    SCHEDULED: '/api/reports/scheduled'
  },
  
  // Documents endpoints
  DOCUMENTS: {
    BASE: '/api/documents',
    UPLOAD: '/api/documents/upload',
    DOWNLOAD: (id: number) => `/api/documents/${id}/download`,
    SHARE: (id: number) => `/api/documents/${id}/share`
  },
  
  // File upload endpoint
  UPLOAD: '/api/upload',
  
  // Health check
  HEALTH: '/api/health'
} as const;