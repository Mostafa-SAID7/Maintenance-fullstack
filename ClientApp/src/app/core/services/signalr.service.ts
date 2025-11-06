import { Injectable, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SignalRMessage } from '../models/signalr-message.model';

export interface ConnectionStatus {
  connected: boolean;
  connectionId?: string;
  reconnectAttempts: number;
  lastConnected?: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private hubConnection: HubConnection | null = null;
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0
  });
  private messageSubject = new Subject<SignalRMessage>();
  
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();

  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(private authService: AuthService) {
    // Subscribe to authentication changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.startConnection();
      } else {
        this.stopConnection();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }

  /**
   * Start SignalR connection
   */
  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      return;
    }

    try {
      const accessToken = this.authService.getToken();
      if (!accessToken) {
        throw new Error('No authentication token available');
      }

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${environment.signalRUrl}/chatHub`, {
          accessTokenFactory: () => accessToken,
          withCredentials: true
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            return delay;
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.hubConnection.start();
      
      this.updateConnectionStatus({
        connected: true,
        connectionId: this.hubConnection.connectionId || undefined,
        reconnectAttempts: 0,
        lastConnected: new Date()
      });

      console.log('SignalR connection started successfully');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.updateConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reconnectAttempts: 0
      });
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.hubConnection = null;
        
        this.updateConnectionStatus({
          connected: false,
          reconnectAttempts: 0
        });
        
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  /**
   * Join user group
   */
  async joinUserGroup(userId: string): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.hubConnection!.invoke('JoinUserGroup', userId);
        console.log(`Joined user group: ${userId}`);
      } catch (error) {
        console.error('Error joining user group:', error);
        throw error;
      }
    }
  }

  /**
   * Join car group
   */
  async joinCarGroup(carId: number): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.hubConnection!.invoke('JoinCarGroup', carId.toString());
        console.log(`Joined car group: ${carId}`);
      } catch (error) {
        console.error('Error joining car group:', error);
        throw error;
      }
    }
  }

  /**
   * Leave user group
   */
  async leaveUserGroup(userId: string): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.hubConnection!.invoke('LeaveUserGroup', userId);
        console.log(`Left user group: ${userId}`);
      } catch (error) {
        console.error('Error leaving user group:', error);
        throw error;
      }
    }
  }

  /**
   * Leave car group
   */
  async leaveCarGroup(carId: number): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.hubConnection!.invoke('LeaveCarGroup', carId.toString());
        console.log(`Left car group: ${carId}`);
      } catch (error) {
        console.error('Error leaving car group:', error);
        throw error;
      }
    }
  }

  /**
   * Send maintenance alert
   */
  async sendMaintenanceAlert(carId: number, message: string): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.hubConnection!.invoke('SendMaintenanceAlert', carId.toString(), message);
        console.log(`Sent maintenance alert for car ${carId}: ${message}`);
      } catch (error) {
        console.error('Error sending maintenance alert:', error);
        throw error;
      }
    }
  }

  /**
   * Send notification
   */
  async sendNotification(userId: string, title: string, message: string): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.hubConnection!.invoke('SendNotification', userId, title, message);
        console.log(`Sent notification to user ${userId}: ${title} - ${message}`);
      } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
      }
    }
  }

  /**
   * Check if connection is established
   */
  isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.hubConnection?.state || 'Disconnected';
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Connection events
    this.hubConnection.onclose(() => {
      console.log('SignalR connection closed');
      this.updateConnectionStatus({
        connected: false,
        reconnectAttempts: this.connectionStatusSubject.value.reconnectAttempts + 1
      });
    });

    this.hubConnection.onreconnecting(() => {
      console.log('SignalR connection reconnecting...');
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR connection reconnected');
      this.updateConnectionStatus({
        connected: true,
        connectionId: this.hubConnection?.connectionId || undefined,
        reconnectAttempts: 0,
        lastConnected: new Date()
      });
    });

    // Message events
    this.hubConnection.on('ReceiveMessage', (user: string, message: string) => {
      this.messageSubject.next({
        type: 'message',
        from: user,
        content: message,
        timestamp: new Date(),
        category: 'chat'
      });
    });

    this.hubConnection.on('ReceiveNotification', (title: string, message: string) => {
      this.messageSubject.next({
        type: 'notification',
        title,
        content: message,
        timestamp: new Date(),
        category: 'notification'
      });
    });

    this.hubConnection.on('ReceiveMaintenanceAlert', (carId: string, message: string) => {
      this.messageSubject.next({
        type: 'maintenance-alert',
        content: message,
        timestamp: new Date(),
        category: 'maintenance',
        carId: parseInt(carId)
      });
    });

    this.hubConnection.on('ReceiveMaintenanceUpdate', (carId: string, update: any) => {
      this.messageSubject.next({
        type: 'maintenance-update',
        content: JSON.stringify(update),
        timestamp: new Date(),
        category: 'maintenance',
        carId: parseInt(carId)
      });
    });

    this.hubConnection.on('ReceiveCarStatusUpdate', (carId: string, status: any) => {
      this.messageSubject.next({
        type: 'car-status-update',
        content: JSON.stringify(status),
        timestamp: new Date(),
        category: 'car',
        carId: parseInt(carId)
      });
    });
  }

  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    const currentStatus = this.connectionStatusSubject.value;
    this.connectionStatusSubject.next({
      ...currentStatus,
      ...status
    });
  }
}