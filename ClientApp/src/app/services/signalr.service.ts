import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  user: string;
  message: string;
  timestamp: Date;
  groupName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor() {}

  async startConnection(): Promise<void> {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('/chatHub')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.on('ReceiveMessage', (user: string, message: string, timestamp: string) => {
      const chatMessage: ChatMessage = {
        user,
        message,
        timestamp: new Date(timestamp)
      };

      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, chatMessage]);
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR connection started');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      console.log('SignalR connection stopped');
    }
  }

  async sendMessage(user: string, message: string): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.invoke('SendMessage', user, message);
    }
  }

  async joinGroup(groupName: string): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.invoke('JoinGroup', groupName);
    }
  }

  async leaveGroup(groupName: string): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.invoke('LeaveGroup', groupName);
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  getConnectionId(): string | null {
    return this.hubConnection?.connectionId || null;
  }
}