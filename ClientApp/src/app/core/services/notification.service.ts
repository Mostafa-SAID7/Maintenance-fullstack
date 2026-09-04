import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { ApiService } from './api.service';
import { SignalRService } from './signalr.service';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  isPersistent: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}

export enum NotificationType {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Maintenance = 'maintenance',
  Reminder = 'reminder'
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  maintenanceReminders: boolean;
  maintenanceUpdates: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = '/api/notifications';
  private readonly settingsUrl = '/api/notifications/settings';
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private settingsSubject = new BehaviorSubject<NotificationSettings | null>(null);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public settings$ = this.settingsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private signalRService: SignalRService
  ) {
    this.initializeSignalR();
    this.setupPeriodicCheck();
  }

  /**
   * Get all notifications for the current user
   */
  getNotifications(page: number = 1, pageSize: number = 20): Observable<ApiResponse<PaginatedResponse<Notification>>> {
    return this.apiService.get<ApiResponse<PaginatedResponse<Notification>>>(
      `${this.apiUrl}?page=${page}&pageSize=${pageSize}`
    );
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.apiService.get<ApiResponse<Notification[]>>(`${this.apiUrl}/unread`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<ApiResponse<void>> {
    return this.apiService.patch<ApiResponse<void>>(`${this.apiUrl}/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.apiService.patch<ApiResponse<void>>(`${this.apiUrl}/read-all`);
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.apiUrl}/${notificationId}`);
  }

  /**
   * Create new notification (admin only)
   */
  createNotification(notification: Partial<Notification>): Observable<ApiResponse<Notification>> {
    return this.apiService.post<ApiResponse<Notification>>(this.apiUrl, notification);
  }

  /**
   * Get notification settings
   */
  getSettings(): Observable<ApiResponse<NotificationSettings>> {
    return this.apiService.get<ApiResponse<NotificationSettings>>(this.settingsUrl);
  }

  /**
   * Update notification settings
   */
  updateSettings(settings: Partial<NotificationSettings>): Observable<ApiResponse<NotificationSettings>> {
    return this.apiService.put<ApiResponse<NotificationSettings>>(this.settingsUrl, settings);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.apiService.get<ApiResponse<number>>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Request permission for notifications
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(notification: Notification): void {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/notification-badge.png',
        tag: notification.id,
        requireInteraction: notification.type === NotificationType.Error,
        silent: false
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto close after 5 seconds unless it's an error
      const timeout = notification.type === NotificationType.Error ? 0 : 5000;
      if (timeout > 0) {
        setTimeout(() => browserNotification.close(), timeout);
      }
    }
  }

  /**
   * Show toast notification
   */
  showToast(notification: Notification): void {
    // This would integrate with your toast/alert system
    console.log('Toast notification:', notification);
    
    // Example implementation with a toast service
    // this.toastService.show(notification.message, {
    //   severity: this.getToastSeverity(notification.type),
    //   summary: notification.title
    // });
  }

  /**
   * Create maintenance reminder
   */
  createMaintenanceReminder(carId: string, maintenanceType: string, dueDate: Date): Observable<ApiResponse<Notification>> {
    const reminder = {
      title: 'Maintenance Reminder',
      message: `Your ${maintenanceType} is due on ${dueDate.toLocaleDateString()}`,
      type: NotificationType.Maintenance,
      isPersistent: true,
      metadata: {
        carId,
        maintenanceType,
        dueDate: dueDate.toISOString()
      }
    };

    return this.apiService.post<ApiResponse<Notification>>(`${this.apiUrl}/reminder`, reminder);
  }

  /**
   * Create system notification
   */
  createSystemNotification(title: string, message: string, type: NotificationType = NotificationType.Info): Observable<ApiResponse<Notification>> {
    const notification = {
      title,
      message,
      type,
      isPersistent: type === NotificationType.Error
    };

    return this.apiService.post<ApiResponse<Notification>>(this.apiUrl, notification);
  }

  /**
   * Get current notifications
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Get current unread count
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Check if user has permissions for notifications
   */
  hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Subscribe to real-time notifications
   */
  private initializeSignalR(): void {
    this.signalRService.messages$.subscribe((message) => {
      if (message.type === 'notification') {
        const notification: Notification = {
          id: message.id || '',
          userId: message.senderId || '',
          title: message.title || '',
          message: message.content || '',
          type: NotificationType.Info,
          isRead: message.isRead || false,
          isPersistent: false,
          createdAt: message.timestamp
        };
        this.handleNewNotification(notification);
      }
    });
  }

  /**
   * Handle new notification from SignalR
   */
  private handleNewNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    
    // Show browser notification if enabled
    if (this.settingsSubject.value?.pushEnabled && this.hasPermission()) {
      this.showBrowserNotification(notification);
    }
    
    // Show toast notification
    this.showToast(notification);
  }

  /**
   * Update existing notification
   */
  private updateNotification(updatedNotification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === updatedNotification.id ? updatedNotification : notification
    );
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  /**
   * Mark notification as read (local update)
   */
  private markNotificationAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId ? { ...notification, isRead: true, readAt: new Date() } : notification
    );
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Setup periodic notification check
   */
  private setupPeriodicCheck(): void {
    // Check for new notifications every 30 seconds
    timer(0, 30000).subscribe(() => {
      this.refreshNotifications();
    });
  }

  /**
   * Refresh notifications from server
   */
  private refreshNotifications(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        if (response.success && response.data !== null && response.data !== undefined) {
          this.unreadCountSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Failed to refresh notification count:', error);
      }
    });
  }

  /**
   * Load initial data
   */
  loadInitialData(): void {
    this.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.settingsSubject.next(response.data);
        }
      }
    });

    this.getUnreadNotifications().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationsSubject.next(response.data);
          this.updateUnreadCount();
        }
      }
    });
  }

  /**
   * Get toast severity for notification type
   */
  private getToastSeverity(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'success';
      case NotificationType.Warning:
        return 'warn';
      case NotificationType.Error:
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    // Cleanup subscriptions if needed
  }
}