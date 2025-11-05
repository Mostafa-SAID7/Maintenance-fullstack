export const STORAGE_KEYS = {
  // Authentication keys
  AUTH_TOKEN: 'carcomm_auth_token',
  REFRESH_TOKEN: 'carcomm_refresh_token',
  USER_PROFILE: 'carcomm_user_profile',
  TOKEN_EXPIRY: 'carcomm_token_expiry',
  
  // App state keys
  USER_PREFERENCES: 'carcomm_user_preferences',
  THEME_PREFERENCE: 'carcomm_theme',
  LANGUAGE_PREFERENCE: 'carcomm_language',
  SIDEBAR_STATE: 'carcomm_sidebar_state',
  
  // Cache keys
  API_CACHE: 'carcomm_api_cache',
  CARS_CACHE: 'carcomm_cars_cache',
  MAINTENANCE_CACHE: 'carcomm_maintenance_cache',
  NOTIFICATIONS_CACHE: 'carcomm_notifications_cache',
  
  // Form data keys
  CAR_FORM_DRAFT: 'carcomm_car_form_draft',
  MAINTENANCE_FORM_DRAFT: 'carcomm_maintenance_form_draft',
  OWNER_FORM_DRAFT: 'carcomm_owner_form_draft',
  
  // Feature flags
  FEATURE_FLAGS: 'carcomm_feature_flags',
  
  // Session keys
  SESSION_ID: 'carcomm_session_id',
  LAST_ACTIVITY: 'carcomm_last_activity',
  
  // Push notifications
  PUSH_NOTIFICATION_TOKEN: 'carcomm_push_token',
  NOTIFICATION_SETTINGS: 'carcomm_notification_settings',
  
  // Offline data
  OFFLINE_QUEUE: 'carcomm_offline_queue',
  SYNC_TIMESTAMP: 'carcomm_sync_timestamp'
} as const;