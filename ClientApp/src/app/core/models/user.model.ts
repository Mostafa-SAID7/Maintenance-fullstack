export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  phone?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  maintenanceReminders: boolean;
  maintenanceAlerts: boolean;
  systemUpdates: boolean;
}

export interface DashboardSettings {
  defaultView: string;
  widgets: string[];
  refreshInterval: number;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferences?: UserPreferences;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}