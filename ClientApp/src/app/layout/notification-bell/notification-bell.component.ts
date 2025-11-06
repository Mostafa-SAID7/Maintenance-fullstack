import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import { SignalRService } from '../../core/services/signalr.service';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionText?: string;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative">
      <!-- Bell Icon -->
      <button
        type="button"
        class="relative p-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="dropdownOpen"
        aria-label="Notifications"
      >
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.07 2.82l-.03-.06a15.247 15.247 0 01-3.79-4.53 15.247 15.247 0 01-.05-.06C1.58 2.71 1 3.12 1 4.38v.55c0 1.26.58 1.67 1.21 2.13l.05.06a15.247 15.247 0 003.79 4.53l.03.06c.54.64.54 1.58 0 2.22l-.03.06a15.247 15.247 0 01-3.79 4.53l-.05.06c-.63.46-1.21.87-1.21 2.13v.55c0 1.26.58 1.67 1.21 2.13l.05.06a15.247 15.247 0 003.79 4.53 15.247 15.247 0 00.05.06c.63.46 1.71.05 1.71-1.3v-.55c0-1.26-.58-1.67-1.21-2.13l-.05-.06a15.247 15.247 0 01-3.79-4.53l-.03-.06a15.247 15.247 0 010-2.22l.03-.06a15.247 15.247 0 013.79-4.53l.05-.06c.63-.46 1.21-.87 1.21-2.13v-.55c0-1.26-.58-1.67-1.21-2.13z" />
        </svg>
        <!-- Notification Badge -->
        <span *ngIf="unreadCount > 0" 
              class="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] h-5">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Dropdown Panel -->
      <div *ngIf="dropdownOpen" 
           class="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-hidden">
        
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
            <div class="flex items-center space-x-2">
              <button *ngIf="unreadCount > 0"
                      type="button"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      (click)="markAllAsRead()">
                Mark all as read
              </button>
              <a routerLink="/notifications" 
                 class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                 (click)="closeDropdown()">
                View all
              </a>
            </div>
          </div>
        </div>

        <!-- Notification List -->
        <div class="max-h-64 overflow-y-auto">
          <div *ngIf="isLoading" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>

          <div *ngIf="!isLoading && notifications.length === 0" class="px-4 py-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.07 2.82l-.03-.06a15.247 15.247 0 01-3.79-4.53 15.247 15.247 0 01-.05-.06C1.58 2.71 1 3.12 1 4.38v.55c0 1.26.58 1.67 1.21 2.13l.05.06a15.247 15.247 0 003.79 4.53l.03.06c.54.64.54 1.58 0 2.22l-.03.06a15.247 15.247 0 01-3.79 4.53l-.05.06c-.63.46-1.21.87-1.21 2.13v.55c0 1.26.58 1.67 1.21 2.13l.05.06a15.247 15.247 0 003.79 4.53 15.247 15.247 0 00.05.06c.63.46 1.71.05 1.71-1.3v-.55c0-1.26-.58-1.67-1.21-2.13l-.05-.06a15.247 15.247 0 01-3.79-4.53l-.03-.06a15.247 15.247 0 010-2.22l.03-.06a15.247 15.247 0 013.79-4.53l.05-.06c.63-.46 1.21-.87 1.21-2.13v-.55c0-1.26-.58-1.67-1.21-2.13z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
          </div>

          <div *ngFor="let notification of notifications" 
               class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer border-l-4"
               [ngClass]="{
                 'border-blue-500': notification.type === 'info',
                 'border-green-500': notification.type === 'success', 
                 'border-yellow-500': notification.type === 'warning',
                 'border-red-500': notification.type === 'error',
                 'bg-blue-50 dark:bg-blue-900/20': notification.type === 'info' && !notification.isRead,
                 'bg-green-50 dark:bg-green-900/20': notification.type === 'success' && !notification.isRead,
                 'bg-yellow-50 dark:bg-yellow-900/20': notification.type === 'warning' && !notification.isRead,
                 'bg-red-50 dark:bg-red-900/20': notification.type === 'error' && !notification.isRead
               }"
               (click)="handleNotificationClick(notification)">
            
            <div class="flex items-start space-x-3">
              <!-- Notification Icon -->
              <div class="flex-shrink-0">
                <div class="w-2 h-2 rounded-full mt-2"
                     [ngClass]="{
                       'bg-blue-500': notification.type === 'info',
                       'bg-green-500': notification.type === 'success',
                       'bg-yellow-500': notification.type === 'warning',
                       'bg-red-500': notification.type === 'error'
                     }"></div>
              </div>

              <!-- Notification Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ notification.title }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {{ notification.message }}
                </p>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatNotificationTime(notification.createdAt) }}
                  </p>
                  <div *ngIf="notification.actionText && notification.actionUrl" class="flex items-center space-x-2">
                    <a [routerLink]="notification.actionUrl"
                       class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                       (click)="$event.stopPropagation()">
                      {{ notification.actionText }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Unread Indicator -->
              <div *ngIf="!notification.isRead" class="flex-shrink-0">
                <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <button type="button"
                    class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    (click)="clearAllNotifications()">
              Clear all
            </button>
            <a routerLink="/settings/notifications"
               class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
               (click)="closeDropdown()">
              Notification settings
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Animation for dropdown */
    .origin-top-right {
      transform-origin: top right;
    }

    .max-h-96 {
      max-height: 24rem;
    }

    .overflow-y-auto::-webkit-scrollbar {
      width: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #4b5563;
    }

    /* Badge animation */
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Output() notificationClick = new EventEmitter<NotificationItem>();
  
  private destroy$ = new Subject<void>();
  
  dropdownOpen = false;
  isLoading = false;
  notifications: NotificationItem[] = [];
  unreadCount = 0;

  constructor(
    private notificationService: NotificationService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    // Load initial notifications
    this.loadNotifications();

    // Click outside to close dropdown
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  private loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getNotifications(0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data?.items) {
            this.notifications = response.data.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              message: item.message,
              type: item.type || 'info',
              isRead: item.isRead || false,
              createdAt: new Date(item.createdAt),
              actionUrl: item.actionUrl,
              actionText: item.actionText
            }));
            this.updateUnreadCount();
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading notifications:', error);
          this.isLoading = false;
        }
      });
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    
    if (this.dropdownOpen) {
      // Refresh notifications when opening
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  private handleClickOutside(event: Event): void {
    const target = event.target as Element;
    if (!target.closest('.relative')) {
      this.closeDropdown();
    }
  }

  handleNotificationClick(notification: NotificationItem): void {
    // Mark as read
    if (!notification.isRead) {
      this.markAsRead(notification.id.toString());
    }

    // Navigate if there's an action URL
    if (notification.actionUrl) {
      this.closeDropdown();
      // Navigation will be handled by the action link
    }

    // Emit click event
    this.notificationClick.emit(notification);
  }

  private markAsRead(notificationId: string): void {
    // Update local state
    const notification = this.notifications.find(n => n.id.toString() === notificationId);
    if (notification) {
      notification.isRead = true;
      this.updateUnreadCount();
    }

    // Update on server
    this.notificationService.markAsRead(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error: any) => {
          console.error('Error marking notification as read:', error);
          // Revert local state on error
          if (notification) {
            notification.isRead = false;
            this.updateUnreadCount();
          }
        }
      });
  }

  markAllAsRead(): void {
    const unreadIds = this.notifications.filter(n => !n.isRead).map(n => n.id.toString());
    
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local state
          this.notifications.forEach(n => n.isRead = true);
          this.updateUnreadCount();
        },
        error: (error: any) => {
          console.error('Error marking all notifications as read:', error);
        }
      });
  }

  clearAllNotifications(): void {
    // Clear local state only (server method may not exist)
    this.notifications = [];
    this.updateUnreadCount();
    
    // Try to clear on server if method exists
    if (typeof (this.notificationService as any).clearAllNotifications === 'function') {
      (this.notificationService as any).clearAllNotifications()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (error: any) => {
            console.error('Error clearing notifications:', error);
            // Reload notifications on error
            this.loadNotifications();
          }
        });
    }
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}