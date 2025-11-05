import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SignalRService } from '../../services/signalr.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(private signalrService: SignalRService) {}

  ngOnInit(): void {
    this.signalrService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: Notification) => {
        this.notifications.unshift(notification);
        if (!notification.isRead) {
          this.unreadCount++;
        }
      });

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      // Call API to mark as read
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    // Call API to mark all as read
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'post:liked': return '👍';
      case 'post:commented': return '💬';
      case 'car:added': return '🚗';
      default: return '🔔';
    }
  }

  getNotificationTitle(notification: Notification): string {
    switch (notification.type) {
      case 'post:liked': return 'Your post was liked';
      case 'post:commented': return 'New comment on your post';
      case 'car:added': return 'New car added to your garage';
      default: return 'New notification';
    }
  }

  private loadNotifications(): void {
    // Load initial notifications from API
    // This would call a service to fetch notifications
    this.notifications = []; // Replace with actual API call
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }
}