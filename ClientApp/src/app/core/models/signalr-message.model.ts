export interface SignalRMessage {
  id?: string;
  type: string;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  groupName?: string;
  content: string;
  timestamp: Date;
  isRead?: boolean;
  metadata?: Record<string, any>;
  title?: string;
  from?: string;
  category?: string;
  carId?: number;
}

export type SignalRMessageType =
  | 'chat_message'
  | 'maintenance_alert'
  | 'system_notification'
  | 'user_status'
  | 'car_update'
  | 'maintenance_reminder'
  | 'message'
  | 'notification'
  | 'maintenance-update'
  | 'car-status-update';

export interface ChatMessage extends SignalRMessage {
  type: 'chat_message' | 'message';
  roomId?: string;
  attachments?: ChatAttachment[];
}

export interface MaintenanceAlert extends SignalRMessage {
  type: 'maintenance_alert' | 'maintenance_reminder';
  carId: number;
  carName?: string;
  maintenanceType?: string;
  dueDate?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemNotification extends SignalRMessage {
  type: 'system_notification' | 'notification';
  category: 'info' | 'warning' | 'error' | 'success';
  actionRequired?: boolean;
  actionUrl?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
}