import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigurationService } from './configuration.service';
import { AuthService } from './auth.service';

export interface Post {
  id: number;
  content: string;
  category?: string;
  userId: string;
  createdDate: Date;
  user?: {
    id: string;
    userName: string;
    displayName?: string;
  };
}

export interface Notification {
  id: number;
  type: string;
  payload: string;
  isRead: boolean;
  userId: string;
  createdDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private connectionState = new BehaviorSubject<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);

  // Subjects for real-time events
  private newPostSubject = new BehaviorSubject<Post | null>(null);
  private newNotificationSubject = new BehaviorSubject<Notification | null>(null);

  // Public observables
  public newPost$ = this.newPostSubject.asObservable();
  public newNotification$ = this.newNotificationSubject.asObservable();
  public connectionState$ = this.connectionState.asObservable();

  constructor(
    private configService: ConfigurationService,
    private authService: AuthService
  ) {}

  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const apiUrl = this.configService.baseUrl;
    const token = this.authService.accessToken;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/community`, {
        accessTokenFactory: () => token || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    // Set up event handlers
    this.hubConnection.on('NewPost', (post: Post) => {
      this.newPostSubject.next(post);
    });

    this.hubConnection.on('NewNotification', (notification: Notification) => {
      this.newNotificationSubject.next(notification);
    });

    this.hubConnection.onreconnecting(() => {
      this.connectionState.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState.next(signalR.HubConnectionState.Connected);
    });

    this.hubConnection.onclose(() => {
      this.connectionState.next(signalR.HubConnectionState.Disconnected);
    });

    try {
      await this.hubConnection.start();
      this.connectionState.next(signalR.HubConnectionState.Connected);
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.connectionState.next(signalR.HubConnectionState.Disconnected);
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionState.next(signalR.HubConnectionState.Disconnected);
    }
  }

  async subscribeToFeed(category: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SubscribeToFeed', category);
    }
  }

  async unsubscribeFromFeed(category: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('UnsubscribeFromFeed', category);
    }
  }

  async joinUserGroup(userId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinUserGroup', userId);
    }
  }

  async leaveUserGroup(userId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveUserGroup', userId);
    }
  }

  get isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}